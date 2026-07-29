import { useState, useEffect } from 'react'
import type { ViewMode } from '@/types'

export type { ViewMode }

export function useListViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('tvtime-list-view') as ViewMode) || 'list'
  })

  useEffect(() => {
    localStorage.setItem('tvtime-list-view', viewMode)
  }, [viewMode])

  return { viewMode, setViewMode }
}
