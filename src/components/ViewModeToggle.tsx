import { List, LayoutGrid } from 'lucide-react'
import type { ViewMode } from '@/hooks/useListViewMode'

export function ViewModeToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}) {
  const buttonClass = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors ${
      active
        ? 'bg-accent/20 text-accent'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
    }`

  return (
    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-1">
      <button onClick={() => setViewMode('list')} aria-label="Vista elenco" className={buttonClass(viewMode === 'list')}>
        <List size={18} />
      </button>
      <button onClick={() => setViewMode('grid')} aria-label="Vista griglia" className={buttonClass(viewMode === 'grid')}>
        <LayoutGrid size={18} />
      </button>
    </div>
  )
}
