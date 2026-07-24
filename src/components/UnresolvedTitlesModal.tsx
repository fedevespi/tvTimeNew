import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { tmdb, posterUrl, PLACEHOLDER_POSTER } from '@/lib/tmdb'
import {
  UnresolvedItem,
  saveResolvedItemToSupabase,
} from '@/lib/importer'
import {
  HelpCircle,
  Search,
  Check,
  Trash2,
  Loader2,
  Film,
  Tv,
  X,
} from 'lucide-react'

interface Candidate {
  id: number
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  poster_path?: string | null
  overview?: string
}

interface Props {
  userId: string
  items: UnresolvedItem[]
  onClose: (resolvedStatsDelta: { movies: number; series: number; episodes: number }) => void
}

export function UnresolvedTitlesModal({ userId, items, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  const [deltaStats, setDeltaStats] = useState({ movies: 0, series: 0, episodes: 0 })

  const currentItem = items[currentIndex]

  // Update search query when current item changes
  useEffect(() => {
    if (!currentItem) return
    const cleanedTitle = currentItem.title.replace(/\s*\(\d{4}\)$/, '')
    setSearchQuery(cleanedTitle)
    fetchCandidates(cleanedTitle, currentItem.type)
  }, [currentIndex, currentItem])

  const fetchCandidates = async (query: string, type: 'movie' | 'tv') => {
    if (!query.trim()) {
      setCandidates([])
      return
    }

    setSearching(true)
    try {
      if (type === 'movie') {
        const res = await tmdb.searchMovie(query)
        setCandidates((res.results || []).slice(0, 3) as Candidate[])
      } else {
        const res = await tmdb.searchTv(query)
        setCandidates((res.results || []).slice(0, 3) as Candidate[])
      }
    } catch (err) {
      console.error(err)
      setCandidates([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentItem) {
      fetchCandidates(searchQuery, currentItem.type)
    }
  }

  const handleSelectCandidate = async (candidateId: number) => {
    if (!currentItem || saving) return
    setSaving(true)

    try {
      const res = await saveResolvedItemToSupabase(userId, currentItem, candidateId)
      if (res.type === 'movie') {
        setDeltaStats(prev => ({ ...prev, movies: prev.movies + 1 }))
      } else {
        setDeltaStats(prev => ({
          ...prev,
          series: prev.series + 1,
          episodes: prev.episodes + res.episodesCount,
        }))
      }
      advanceNext()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSkipOrDelete = () => {
    advanceNext()
  }

  const advanceNext = () => {
    if (currentIndex + 1 < items.length) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onClose(deltaStats)
    }
  }

  if (!currentItem) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/15 text-amber-500 rounded-xl">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Risolvi Titolo Non Trovato
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Elemento {currentIndex + 1} di {items.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose(deltaStats)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Unresolved Item info */}
        <div className="bg-slate-200/50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-300/40 dark:border-slate-700/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
              {currentItem.type === 'movie' ? <Film size={14} /> : <Tv size={14} />}
              {currentItem.type === 'movie' ? 'Film non trovato' : 'Serie TV non trovata'}
            </span>
            {currentItem.year && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-300/50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                {currentItem.year}
              </span>
            )}
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            "{currentItem.title}"
          </p>
        </div>

        {/* Live Search Input */}
        <form onSubmit={handleSearchSubmit} className="space-y-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Cerca su TMDB per trovare il titolo corrispondente:
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Digita il nome corretto..."
              className="w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2 pl-9 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-accent transition-colors"
            />
            <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
            <button
              type="submit"
              aria-label="Cerca"
              className="absolute right-1.5 p-1.5 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors"
            >
              <Search size={15} />
            </button>
          </div>
        </form>

        {/* Candidates List */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {searching ? 'Ricerca suggerimenti in corso...' : 'Seleziona una delle alternative trovate:'}
          </p>

          {searching ? (
            <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="animate-spin text-accent" size={24} />
              <span className="text-xs">Ricerca alternative su TMDB...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-200/30 dark:bg-slate-900/30 rounded-xl border border-slate-300/30 dark:border-slate-700/30">
              Nessuna alternativa trovata per la ricerca attuale. Prova a modificare le parole chiave.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {candidates.map(candidate => {
                const title = candidate.title || candidate.name || 'Titolo sconosciuto'
                const year = candidate.release_date
                  ? candidate.release_date.substring(0, 4)
                  : (candidate.first_air_date ? candidate.first_air_date.substring(0, 4) : null)

                return (
                  <div
                    key={candidate.id}
                    className="flex items-center gap-3 bg-slate-200/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-300/40 dark:border-slate-700/40 hover:border-accent/50 transition-all group"
                  >
                    <img
                      src={posterUrl(candidate.poster_path ?? null, 'w200')}
                      alt={title}
                      className="w-10 h-14 object-cover rounded-md bg-slate-300 dark:bg-slate-800 shrink-0"
                      onError={e => { e.currentTarget.src = PLACEHOLDER_POSTER }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {title}
                      </p>
                      {year && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Anno: {year}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSelectCandidate(candidate.id)}
                      disabled={saving}
                      className="py-1.5 px-3 bg-accent hover:bg-accent/90 active:scale-95 text-white font-medium text-xs rounded-lg transition-all flex items-center gap-1 shrink-0"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      <span>Associa</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer option: Delete/Skip without replacing */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
          <button
            onClick={handleSkipOrDelete}
            disabled={saving}
            className="w-full py-2.5 px-3 bg-slate-200/60 dark:bg-slate-700/50 hover:bg-red-500/15 hover:text-red-500 text-slate-600 dark:text-slate-400 font-medium text-xs rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={15} />
            <span>Elimina senza sostituire (Ignora)</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
