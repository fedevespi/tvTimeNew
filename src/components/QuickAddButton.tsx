import { useState, useRef, useEffect } from 'react'
import { useTitleStatus } from '@/hooks/useSupabase'
import { useAuth } from '@/lib/auth'
import { Plus, Eye, Play, CheckCircle } from 'lucide-react'

interface QuickAddButtonProps {
  tmdbId: number
  mediaType: 'movie' | 'tv'
}

const STATUS_CONFIG = {
  da_vedere: { icon: Eye, label: 'Da vedere' },
  in_corso: { icon: Play, label: 'In corso' },
  visto: { icon: CheckCircle, label: 'Visto' },
}

export function QuickAddButton({ tmdbId, mediaType }: QuickAddButtonProps) {
  const { user } = useAuth()
  const { status, setStatus } = useTitleStatus(tmdbId, mediaType)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  if (!user) return null

  if (status) {
    const config = STATUS_CONFIG[status]
    return (
      <span className="absolute top-1.5 right-1.5 bg-accent/20 text-accent p-1 rounded-full border border-accent/30">
        <config.icon size={12} />
      </span>
    )
  }

  return (
    <div className="absolute top-1.5 right-1.5" ref={menuRef}>
      <button
        onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu) }}
        className="bg-accent/90 hover:bg-accent text-white p-1 rounded-full transition-colors shadow-md"
      >
        <Plus size={14} />
      </button>
      {showMenu && (
        <div className="absolute right-0 top-8 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-xl py-1 z-20 w-40">
          {(['da_vedere', 'visto'] as const).map(key => {
            const config = STATUS_CONFIG[key]
            return (
              <button
                key={key}
                onClick={(e) => { e.preventDefault(); setStatus(key); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <config.icon size={14} className="text-slate-500 dark:text-slate-400" />
                {config.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
