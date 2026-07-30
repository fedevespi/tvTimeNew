-- tvBoss Database Setup
-- Esegui questo script nell'SQL Editor di Supabase

-- 1. Tabella profili
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- 2. Tabella stato titoli
create table user_title_status (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  status text not null check (status in ('da_vedere', 'in_corso', 'visto')),
  updated_at timestamptz default now(),
  unique(user_id, tmdb_id, media_type)
);

alter table user_title_status enable row level security;

create policy "Users can view own title status"
  on user_title_status for select
  using (auth.uid() = user_id);

create policy "Users can insert own title status"
  on user_title_status for insert
  with check (auth.uid() = user_id);

create policy "Users can update own title status"
  on user_title_status for update
  using (auth.uid() = user_id);

create policy "Users can delete own title status"
  on user_title_status for delete
  using (auth.uid() = user_id);

-- 3. Tabella episodi visti
create table user_episode_watched (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  watched_at timestamptz default now(),
  unique(user_id, tmdb_id, season_number, episode_number)
);

alter table user_episode_watched enable row level security;

create policy "Users can view own watched episodes"
  on user_episode_watched for select
  using (auth.uid() = user_id);

create policy "Users can insert own watched episodes"
  on user_episode_watched for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own watched episodes"
  on user_episode_watched for delete
  using (auth.uid() = user_id);

-- 4. Tabella recensioni
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  season_number integer,
  episode_number integer,
  rating integer check (rating >= 1 and rating <= 10),
  comment text,
  created_at timestamptz default now(),
  check (rating is not null or comment is not null),
  check (
    (media_type = 'movie' and season_number is null and episode_number is null)
    or
    (media_type = 'tv' and season_number is not null and episode_number is not null)
  )
);

alter table reviews enable row level security;

-- L'autore può vedere le proprie recensioni
create policy "Users can view own reviews"
  on reviews for select
  using (auth.uid() = user_id);

-- L'autore può inserire recensioni
create policy "Users can insert own reviews"
  on reviews for insert
  with check (auth.uid() = user_id);

-- L'autore può modificare le proprie recensioni
create policy "Users can update own reviews"
  on reviews for update
  using (auth.uid() = user_id);

-- L'autore può cancellare le proprie recensioni
create policy "Users can delete own reviews"
  on reviews for delete
  using (auth.uid() = user_id);

-- Altri utenti vedono recensioni di film solo se hanno segnato il film come visto
create policy "Users can view movie reviews if watched"
  on reviews for select
  using (
    media_type = 'movie'
    and exists (
      select 1 from user_title_status
      where user_title_status.user_id = auth.uid()
        and user_title_status.tmdb_id = reviews.tmdb_id
        and user_title_status.status = 'visto'
    )
  );

-- Altri utenti vedono recensioni di episodi solo se hanno visto quell'episodio
create policy "Users can view episode reviews if watched"
  on reviews for select
  using (
    media_type = 'tv'
    and season_number is not null
    and episode_number is not null
    and exists (
      select 1 from user_episode_watched
      where user_episode_watched.user_id = auth.uid()
        and user_episode_watched.tmdb_id = reviews.tmdb_id
        and user_episode_watched.season_number = reviews.season_number
        and user_episode_watched.episode_number = reviews.episode_number
    )
  );
