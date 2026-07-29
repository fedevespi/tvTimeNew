import { useMemo, useState } from 'react'
import { useUserLists } from '@/hooks/useSupabase'
import { useListViewMode } from '@/hooks/useListViewMode'
import { useTitleDetails } from '@/hooks/useTitleDetails'
import { useLastWatchedOrder } from '@/hooks/useLastWatchedOrder'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import { TitleSection } from '@/components/TitleSection'
import { TitleCollection } from '@/components/TitleCollection'
import { STATUS_LABELS, previewSize } from '@/lib/lists'
import type { TitleStatus } from '@/types'
import { Eye, Play, CheckCircle } from 'lucide-react'

const TABS: { key: TitleStatus; icon: typeof Eye }[] = [
  { key: 'da_vedere', icon: Eye },
  { key: 'in_corso', icon: Play },
  { key: 'visto', icon: CheckCircle },
]

export function MyLists() {
  const { titles, loading } = useUserLists()
  const [activeTab, setActiveTab] = useState<TitleStatus>('da_vedere')
  const { viewMode, setViewMode } = useListViewMode()

  const counts = useMemo(() => {
    const acc: Record<TitleStatus, number> = { da_vedere: 0, in_corso: 0, visto: 0 }
    for (const title of titles) acc[title.status] += 1
    return acc
  }, [titles])

  const inTab = useMemo(() => titles.filter(t => t.status === activeTab), [titles, activeTab])
  const tvItems = useMemo(() => inTab.filter(t => t.media_type === 'tv'), [inTab])
  const movieItems = useMemo(() => inTab.filter(t => t.media_type === 'movie'), [inTab])

  // "In corso" contiene solo serie TV: nessuna divisione, elenco unico
  // ordinato dalla visione più recente alla più remota.
  const isSplit = activeTab !== 'in_corso'
  const inProgress = useLastWatchedOrder(inTab, !isSplit)

  // Si caricano da TMDB solo i dettagli effettivamente mostrati a schermo:
  // la dimensione dell'anteprima dipende dalla vista attiva.
  const preview = previewSize(viewMode)
  const visibleItems = useMemo(
    () =>
      isSplit
        ? [...tvItems.slice(0, preview), ...movieItems.slice(0, preview)]
        : inProgress,
    [isSplit, tvItems, movieItems, inProgress, preview]
  )
  const { details, loading: detailsLoading } = useTitleDetails(visibleItems)

  if (loading) return <div className="text-slate-900 dark:text-white text-center py-20">Caricamento...</div>

  return (
    <div className="pb-20 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Le mie liste</h1>
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <tab.icon size={16} />
            {STATUS_LABELS[tab.key]}
            <span className={activeTab === tab.key ? 'text-accent/70' : 'text-slate-500 dark:text-slate-400'}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {inTab.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-10">
          Nessun titolo in questa lista.
        </p>
      ) : isSplit ? (
        <>
          <TitleSection
            status={activeTab}
            mediaType="tv"
            items={tvItems}
            details={details}
            detailsLoading={detailsLoading}
            viewMode={viewMode}
          />
          <TitleSection
            status={activeTab}
            mediaType="movie"
            items={movieItems}
            details={details}
            detailsLoading={detailsLoading}
            viewMode={viewMode}
          />
        </>
      ) : (
        <TitleCollection
          items={inProgress}
          details={details}
          detailsLoading={detailsLoading}
          viewMode={viewMode}
        />
      )}
    </div>
  )
}
