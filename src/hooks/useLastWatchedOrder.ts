import { useEffect, useMemo, useState } from 'react'
import { compareByLastWatched, fetchLastWatchedPerShow } from '@/lib/lastWatched'
import type { UserTitleStatus } from '@/types'

/**
 * Riordina i titoli dalla visione più recente alla più remota, in base
 * all'ultimo episodio segnato come visto. Usato per le serie "In corso":
 * `user_title_status.updated_at` riflette il cambio di stato, non l'ultima
 * visione, quindi da solo non produce l'ordine atteso.
 *
 * Quando `enabled` è false gli elementi vengono restituiti inalterati e
 * nessuna query viene eseguita. Finché la query è in volo l'ordine di
 * partenza resta visibile, senza schermate di caricamento intermedie.
 */
export function useLastWatchedOrder(items: UserTitleStatus[], enabled: boolean): UserTitleStatus[] {
  const [lastWatchedAt, setLastWatchedAt] = useState<Map<number, string>>(() => new Map())

  const tmdbIds = useMemo(() => (enabled ? items.map(item => item.tmdb_id) : []), [enabled, items])
  const requestKey = tmdbIds.join(',')

  useEffect(() => {
    if (tmdbIds.length === 0) {
      setLastWatchedAt(new Map())
      return
    }

    let cancelled = false
    fetchLastWatchedPerShow(tmdbIds).then(map => {
      if (!cancelled) setLastWatchedAt(map)
    })

    return () => { cancelled = true }
    // tmdbIds è ricalcolato a ogni render: la dipendenza reale è il suo contenuto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  return useMemo(() => {
    if (!enabled) return items
    return [...items].sort((a, b) =>
      compareByLastWatched(lastWatchedAt.get(a.tmdb_id), lastWatchedAt.get(b.tmdb_id))
    )
  }, [enabled, items, lastWatchedAt])
}
