import { Eye, Play, CheckCircle, X } from 'lucide-react'
import type { TitleStatus, MediaType } from '@/types'

interface StatusButtonProps {
  status: TitleStatus | null
  onChange: (status: TitleStatus) => void
  onRemove: () => void
  mediaType: MediaType
}

export function StatusButton({ status, onChange, onRemove, mediaType }: StatusButtonProps) {
  const options = mediaType === 'movie'
    ? [
        { value: 'da_vedere' as const, icon: Eye, label: 'Da vedere' },
        { value: 'visto' as const, icon: CheckCircle, label: 'Visto' },
      ]
    : [
        { value: 'da_vedere' as const, icon: Eye, label: 'Da vedere' },
        { value: 'in_corso' as const, icon: Play, label: 'In corso', auto: true },
        { value: 'visto' as const, icon: CheckCircle, label: 'Visto' },
      ]

  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => !opt.auto && onChange(opt.value)}
          disabled={opt.auto}
          title={opt.label}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            status === opt.value
              ? 'bg-accent/20 text-accent border border-accent/30'
              : opt.auto
                ? 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-700/50 cursor-default'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <opt.icon size={16} />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
      {status && (
        <button
          onClick={onRemove}
          title="Rimuovi dalle liste"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700/50"
        >
          <X size={16} />
          <span className="hidden sm:inline">Rimuovi</span>
        </button>
      )}
    </div>
  )
}
