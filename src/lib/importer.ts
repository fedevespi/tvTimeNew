import JSZip from 'jszip'
import { tmdb } from './tmdb'
import { supabase } from './supabase'
import { parseYear, pickBestMatch, splitTrailingYear, type MatchCandidate, type MatchQuery } from './titleMatch'

export interface RawMovie {
  id?: { tvdb?: number; imdb?: string | null }
  title: string
  year?: number
  watched_at?: string | null
  is_watched?: boolean
  is_favorite?: boolean
}

export interface RawEpisode {
  number: number
  is_watched?: boolean
  watched_at?: string | null
}

export interface RawSeason {
  number: number
  episodes?: RawEpisode[]
}

export interface RawSeries {
  id?: { tvdb?: number; imdb?: string | null }
  title: string
  status?: string
  is_favorite?: boolean
  seasons?: RawSeason[]
}

export interface ImportData {
  movies: RawMovie[]
  series: RawSeries[]
}

export interface UnresolvedItem {
  raw: RawMovie | RawSeries
  type: 'movie' | 'tv'
  title: string
  year?: number
}

export interface ImportProgress {
  phase: 'reading' | 'resolving' | 'saving' | 'complete' | 'error'
  totalItems: number
  processedItems: number
  currentItemTitle?: string
  message: string
  stats?: {
    moviesImported: number
    seriesImported: number
    episodesImported: number
    notFoundCount: number
    /** Righe rifiutate dal database: l'importazione è riuscita solo in parte. */
    notSavedCount: number
    /** Messaggio dell'ultimo errore di salvataggio, per capire cosa non è passato. */
    saveError?: string
  }
}

interface TitleStatusRecord {
  user_id: string
  tmdb_id: number
  media_type: 'movie' | 'tv'
  status: 'da_vedere' | 'in_corso' | 'visto'
}

interface EpisodeWatchedRecord {
  user_id: string
  tmdb_id: number
  season_number: number
  episode_number: number
  watched_at?: string
}

const TITLE_STATUS_CONFLICT = 'user_id,tmdb_id,media_type'
const EPISODE_WATCHED_CONFLICT = 'user_id,tmdb_id,season_number,episode_number'

async function upsertTitleStatus(rows: TitleStatusRecord[]): Promise<string | null> {
  const { error } = await supabase
    .from('user_title_status')
    .upsert(rows, { onConflict: TITLE_STATUS_CONFLICT })
  return error?.message ?? null
}

async function upsertEpisodesWatched(rows: EpisodeWatchedRecord[]): Promise<string | null> {
  const { error } = await supabase
    .from('user_episode_watched')
    .upsert(rows, { onConflict: EPISODE_WATCHED_CONFLICT })
  return error?.message ?? null
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    // Try to sanitize loose JSON formatting (e.g. unquoted keys or missing outer braces)
    try {
      let cleaned = text.trim()
      if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
        cleaned = '{' + cleaned + '}'
      }
      // Quote unquoted keys like movie: or series:
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      return JSON.parse(cleaned)
    } catch {
      return null
    }
  }
}

export function extractImportData(jsonObj: unknown): ImportData {
  const movies: RawMovie[] = []
  const series: RawSeries[] = []

  const processObject = (obj: unknown) => {
    if (!obj || typeof obj !== 'object') return

    if (Array.isArray(obj)) {
      obj.forEach(item => processObject(item))
      return
    }

    const record = obj as Record<string, unknown>

    if ('movie' in record && Array.isArray(record.movie)) {
      movies.push(...(record.movie as RawMovie[]))
    }
    if ('movies' in record && Array.isArray(record.movies)) {
      movies.push(...(record.movies as RawMovie[]))
    }
    if ('series' in record && Array.isArray(record.series)) {
      series.push(...(record.series as RawSeries[]))
    }
    if ('shows' in record && Array.isArray(record.shows)) {
      series.push(...(record.shows as RawSeries[]))
    }

    // Single item check
    if ('seasons' in record && 'title' in record) {
      series.push(record as unknown as RawSeries)
    } else if ('is_watched' in record && 'title' in record && !('seasons' in record)) {
      movies.push(record as unknown as RawMovie)
    }
  }

  processObject(jsonObj)
  return { movies, series }
}

