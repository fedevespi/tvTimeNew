export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
}

export interface TMDBTvShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  genre_ids: number[]
}

export type TMDBMediaItem = (TMDBMovie | TMDBTvShow) & { media_type?: string }

export interface TMDBMovieDetail {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genres: { id: number; name: string }[]
  runtime: number | null
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[]
  }
}

export interface TMDBTvDetail {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  genres: { id: number; name: string }[]
  number_of_seasons: number
  seasons: {
    id: number
    name: string
    season_number: number
    episode_count: number
    air_date: string | null
    poster_path: string | null
  }[]
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[]
  }
}

export interface TMDBSeasonDetail {
  id: number
  name: string
  season_number: number
  overview: string
  episodes: {
    id: number
    name: string
    episode_number: number
    overview: string
    air_date: string | null
    still_path: string | null
    vote_average: number
  }[]
}

export type TitleStatus = 'da_vedere' | 'in_corso' | 'visto'

export interface UserTitleStatus {
  id: string
  user_id: string
  tmdb_id: number
  media_type: 'movie' | 'tv'
  status: TitleStatus
  updated_at: string
}

export interface UserEpisodeWatched {
  id: string
  user_id: string
  tmdb_id: number
  season_number: number
  episode_number: number
  watched_at: string
}

export interface NextEpisodeItem {
  tmdbId: number
  showName: string
  showPosterPath: string | null
  seasonNumber: number
  episodeNumber: number
  episodeName: string
  stillPath: string | null
}

export interface Review {
  id: string
  user_id: string
  tmdb_id: number
  media_type: 'movie' | 'tv'
  season_number: number | null
  episode_number: number | null
  rating: number | null
  comment: string | null
  created_at: string
}

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export type MediaType = 'movie' | 'tv'

export type ViewMode = 'list' | 'grid'
