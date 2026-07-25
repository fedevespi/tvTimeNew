import { useState, useEffect, useCallback } from 'react'
import { tmdb } from '@/lib/tmdb'
import type { TMDBMediaItem } from '@/types'
import { MediaCard } from '@/components/MediaCard'
import { Search as SearchIcon, Loader2, RefreshCw } from 'lucide-react'

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 400

export function Search() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const [trending, setTrending] = useState<TMDBMediaItem[]>([])
  const [popularMovies, setPopularMovies] = useState<TMDBMediaItem[]>([])
  const [popularTv, setPopularTv] = useState<TMDBMediaItem[]>([])
  const [browseLoading, setBrowseLoading] = useState(true)
  const [browseError, setBrowseError] = useState('')

  const [results, setResults] = useState<TMDBMediaItem[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length >= MIN_QUERY_LENGTH
  const isPending = isSearching && trimmedQuery !== debouncedQuery

  const loadBrowseContent = useCallback(async () => {
    setBrowseLoading(true)
    setBrowseError('')
    try {
      const [t, m, tv] = await Promise.all([
        tmdb.getTrending('all'),
        tmdb.getPopular('movie'),
        tmdb.getPopular('tv'),
      ])
      setTrending(t.results.map((r: unknown) => ({ ...r as TMDBMediaItem, media_type: (r as TMDBMediaItem).media_type || 'movie' })))
      setPopularMovies(m.results.map((r: unknown) => ({ ...r as TMDBMediaItem, media_type: 'movie' })))
      setPopularTv(tv.results.map((r: unknown) => ({ ...r as TMDBMediaItem, media_type: 'tv' })))
    } catch {
      setBrowseError('Errore nel caricamento dei dati.')
    } finally {
      setBrowseLoading(false)
    }
  }, [])

  useEffect(() => { loadBrowseContent() }, [loadBrowseContent])

  useEffect(() => {
    if (!isSearching) {
      setResults([])
      setSearchError('')
      return
    }
    const timer = setTimeout(() => setDebouncedQuery(trimmedQuery), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmedQuery, isSearching])

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) return
    let cancelled = false
    setSearchLoading(true)
    setSearchError('')
    tmdb.search(debouncedQuery)
      .then(data => {
        if (cancelled) return
        const filtered = data.results
          .filter((r: unknown) => {
            const item = r as TMDBMediaItem
            return item.media_type === 'movie' || item.media_type === 'tv'
          })
          .map((r: unknown) => r as TMDBMediaItem)
        setResults(filtered)
      })
      .catch(() => {
        if (cancelled) return
        setSearchError('Errore nella ricerca. Riprova.')
        setResults([])
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false)
      })
    return () => { cancelled = true }
  }, [debouncedQuery])

  return (
    <div className="pb-20 px-4">
      <div className="relative mb-6">
        <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cerca film o serie TV..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-accent/50 transition-colors"
        />
        {(searchLoading || isPending) && (
          <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
      </div>

      {isSearching ? (
        <SearchResults loading={searchLoading || isPending} error={searchError} results={results} />
      ) : (
        <BrowseContent
          loading={browseLoading}
          error={browseError}
          onRetry={loadBrowseContent}
          trending={trending}
          popularMovies={popularMovies}
          popularTv={popularTv}
        />
      )}
    </div>
  )
}

function BrowseContent({ loading, error, onRetry, trending, popularMovies, popularTv }: {
  loading: boolean
  error: string
  onRetry: () => void
  trending: TMDBMediaItem[]
  popularMovies: TMDBMediaItem[]
  popularTv: TMDBMediaItem[]
}) {
  if (loading) return <div className="text-slate-900 dark:text-white text-center py-20">Caricamento...</div>
  if (error) return (
    <div className="text-center py-20">
      <p className="text-red-400 mb-4">{error}</p>
      <button onClick={onRetry} className="flex items-center gap-2 mx-auto px-6 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
        <RefreshCw size={16} />
        Riprova
      </button>
    </div>
  )
  return (
    <div>
      <Section title="Trending" items={trending} />
      <Section title="Film Popolari" items={popularMovies} />
      <Section title="Serie TV Popolari" items={popularTv} />
    </div>
  )
}

function Section({ title, items }: { title: string; items: TMDBMediaItem[] }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h2>
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
        {items.map(item => (
          <div key={`${item.media_type}-${item.id}`} className="flex-shrink-0 w-36">
            <MediaCard item={item} />
          </div>
        ))}
      </div>
    </section>
  )
}

function SearchResults({ loading, error, results }: {
  loading: boolean
  error: string
  results: TMDBMediaItem[]
}) {
  if (error) return <p className="text-red-400 text-center py-10">{error}</p>
  if (!loading && results.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400 text-center py-10">Nessun risultato trovato.</p>
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {results.map(item => (
        <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
      ))}
    </div>
  )
}