export async function parseFileToImportData(file: File): Promise<ImportData> {
  const filename = file.name.toLowerCase()
  const result: ImportData = { movies: [], series: [] }

  if (filename.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file)
    for (const relativePath of Object.keys(zip.files)) {
      const zipEntry = zip.files[relativePath]
      if (!zipEntry || zipEntry.dir) continue
      if (relativePath.endsWith('.json') || relativePath.endsWith('.txt')) {
        const text = await zipEntry.async('text')
        const parsed = safeJsonParse(text)
        if (parsed) {
          const data = extractImportData(parsed)
          result.movies.push(...data.movies)
          result.series.push(...data.series)
        }
      }
    }
  } else {
    const text = await file.text()
    const parsed = safeJsonParse(text)
    if (parsed) {
      const data = extractImportData(parsed)
      result.movies.push(...data.movies)
      result.series.push(...data.series)
    }
  }

  // Remove duplicates based on title/id
  const uniqueMovies = Array.from(
    new Map(result.movies.map(m => [`${m.title}-${m.year ?? ''}`, m])).values()
  )
  const uniqueSeries = Array.from(
    new Map(result.series.map(s => [s.title, s])).values()
  )

  return { movies: uniqueMovies, series: uniqueSeries }
}

/**
 * Un id esterno (imdb/tvdb) identifica l'opera senza ambiguità: il primo
 * risultato di `/find` si può accettare così com'è. È la ricerca per titolo che
 * va verificata, e per questo passa da `pickBestMatch`.
 */
async function resolveByExternalId(
  id: string | number,
  source: 'imdb_id' | 'tvdb_id',
  type: 'movie' | 'tv'
): Promise<number | null> {
  try {
    const res = await tmdb.findByExternalId(id, source)
    const matches = type === 'movie' ? res?.movie_results : res?.tv_results
    return matches?.[0]?.id ?? null
  } catch {
    return null
  }
}

async function resolveByExternalIds(
  ids: { imdb?: string | null; tvdb?: number } | undefined,
  type: 'movie' | 'tv'
): Promise<number | null> {
  if (ids?.imdb) {
    const found = await resolveByExternalId(ids.imdb, 'imdb_id', type)
    if (found !== null) return found
  }
  if (ids?.tvdb) {
    const found = await resolveByExternalId(ids.tvdb, 'tvdb_id', type)
    if (found !== null) return found
  }
  return null
}

function movieCandidates(
  results: Array<{ id: number; title: string; original_title?: string; release_date?: string }> | undefined
): MatchCandidate[] {
  return (results ?? []).map(result => ({
    id: result.id,
    title: result.title,
    originalTitle: result.original_title,
    year: parseYear(result.release_date),
  }))
}

function tvCandidates(
  results: Array<{ id: number; name: string; original_name?: string; first_air_date?: string }> | undefined
): MatchCandidate[] {
  return (results ?? []).map(result => ({
    id: result.id,
    title: result.name,
    originalTitle: result.original_name,
    year: parseYear(result.first_air_date),
  }))
}

/**
 * Cerca il titolo e restituisce solo un abbinamento convincente. Se la ricerca
 * vincolata all'anno non produce nulla si allarga senza vincolo, ma la verifica
 * sul risultato resta la stessa: l'anno continua a pesare nel punteggio.
 */
