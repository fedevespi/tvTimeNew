-- Dati aggregati per la Home, in poche query economiche.
-- Esegui questo script nell'SQL Editor di Supabase.

-- 1. Progresso per stagione di più serie in una sola query.
-- Sostituisce la query per singola serie che la Home faceva in `useNextEpisodes`:
-- restituisce quanti episodi sono stati visti per ogni stagione (per capire, senza
-- scaricare nulla da TMDB, quale stagione contiene il prossimo episodio) e quali
-- numeri episodio sono già visti in quella stagione.
create or replace function get_watched_progress_per_show(p_tmdb_ids integer[])
returns table (
  tmdb_id integer,
  season_number integer,
  watched_count integer,
  episode_numbers integer[],
  last_watched_at timestamptz
)
language sql
stable
security invoker
as $$
  select
    tmdb_id,
    season_number,
    count(*)::integer as watched_count,
    array_agg(episode_number order by episode_number) as episode_numbers,
    max(watched_at) as last_watched_at
  from user_episode_watched
  where user_id = auth.uid()
    and tmdb_id = any(p_tmdb_ids)
  group by tmdb_id, season_number;
$$;

-- 2. Contatori della riga statistiche in Home: una sola chiamata invece di
-- quattro count() lato client.
create or replace function get_home_stats()
returns table (
  episodes_week integer,
  episodes_month integer,
  episodes_total integer,
  shows_in_progress integer,
  watchlist_count integer
)
language sql
stable
security invoker
as $$
  select
    (
      select count(*) from user_episode_watched
      where user_id = auth.uid() and watched_at >= now() - interval '7 days'
    )::integer,
    (
      select count(*) from user_episode_watched
      where user_id = auth.uid() and watched_at >= now() - interval '30 days'
    )::integer,
    (
      select count(*) from user_episode_watched
      where user_id = auth.uid()
    )::integer,
    (
      select count(*) from user_title_status
      where user_id = auth.uid() and media_type = 'tv' and status = 'in_corso'
    )::integer,
    (
      select count(*) from user_title_status
      where user_id = auth.uid() and status = 'da_vedere'
    )::integer;
$$;

-- 3. Indici a supporto delle due funzioni.
-- (user_id, tmdb_id) è già coperto dal prefisso dell'indice unique su
-- user_episode_watched, qui servono i filtri per data e per stato.
create index if not exists user_episode_watched_user_watched_at_idx
  on user_episode_watched (user_id, watched_at desc);

create index if not exists user_title_status_user_type_status_idx
  on user_title_status (user_id, media_type, status);
