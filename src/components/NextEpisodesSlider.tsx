import { Link } from 'react-router-dom'
import { useNextEpisodesToWatch } from '@/hooks/useNextEpisodes'
import { NextEpisodeCard } from '@/components/NextEpisodeCard'
import { ChevronRight } from 'lucide-react'

const MAX_ITEMS = 10

export function NextEpisodesSlider() {
  const { items, loading, markWatched } = useNextEpisodesToWatch()

  if (loading || items.length === 0) return null

  const visible = items.slice(0, MAX_ITEMS)

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white px-4 mb-3">Prossimi episodi</h2>
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">
        {visible.map(item => (
          <div key={`${item.tmdbId}-${item.seasonNumber}-${item.episodeNumber}`} className="flex-shrink-0 w-40">
            <NextEpisodeCard item={item} onMarkWatched={markWatched} />
          </div>
        ))}
      </div>
      <Link
        to="/continue-watching"
        className="flex items-center gap-1 px-4 mt-2 text-accent text-sm font-medium hover:text-accent-light transition-colors"
      >
        Vedi tutte
        <ChevronRight size={16} />
      </Link>
    </section>
  )
}
