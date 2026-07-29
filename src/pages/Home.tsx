import { useNextEpisodesToWatch } from '@/hooks/useNextEpisodes'
import { NextEpisodesSlider } from '@/components/NextEpisodesSlider'
import { UpcomingSlider } from '@/components/UpcomingSlider'
import { WatchlistSlider } from '@/components/WatchlistSlider'
import { HomeStatsRow } from '@/components/HomeStatsRow'

const MAX_NEXT_EPISODES = 10

/** Route protetta: senza sessione `ProtectedRoute` reindirizza a `/login`. */
export function Home() {
  // Una sola passata alimenta sia "Prossimi episodi" sia "In arrivo".
  const { items, upcoming, loading, markWatched } = useNextEpisodesToWatch({ limit: MAX_NEXT_EPISODES })

  return (
    <div className="pb-20">
      <HomeStatsRow />
      <NextEpisodesSlider items={items} loading={loading} onMarkWatched={markWatched} />
      <UpcomingSlider items={upcoming} />
      <WatchlistSlider />
    </div>
  )
}
