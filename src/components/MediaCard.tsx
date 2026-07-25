import { Link } from 'react-router-dom'
import { posterUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import type { TMDBMediaItem } from '@/types'
import { QuickAddButton } from '@/components/QuickAddButton'

export function MediaCard({ item }: { item: TMDBMediaItem }) {
  const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'
  const title = 'title' in item ? item.title : ('name' in item ? item.name : '')
  const path = mediaType === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`

  return (
    <div className="relative group">
      <Link to={path}>
        <div className="overflow-hidden rounded-xl">
          <img
            src={posterUrl(item.poster_path, 'w342')}
            alt={title}
            className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
          />
        </div>
        <p className="text-slate-900 dark:text-white text-sm mt-2 line-clamp-2 font-medium">{title}</p>
        <p className="text-accent text-xs font-medium">
          {item.vote_average.toFixed(1)} ★
        </p>
      </Link>
      <QuickAddButton tmdbId={item.id} mediaType={mediaType} />
    </div>
  )
}
