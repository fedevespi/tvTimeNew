-- Profili mancanti per gli utenti registrati prima del trigger.
-- Esegui questo script nell'SQL Editor di Supabase.
--
-- `002_profile_trigger.sql` popola `profiles` solo alle registrazioni successive
-- alla sua esecuzione: chi si era già registrato è rimasto senza riga. Il login
-- continua a funzionare (la sessione dipende da `auth.users`) e i dati restano
-- corretti (sono legati a `user_id`), ma il suo username non è risolvibile —
-- nelle recensioni compariva come "Anonimo".
--
-- `username` è `unique not null`: se lo spezzone di email prima della @ collide
-- con un profilo esistente si aggiungono i primi caratteri dell'id per renderlo
-- univoco, invece di far fallire l'intera insert.
insert into public.profiles (id, username, created_at)
select
  u.id,
  case
    when exists (
      select 1 from public.profiles p
      where p.username = coalesce(
        u.raw_user_meta_data ->> 'username',
        split_part(u.email, '@', 1)
      )
    )
    then coalesce(
           u.raw_user_meta_data ->> 'username',
           split_part(u.email, '@', 1)
         ) || '-' || left(u.id::text, 4)
    else coalesce(
           u.raw_user_meta_data ->> 'username',
           split_part(u.email, '@', 1)
         )
  end,
  u.created_at
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
