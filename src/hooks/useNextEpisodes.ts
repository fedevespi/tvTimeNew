import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { tmdb } from '@/lib/tmdb'
import { updateTvTitleStatus } from '@/hooks/useSupabase'
import { mapWithConcurrencyLimit } from '@/lib/concurrency'
import { compareByLastWatched } from '@/lib/lastWatched'
import { loadInProgressProgress, seasonProgress, type InProgressProgress, type ShowProgress } from '@/lib/watchedProgress'
import { readCache, writeCache } from '@/lib/localCache'
import type { TMDBTvSummary, NextEpisodeItem, UpcomingEpisodeItem } from '@/types'

/** Due richieste TMDB per serie, quindi si può salire rispetto al vecchio 4. */
const FETCH_CONCURRENCY = 8
const BATCH_BUFFER = 5
/** Aggiornamenti accorpati durante il caricamento progressivo. */
const FLUSH_MS = 120
const SNAPSHOT_TTL_MS = 6 * 60 * 60 * 1000

interface ShowOutcome {
  /** Prossimo episodio già uscito e non visto. */
  next: NextEpisodeItem | null
  /** Primo episodio non ancora trasmesso, per la sezione "In arrivo". */
  upcoming: UpcomingEpisodeItem | null
}

interface FeedSnapshot {
  items: NextEpisodeItem[]
  upcoming: UpcomingEpisodeItem[]
}

interface FeedState extends FeedSnapshot {
  ready: boolean
}

const EMPTY_FEED: FeedState = { items: [], upcoming: [], ready: true }
const PENDING_FEED: FeedState = { items: [], upcoming: [], ready: false }

function hasAired(airDate: string | null | undefined, now: Date): boolean {
  return !!airDate && new Date(airDate) <= now
}

/** Episodio annunciato da TMDB per una serie di cui si è già visto tutto. */
function upcomingFromShow(show: TMDBTvSummary, now: Date): UpcomingEpisodeItem | null {
  const ep = show.next_episode_to_air
  if (!ep?.air_date || hasAired(ep.air_date, now)) return null
  return {
    tmdbId: show.id,
    showName: show.name,
    showPosterPath: show.poster_path,
    seasonNumber: ep.season_number,
    episodeNumber: ep.episode_number,
    episodeName: ep.name,
    stillPath: ep.still_path,
    airDate: ep.air_date,
  }
}

/**
 * Individua il prossimo episodio di una serie con **due sole richieste TMDB**:
 * il riepilogo della serie e la singola stagione che contiene l'episodio.
 *
 * La stagione giusta si deduce dal progresso già in memoria (`get_watched_progress_per_show`):
 * è la prima con meno episodi visti di `episode_count`. Prima invece si scaricavano
 * le stagioni una dopo l'altra, in serie, finché non si trovava un episodio da vedere.
 */
async function resolveShow(
  tmdbId: number,
  progress: ShowProgress | undefined,
  now: Date
): Promise<ShowOutcome> {
  try {
    const show = await tmdb.getTvSummary(tmdbId)
    const seasons = show.seasons
      .filter(s => s.season_number > 0 && s.episode_count > 0)
      .sort((a, b) => a.season_number - b.season_number)

    const firstIncomplete = seasons.findIndex(
      s => seasonProgress(progress, s.season_number).watchedCount < s.episode_count
    )
    // Se i conteggi dicono "tutto visto" si ricontrolla comunque l'ultima stagione:
    // l'`episode_count` di TMDB non sempre coincide con gli episodi elencati.
    const toScan = firstIncomplete === -1 ? seasons.slice(-1) : seasons.slice(firstIncomplete)

    for (const season of toScan) {
      const detail = await tmdb.getSeasonDetail(tmdbId, season.season_number)
      const watched = seasonProgress(progress, season.season_number).episodeNumbers
      const pending = detail.episodes
        .slice()
        .sort((a, b) => a.episode_number - b.episode_number)
        .find(ep => !watched.has(ep.episode_number))
      if (!pending) continue

      const item: NextEpisodeItem = {
        tmdbId,
        showName: show.name,
        showPosterPath: show.poster_path,
        seasonNumber: season.season_number,
        episodeNumber: pending.episode_number,
        episodeName: pending.name,
        stillPath: pending.still_path,
      }

      if (hasAired(pending.air_date, now)) return { next: item, upcoming: null }
      // Il primo episodio non visto non è ancora uscito: la serie non va in
      // "Prossimi episodi" ma in "In arrivo".
      return {
        next: null,
        upcoming: pending.air_date ? { ...item, airDate: pending.air_date } : null,
      }
    }

    return { next: null, upcoming: upcomingFromShow(show, now) }
  } catch {
    return { next: null, upcoming: null }
  }
}

function collectFeed(outcomes: (ShowOutcome | undefined)[], limit: number | undefined): FeedState {
  const items: NextEpisodeItem[] = []
  const upcoming: UpcomingEpisodeItem[] = []
  for (const outcome of outcomes) {
    if (!outcome) continue
    if (outcome.next) items.push(outcome.next)
    if (outcome.upcoming) upcoming.push(outcome.upcoming)
  }
  upcoming.sort((a, b) => a.airDate.localeCompare(b.airDate))
  return {
    items: limit === undefined ? items : items.slice(0, limit),
    upcoming,
    ready: true,
  }
}

