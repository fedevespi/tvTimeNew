# tvTime — Sviluppo

Ultimo aggiornamento: 2026-07-23

---

## Stato attuale

MVP funzionante. Auth, database, navigazione, pagine principali e anti-spoiler implementati. App utilizzabile con registrazione/login,icerca, scoprerta di titoli, gestione liste personali e recensioni.

---

## Feature completate

### Autenticazione
- [x] Registrazione con username, email, password (`Register.tsx`)
- [x] Login con email/password (`Login.tsx`)
- [x] Protected routes — reindirizza a `/login` se non autenticato (`App.tsx`)
- [x] Logout (`Layout.tsx` header)
- [x] Auto-creazione profilo via trigger database (`002_profile_trigger.sql`)

### Scopri (Home)
- [x] Trending (tutti i media) da TMDB (`Discover.tsx`)
- [x] Film popolari da TMDB
- [x] Serie TV popolari da TMDB
- [x] Scroll orizzontale per ogni sezione
- [x] Card con poster, titolo, voto
- [x] Quick add button per aggiungere ai propri stati

### Ricerca
- [x] Ricerca multipla (film + serie TV) via TMDB (`Search.tsx`)
- [x] Griglia responsive di risultati (3-5 colonne)
- [x] Link ai dettagli del titolo

### Pagina Dettaglio Film
- [x] Backdrop con gradient overlay (`MovieDetail.tsx`)
- [x] Poster, titolo, anno, generi, durata, voto
- [x] Trama
- [x] Cast (scroll orizzontale, max 15 persone)
- [x] Bottone stato (Da vedere / Visto) se autenticato — i film non hanno "In corso"
- [x] Form recensione se il film è segnato come "Visto"
- [x] Lista recensioni pubbliche

### Pagina Dettaglio Serie TV
- [x] Backdrop, poster, titolo, anno, generi, stagioni, voto (`TvDetail.tsx`)
- [x] Trama e cast
- [x] Bottone stato se autenticato — "In corso" è automatico, non cliccabile
- [x] Selettore stagioni (bottoni orizzontali)
- [x] Lista episodi con checkbox "visto" per ogni episodio
- [x] Form recensione inline per ogni episodio visto
- [x] Lista recensioni per episodio

### Le Mie Liste
- [x] Tre tab: Da vedere / In corso / Visto (`MyLists.tsx`)
- [x] Filtraggio per stato
- [x] Card con poster, titolo, tipo media (caricati da TMDB)
- [x] Route protetta

### Recensioni e Valutazioni
- [x] Voto 1-10 (opzionale) (`ReviewForm.tsx`)
- [x] Commento testuale (opzionale)
- [x] Almeno uno tra voto e commento obbligatorio
- [x] Lista recensioni con username, voto, data (`ReviewList.tsx`)
- [x] Recensioni per film e per singoli episodi

### Anti-Spoiler
- [x] Recensioni film visibili solo a chi ha segnato il film come "visto" (RLS)
- [x] Recensioni episodi visibili solo a chi ha segnato quell'episodio come visto (RLS)
- [x] Protezione lato server (Row Level Security policies)

