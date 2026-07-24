import { useState, type FormEvent } from 'react'
import { tmdb, posterUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import { Link } from 'react-router-dom'
import type { TMDBMediaItem } from '@/types'
import { Search as SearchIcon, Loader2 } from 'lucide-react'

export function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBMediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await tmdb.search(query)
      const filtered = data.results
        .filter((r: unknown) => {
          const item = r as TMDBMediaItem
          return item.media_type === 'movie' || item.media_type === 'tv'
        })
        .map((r: unknown) => r as TMDBMediaItem)
      setResults(filtered)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-20 px-4">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca film o serie TV..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Cerca'}
        </button>
      </form>

      {!loading && searched && results.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400 text-center">Nessun risultato trovato.</p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {results.map(item => {
          const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'
          const title = 'title' in item ? item.title : ('name' in item ? item.name : '')
          const path = mediaType === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`
          return (
            <Link key={`${mediaType}-${item.id}`} to={path} className="group">
              <img
                src={posterUrl(item.poster_path, 'w342')}
                alt={title}
                className="w-full rounded-xl group-hover:opacity-80 transition-opacity"
                loading="lazy"
                onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
              />
              <p className="text-slate-900 dark:text-white text-sm mt-1 line-clamp-2">{title}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
