import { useState, useEffect, useCallback } from 'react'
import { tmdb } from '@/lib/tmdb'
import type { TMDBMediaItem } from '@/types'
import { MediaCard } from '@/components/MediaCard'
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
          <div key={`${item.media_type}-${item.id}`} className="flex-shrink-0 w-36">
            <MediaCard item={item} />
          </div>
        ))}
      </div>
    </section>
  )
}
