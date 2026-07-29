import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { TitleCollection } from '@/components/TitleCollection'
import { MEDIA_TYPE_LABELS, emptyListMessage, listPath, previewSize } from '@/lib/lists'
import type { TitleDetailsMap } from '@/hooks/useTitleDetails'
import type { ViewMode } from '@/hooks/useListViewMode'
import type { MediaType, TitleStatus, UserTitleStatus } from '@/types'

/**
 * Sezione "Serie TV" o "Film" all'interno di una lista: contatore totale,
 * anteprima dei primi elementi (quantità dipendente dalla vista attiva)
 * e link alla lista completa.
 */
export function TitleSection({
  status,
  mediaType,
  items,
  details,
  detailsLoading,
  viewMode,
}: {
  status: TitleStatus
  mediaType: MediaType
  items: UserTitleStatus[]
  details: TitleDetailsMap
  detailsLoading: boolean
  viewMode: ViewMode
}) {
  const preview = items.slice(0, previewSize(viewMode))
  const hasMore = items.length > preview.length

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {MEDIA_TYPE_LABELS[mediaType]}
          <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            · {items.length}
          </span>
        </h2>
        {hasMore && (
          <Link
            to={listPath(status, mediaType)}
            className="flex items-center gap-1 text-accent text-sm font-medium hover:text-accent-light transition-colors"
          >
            Vedi tutte
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm py-4">
          {emptyListMessage(status, mediaType)}
        </p>
      ) : (
        <TitleCollection
          items={preview}
          details={details}
          detailsLoading={detailsLoading}
          viewMode={viewMode}
        />
      )}
    </section>
  )
}
