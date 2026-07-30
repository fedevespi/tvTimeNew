# tvBoss — Design Spec

**Data:** 2026-07-23
**Stato:** Approvato per la fase di pianificazione implementativa

## 1. Obiettivo

Una web app installabile su mobile (PWA) per tracciare film e serie TV: cosa ho visto, cosa voglio vedere, e cosa c'è in circolazione (popolare, in uscita, trending). Ispirata a TV Show Time (ora chiusa), con focus su:

- tracking personale di film/serie/episodi
- valutazioni e recensioni pubbliche, leggibili da tutti gli utenti dell'app
- protezione anti-spoiler sui commenti

Multi-utente pubblico fin dal giorno 1: chiunque può registrarsi e usare l'app con il proprio account.

## 2. Scope dell'MVP

**Incluso:**

- Registrazione/login utenti
- Sezione "Scopri": popolari, novità, trending (da TMDB)
- Ricerca titoli (film e serie TV)
- Pagina titolo con dettagli (poster, trama, cast, stagioni/episodi per le serie)
- Liste personali per stato: **Da vedere / In corso / Visto**
- Tracking del progresso episodio per episodio nelle serie TV
- Valutazione (1-10) e recensione testuale, pubbliche, per film e per singoli episodi
- Protezione anti-spoiler: una recensione/valutazione su un episodio o film è visibile solo a chi lo ha già segnato come visto (oltre che al suo autore)

**Esplicitamente fuori scope per l'MVP (possibili v2 future):**

