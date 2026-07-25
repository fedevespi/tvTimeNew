import { Link } from 'react-router-dom'
import { posterUrl, stillUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import type { NextEpisodeItem } from '@/types'
import { CheckCircle } from 'lucide-react'

interface NextEpisodeCardProps {
  item: NextEpisodeItem
  onMarkWatched: (tmdbId: number, seasonNumber: number, episodeNumber: number) => void
}

export function NextEpisodeCard({ item, onMarkWatched }: NextEpisodeCardProps) {
  const imageUrl = item.stillPath ? stillUrl(item.stillPath) : posterUrl(item.showPosterPath)

  return (
    <div className="relative group">
      <Link to={`/tv/${item.tmdbId}?season=${item.seasonNumber}`}>
        <div className="overflow-hidden rounded-xl">
          <img
            src={imageUrl}
            alt={item.episodeName}
            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
          />
        </div>
        <p className="text-slate-900 dark:text-white text-sm mt-2 line-clamp-1 font-medium">{item.showName}</p>
        <p className="text-slate-500 dark:text-slate-400 text-xs">
          S{item.seasonNumber}E{item.episodeNumber}
        </p>
      </Link>
      <button
        onClick={e => { e.preventDefault(); onMarkWatched(item.tmdbId, item.seasonNumber, item.episodeNumber) }}
        className="absolute top-1.5 right-1.5 bg-accent/90 hover:bg-accent text-white p-1 rounded-full transition-colors shadow-md"
        aria-label="Segna come visto"
      >
        <CheckCircle size={14} />
      </button>
    </div>
  )
}
