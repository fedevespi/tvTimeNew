import { supabase } from '@/lib/supabase'

interface LastWatchedRow {
  tmdb_id: number
  last_watched_at: string | null
}

/**
 * Data dell'ultimo episodio visto per ciascuna serie, in una sola query
 * economica (`get_last_watched_per_show`, `003_last_watched_per_show.sql`).
 * Le serie senza episodi visti non compaiono nella mappa.
 */
export async function fetchLastWatchedPerShow(tmdbIds: number[]): Promise<Map<number, string>> {
  if (tmdbIds.length === 0) return new Map()

  const { data } = await supabase.rpc('get_last_watched_per_show', { p_tmdb_ids: tmdbIds })

  return new Map(
    (data ?? [])
      .filter((row: LastWatchedRow) => row.last_watched_at !== null)
      .map((row: LastWatchedRow) => [row.tmdb_id, row.last_watched_at as string])
  )
}

/**
 * Comparatore dalla visione più recente alla più remota. Le serie senza
 * episodi visti finiscono in fondo, non in cima.
 */
export function compareByLastWatched(aDate: string | undefined, bDate: string | undefined): number {
  if (aDate && bDate) return bDate.localeCompare(aDate)
  if (aDate) return -1
  if (bDate) return 1
  return 0
}