- Sistema di "following"/amicizie tra utenti e feed sociale delle attività altrui
- Notifiche push (nuove stagioni, nuovi episodi, uscite in streaming)
- Pulsante "mostra comunque" per bypassare la protezione anti-spoiler
- Supporto offline-first completo (l'app richiede connessione per dati TMDB/Supabase; la PWA fa solo caching degli asset statici)

## 3. Architettura

```
┌─────────────────────────────────────┐
│   React + Vite PWA (frontend)        │
│   - installabile su mobile           │
│   - service worker su asset statici  │
└───────────┬───────────────┬─────────┘
            │               │
            ▼               ▼
   ┌─────────────────┐  ┌──────────────┐
   │    Supabase      │  │  TMDB API    │
   │ - Auth (login)   │  │ (dati film/  │
   │ - Postgres DB    │  │  serie TV)   │
   │ (liste, review)  │  │              │
   └─────────────────┘  └──────────────┘
```

**Stack tecnologico:**

- Frontend: React + TypeScript + Vite, PWA via `vite-plugin-pwa`
- Backend-as-a-service: Supabase (Postgres + Auth), piano gratuito
- Dati contenuti: TMDB API (The Movie Database), chiamata direttamente dal client con API key pubblica v3
- Hosting: Vercel (piano gratuito), deploy automatico da git
- Nessun server/backend custom da mantenere

**Nota sui termini TMDB:** le linee guida di attribuzione di TMDB richiedono di mostrare il logo "The Movie Database" nelle schermate che usano i loro dati (es. footer o pagina "Informazioni"). Da includere nell'implementazione.

I dati di titoli/episodi (poster, trame, cast) non vengono duplicati nel database: si tiene solo l'ID TMDB come riferimento nelle tabelle interne, e i dettagli si recuperano da TMDB al volo.

## 4. Modello dati (Supabase/Postgres)

### `profiles`
| colonna | tipo | note |
|---|---|---|
| id | uuid | PK, riferimento a `auth.users(id)` |
| username | text | univoco |
| avatar_url | text | opzionale |
| created_at | timestamptz | default `now()` |

### `user_title_status`
| colonna | tipo | note |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | riferimento a `auth.users(id)` |
| tmdb_id | integer | id del titolo su TMDB |
| media_type | text | `'movie'` \| `'tv'` |
| status | text | `'da_vedere'` \| `'in_corso'` \| `'visto'` |
| updated_at | timestamptz | default `now()` |

Vincolo di unicità: `(user_id, tmdb_id, media_type)`.

### `user_episode_watched`
| colonna | tipo | note |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | riferimento a `auth.users(id)` |
| tmdb_id | integer | id della serie su TMDB |
| season_number | integer | |
| episode_number | integer | |
| watched_at | timestamptz | default `now()` |

Vincolo di unicità: `(user_id, tmdb_id, season_number, episode_number)`.

### `reviews`
| colonna | tipo | note |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | riferimento a `auth.users(id)` |
| tmdb_id | integer | id del titolo (film o serie) su TMDB |
| media_type | text | `'movie'` \| `'tv'` |
| season_number | integer | nullo se `media_type = 'movie'`; obbligatorio se `media_type = 'tv'` |
| episode_number | integer | nullo se `media_type = 'movie'`; obbligatorio se `media_type = 'tv'` |
| rating | integer | 1-10, opzionale |
| comment | text | opzionale |
| created_at | timestamptz | default `now()` |

Vincoli: almeno uno tra `rating` e `comment` deve essere valorizzato (non ha senso una riga vuota); `season_number`/`episode_number` presenti se e solo se `media_type = 'tv'`. Nell'MVP non esiste una recensione "della serie in generale": ogni recensione di una serie è sempre legata a un episodio specifico.

### Regole di accesso (Row Level Security)

- **profiles**: lettura pubblica (serve per mostrare username accanto alle recensioni); scrittura solo sulla propria riga (`auth.uid() = id`)
- **user_title_status**: lettura/scrittura solo sulle proprie righe (`auth.uid() = user_id`)
- **user_episode_watched**: lettura/scrittura solo sulle proprie righe (`auth.uid() = user_id`)
- **reviews**:
  - inserimento: `auth.uid() = user_id`
  - modifica/cancellazione: solo l'autore (`auth.uid() = user_id`)
  - lettura: l'autore vede sempre la propria riga; inoltre una riga è visibile a un utente se:
    - `media_type = 'movie'` e l'utente ha una riga in `user_title_status` con `status = 'visto'` per quel `tmdb_id`, **oppure**
    - `media_type = 'tv'` e `episode_number` è valorizzato, e l'utente ha una riga in `user_episode_watched` per quello specifico `(tmdb_id, season_number, episode_number)`

## 5. Flussi utente principali

1. **Onboarding**: registrazione/login (email + password via Supabase Auth) → creazione profilo con username
2. **Scopri** (home): popolari / novità / trending da TMDB, con azione rapida "aggiungi a Da vedere"
3. **Ricerca**: cerca per titolo → pagina titolo
4. **Pagina titolo — film**: stato Da vedere/Visto → se "Visto", form per votare/recensire → sotto, elenco delle recensioni pubbliche di altri utenti (visibili perché l'utente corrente ha già segnato il film come visto)
5. **Pagina titolo — serie**: elenco stagioni/episodi, checkbox "visto" per ogni episodio → segnando un episodio come visto si sblocca la possibilità di votarlo/commentarlo e di leggere i commenti già presenti su quell'episodio
6. **Le mie liste**: tre tab — Da vedere / In corso / Visto — con i titoli raggruppati per stato

## 6. Gestione errori

- TMDB irraggiungibile o rate-limited → messaggio di errore con azione di retry, nessun crash della pagina
- Scrittura su Supabase (voto/commento/stato) fallita → toast di errore, l'interfaccia non conferma l'azione finché la scrittura non è confermata dal server (niente aggiornamento ottimistico permanente in caso di errore)
- Tentativo di leggere una recensione senza averne diritto (bypass client-side) → bloccato lato server dalle policy RLS, non solo nascosto in UI

## 7. Testing

- Test unitari su: mapping dati TMDB → modello interno, logica di visibilità anti-spoiler (se replicata lato client per l'UI)
- Verifica manuale dei flussi principali su browser mobile (Chrome Android, Safari iOS) prima del rilascio
- Nessuna suite e2e automatizzata prevista per l'MVP: la scala del progetto non la giustifica

## 8. Deployment e costi

- Frontend: Vercel, piano gratuito, deploy automatico da git
- Backend: Supabase, piano gratuito (Postgres + Auth)
- Dati: TMDB API, gratuita (richiede registrazione per la API key)
- **Costo totale attuale: €0/mese**
