import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/useToast'

interface ReviewFormProps {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  seasonNumber?: number
  episodeNumber?: number
  onSubmitted: () => void
}

export function ReviewForm({ tmdbId, mediaType, seasonNumber, episodeNumber, onSubmitted }: ReviewFormProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [rating, setRating] = useState<number | ''>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || (!rating && !comment)) return
    setSubmitting(true)

    const { error: insertError } = await supabase.from('reviews').insert({
      user_id: user.id,
      tmdb_id: tmdbId,
      media_type: mediaType,
      season_number: seasonNumber ?? null,
      episode_number: episodeNumber ?? null,
      rating: rating || null,
      comment: comment || null,
    })

    setSubmitting(false)
    if (insertError) {
      showToast('Errore nell\'invio della recensione.')
    } else {
      setRating('')
      setComment('')
      showToast('Recensione pubblicata!', 'success')
      onSubmitted()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl p-4 space-y-3 border border-slate-200 dark:border-slate-700/50">
      <h3 className="text-slate-900 dark:text-white font-semibold">La tua recensione</h3>
      <select
        value={rating}
        onChange={e => setRating(e.target.value ? Number(e.target.value) : '')}
        className="w-full px-3 py-2.5 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
      >
        <option value="">Seleziona un voto (opzionale)</option>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <option key={n} value={n}>{n}/10</option>
        ))}
      </select>
      <textarea
        placeholder="Scrivi la tua recensione (opzionale)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white text-sm resize-none focus:outline-none focus:border-accent/50 transition-colors"
        rows={3}
      />
      <button
        type="submit"
        disabled={submitting || (!rating && !comment)}
        className="px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Invio...' : 'Pubblica'}
      </button>
    </form>
  )
}
