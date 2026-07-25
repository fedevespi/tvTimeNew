import { useNextEpisodesToWatch } from '@/hooks/useNextEpisodes'
import { NextEpisodeCard } from '@/components/NextEpisodeCard'

export function ContinueWatching() {
  const { items, loading, markWatched } = useNextEpisodesToWatch()

  return (
    <div className="pb-20 px-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Continua a guardare</h1>
      {loading ? (
        <div className="text-slate-900 dark:text-white text-center py-20">Caricamento...</div>
      ) : items.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-10">Nessuna serie in corso al momento.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {items.map(item => (
            <NextEpisodeCard
              key={`${item.tmdbId}-${item.seasonNumber}-${item.episodeNumber}`}
              item={item}
              onMarkWatched={markWatched}
            />
          ))}
        </div>
      )}
    </div>
  )
}