async function resolveByTitle(
  query: MatchQuery,
  search: (title: string, year?: number) => Promise<MatchCandidate[]>
): Promise<number | null> {
  try {
    const narrow = await search(query.title, query.year)
    const match = pickBestMatch(narrow, query)
    if (match) return match.id

    if (query.year !== undefined) {
      const wide = await search(query.title)
      const wideMatch = pickBestMatch(wide, query)
      if (wideMatch) return wideMatch.id
    }
  } catch {
    // Ricerca non riuscita: l'elemento finisce fra i non risolti
  }

  return null
}

async function resolveMovieTmdbId(movie: RawMovie): Promise<number | null> {
  const byId = await resolveByExternalIds(movie.id, 'movie')
  if (byId !== null) return byId

  const fromTitle = splitTrailingYear(movie.title)
  return resolveByTitle(
    { title: fromTitle.title, year: movie.year ?? fromTitle.year },
    async (title, year) => movieCandidates((await tmdb.searchMovie(title, year)).results)
  )
}

async function resolveSeriesTmdbId(show: RawSeries): Promise<number | null> {
  const byId = await resolveByExternalIds(show.id, 'tv')
  if (byId !== null) return byId

  // L'anno fra parentesi ("Doctor Who (2005)") distingue la serie dal reboot
  // omonimo: prima veniva scartato insieme alle parentesi.
  return resolveByTitle(
    splitTrailingYear(show.title),
    async (title, year) => tvCandidates((await tmdb.searchTv(title, year)).results)
  )
}

export async function saveResolvedItemToSupabase(
  userId: string,
  item: UnresolvedItem,
  tmdbId: number
) {
  let status: 'da_vedere' | 'in_corso' | 'visto' = 'da_vedere'
  let episodesCount = 0

  if (item.type === 'movie') {
    const movie = item.raw as RawMovie
    status = movie.is_watched || movie.watched_at ? 'visto' : 'da_vedere'
    const error = await upsertTitleStatus([
      { user_id: userId, tmdb_id: tmdbId, media_type: 'movie', status },
    ])
    if (error) throw new Error(error)
  } else {
    const show = item.raw as RawSeries
    const episodeWatchedRecords: EpisodeWatchedRecord[] = []

    if (show.seasons && show.seasons.length > 0) {
      for (const season of show.seasons) {
        if (!season.episodes) continue
        for (const ep of season.episodes) {
          if (ep.is_watched || ep.watched_at) {
            episodesCount++
            episodeWatchedRecords.push({
              user_id: userId,
              tmdb_id: tmdbId,
              season_number: season.number,
              episode_number: ep.number,
              watched_at: ep.watched_at ?? new Date().toISOString(),
            })
          }
        }
      }
    }

    if (show.status === 'up_to_date') {
      status = 'visto'
    } else if (episodesCount > 0 || show.status === 'continuing') {
      status = 'in_corso'
    }

    const statusError = await upsertTitleStatus([
      { user_id: userId, tmdb_id: tmdbId, media_type: 'tv', status },
    ])
    if (statusError) throw new Error(statusError)

    if (episodeWatchedRecords.length > 0) {
      const episodesError = await upsertEpisodesWatched(episodeWatchedRecords)
      if (episodesError) throw new Error(episodesError)
    }
  }

  return { type: item.type, episodesCount }
}