/**
 * Serie "in corso" con il prossimo episodio da vedere, più gli episodi in arrivo
 * raccolti nella stessa passata (nessuna richiesta aggiuntiva).
 *
 * Il contenuto della sessione precedente viene mostrato subito da localStorage e
 * poi revalidato in background (stale-while-revalidate); al primo caricamento
 * assoluto le card compaiono man mano che arrivano, senza attendere l'ultima serie.
 */
export function useNextEpisodesToWatch(options?: { limit?: number }) {
  const limit = options?.limit
  const { user } = useAuth()

  const userId = user?.id
  const cacheKey = userId ? `home:next-episodes:${userId}:${limit ?? 'all'}` : null

  const snapshot = useMemo(
    () => (cacheKey ? readCache<FeedSnapshot>(cacheKey) : null),
    [cacheKey]
  )

  const [feed, setFeed] = useState<FeedState | null>(null)
  /**
   * Se qualcosa è già a schermo si sostituisce solo a caricamento concluso:
   * mostrare risultati parziali sopra dati completi sembrerebbe una perdita di
   * contenuto. Vive in un ref per non entrare nelle dipendenze di `load`.
   */
  const contentShown = useRef(snapshot !== null)
  const runId = useRef(0)

  const load = useCallback(async () => {
    if (!userId) {
      setFeed(EMPTY_FEED)
      return
    }

    const run = ++runId.current
    const isCurrent = () => runId.current === run

    if (!contentShown.current) setFeed(PENDING_FEED)

    let loaded: InProgressProgress | null = null
    try {
      loaded = await loadInProgressProgress(userId)
    } catch {
      loaded = null
    }
    if (!isCurrent()) return

    if (!loaded) {
      // Errore di rete: si conserva quanto è già a schermo invece di svuotare la
      // Home, e soprattutto non si sovrascrive lo snapshot con un elenco vuoto.
      if (!contentShown.current) setFeed(EMPTY_FEED)
      return
    }

    const { tmdbIds, progress } = loaded

    if (tmdbIds.length === 0) {
      setFeed(EMPTY_FEED)
      contentShown.current = true
      if (cacheKey) writeCache<FeedSnapshot>(cacheKey, { items: [], upcoming: [] }, SNAPSHOT_TTL_MS)
      return
    }

    // L'ordine dei candidati (visione più recente prima) è già l'ordine finale:
    // i risultati possono essere mostrati appena arrivano, senza riordinare dopo.
    const candidates = [...tmdbIds].sort((a, b) =>
      compareByLastWatched(progress.get(a)?.lastWatchedAt, progress.get(b)?.lastWatchedAt)
    )

    const now = new Date()
    const outcomes = new Array<ShowOutcome | undefined>(candidates.length)
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const flush = () => {
      flushTimer = null
      if (!isCurrent()) return
      setFeed(collectFeed(outcomes, limit))
    }
    const scheduleFlush = () => {
      if (contentShown.current) return
      if (flushTimer === null) flushTimer = setTimeout(flush, FLUSH_MS)
    }

    let cursor = 0
    let found = 0

    while (cursor < candidates.length && (limit === undefined || found < limit)) {
      const remaining = candidates.length - cursor
      // Con un limite si elabora un batch più grande del necessario: alcune serie
      // non producono un episodio da vedere (già in pari o non ancora uscito).
      const batchSize = limit === undefined ? remaining : Math.min(limit + BATCH_BUFFER, remaining)
      const offset = cursor
      const batch = candidates
        .slice(offset, offset + batchSize)
        .map((tmdbId, i) => ({ tmdbId, index: offset + i }))
      cursor += batchSize

      await mapWithConcurrencyLimit(batch, FETCH_CONCURRENCY, async ({ tmdbId, index }) => {
        const outcome = await resolveShow(tmdbId, progress.get(tmdbId), now)
        if (!isCurrent()) return
        // L'indice conserva l'ordine dei candidati anche se le risposte arrivano
        // in ordine sparso, così il rendering progressivo non riordina le card.
        outcomes[index] = outcome
        if (outcome.next) found++
        scheduleFlush()
      })
      if (!isCurrent()) return
    }

    if (flushTimer !== null) clearTimeout(flushTimer)
    if (!isCurrent()) return

    const result = collectFeed(outcomes, limit)
    contentShown.current = true
    setFeed(result)
    if (cacheKey) {
      writeCache<FeedSnapshot>(cacheKey, { items: result.items, upcoming: result.upcoming }, SNAPSHOT_TTL_MS)
    }
  }, [userId, limit, cacheKey])

  useEffect(() => { load() }, [load])

  const markWatched = useCallback(async (tmdbId: number, seasonNumber: number, episodeNumber: number) => {
    if (!user) return
    // La card sparisce subito: il resto (stato serie, ricalcolo) avviene dopo.
    setFeed(prev => {
      const current = prev ?? { items: snapshot?.items ?? [], upcoming: snapshot?.upcoming ?? [], ready: true }
      return { ...current, items: current.items.filter(i => i.tmdbId !== tmdbId) }
    })

    await supabase.from('user_episode_watched').insert({
      user_id: user.id,
      tmdb_id: tmdbId,
      season_number: seasonNumber,
      episode_number: episodeNumber,
    })
    const [show, countResult] = await Promise.all([
      tmdb.getTvSummary(tmdbId),
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
  }, [user, load, snapshot])

  const effective: FeedState = feed
    ?? (snapshot ? { items: snapshot.items, upcoming: snapshot.upcoming, ready: true } : PENDING_FEED)

  return {
    items: effective.items,
    upcoming: effective.upcoming,
    loading: !effective.ready,
    markWatched,
  }
}
