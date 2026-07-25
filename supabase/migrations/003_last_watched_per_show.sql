-- Funzione per ottenere in una sola query economica l'ultimo episodio
-- visto per ciascuna serie, senza scaricare tutte le righe episodio.
-- Esegui questo script nell'SQL Editor di Supabase.

create or replace function get_last_watched_per_show(p_tmdb_ids integer[])
returns table (tmdb_id integer, last_watched_at timestamptz)
language sql
stable
security invoker
as $$
  select tmdb_id, max(watched_at) as last_watched_at
  from user_episode_watched
  where user_id = auth.uid()
    and tmdb_id = any(p_tmdb_ids)
  group by tmdb_id;
$$;
