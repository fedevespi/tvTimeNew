-- Serie "in corso" e loro progresso di visione in un'unica chiamata.
-- Esegui questo script nell'SQL Editor di Supabase.
--
-- Prima la Home faceva due viaggi in fila: uno per sapere quali serie sono in
-- corso, poi `get_watched_progress_per_show` con quegli ID. Il join sta qui, così
-- il secondo viaggio non serve più.
--
-- La LEFT JOIN è necessaria: una serie "in corso" senza episodi segnati deve
-- comparire comunque tra i candidati. In quel caso restituisce una riga con
-- season_number nullo e conteggio zero.
create or replace function get_in_progress_shows_progress()
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
    s.tmdb_id,
    e.season_number,
    count(e.episode_number)::integer as watched_count,
    array_agg(e.episode_number order by e.episode_number)
      filter (where e.episode_number is not null) as episode_numbers,
    max(e.watched_at) as last_watched_at
  from user_title_status s
  left join user_episode_watched e
    on e.user_id = s.user_id
   and e.tmdb_id = s.tmdb_id
  where s.user_id = auth.uid()
    and s.media_type = 'tv'
    and s.status = 'in_corso'
  group by s.tmdb_id, e.season_number;
$$;
