const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

const apiKey = import.meta.env.VITE_TMDB_API_KEY

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('language', 'it-IT')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status}`)
  }
  return res.json() as Promise<T>
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

  getMovieDetail: (id: number) =>
    tmdbFetch<unknown>(`/movie/${id}`, { append_to_response: 'credits' }),

  getTvDetail: (id: number) =>
    tmdbFetch<unknown>(`/tv/${id}`, { append_to_response: 'credits' }),

  getSeasonDetail: (tvId: number, seasonNumber: number) =>
    tmdbFetch<unknown>(`/tv/${tvId}/season/${seasonNumber}`),
}

export function posterUrl(path: string | null, size: 'w200' | 'w342' | 'w500' | 'original' = 'w342'): string {
  if (!path) return '/placeholder-poster.png'
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function backdropUrl(path: string | null, size: 'w780' | 'original' = 'w780'): string {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}
