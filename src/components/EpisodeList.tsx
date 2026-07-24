import { useState, type FormEvent } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ReviewList } from './ReviewList'
import { useReviews } from '@/hooks/useSupabase'
import { useToast } from '@/hooks/useToast'
import { CheckCircle } from 'lucide-react'

interface Episode {
  id: number
  name: string
  episode_number: number
  overview: string
  air_date: string | null
  still_path: string | null
  vote_average: number
}

interface EpisodeListProps {
  episodes: Episode[]
  tmdbId: number
  seasonNumber: number
  isWatched: (season: number, episode: number) => boolean
  onToggle: (season: number, episode: number) => void
}

export function EpisodeList({ episodes, tmdbId, seasonNumber, isWatched, onToggle }: EpisodeListProps) {
  return (
    <div className="space-y-3">
      {episodes.map(ep => (
        <EpisodeItem
          key={ep.id}
          episode={ep}
          tmdbId={tmdbId}
          seasonNumber={seasonNumber}
          watched={isWatched(seasonNumber, ep.episode_number)}
          onToggle={() => onToggle(seasonNumber, ep.episode_number)}
        />
      ))}
    </div>
  )
}

function EpisodeItem({
  episode, tmdbId, seasonNumber, watched, onToggle
}: {
  episode: Episode
  tmdbId: number
  seasonNumber: number
  watched: boolean
  onToggle: () => void
}) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { reviews } = useReviews(tmdbId, 'tv', seasonNumber, episode.episode_number)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState<number | ''>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || (!rating && !comment)) return
    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      tmdb_id: tmdbId,
      media_type: 'tv',
      season_number: seasonNumber,
      episode_number: episode.episode_number,
      rating: rating || null,
      comment: comment || null,
    })
    setSubmitting(false)
    if (error) {
      showToast('Errore nell\'invio della recensione.')
    } else {
      setRating('')
      setComment('')
      setShowReviewForm(false)
      showToast('Recensione pubblicata!', 'success')
    }
  }

  return (
    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
      <div className="flex items-start gap-3">
        {user && (
          <button
            onClick={onToggle}
            className={`mt-0.5 flex-shrink-0 transition-colors ${
              watched
                ? 'text-accent'
                : 'text-slate-500 hover:text-accent/70'
            }`}
          >
            <CheckCircle size={20} strokeWidth={watched ? 2.5 : 1.5} />
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-sm">E{episode.episode_number}</span>
            <span className="text-slate-900 dark:text-white font-medium">{episode.name}</span>
          </div>
          {episode.air_date && (
            <p className="text-slate-400 dark:text-slate-500 text-xs">{episode.air_date}</p>
          )}
          {episode.overview && (
            <p className="text-slate-700 dark:text-slate-300 text-sm mt-1 line-clamp-2">{episode.overview}</p>
          )}
          {episode.vote_average > 0 && (
            <p className="text-yellow-400 text-xs mt-1">{episode.vote_average.toFixed(1)} ★</p>
          )}
        </div>
      </div>

      {watched && user && (
        <div className="mt-3 ml-8">
          {!showReviewForm ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-accent text-sm hover:text-accent-light transition-colors"
            >
              {reviews.length > 0 ? `Leggi recensioni (${reviews.length})` : 'Scrivi recensione'}
            </button>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-2">
              <select
                value={rating}
                onChange={e => setRating(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
              >
                <option value="">Voto (opzionale)</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}/10</option>
                ))}
              </select>
              <textarea
                placeholder="Recensione (opzionale)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white text-sm resize-none focus:outline-none focus:border-accent/50 transition-colors"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || (!rating && !comment)}
                  className="px-4 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Invio...' : 'Invia'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          )}

          {showReviewForm && reviews.length > 0 && (
            <div className="mt-3">
              <ReviewList reviews={reviews} />
            </div>
          )}
          {!showReviewForm && reviews.length > 0 && (
            <ReviewList reviews={reviews} />
          )}
        </div>
      )}
    </div>
  )
}