### UI / Layout
- [x] Header sticky con brand "tvTime", link Info, Settings e login/logout (`Layout.tsx`)
- [x] Floating Bottom Navigation Bar con glassmorphism e sliding pill animation (Scopri / Cerca / Liste)
- [x] Tema scuro e chiaro con toggle (`useTheme.tsx`, `Settings.tsx`)
- [x] Default dark mode, override light via toggle
- [x] Design responsive mobile-first
- [x] Accent color arancione (#f97316) per bottoni primari e stati attivi
- [x] Icone Lucide in tutta l'app (Compass, Search, List, Eye, Play, CheckCircle, Info, LogOut, Plus, RefreshCw, Settings, Sun, Moon)
- [x] Effetti glassmorphism (backdrop-blur) su header, nav bar, card
- [x] Transizioni e animazioni smooth (hover effects, scale su card, sliding pill nav)
- [x] Form con bordi arrotondati e focus states accent

### Gestione Errori
- [x] Toast system per notifiche errore/successo (`useToast.tsx`)
- [x] Retry bottoni su errori TMDB (Discover, MovieDetail, TvDetail)
- [x] Toast errori per fallimenti Supabase nei form (ReviewForm, EpisodeList)
- [x] Toast successo dopo azioni completate (recensione pubblicata)
- [x] Animazione fade-in per i toast

### Pagina Informazioni
- [x] Logo TMDB "The Movie Database" con link (`Info.tsx`)
- [x] Attribuzione dati TMDB (obbligo linee guida)
- [x] Lista tecnologie utilizzate
- [x] Link a documentazione API TMDB
- [x] Accessibile da header ("Info")

### Pagina Impostazioni
- [x] Icona ingranaggio nell'header (`Settings.tsx`)
- [x] Info account (email utente)
- [x] Toggle tema luce/scuro con persistenza localStorage
- [x] Link a pagina Informazioni
- [x] Bottone logout
- [x] Route protetta (`/settings`)

### Hook e Data Fetching
- [x] `useTitleStatus` — stato di un titolo per l'utente (`useSupabase.ts`)
- [x] `useWatchedEpisodes` — episodi visti per una serie, con aggiornamento automatico stato
- [x] `useReviews` — recensioni con join su profili
- [x] `useUserLists` — tutti i titoli dell'utente
- [x] `useTheme` — stato dark/light con persistenza localStorage

### Stato Automatico (Serie TV)
- [x] Film: solo "Da vedere" o "Visto" (nessun "In corso")
- [x] Serie TV: "In corso" assegnato automaticamente quando si guarda il primo episodio
- [x] Serie TV: "Visto" assegnato automaticamente quando tutti gli episodi sono segnati come visti
- [x] Serie TV: torna a "Da vedere" quando tutti gli episodi visti vengono rimossi
- [x] Logica in `useWatchedEpisodes` → `updateTitleStatus()` dopo ogni toggle

---

## Database

### Tabelle
| Tabella | Descrizione |
|---|---|
| `profiles` | Profili utente (id, username, avatar_url, created_at) |
| `user_title_status` | Stato di un titolo per utente (da_vedere / in_corso / visto) |
| `user_episode_watched` | Episodi segnati come visti |
| `reviews` | Recensioni con voto 1-10 e/o commento |

### Migrazioni
| File | Contenuto |
|---|---|
| `001_initial.sql` | Creazione 4 tabelle + RLS policies |
| `002_profile_trigger.sql` | Trigger auto-creazione profilo alla registrazione |

---

## Note tecniche

- **Node.js**: il progetto richiede Node >= 20 per il plugin PWA. Con Node 18 (attuale), `vite-plugin-pwa` è commentato in `vite.config.ts`
- **PWA**: manifest e apple-touch-icon configurati in `index.html`, plugin PWA da abilitare con Node >= 20
- **Supabase**: email conferma disabilitata per sviluppo (da riabilitare in produzione)
- **TMDB**: lingua italiana (`it-IT`) per tutte le chiamate API
- **Build**: `npx tsc --noEmit` e `npx vite build` entrambi OK

---

## Prossimi passi (MVP completamento)

- [x] Attribution TMDB — logo "The Movie Database" in pagina Info (`Info.tsx`)
- [x] Pagina "Informazioni" con attribuzione e crediti
- [x] Gestione errori TMDB (messaggio + retry, nessun crash)
- [x] Toast di errore per fallimenti Supabase (voto/commento/stato)
- [ ] Placeholder poster per immagini mancanti
- [ ] Abilitare PWA con Node >= 20
- [ ] Riabilitare email conferma per produzione
- [ ] Deploy su Vercel

---

## TODO futuri (v2, fuori scope MVP)

- Sistema following/amicizie e feed sociale
- Notifiche push (nuove stagioni, uscite streaming)
- Pulsante "mostra comunque" per bypassare anti-spoiler
- Supporto offline-first completo
