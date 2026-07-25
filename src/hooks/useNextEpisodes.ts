import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { tmdb } from '@/lib/tmdb'
import { useUserLists, updateTvTitleStatus } from '@/hooks/useSupabase'
import type { TMDBTvDetail, TMDBSeasonDetail, NextEpisodeItem } from '@/types'

const FETCH_CONCURRENCY = 4

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

export function useNextEpisodesToWatch() {
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

    const now = new Date()
    const lastWatchedAt = new Map<number, string>()

    const results = await mapWithConcurrencyLimit(inProgressTv, FETCH_CONCURRENCY, async (title): Promise<NextEpisodeItem | null> => {
      try {
        const [show, watchedResult] = await Promise.all([
          tmdb.getTvDetail(title.tmdb_id) as Promise<TMDBTvDetail>,
          supabase
            .from('user_episode_watched')
            .select('season_number, episode_number, watched_at')
            .eq('user_id', user.id)
            .eq('tmdb_id', title.tmdb_id),
        ])

        const watchedRows = watchedResult.data ?? []
        const watchedKeySet = new Set(watchedRows.map(r => `${r.season_number}-${r.episode_number}`))
        const showLastWatchedAt = watchedRows.reduce<string | null>(
          (max, r) => (!max || r.watched_at > max ? r.watched_at : max),
          null
        )
        if (showLastWatchedAt) lastWatchedAt.set(title.tmdb_id, showLastWatchedAt)

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
    })

    const sorted = results
      .filter((r): r is NextEpisodeItem => r !== null)
      .sort((a, b) => {
        const aDate = lastWatchedAt.get(a.tmdbId)
        const bDate = lastWatchedAt.get(b.tmdbId)
        if (aDate && bDate) return bDate.localeCompare(aDate)
        if (aDate) return -1
        if (bDate) return 1
        return 0
      })

    setItems(sorted)
    setLoading(false)
  }, [user, inProgressTv])

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
