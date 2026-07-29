import { supabase } from '@/lib/supabase'
import { mapWithConcurrencyLimit } from '@/lib/concurrency'

const FALLBACK_CONCURRENCY = 6

interface ProgressRow {
  tmdb_id: number
  /** Nullo per una serie in corso senza alcun episodio segnato come visto. */
  season_number: number | null
  watched_count: number
  episode_numbers: number[] | null
  last_watched_at: string | null
}

export interface SeasonProgress {
  watchedCount: number
  episodeNumbers: Set<number>
}

export interface ShowProgress {
  /** Data dell'episodio visto più recentemente, su tutte le stagioni. */
  lastWatchedAt: string | undefined
  seasons: Map<number, SeasonProgress>
}

export type WatchedProgressMap = Map<number, ShowProgress>

export interface InProgressProgress {
  tmdbIds: number[]
  progress: WatchedProgressMap
}

const EMPTY_SEASON: SeasonProgress = { watchedCount: 0, episodeNumbers: new Set() }

export function seasonProgress(progress: ShowProgress | undefined, seasonNumber: number): SeasonProgress {
  return progress?.seasons.get(seasonNumber) ?? EMPTY_SEASON
}

function showEntry(map: WatchedProgressMap, tmdbId: number): ShowProgress {
  let show = map.get(tmdbId)
  if (!show) {
    show = { lastWatchedAt: undefined, seasons: new Map() }
    map.set(tmdbId, show)
  }
  return show
}

function noteLastWatched(show: ShowProgress, watchedAt: string | null) {
  if (watchedAt && (!show.lastWatchedAt || watchedAt > show.lastWatchedAt)) {
    show.lastWatchedAt = watchedAt
  }
}

function buildProgress(rows: ProgressRow[]): WatchedProgressMap {
  const map: WatchedProgressMap = new Map()
  for (const row of rows) {
    const show = showEntry(map, row.tmdb_id)
    if (row.season_number !== null) {
      show.seasons.set(row.season_number, {
        watchedCount: row.watched_count,
        episodeNumbers: new Set(row.episode_numbers ?? []),
      })
    }
    noteLastWatched(show, row.last_watched_at)
  }
  return map
}

/**
 * Serie in corso **e** loro progresso di visione in una sola chiamata
 * (`get_in_progress_shows_progress`, `005_in_progress_progress.sql`): il join tra
 * stato dei titoli ed episodi visti avviene nel database, quindi la Home non deve
 * più chiedere prima l'elenco delle serie e poi il loro progresso.
 *
 * Se la RPC non è disponibile si ricade sui due passaggi separati.
 */
export async function loadInProgressProgress(userId: string): Promise<InProgressProgress> {
  const { data, error } = await supabase.rpc('get_in_progress_shows_progress')

  if (!error && data) {
    // La LEFT JOIN garantisce una riga per ogni serie in corso, anche senza
    // episodi visti: le chiavi della mappa sono l'elenco completo dei candidati.
    const progress = buildProgress(data as ProgressRow[])
    return { tmdbIds: [...progress.keys()], progress }
  }

  const tmdbIds = await fetchInProgressIds(userId)
  return { tmdbIds, progress: await fetchWatchedProgress(tmdbIds, userId) }
}

async function fetchInProgressIds(userId: string): Promise<number[]> {
  const { data } = await supabase
    .from('user_title_status')
    .select('tmdb_id')
    .eq('user_id', userId)
    .eq('media_type', 'tv')
    .eq('status', 'in_corso')

  return (data ?? []).map(row => row.tmdb_id as number)
}

/**
 * Progresso di visione di serie note (`get_watched_progress_per_show`,
 * `004_home_data.sql`): conteggio ed elenco degli episodi visti per stagione.
 *
 * È ciò che permette alla Home di scaricare da TMDB **una sola stagione** per serie
 * — quella che contiene il prossimo episodio, individuata confrontando gli episodi
 * visti con `episode_count` — invece di scorrere tutte le stagioni in sequenza.
 */
export async function fetchWatchedProgress(tmdbIds: number[], userId: string): Promise<WatchedProgressMap> {
  if (tmdbIds.length === 0) return new Map()

  const { data, error } = await supabase.rpc('get_watched_progress_per_show', { p_tmdb_ids: tmdbIds })

  // Senza la migrazione 004 eseguita sul database la RPC non esiste: si ricade
  // sulle query per singola serie. Più lenta, ma restituisce lo stesso risultato —
  // trattare l'errore come "nessun episodio visto" proporrebbe invece il primo
  // episodio di ogni serie.
  if (error || !data) return fetchWatchedProgressPerShow(tmdbIds, userId)

  return buildProgress(data as ProgressRow[])
}

/** Ripiego senza RPC: una query per serie, come prima della migrazione 004. */
async function fetchWatchedProgressPerShow(tmdbIds: number[], userId: string): Promise<WatchedProgressMap> {
  const map: WatchedProgressMap = new Map()

  await mapWithConcurrencyLimit(tmdbIds, FALLBACK_CONCURRENCY, async tmdbId => {
    const { data } = await supabase
      .from('user_episode_watched')
      .select('season_number, episode_number, watched_at')
      .eq('user_id', userId)
      .eq('tmdb_id', tmdbId)

    if (!data?.length) return
    const show = showEntry(map, tmdbId)
    for (const row of data) {
      let season = show.seasons.get(row.season_number)
      if (!season) {
        season = { watchedCount: 0, episodeNumbers: new Set() }
        show.seasons.set(row.season_number, season)
      }
      season.episodeNumbers.add(row.episode_number)
      season.watchedCount = season.episodeNumbers.size
      noteLastWatched(show, row.watched_at)
    }
  })

  return map
}
