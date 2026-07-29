import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Intestazione + carosello orizzontale condivisi da tutte le sezioni della Home,
 * così spaziature, titoli e link "Vedi tutte" restano allineati tra sezioni.
 * Ogni figlio si occupa della propria larghezza (`flex-shrink-0 w-…`).
 */
export function HomeSection({
  title,
  linkTo,
  linkLabel = 'Vedi tutte',
  action,
  children,
}: {
  title: string
  linkTo?: string
  linkLabel?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-2 px-4 mb-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <div className="flex items-center gap-1">
          {action}
          {linkTo && (
            <Link
              to={linkTo}
              className="flex items-center gap-1 text-accent text-sm font-medium hover:text-accent-light transition-colors"
            >
              {linkLabel}
              <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">{children}</div>
    </section>
  )
}

/** Placeholder animati mostrati al posto delle card finché i dati non arrivano. */
export function SliderSkeleton({
  count,
  width,
  aspect,
}: {
  count: number
  width: string
  aspect: 'video' | 'poster'
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`flex-shrink-0 ${width} animate-pulse`}>
          <div
            className={`w-full rounded-xl bg-slate-200 dark:bg-slate-700 ${
              aspect === 'video' ? 'aspect-video' : 'aspect-[2/3]'
            }`}
          />
          <div className="h-3 w-3/4 mt-2 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-1/3 mt-1.5 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </>
  )
}
