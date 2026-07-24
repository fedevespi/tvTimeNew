import type { Review } from '@/types'

interface ReviewWithProfile extends Review {
  profiles: { username: string } | null
}

interface ReviewListProps {
  reviews: ReviewWithProfile[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-slate-900 dark:text-white font-semibold">Recensioni</h3>
      {reviews.map(review => (
        <div key={review.id} className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-accent text-sm font-medium">
              {review.profiles?.username ?? 'Anonimo'}
            </span>
            {review.rating && (
              <span className="text-yellow-400 text-sm">{review.rating}/10</span>
            )}
          </div>
          {review.comment && (
            <p className="text-slate-700 dark:text-slate-300 text-sm">{review.comment}</p>
          )}
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            {new Date(review.created_at).toLocaleDateString('it-IT')}
          </p>
        </div>
      ))}
    </div>
  )
}
