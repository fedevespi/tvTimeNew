import { useState, useEffect } from 'react'
import type { ViewMode } from '@/types'

export type { ViewMode }

const STORAGE_KEY = 'tvboss-list-view'
/** Chiave usata quando l'app si chiamava tvTime: letta una volta per non perdere la preferenza. */
const LEGACY_STORAGE_KEY = 'tvtime-list-view'

export function useListViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    return (stored as ViewMode) || 'list'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode)
  }, [viewMode])

  return { viewMode, setViewMode }
}
