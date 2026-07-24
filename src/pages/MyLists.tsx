import { useState, useEffect } from 'react'
import { useUserLists } from '@/hooks/useSupabase'
import { useListViewMode } from '@/hooks/useListViewMode'
import { tmdb, posterUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import { Link } from 'react-router-dom'
import type { UserTitleStatus, TMDBMediaItem } from '@/types'
import { Eye, Play, CheckCircle, List, LayoutGrid } from 'lucide-react'

type Tab = 'da_vedere' | 'in_corso' | 'visto'

const TABS: { key: Tab; label: string; icon: typeof Eye }[] = [
  { key: 'da_vedere', label: 'Da vedere', icon: Eye },
  { key: 'in_corso', label: 'In corso', icon: Play },
  { key: 'visto', label: 'Visto', icon: CheckCircle },
]

export function MyLists() {
  const { titles, loading } = useUserLists()
  const [activeTab, setActiveTab] = useState<Tab>('da_vedere')
  const { viewMode, setViewMode } = useListViewMode()

  const filtered = titles.filter(t => t.status === activeTab)

  if (loading) return <div className="text-slate-900 dark:text-white text-center py-20">Caricamento...</div>

  return (
    <div className="pb-20 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Le mie liste</h1>
        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-1">
          <button
            onClick={() => setViewMode('list')}
            aria-label="Vista elenco"
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-accent/20 text-accent'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Vista griglia"
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-accent/20 text-accent'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
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
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-center py-10">
          Nessun titolo in questa lista.
        </p>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filtered.map(title => (
            <ListItem key={title.id} item={title} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(title => (
            <GridItem key={title.id} item={title} />
          ))}
        </div>
      )}
    </div>
  )
}

function ListItem({ item }: { item: UserTitleStatus }) {
  const [details, setDetails] = useState<TMDBMediaItem | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = item.media_type === 'movie'
          ? await tmdb.getMovieDetail(item.tmdb_id)
          : await tmdb.getTvDetail(item.tmdb_id)
        setDetails(data as TMDBMediaItem)
      } catch {
        // ignore
      }
    }
    fetch()
  }, [item])

  if (!details) return null

  const title = 'title' in details ? details.title : ('name' in details ? details.name : '')
  const path = item.media_type === 'tv' ? `/tv/${item.tmdb_id}` : `/movie/${item.tmdb_id}`

  return (
    <Link to={path} className="flex gap-3 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all duration-200 group">
      <div className="overflow-hidden rounded-lg">
        <img
          src={posterUrl(details.poster_path, 'w200')}
          alt={title}
          className="w-16 h-24 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
        />
      </div>
      <div className="flex-1">
        <p className="text-slate-900 dark:text-white font-medium">{title}</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{item.media_type === 'movie' ? 'Film' : 'Serie TV'}</p>
      </div>
    </Link>
  )
}

function GridItem({ item }: { item: UserTitleStatus }) {
  const [details, setDetails] = useState<TMDBMediaItem | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = item.media_type === 'movie'
          ? await tmdb.getMovieDetail(item.tmdb_id)
          : await tmdb.getTvDetail(item.tmdb_id)
        setDetails(data as TMDBMediaItem)
      } catch {
        // ignore
      }
    }
    fetch()
  }, [item])

  if (!details) return null

  const title = 'title' in details ? details.title : ('name' in details ? details.name : '')
  const path = item.media_type === 'tv' ? `/tv/${item.tmdb_id}` : `/movie/${item.tmdb_id}`

  return (
    <Link to={path} className="group">
      <img
        src={posterUrl(details.poster_path, 'w342')}
        alt={title}
        className="w-full aspect-[2/3] object-cover rounded-xl group-hover:opacity-80 transition-opacity"
        onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
      />
      <p className="text-slate-900 dark:text-white text-sm mt-1.5 line-clamp-2">{title}</p>
    </Link>
  )
}
