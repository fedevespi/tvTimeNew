import { useAuth } from '@/lib/auth'
import { useNextEpisodesToWatch } from '@/hooks/useNextEpisodes'
import { NextEpisodesSlider } from '@/components/NextEpisodesSlider'
import { UpcomingSlider } from '@/components/UpcomingSlider'
import { WatchlistSlider } from '@/components/WatchlistSlider'
import { HomeStatsRow } from '@/components/HomeStatsRow'

const MAX_NEXT_EPISODES = 10

export function Home() {
  const { user } = useAuth()
  // Una sola passata alimenta sia "Prossimi episodi" sia "In arrivo".
  const { items, upcoming, loading, markWatched } = useNextEpisodesToWatch({ limit: MAX_NEXT_EPISODES })

  if (!user) return <div className="pb-20" />

  return (
    <div className="pb-20">
      <HomeStatsRow />
      <NextEpisodesSlider items={items} loading={loading} onMarkWatched={markWatched} />
      <UpcomingSlider items={upcoming} />
      <WatchlistSlider />
    </div>
  )
}
