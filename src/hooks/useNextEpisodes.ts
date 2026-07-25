import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { tmdb } from '@/lib/tmdb'
import { useUserLists, updateTvTitleStatus } from '@/hooks/useSupabase'
import type { TMDBTvDetail, TMDBSeasonDetail, NextEpisodeItem, UserTitleStatus } from '@/types'

const FETCH_CONCURRENCY = 4
const BATCH_BUFFER = 5

async function mapWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++
      results[current] = await fn(items[current]!)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  )

  return results
}

async function fetchNextEpisode(
  title: UserTitleStatus,
  userId: string,
  now: Date,
  onLastWatchedAt: (tmdbId: number, watchedAt: string) => void
): Promise<NextEpisodeItem | null> {
  try {
    const [show, watchedResult] = await Promise.all([
      tmdb.getTvDetail(title.tmdb_id) as Promise<TMDBTvDetail>,
      supabase
        .from('user_episode_watched')
        .select('season_number, episode_number, watched_at')
        .eq('user_id', userId)
        .eq('tmdb_id', title.tmdb_id),
    ])

    const watchedRows = watchedResult.data ?? []
    const watchedKeySet = new Set(watchedRows.map(r => `${r.season_number}-${r.episode_number}`))
    const showLastWatchedAt = watchedRows.reduce<string | null>(
      (max, r) => (!max || r.watched_at > max ? r.watched_at : max),
      null
    )
    if (showLastWatchedAt) onLastWatchedAt(title.tmdb_id, showLastWatchedAt)

    const seasons = show.seasons
      .filter(s => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number)

    for (const season of seasons) {
      const detail = await tmdb.getSeasonDetail(title.tmdb_id, season.season_number) as TMDBSeasonDetail
      const episodes = detail.episodes.slice().sort((a, b) => a.episode_number - b.episode_number)

      for (const ep of episodes) {
        const key = `${season.season_number}-${ep.episode_number}`
        if (watchedKeySet.has(key)) continue
        if (!ep.air_date || new Date(ep.air_date) > now) return null

        return {
          tmdbId: title.tmdb_id,
          showName: show.name,
          showPosterPath: show.poster_path,
          seasonNumber: season.season_number,
          episodeNumber: ep.episode_number,
          episodeName: ep.name,
          stillPath: ep.still_path,
        }
      }
    }
    return null
  } catch {
    return null
  }
}

export function useNextEpisodesToWatch(options?: { limit?: number }) {
  const limit = options?.limit
  const { user } = useAuth()
  const { titles, loading: listsLoading } = useUserLists()
  const [items, setItems] = useState<NextEpisodeItem[]>([])
  const [loading, setLoading] = useState(true)

  const inProgressTv = useMemo(
    () => titles.filter(t => t.media_type === 'tv' && t.status === 'in_corso'),
    [titles]
  )

  const load = useCallback(async () => {
    if (!user || inProgressTv.length === 0) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)

    const { data: lastWatchedRows } = await supabase.rpc('get_last_watched_per_show', {
      p_tmdb_ids: inProgressTv.map(t => t.tmdb_id),
    })

    const rpcLastWatchedAt = new Map<number, string>(
      (lastWatchedRows ?? [])
        .filter((r: { tmdb_id: number; last_watched_at: string | null }) => r.last_watched_at !== null)
        .map((r: { tmdb_id: number; last_watched_at: string }) => [r.tmdb_id, r.last_watched_at])
    )

    const candidates = [...inProgressTv].sort((a, b) => {
      const aDate = rpcLastWatchedAt.get(a.tmdb_id)
      const bDate = rpcLastWatchedAt.get(b.tmdb_id)
      if (aDate && bDate) return bDate.localeCompare(aDate)
      if (aDate) return -1
      if (bDate) return 1
      return 0
    })

    const now = new Date()
    const finalLastWatchedAt = new Map<number, string>()
    const found: NextEpisodeItem[] = []
    let cursor = 0

    while (cursor < candidates.length && (limit === undefined || found.length < limit)) {
      const remaining = candidates.length - cursor
      const batchSize = limit === undefined ? remaining : Math.min(limit + BATCH_BUFFER, remaining)
      const batch = candidates.slice(cursor, cursor + batchSize)
      cursor += batchSize

      const batchResults = await mapWithConcurrencyLimit(batch, FETCH_CONCURRENCY, title =>
        fetchNextEpisode(title, user.id, now, (tmdbId, watchedAt) => {
          finalLastWatchedAt.set(tmdbId, watchedAt)
        })
      )

      found.push(...batchResults.filter((r): r is NextEpisodeItem => r !== null))
    }

    const sorted = found.sort((a, b) => {
      const aDate = finalLastWatchedAt.get(a.tmdbId)
      const bDate = finalLastWatchedAt.get(b.tmdbId)
      if (aDate && bDate) return bDate.localeCompare(aDate)
      if (aDate) return -1
      if (bDate) return 1
      return 0
    })

    setItems(limit === undefined ? sorted : sorted.slice(0, limit))
    setLoading(false)
  }, [user, inProgressTv, limit])

  useEffect(() => { load() }, [load])

  const markWatched = useCallback(async (tmdbId: number, seasonNumber: number, episodeNumber: number) => {
    if (!user) return
    await supabase.from('user_episode_watched').insert({
      user_id: user.id,
      tmdb_id: tmdbId,
      season_number: seasonNumber,
      episode_number: episodeNumber,
    })
    const [show, countResult] = await Promise.all([
      tmdb.getTvDetail(tmdbId) as Promise<TMDBTvDetail>,
      supabase
        .from('user_episode_watched')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId),
    ])
    const totalEpisodes = show.seasons
      .filter(s => s.season_number > 0)
      .reduce((acc, s) => acc + s.episode_count, 0)
    await updateTvTitleStatus(user.id, tmdbId, totalEpisodes, countResult.count ?? 0)
    await load()
  }, [user, load])

  return { items, loading: listsLoading || loading, markWatched }
}
