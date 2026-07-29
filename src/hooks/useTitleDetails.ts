import { useEffect, useMemo, useState } from 'react'
import { tmdb } from '@/lib/tmdb'
import { mapWithConcurrencyLimit } from '@/lib/concurrency'
import type { TMDBMediaItem, UserTitleStatus } from '@/types'

const FETCH_CONCURRENCY = 4
/** Le risposte risolte vengono accorpate in un solo update ogni FLUSH_MS. */
const FLUSH_MS = 100

export interface TitleDetails {
  title: string
  posterPath: string | null
}

export type TitleDetailsMap = Map<string, TitleDetails>

export function titleKey(item: Pick<UserTitleStatus, 'media_type' | 'tmdb_id'>): string {
  return `${item.media_type}-${item.tmdb_id}`
}

/**
 * Carica da TMDB titolo e poster degli elementi passati, con concorrenza limitata.
 * Sostituisce la fetch-per-riga: la pagina richiede solo i dettagli che mostra
 * davvero e i risultati vengono resi progressivamente, senza waterfall.
 * I dettagli già ottenuti restano in mappa anche al cambio di elenco, così
 * tornare su una lista visitata non ricarica nulla.
 */
export function useTitleDetails(items: UserTitleStatus[]) {
  const [details, setDetails] = useState<TitleDetailsMap>(() => new Map())
  const [loading, setLoading] = useState(items.length > 0)

  const requestKey = useMemo(() => items.map(titleKey).join(','), [items])

  useEffect(() => {
    if (items.length === 0) {
      setLoading(false)
      return
    }

    let cancelled = false
    const pending: TitleDetailsMap = new Map()
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const flush = () => {
      flushTimer = null
      if (cancelled || pending.size === 0) return
      // Snapshot prima di svuotare: React invoca l'updater in fase di render,
      // quindi non può chiudere su `pending`, che a quel punto è già vuota.
      const batch = Array.from(pending)
      pending.clear()
      setDetails(prev => {
        const next = new Map(prev)
        for (const [key, value] of batch) next.set(key, value)
        return next
      })
    }

    const scheduleFlush = () => {
      if (flushTimer === null) flushTimer = setTimeout(flush, FLUSH_MS)
    }

    setLoading(true)

    mapWithConcurrencyLimit(items, FETCH_CONCURRENCY, async item => {
      try {
        const data = (item.media_type === 'movie'
          ? await tmdb.getMovieDetail(item.tmdb_id)
          : await tmdb.getTvDetail(item.tmdb_id)) as TMDBMediaItem
        if (cancelled) return
        const title = 'title' in data ? data.title : 'name' in data ? data.name : ''
        pending.set(titleKey(item), { title, posterPath: data.poster_path })
        scheduleFlush()
      } catch {
        // titolo non risolvibile su TMDB: resta senza dettagli
      }
    }).then(() => {
      if (cancelled) return
      flush()
      setLoading(false)
    })

    return () => {
      cancelled = true
      if (flushTimer !== null) clearTimeout(flushTimer)
    }
    // items è ricalcolato a ogni render: la dipendenza reale è la sua identità logica
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  return { details, loading }
}