export async function importDataToSupabase(
  userId: string,
  data: ImportData,
  onProgress: (progress: ImportProgress) => void
) {
  const totalItems = data.movies.length + data.series.length
  let processedItems = 0
  let moviesImported = 0
  let seriesImported = 0
  let episodesImported = 0
  let notFoundCount = 0

  const unresolvedItems: UnresolvedItem[] = []

  const titleStatusRecords: TitleStatusRecord[] = []
  const episodeWatchedRecords: EpisodeWatchedRecord[] = []

  // 1. Process Movies
  for (const movie of data.movies) {
    processedItems++
    onProgress({
      phase: 'resolving',
      totalItems,
      processedItems,
      currentItemTitle: movie.title,
      message: `Ricerca TMDB per il film "${movie.title}" (${processedItems}/${totalItems})...`,
    })

    const tmdbId = await resolveMovieTmdbId(movie)

    if (tmdbId) {
      const status = movie.is_watched || movie.watched_at ? 'visto' : 'da_vedere'
      titleStatusRecords.push({
        user_id: userId,
        tmdb_id: tmdbId,
        media_type: 'movie',
        status,
      })
      moviesImported++
    } else {
      notFoundCount++
      unresolvedItems.push({
        raw: movie,
        type: 'movie',
        title: movie.title,
        year: movie.year,
      })
    }

    // Small delay to respect rate limit
    await new Promise(r => setTimeout(r, 60))
  }

  // 2. Process TV Series
  for (const show of data.series) {
    processedItems++
    onProgress({
      phase: 'resolving',
      totalItems,
      processedItems,
      currentItemTitle: show.title,
      message: `Ricerca TMDB per la serie "${show.title}" (${processedItems}/${totalItems})...`,
    })

    const tmdbId = await resolveSeriesTmdbId(show)

    if (tmdbId) {
      let watchedCount = 0

      if (show.seasons && show.seasons.length > 0) {
        for (const season of show.seasons) {
          if (!season.episodes) continue
          for (const ep of season.episodes) {
            if (ep.is_watched || ep.watched_at) {
              watchedCount++
              episodeWatchedRecords.push({
                user_id: userId,
                tmdb_id: tmdbId,
                season_number: season.number,
                episode_number: ep.number,
                watched_at: ep.watched_at ?? new Date().toISOString(),
              })
            }
          }
        }
      }

      let status: 'da_vedere' | 'in_corso' | 'visto' = 'da_vedere'
      if (show.status === 'up_to_date') {
        status = 'visto'
      } else if (watchedCount > 0 || show.status === 'continuing') {
        status = 'in_corso'
      }

      titleStatusRecords.push({
        user_id: userId,
        tmdb_id: tmdbId,
        media_type: 'tv',
        status,
      })
      seriesImported++
      episodesImported += watchedCount
    } else {
      notFoundCount++
      unresolvedItems.push({
        raw: show,
        type: 'tv',
        title: show.title,
      })
    }

    // Small delay to respect rate limit
    await new Promise(r => setTimeout(r, 60))
  }

  // 3. Save to Supabase
  onProgress({
    phase: 'saving',
    totalItems,
    processedItems,
    message: 'Salvataggio dati su Supabase in corso...',
  })

  // Un batch rifiutato non ferma i successivi — il resto dei dati va comunque
  // salvato — ma non passa più inosservato: le righe perse vengono contate e
  // riportate, così l'esito non dichiara un successo che non c'è stato.
  let notSavedCount = 0
  let saveError: string | undefined

  const noteFailure = (rows: number, message: string) => {
    notSavedCount += rows
    saveError = message
  }

  // Upsert title statuses in batches of 50
  for (let i = 0; i < titleStatusRecords.length; i += 50) {
    const chunk = titleStatusRecords.slice(i, i + 50)
    const error = await upsertTitleStatus(chunk)
    if (error) noteFailure(chunk.length, error)
  }

  // Upsert episode watched in batches of 100
  for (let i = 0; i < episodeWatchedRecords.length; i += 100) {
    const chunk = episodeWatchedRecords.slice(i, i + 100)
    const error = await upsertEpisodesWatched(chunk)
    if (error) noteFailure(chunk.length, error)
  }

  const stats = {
    moviesImported,
    seriesImported,
    episodesImported,
    notFoundCount,
    notSavedCount,
    saveError,
  }

  onProgress({
    phase: 'complete',
    totalItems,
    processedItems,
    message: notSavedCount > 0
      ? `Importazione conclusa con errori: ${notSavedCount} righe non salvate.`
      : `Importazione completata! ${moviesImported} film, ${seriesImported} serie e ${episodesImported} episodi salvati.`,
    stats,
  })

  return { stats, unresolvedItems }
}
