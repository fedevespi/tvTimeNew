import { Link } from 'react-router-dom'
import { useNextEpisodesToWatch } from '@/hooks/useNextEpisodes'
import { NextEpisodeCard } from '@/components/NextEpisodeCard'
import { ChevronRight } from 'lucide-react'

const MAX_ITEMS = 10

export function NextEpisodesSlider() {
  const { items, loading, markWatched } = useNextEpisodesToWatch({ limit: MAX_ITEMS })

  if (loading || items.length === 0) return null

  const visible = items

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prossimi episodi</h2>
        <Link
          to="/continue-watching"
          className="flex items-center gap-1 text-accent text-sm font-medium hover:text-accent-light transition-colors"
        >
          Vedi tutte
          <ChevronRight size={16} />
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">
        {visible.map(item => (
          <div key={`${item.tmdbId}-${item.seasonNumber}-${item.episodeNumber}`} className="flex-shrink-0 w-40">
            <NextEpisodeCard item={item} onMarkWatched={markWatched} />
          </div>
        ))}
      </div>
    </section>
  )
}
