import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useUserLists } from '@/hooks/useSupabase'
import { useListViewMode } from '@/hooks/useListViewMode'
import { useTitleDetails } from '@/hooks/useTitleDetails'
import { useLastWatchedOrder } from '@/hooks/useLastWatchedOrder'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import { TitleCollection } from '@/components/TitleCollection'
import { emptyListMessage, fullListTitle, isMediaType, isTitleStatus } from '@/lib/lists'

/** Lista completa di un singolo stato e tipo media, es. /lists/visto/movie. */
export function ListDetail() {
  const { status, mediaType } = useParams()
  const { titles, loading } = useUserLists()
  const { viewMode, setViewMode } = useListViewMode()

  const valid = isTitleStatus(status) && isMediaType(mediaType)

  const filtered = useMemo(
    () =>
      valid
        ? titles.filter(t => t.status === status && t.media_type === mediaType)
        : [],
    [valid, titles, status, mediaType]
  )
  // Come in "Le mie liste": le serie in corso vanno dalla visione più recente
  // alla più remota, non per data di cambio stato.
  const items = useLastWatchedOrder(filtered, status === 'in_corso')
  const { details, loading: detailsLoading } = useTitleDetails(items)

  if (!valid) return <Navigate to="/lists" replace />

  return (
    <div className="pb-20 px-4">
      <Link
        to="/lists"
        className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-accent-light transition-colors mb-3"
      >
        <ChevronLeft size={16} />
        Le mie liste
      </Link>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {fullListTitle(status, mediaType)}
          <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            · {items.length}
          </span>
        </h1>
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {loading ? (
        <div className="text-slate-900 dark:text-white text-center py-20">Caricamento...</div>
      ) : items.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-10">
          {emptyListMessage(status, mediaType)}
        </p>
      ) : (
        <TitleCollection
          items={items}
          details={details}
          detailsLoading={detailsLoading}
          viewMode={viewMode}
        />
      )}
    </div>
  )
}
