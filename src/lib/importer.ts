import JSZip from 'jszip'
import { tmdb } from './tmdb'
import { supabase } from './supabase'

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
  }
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

async function resolveMovieTmdbId(movie: RawMovie): Promise<number | null> {
  const imdb = movie.id?.imdb
  const tvdb = movie.id?.tvdb

  if (imdb) {
    try {
      const res = await tmdb.findByExternalId(imdb, 'imdb_id')
      const matches = res?.movie_results
      if (matches && matches.length > 0 && matches[0]) {
        return matches[0].id
      }
    } catch {
      // Continue to next lookup
    }
  }

  if (tvdb) {
    try {
      const res = await tmdb.findByExternalId(tvdb, 'tvdb_id')
      const matches = res?.movie_results
      if (matches && matches.length > 0 && matches[0]) {
        return matches[0].id
      }
    } catch {
      // Continue to next lookup
    }
  }

  // Fallback to title search
  try {
    const res = await tmdb.searchMovie(movie.title, movie.year)
    const matches = res?.results
    if (matches && matches.length > 0 && matches[0]) {
      return matches[0].id
    }
    // Try without year if year search yielded no results
    if (movie.year) {
      const resNoYear = await tmdb.searchMovie(movie.title)
      const matchesNoYear = resNoYear?.results
      if (matchesNoYear && matchesNoYear.length > 0 && matchesNoYear[0]) {
        return matchesNoYear[0].id
      }
    }
  } catch {
    // Failed search
  }

  return null
}

async function resolveSeriesTmdbId(show: RawSeries): Promise<number | null> {
  const imdb = show.id?.imdb
  const tvdb = show.id?.tvdb

  if (imdb) {
    try {
      const res = await tmdb.findByExternalId(imdb, 'imdb_id')
      const matches = res?.tv_results
      if (matches && matches.length > 0 && matches[0]) {
        return matches[0].id
      }
    } catch {
      // Continue to next lookup
    }
  }

  if (tvdb) {
    try {
      const res = await tmdb.findByExternalId(tvdb, 'tvdb_id')
      const matches = res?.tv_results
      if (matches && matches.length > 0 && matches[0]) {
        return matches[0].id
      }
    } catch {
      // Continue to next lookup
    }
  }

  // Fallback to title search
  try {
    const cleanTitle = show.title.replace(/\s*\(\d{4}\)$/, '')
    const res = await tmdb.searchTv(cleanTitle)
    const matches = res?.results
    if (matches && matches.length > 0 && matches[0]) {
      return matches[0].id
    }
  } catch {
    // Failed search
  }

  return null
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
    await supabase.from('user_title_status').upsert(
      { user_id: userId, tmdb_id: tmdbId, media_type: 'movie', status },
      { onConflict: 'user_id,tmdb_id,media_type' }
    )
  } else {
    const show = item.raw as RawSeries
    const episodeWatchedRecords: Array<{
      user_id: string
      tmdb_id: number
      season_number: number
      episode_number: number
      watched_at?: string
    }> = []

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

    await supabase.from('user_title_status').upsert(
      { user_id: userId, tmdb_id: tmdbId, media_type: 'tv', status },
      { onConflict: 'user_id,tmdb_id,media_type' }
    )

    if (episodeWatchedRecords.length > 0) {
      await supabase.from('user_episode_watched').upsert(episodeWatchedRecords, {
        onConflict: 'user_id,tmdb_id,season_number,episode_number',
      })
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

  const titleStatusRecords: Array<{
    user_id: string
    tmdb_id: number
    media_type: 'movie' | 'tv'
    status: 'da_vedere' | 'in_corso' | 'visto'
  }> = []

  const episodeWatchedRecords: Array<{
    user_id: string
    tmdb_id: number
    season_number: number
    episode_number: number
    watched_at?: string
  }> = []

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

  // Upsert title statuses in batches of 50
  for (let i = 0; i < titleStatusRecords.length; i += 50) {
    const chunk = titleStatusRecords.slice(i, i + 50)
    await supabase.from('user_title_status').upsert(chunk, {
      onConflict: 'user_id,tmdb_id,media_type',
    })
  }

  // Upsert episode watched in batches of 100
  for (let i = 0; i < episodeWatchedRecords.length; i += 100) {
    const chunk = episodeWatchedRecords.slice(i, i + 100)
    await supabase.from('user_episode_watched').upsert(chunk, {
      onConflict: 'user_id,tmdb_id,season_number,episode_number',
    })
  }

  const stats = {
    moviesImported,
    seriesImported,
    episodesImported,
    notFoundCount,
  }

  onProgress({
    phase: 'complete',
    totalItems,
    processedItems,
    message: `Importazione completata! ${moviesImported} film, ${seriesImported} serie e ${episodesImported} episodi salvati.`,
    stats,
  })

  return { stats, unresolvedItems }
}
