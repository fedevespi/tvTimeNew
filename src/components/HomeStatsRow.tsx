import { Link } from 'react-router-dom'
import { useHomeStats } from '@/hooks/useHomeStats'
import { listPath } from '@/lib/lists'
import type { HomeStats } from '@/types'

interface Tile {
  key: keyof HomeStats
  label: string
  hint: string
  to?: string
}

const TILES: Tile[] = [
  { key: 'episodesWeek', label: 'Settimana', hint: 'Episodi visti negli ultimi 7 giorni' },
  { key: 'episodesMonth', label: '30 giorni', hint: 'Episodi visti negli ultimi 30 giorni' },
  { key: 'showsInProgress', label: 'In corso', hint: 'Serie TV in corso', to: listPath('in_corso', 'tv') },
  { key: 'watchlistCount', label: 'Da vedere', hint: 'Titoli nella watchlist', to: '/lists' },
]

const TILE_CLASS =
  'flex flex-col items-center justify-center rounded-xl bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700/50 py-2.5 px-1'

function TileContent({ value, label }: { value: number | null; label: string }) {
  return (
    <>
      {value === null ? (
        <div className="h-6 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      ) : (
        <span className="text-lg font-bold leading-tight text-slate-900 dark:text-white">{value}</span>
      )}
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </>
  )
}

/** Riga compatta di contatori in cima alla Home: contenuto immediato mentre il resto carica. */
export function HomeStatsRow() {
  const { stats, unavailable } = useHomeStats()

  if (unavailable) return null

  return (
    <div className="grid grid-cols-4 gap-2 px-4 mb-6">
      {TILES.map(tile => {
        const value = stats ? stats[tile.key] : null
        return tile.to ? (
          <Link
            key={tile.key}
            to={tile.to}
            title={tile.hint}
            className={`${TILE_CLASS} hover:border-accent/40 transition-colors`}
          >
            <TileContent value={value} label={tile.label} />
          </Link>
        ) : (
          <div key={tile.key} title={tile.hint} className={TILE_CLASS}>
            <TileContent value={value} label={tile.label} />
          </div>
        )
      })}
    </div>
  )
}
