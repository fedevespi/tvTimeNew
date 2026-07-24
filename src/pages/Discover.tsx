import { useState, useEffect, useCallback } from 'react'
import { tmdb, posterUrl } from '@/lib/tmdb'
import { Link } from 'react-router-dom'
import type { TMDBMediaItem } from '@/types'
import { QuickAddButton } from '@/components/QuickAddButton'
import { RefreshCw } from 'lucide-react'

export function Discover() {
  const [trending, setTrending] = useState<TMDBMediaItem[]>([])
  const [popularMovies, setPopularMovies] = useState<TMDBMediaItem[]>([])
  const [popularTv, setPopularTv] = useState<TMDBMediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
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
      setError('Errore nel caricamento dei dati.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="text-slate-900 dark:text-white text-center py-20">Caricamento...</div>
  if (error) return (
    <div className="text-center py-20">
      <p className="text-red-400 mb-4">{error}</p>
      <button onClick={load} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
        <RefreshCw size={16} />
        Riprova
      </button>
    </div>
  )

  return (
    <div className="pb-20">
      <Section title="Trending" items={trending} />
      <Section title="Film Popolari" items={popularMovies} />
      <Section title="Serie TV Popolari" items={popularTv} />
    </div>
  )
}

function Section({ title, items }: { title: string; items: TMDBMediaItem[] }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white px-4 mb-3">{title}</h2>
      <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">
        {items.map(item => (
          <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  )
}

function MediaCard({ item }: { item: TMDBMediaItem }) {
  const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'
  const title = 'title' in item ? item.title : ('name' in item ? item.name : '')
  const path = mediaType === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`

  return (
    <div className="relative flex-shrink-0 w-36 group">
      <Link to={path}>
        <div className="overflow-hidden rounded-xl">
          <img
            src={posterUrl(item.poster_path, 'w342')}
            alt={title}
            className="w-36 h-54 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <p className="text-slate-900 dark:text-white text-sm mt-2 line-clamp-2 font-medium">{title}</p>
        <p className="text-accent text-xs font-medium">
          {item.vote_average.toFixed(1)} ★
        </p>
      </Link>
      <QuickAddButton tmdbId={item.id} mediaType={mediaType} />
    </div>
  )
}
