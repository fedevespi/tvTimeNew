import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { tmdb, posterUrl, backdropUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import type { TMDBMovieDetail } from '@/types'
import { useTitleStatus, useReviews } from '@/hooks/useSupabase'
import { useAuth } from '@/lib/auth'
import { ReviewForm } from '@/components/ReviewForm'
import { ReviewList } from '@/components/ReviewList'
import { StatusButton } from '@/components/StatusButton'
import { RefreshCw } from 'lucide-react'

export function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const [movie, setMovie] = useState<TMDBMovieDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const tmdbId = Number(id)
  const { status, setStatus, removeStatus } = useTitleStatus(tmdbId, 'movie')
  const { reviews } = useReviews(tmdbId, 'movie')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await tmdb.getMovieDetail(Number(id))
      setMovie(data as TMDBMovieDetail)
    } catch {
      setError('Errore nel caricamento del film.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="text-slate-900 dark:text-white text-center py-20">Caricamento...</div>
  if (error || !movie) return (
    <div className="text-center py-20">
      <p className="text-red-400 mb-4">{error || 'Film non trovato'}</p>
      <button onClick={load} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors">
        <RefreshCw size={16} />
        Riprova
      </button>
    </div>
  )

  return (
    <div className="pb-20">
      <div
        className="h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${backdropUrl(movie.backdrop_path)})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
      </div>

      <div className="px-4 -mt-20 relative z-10 flex gap-4">
        <img
          src={posterUrl(movie.poster_path, 'w342')}
          alt={movie.title}
          className="w-28 rounded-lg shadow-lg"
          onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
        />
        <div className="flex-1 pt-10">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{movie.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {movie.release_date?.slice(0, 4)} · {movie.genres.map(g => g.name).join(', ')}
          </p>
          {movie.runtime && <p className="text-slate-500 dark:text-slate-400 text-sm">{movie.runtime} min</p>}
          <p className="text-yellow-400 text-sm">{movie.vote_average.toFixed(1)} ★</p>
        </div>
      </div>

      <div className="px-4 mt-4">
        {user && (
          <StatusButton status={status} onChange={setStatus} onRemove={removeStatus} mediaType="movie" />
        )}
      </div>

      <div className="px-4 mt-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Trama</h2>
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{movie.overview || 'Nessuna trama disponibile.'}</p>
      </div>

      {movie.credits?.cast?.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Cast</h2>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {movie.credits.cast.slice(0, 15).map(person => (
              <div key={person.id} className="flex-shrink-0 w-20 text-center">
                {person.profile_path ? (
                  <img
                    src={posterUrl(person.profile_path, 'w200')}
                    alt={person.name}
                    className="w-16 h-16 rounded-full object-cover mx-auto"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto" />
                )}
                <p className="text-slate-900 dark:text-white text-xs mt-1">{person.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{person.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        {user && status === 'visto' && (
          <ReviewForm tmdbId={tmdbId} mediaType="movie" onSubmitted={() => {}} />
        )}
        <ReviewList reviews={reviews} />
      </div>
    </div>
  )
}
