import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { posterUrl, stillUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import { formatAirDate } from '@/lib/dates'
import { HomeSection } from '@/components/HomeSection'
import type { UpcomingEpisodeItem } from '@/types'

const MAX_ITEMS = 10

function UpcomingEpisodeCard({ item }: { item: UpcomingEpisodeItem }) {
  const imageUrl = item.stillPath ? stillUrl(item.stillPath) : posterUrl(item.showPosterPath)

  return (
    <Link to={`/tv/${item.tmdbId}?season=${item.seasonNumber}`} className="group block">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={imageUrl}
          alt={item.episodeName}
          className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
          loading="lazy"
          onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
        />
        <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          <CalendarClock size={11} />
          {formatAirDate(item.airDate)}
        </span>
      </div>
      <p className="text-slate-900 dark:text-white text-sm mt-2 line-clamp-1 font-medium">{item.showName}</p>
      <p className="text-slate-500 dark:text-slate-400 text-xs">
        S{item.seasonNumber}E{item.episodeNumber}
      </p>
    </Link>
  )
}

/**
 * Episodi non ancora trasmessi delle serie seguite. I dati arrivano dalla stessa
 * passata di "Prossimi episodi" (`useNextEpisodesToWatch`), quindi la sezione non
 * costa nessuna richiesta in più.
 */
export function UpcomingSlider({ items }: { items: UpcomingEpisodeItem[] }) {
  if (items.length === 0) return null

  return (
    <HomeSection title="In arrivo">
      {items.slice(0, MAX_ITEMS).map(item => (
        <div key={`${item.tmdbId}-${item.seasonNumber}-${item.episodeNumber}`} className="flex-shrink-0 w-40">
          <UpcomingEpisodeCard item={item} />
        </div>
      ))}
    </HomeSection>
  )
}
