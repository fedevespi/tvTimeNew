import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { readCache, writeCache } from '@/lib/localCache'
import type { HomeStats } from '@/types'

const STATS_TTL_MS = 5 * 60 * 1000

interface StatsRow {
  episodes_week: number
  episodes_month: number
  episodes_total: number
  shows_in_progress: number
  watchlist_count: number
}

/**
 * Contatori della riga statistiche in Home: una sola RPC aggregata
 * (`get_home_stats`, `004_home_data.sql`), con l'ultimo valore noto mostrato
 * subito da localStorage mentre si revalida.
 */
export function useHomeStats() {
  const { user } = useAuth()
  const cacheKey = user ? `home:stats:${user.id}` : null

  const cached = useMemo(() => (cacheKey ? readCache<HomeStats>(cacheKey) : null), [cacheKey])
  const [stats, setStats] = useState<HomeStats | null>(null)
  /** RPC non disponibile (migrazione 004 non eseguita): meglio nascondere la riga che mostrare zeri. */
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    if (!cacheKey) {
      setStats(null)
      return
    }
    let cancelled = false

    supabase.rpc('get_home_stats').then(({ data, error }) => {
      if (cancelled) return
      const row = (data as StatsRow[] | null)?.[0]
      if (error || !row) {
        setUnavailable(true)
        return
      }
      const next: HomeStats = {
        episodesWeek: row.episodes_week,
        episodesMonth: row.episodes_month,
        episodesTotal: row.episodes_total,
        showsInProgress: row.shows_in_progress,
        watchlistCount: row.watchlist_count,
      }
      setStats(next)
      setUnavailable(false)
      writeCache(cacheKey, next, STATS_TTL_MS)
    })

    return () => { cancelled = true }
  }, [cacheKey])

  const value = stats ?? cached
  return { stats: value, unavailable: unavailable && value === null }
}
