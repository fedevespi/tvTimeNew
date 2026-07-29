import { Link } from 'react-router-dom'
import { posterUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import { MEDIA_TYPE_LABELS } from '@/lib/lists'
import { titleKey, type TitleDetails, type TitleDetailsMap } from '@/hooks/useTitleDetails'
import type { ViewMode } from '@/hooks/useListViewMode'
import type { UserTitleStatus } from '@/types'

function detailPath(item: UserTitleStatus): string {
  return item.media_type === 'tv' ? `/tv/${item.tmdb_id}` : `/movie/${item.tmdb_id}`
}

/**
 * Dettagli da mostrare per un titolo che TMDB non ha risolto: senza fallback
 * resterebbe uno skeleton pulsante all'infinito, senza spiegazione.
 */
function fallbackDetails(): TitleDetails {
  return { title: 'Titolo non disponibile', posterPath: null }
}

/**
 * Dettagli caricati, oppure `undefined` finché il caricamento è in corso
 * (skeleton), oppure il fallback se il caricamento è finito senza risultato.
 */
function resolveDetails(details: TitleDetails | undefined, detailsLoading: boolean) {
  if (details) return details
  return detailsLoading ? undefined : fallbackDetails()
}

function ListItemSkeleton() {
  return (
    <div className="flex gap-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50 animate-pulse">
      <div className="w-16 h-24 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  )
}

function GridItemSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full aspect-[2/3] rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="h-3 w-2/3 mt-2 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}

function TitleListItem({
  item,
  details,
  detailsLoading,
}: {
  item: UserTitleStatus
  details?: TitleDetails
  detailsLoading: boolean
}) {
  const resolved = resolveDetails(details, detailsLoading)
  if (!resolved) return <ListItemSkeleton />

  return (
    <Link
      to={detailPath(item)}
      className="flex gap-3 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all duration-200 group"
    >
      <div className="overflow-hidden rounded-lg">
        <img
          src={posterUrl(resolved.posterPath, 'w200')}
          alt={resolved.title}
          className="w-16 h-24 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
        />
      </div>
      <div className="flex-1">
        <p className="text-slate-900 dark:text-white font-medium">{resolved.title}</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{MEDIA_TYPE_LABELS[item.media_type]}</p>
      </div>
    </Link>
  )
}

function TitleGridItem({
  item,
  details,
  detailsLoading,
}: {
  item: UserTitleStatus
  details?: TitleDetails
  detailsLoading: boolean
}) {
  const resolved = resolveDetails(details, detailsLoading)
  if (!resolved) return <GridItemSkeleton />

  return (
    <Link to={detailPath(item)} className="group">
      <img
        src={posterUrl(resolved.posterPath, 'w342')}
        alt={resolved.title}
        className="w-full aspect-[2/3] object-cover rounded-xl group-hover:opacity-80 transition-opacity"
        onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
      />
      <p className="text-slate-900 dark:text-white text-sm mt-1.5 line-clamp-2">{resolved.title}</p>
    </Link>
  )
}

/** Elenco di titoli nella vista scelta (righe o griglia di poster). */
export function TitleCollection({
  items,
  details,
  detailsLoading,
  viewMode,
}: {
  items: UserTitleStatus[]
  details: TitleDetailsMap
  detailsLoading: boolean
  viewMode: ViewMode
}) {
  const Item = viewMode === 'list' ? TitleListItem : TitleGridItem

  return (
    <div className={viewMode === 'list' ? 'space-y-3' : 'grid grid-cols-2 gap-3'}>
      {items.map(item => (
        <Item
          key={item.id}
          item={item}
          details={details.get(titleKey(item))}
          detailsLoading={detailsLoading}
        />
      ))}
    </div>
  )
}
