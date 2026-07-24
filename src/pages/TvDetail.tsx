import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { tmdb, posterUrl, backdropUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import type { TMDBTvDetail, TMDBSeasonDetail } from '@/types'
import { useTitleStatus, useWatchedEpisodes } from '@/hooks/useSupabase'
import { useAuth } from '@/lib/auth'
import { StatusButton } from '@/components/StatusButton'
import { EpisodeList } from '@/components/EpisodeList'
import { RefreshCw } from 'lucide-react'

export function TvDetail() {
  const { id } = useParams<{ id: string }>()
  const [show, setShow] = useState<TMDBTvDetail | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [seasonDetail, setSeasonDetail] = useState<TMDBSeasonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const tmdbId = Number(id)
  const { status, setStatus, removeStatus } = useTitleStatus(tmdbId, 'tv')
  const totalEpisodes = show?.seasons
    ?.filter(s => s.season_number > 0)
    .reduce((acc, s) => acc + s.episode_count, 0) ?? 0
  const { isWatched, toggleEpisode } = useWatchedEpisodes(tmdbId, totalEpisodes)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await tmdb.getTvDetail(Number(id))
      const tvData = data as TMDBTvDetail
      setShow(tvData)
      if (tvData.seasons?.length > 0) {
        const firstVisible = tvData.seasons.find(s => s.season_number > 0) ?? tvData.seasons[0]
        if (firstVisible) setSelectedSeason(firstVisible.season_number)
      }
    } catch {
      setError('Errore nel caricamento della serie.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!show) return
    tmdb.getSeasonDetail(tmdbId, selectedSeason)
      .then(data => setSeasonDetail(data as TMDBSeasonDetail))
      .catch(() => setSeasonDetail(null))
  }, [show, tmdbId, selectedSeason])

  if (loading) return <div className="text-slate-900 dark:text-white text-center py-20">Caricamento...</div>
  if (error || !show) return (
    <div className="text-center py-20">
      <p className="text-red-400 mb-4">{error || 'Serie non trovata'}</p>
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
        style={{ backgroundImage: `url(${backdropUrl(show.backdrop_path)})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
      </div>

      <div className="px-4 -mt-20 relative z-10 flex gap-4">
        <img
          src={posterUrl(show.poster_path, 'w342')}
          alt={show.name}
          className="w-28 rounded-lg shadow-lg"
          onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
        />
        <div className="flex-1 pt-10">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{show.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {show.first_air_date?.slice(0, 4)} · {show.genres.map(g => g.name).join(', ')}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {show.number_of_seasons} {show.number_of_seasons === 1 ? 'stagione' : 'stagioni'}
          </p>
          <p className="text-yellow-400 text-sm">{show.vote_average.toFixed(1)} ★</p>
        </div>
      </div>

      <div className="px-4 mt-4">
        {user && (
          <StatusButton status={status} onChange={setStatus} onRemove={removeStatus} mediaType="tv" />
        )}
      </div>

      <div className="px-4 mt-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Trama</h2>
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{show.overview || 'Nessuna trama disponibile.'}</p>
      </div>

      {show.credits?.cast?.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Cast</h2>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {show.credits.cast.slice(0, 15).map(person => (
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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Stagioni</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {show.seasons.filter(s => s.season_number > 0).map(season => (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.season_number)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSeason === season.season_number
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Stagione {season.season_number}
            </button>
          ))}
        </div>
      </div>

      {seasonDetail && (
        <div className="px-4 mt-4">
          <EpisodeList
            episodes={seasonDetail.episodes}
            tmdbId={tmdbId}
            seasonNumber={selectedSeason}
            isWatched={isWatched}
            onToggle={toggleEpisode}
          />
        </div>
      )}
    </div>
  )
}
