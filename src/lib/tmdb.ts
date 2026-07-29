import { readCache, writeCache } from '@/lib/localCache'
import type { TMDBSeasonDetail, TMDBTvSummary } from '@/types'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

const apiKey = import.meta.env.VITE_TMDB_API_KEY

const tmdbCache = new Map<string, Promise<unknown>>()

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * TTL della risposta: un numero fisso, o una funzione della risposta stessa per
 * i dati che invecchiano a velocità diversa (una stagione conclusa è immutabile,
 * una in corso cambia a ogni episodio trasmesso).
 */
type PersistTtl<T> = number | ((data: T) => number)

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  persistTtl?: PersistTtl<T>
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('language', 'it-IT')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const cacheKey = url.toString()

  const cached = tmdbCache.get(cacheKey)
  if (cached) return cached as Promise<T>

  // La chiave persistita esclude l'api_key: non va scritta su localStorage.
  const persistKey = persistTtl === undefined
    ? null
    : `tmdb:${path}?${new URLSearchParams({ language: 'it-IT', ...params }).toString()}`

  if (persistKey) {
    const stored = readCache<T>(persistKey)
    if (stored !== null) {
      const resolved = Promise.resolve(stored)
      tmdbCache.set(cacheKey, resolved)
      return resolved
    }
  }

  const request = (async () => {
    const res = await fetch(cacheKey)
    if (!res.ok) {
      throw new Error(`TMDB API error: ${res.status}`)
    }
    const data = (await res.json()) as T
    if (persistKey) {
      const ttl = typeof persistTtl === 'function' ? persistTtl(data) : persistTtl!
      writeCache(persistKey, data, ttl)
    }
    return data
  })().catch(err => {
    tmdbCache.delete(cacheKey)
    throw err
  })

  tmdbCache.set(cacheKey, request)
  return request as Promise<T>
}

/** Vero se la data cade nella finestra "di attualità" attorno a oggi. */
function isRecentOrImminent(airDate: string | null | undefined, pastDays: number, futureDays: number): boolean {
  if (!airDate) return false
  const time = new Date(airDate).getTime()
  if (Number.isNaN(time)) return false
  const now = Date.now()
  return time >= now - pastDays * DAY && time <= now + futureDays * DAY
}

/**
 * Una stagione ancora in onda (o appena conclusa) può guadagnare episodi o date:
 * TTL breve. Una stagione vecchia non cambia più: TTL lungo.
 */
function seasonDetailTtl(data: TMDBSeasonDetail): number {
  const inFlight = data.episodes?.some(ep => isRecentOrImminent(ep.air_date, 3, 30))
  return inFlight ? 30 * MINUTE : 7 * DAY
}

/** Con un episodio in arrivo a breve il dato scade presto, altrimenti dura ore. */
function tvSummaryTtl(data: TMDBTvSummary): number {
  return isRecentOrImminent(data.next_episode_to_air?.air_date, 1, 3) ? 30 * MINUTE : 6 * HOUR
}

export const tmdb = {
  getPopular: (mediaType: 'movie' | 'tv') =>
    tmdbFetch<{ results: unknown[] }>(`/${mediaType}/popular`),

  getTrending: (mediaType: 'movie' | 'tv' | 'all') =>
    tmdbFetch<{ results: unknown[] }>(`/trending/${mediaType}/week`),

  getTopRated: (mediaType: 'movie' | 'tv') =>
    tmdbFetch<{ results: unknown[] }>(`/${mediaType}/top_rated`),

  getNowPlaying: () =>
    tmdbFetch<{ results: unknown[] }>('/movie/now_playing'),

  getUpcoming: () =>
    tmdbFetch<{ results: unknown[] }>('/movie/upcoming'),

  search: (query: string) =>
    tmdbFetch<{ results: unknown[] }>('/search/multi', { query }),

  /**
   * `original_title` e `release_date` servono a verificare l'abbinamento: la
   * risposta è in italiano, mentre il titolo cercato arriva spesso in inglese.
   */
  searchMovie: (query: string, year?: number) =>
    tmdbFetch<{
      results: Array<{ id: number; title: string; original_title?: string; release_date?: string }>
    }>('/search/movie', {
      query,
      ...(year ? { year: year.toString() } : {}),
    }),

  searchTv: (query: string, year?: number) =>
    tmdbFetch<{
      results: Array<{ id: number; name: string; original_name?: string; first_air_date?: string }>
    }>('/search/tv', {
      query,
      ...(year ? { first_air_date_year: year.toString() } : {}),
    }),

  findByExternalId: (id: string | number, source: 'tvdb_id' | 'imdb_id') =>
    tmdbFetch<{
      movie_results: Array<{ id: number; title: string; release_date?: string }>;
      tv_results: Array<{ id: number; name: string; first_air_date?: string }>;
    }>(`/find/${id}`, { external_source: source }),

  getMovieDetail: (id: number) =>
    tmdbFetch<unknown>(`/movie/${id}`, { append_to_response: 'credits' }),

  getTvDetail: (id: number) =>
    tmdbFetch<unknown>(`/tv/${id}`, { append_to_response: 'credits' }),

  /**
   * Versione leggera di `getTvDetail` per la Home: senza `credits`, che qui non
   * serve e pesa quanto il resto della risposta. Persistita, così tornare sulla
   * Home non ripaga le stesse richieste.
   */
  getTvSummary: (id: number) =>
    tmdbFetch<TMDBTvSummary>(`/tv/${id}`, {}, tvSummaryTtl),

  getSeasonDetail: (tvId: number, seasonNumber: number) =>
    tmdbFetch<TMDBSeasonDetail>(`/tv/${tvId}/season/${seasonNumber}`, {}, seasonDetailTtl),
}

export const PLACEHOLDER_POSTER = '/placeholder-poster.svg'

export function posterUrl(path: string | null, size: 'w200' | 'w342' | 'w500' | 'original' = 'w342'): string {
  if (!path) return PLACEHOLDER_POSTER
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function backdropUrl(path: string | null, size: 'w780' | 'original' = 'w780'): string {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function stillUrl(path: string | null, size: 'w300' | 'w780' | 'original' = 'w300'): string {
  if (!path) return PLACEHOLDER_POSTER
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}
