import { NextEpisodeCard } from '@/components/NextEpisodeCard'
import { HomeSection, SliderSkeleton } from '@/components/HomeSection'
import type { NextEpisodeItem } from '@/types'

/**
 * Sezione "Prossimi episodi". È presentazionale: i dati arrivano dalla Home, che
 * con la stessa passata alimenta anche "In arrivo".
 */
export function NextEpisodesSlider({
  items,
  loading,
  onMarkWatched,
}: {
  items: NextEpisodeItem[]
  loading: boolean
  onMarkWatched: (tmdbId: number, seasonNumber: number, episodeNumber: number) => void
}) {
  if (loading) {
    return (
      <HomeSection title="Prossimi episodi">
        <SliderSkeleton count={3} width="w-40" aspect="video" />
      </HomeSection>
    )
  }
  if (items.length === 0) return null

  return (
    <HomeSection title="Prossimi episodi" linkTo="/continue-watching">
      {items.map(item => (
        <div key={`${item.tmdbId}-${item.seasonNumber}-${item.episodeNumber}`} className="flex-shrink-0 w-40">
          <NextEpisodeCard item={item} onMarkWatched={onMarkWatched} />
        </div>
      ))}
    </HomeSection>
  )
}
