import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dices } from 'lucide-react'
import { useUserLists } from '@/hooks/useSupabase'
import { useTitleDetails, titleKey, type TitleDetailsMap } from '@/hooks/useTitleDetails'
import { HomeSection, SliderSkeleton } from '@/components/HomeSection'
import { posterUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import { MEDIA_TYPE_LABELS } from '@/lib/lists'
import type { UserTitleStatus } from '@/types'

/** Titoli mostrati nel carosello: i dettagli TMDB si scaricano solo per questi. */
const MAX_ITEMS = 12

const WATCHLIST = { status: 'da_vedere' } as const

function detailPath(item: UserTitleStatus): string {
  return item.media_type === 'tv' ? `/tv/${item.tmdb_id}` : `/movie/${item.tmdb_id}`
}

function WatchlistCard({
  item,
  details,
  detailsLoading,
}: {
  item: UserTitleStatus
  details: TitleDetailsMap
  detailsLoading: boolean
}) {
  const resolved = details.get(titleKey(item))

  if (!resolved && detailsLoading) {
    return (
      <div className="animate-pulse">
        <div className="w-full aspect-[2/3] rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-3/4 mt-2 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    )
  }

  // Titolo non risolto da TMDB: resta cliccabile invece di pulsare all'infinito.
  const title = resolved?.title ?? 'Titolo non disponibile'

  return (
    <Link to={detailPath(item)} className="group block">
      <img
        src={posterUrl(resolved?.posterPath ?? null, 'w342')}
        alt={title}
        className="w-full aspect-[2/3] object-cover rounded-xl group-hover:opacity-80 transition-opacity"
        loading="lazy"
        onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
      />
      <p className="text-slate-900 dark:text-white text-sm mt-2 line-clamp-2 font-medium">{title}</p>
      <p className="text-slate-500 dark:text-slate-400 text-xs">{MEDIA_TYPE_LABELS[item.media_type]}</p>
    </Link>
  )
}

/**
 * Titoli "Da vedere" per iniziare qualcosa di nuovo, con estrazione casuale
 * ("Cosa guardo stasera?") su **tutta** la watchlist, non solo sui titoli visibili.
 */
export function WatchlistSlider() {
  const navigate = useNavigate()
  const { titles, loading } = useUserLists(WATCHLIST)
  const visible = useMemo(() => titles.slice(0, MAX_ITEMS), [titles])
  const { details, loading: detailsLoading } = useTitleDetails(visible)

  if (loading) {
    return (
      <HomeSection title="Dalla tua watchlist">
        <SliderSkeleton count={4} width="w-28" aspect="poster" />
      </HomeSection>
    )
  }
  if (titles.length === 0) return null

  const pickRandom = () => {
    const pick = titles[Math.floor(Math.random() * titles.length)]
    if (pick) navigate(detailPath(pick))
  }

  return (
    <HomeSection
      title="Dalla tua watchlist"
      linkTo="/lists"
      action={
        <button
          onClick={pickRandom}
          title="Cosa guardo stasera?"
          aria-label="Cosa guardo stasera?"
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-accent hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <Dices size={18} />
        </button>
      }
    >
      {visible.map(item => (
        <div key={item.id} className="flex-shrink-0 w-28">
          <WatchlistCard item={item} details={details} detailsLoading={detailsLoading} />
        </div>
      ))}
    </HomeSection>
  )
}
