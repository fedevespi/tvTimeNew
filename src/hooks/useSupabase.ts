import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import type { UserTitleStatus, UserEpisodeWatched, Review, TitleStatus } from '@/types'

export function useTitleStatus(tmdbId: number, mediaType: 'movie' | 'tv') {
  const { user } = useAuth()
  const [status, setStatus] = useState<TitleStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('user_title_status')
      .select('status')
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdbId)
      .eq('media_type', mediaType)
      .single()
      .then(({ data }) => {
        setStatus(data?.status ?? null)
        setLoading(false)
      })
  }, [user, tmdbId, mediaType])

  const setStatus_ = async (newStatus: TitleStatus) => {
    if (!user) return
    const { error } = await supabase
      .from('user_title_status')
      .upsert(
        { user_id: user.id, tmdb_id: tmdbId, media_type: mediaType, status: newStatus },
        { onConflict: 'user_id,tmdb_id,media_type' }
      )
    if (!error) setStatus(newStatus)
  }

  const removeStatus = async () => {
    if (!user) return
    const { error } = await supabase
      .from('user_title_status')
      .delete()
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdbId)
      .eq('media_type', mediaType)
    if (!error) setStatus(null)
  }

  return { status, loading, setStatus: setStatus_, removeStatus }
}

export async function updateTvTitleStatus(userId: string, tmdbId: number, totalEpisodes: number, watchedCount: number) {
  const { data: current } = await supabase
    .from('user_title_status')
    .select('status')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', 'tv')
    .single()

  const currentStatus = current?.status as TitleStatus | null | undefined

  let newStatus: TitleStatus | null = null

  if (watchedCount === 0) {
    newStatus = 'da_vedere'
  } else if (watchedCount >= totalEpisodes && totalEpisodes > 0) {
    newStatus = 'visto'
  } else if (currentStatus !== 'visto') {
    newStatus = 'in_corso'
  }

  if (newStatus && newStatus !== currentStatus) {
    await supabase
      .from('user_title_status')
      .upsert(
        { user_id: userId, tmdb_id: tmdbId, media_type: 'tv', status: newStatus },
        { onConflict: 'user_id,tmdb_id,media_type' }
      )
  }
}

export function useWatchedEpisodes(tmdbId: number, totalEpisodes: number) {
  const { user } = useAuth()
  const [episodes, setEpisodes] = useState<UserEpisodeWatched[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEpisodes = async () => {
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('user_episode_watched')
      .select('*')
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdbId)
    setEpisodes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchEpisodes() }, [user, tmdbId])

  const toggleEpisode = async (seasonNumber: number, episodeNumber: number) => {
    if (!user) return
    const existing = episodes.find(
      e => e.season_number === seasonNumber && e.episode_number === episodeNumber
    )
    if (existing) {
      await supabase
        .from('user_episode_watched')
        .delete()
        .eq('id', existing.id)
    } else {
      await supabase
        .from('user_episode_watched')
        .insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          season_number: seasonNumber,
          episode_number: episodeNumber,
        })
    }
    await fetchEpisodes()
    const newCount = existing ? episodes.length - 1 : episodes.length + 1
    await updateTvTitleStatus(user.id, tmdbId, totalEpisodes, newCount)
  }

  const isWatched = (seasonNumber: number, episodeNumber: number) =>
    episodes.some(e => e.season_number === seasonNumber && e.episode_number === episodeNumber)

  return { episodes, loading, toggleEpisode, isWatched }
}

export function useReviews(tmdbId: number, mediaType: 'movie' | 'tv', seasonNumber?: number, episodeNumber?: number) {
  const [reviews, setReviews] = useState<(Review & { profiles: { username: string } | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      let query = supabase
        .from('reviews')
        .select('*, profiles(username)')
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)

      if (mediaType === 'tv' && seasonNumber !== undefined && episodeNumber !== undefined) {
        query = query
          .eq('season_number', seasonNumber)
          .eq('episode_number', episodeNumber)
      }

      const { data } = await query
      setReviews((data as (Review & { profiles: { username: string } | null })[]) ?? [])
      setLoading(false)
    }
    fetchReviews()
  }, [tmdbId, mediaType, seasonNumber, episodeNumber])

  return { reviews, loading }
}

export function useUserLists() {
  const { user } = useAuth()
  const [titles, setTitles] = useState<UserTitleStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('user_title_status')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setTitles(data ?? [])
        setLoading(false)
      })
  }, [user])

  return { titles, loading }
}
