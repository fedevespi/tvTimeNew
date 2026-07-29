# tvTime — Sviluppo

Ultimo aggiornamento: 2026-07-28 (Le mie liste: divisione Serie TV / Film con anteprime e liste complete dedicate)

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

### Home
- [x] Slider "Prossimi episodi" (`NextEpisodesSlider.tsx`, `Home.tsx`), route `/`: mostra fino a 10 serie TV "in corso" con il prossimo episodio non ancora visto e già uscito, ordinate per ultimo episodio visto
- [x] Calcolo del prossimo episodio da vedere (`useNextEpisodes.ts`): scansiona le stagioni via TMDB e gli episodi già visti dell'utente; esclude le serie il cui prossimo episodio non è ancora uscito
- [x] Cache in-memory delle risposte TMDB per sessione (`tmdb.ts`) e query Supabase scoped per singola serie (non cumulative) per evitare troncamenti e richieste duplicate
- [x] Ordinamento e riduzione del carico su Home tramite funzione Postgres economica `get_last_watched_per_show` (`003_last_watched_per_show.sql`): elabora solo le serie necessarie a riempire lo slider (con margine per le escluse), non tutte le serie in corso — la pagina "Continua a guardare" elabora comunque tutte le serie
- [x] Card riutilizzabile `NextEpisodeCard.tsx`: immagine dell'episodio (fallback al poster della serie se mancante), nome serie + `SxEy`, pulsante rapido per segnare l'episodio come visto senza uscire dalla Home
- [x] Click sulla card apre `TvDetail.tsx` con la stagione del prossimo episodio già preselezionata (parametro `?season=`)
- [x] Pagina dedicata "Continua a guardare" (`ContinueWatching.tsx`, route protetta `/continue-watching`) con tutte le serie in corso, stessa card in griglia
- [x] Sezione nascosta del tutto se non ci sono serie in corso con un episodio da vedere
- [ ] Prossime uscite (film/serie in arrivo) nella Home (v2)

### Scopri
- [x] Input di ricerca sempre visibile in cima alla pagina (`Discover.tsx`, ex `Search.tsx`), route `/discover`
- [x] Contenuto di default sotto l'input: Trending, Film Popolari, Serie TV Popolari da TMDB (spostato dalla vecchia pagina Scopri)
- [x] Scroll orizzontale per ogni sezione di default
- [x] Card con poster, titolo, voto, quick add button (`MediaCard.tsx`, componente condiviso tra sezioni di default e griglia risultati)
- [x] Ricerca live: da 3 caratteri in poi (debounce 400ms) sostituisce il contenuto sotto l'input con una griglia responsive di risultati (3-5 colonne)
- [x] Sotto i 3 caratteri torna istantaneamente al contenuto di default (nessun debounce sul ripristino)
- [x] Gestione errori separata per contenuto di default e ricerca, con retry sul contenuto di default

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
- [x] Divisione Serie TV / Film nei tab "Da vedere" e "Visto" tramite due sezioni (`TitleSection.tsx`); "In corso" resta un elenco unico perché contiene solo serie TV
- [x] "In corso" ordinato dalla visione più recente alla più remota in base all'ultimo episodio segnato come visto (`useLastWatchedOrder.ts`), non per data di cambio stato; le serie senza episodi visti finiscono in fondo
- [x] Ogni sezione mostra il contatore totale e un'anteprima dei primi elementi, con link "Vedi tutte" visibile solo se ci sono altri titoli oltre l'anteprima
- [x] Dimensione dell'anteprima dipendente dalla vista attiva (`previewSize()` in `lib/lists.ts`): 6 elementi in griglia (3 righe da 2 colonne), 4 in elenco, dove ogni riga è più alta — l'atterraggio su "Le mie liste" resta compatto e si scaricano meno dettagli TMDB
- [x] Pagina lista completa dedicata e linkabile (`ListDetail.tsx`, route protetta `/lists/:status/:mediaType`, es. `/lists/visto/movie`) con titolo contestuale ("Film visti", "Serie TV da vedere", …) e link di ritorno
- [x] Badge con il numero di titoli su ogni tab
- [x] Toggle lista/griglia estratto in `ViewModeToggle.tsx` e condiviso tra `MyLists` e `ListDetail`; l'anteprima rispetta la vista attiva (righe o griglia di poster) invece di usare un carosello orizzontale
- [x] Elenco titoli riutilizzabile (`TitleCollection.tsx`) con skeleton animato per gli elementi in attesa dei dettagli TMDB, al posto del precedente `return null`
- [x] Fallback "Titolo non disponibile" con placeholder poster per i titoli che TMDB non risolve: a caricamento concluso l'elemento resta cliccabile invece di mostrare uno skeleton pulsante all'infinito (`detailsLoading` propagato da `useTitleDetails` fino alle card)
- [x] Etichette, path e helper di validazione delle liste centralizzati in `lib/lists.ts`

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
- [x] Floating Bottom Navigation Bar con glassmorphism e sliding pill animation (Home / Scopri / Liste)
- [x] La voce di nav resta attiva anche sulle sotto-rotte (`/lists/:status/:mediaType` evidenzia "Liste"), prima il match era solo esatto e la pill spariva
- [x] Tema scuro e chiaro con toggle (`useTheme.tsx`, `Settings.tsx`)
- [x] Default dark mode, override light via toggle
- [x] Design responsive mobile-first
- [x] Accent color arancione (#f97316) per bottoni primari e stati attivi
- [x] Icone Lucide in tutta l'app (Home, Compass, Search, List, Eye, Play, CheckCircle, Info, LogOut, Plus, RefreshCw, Settings, Sun, Moon)
- [x] Effetti glassmorphism (backdrop-blur) su header, nav bar, card
- [x] Transizioni e animazioni smooth (hover effects, scale su card, sliding pill nav)
- [x] Form con bordi arrotondati e focus states accent
- [x] Documentazione e linee guida del Design System (`docs/DESIGN_SYSTEM.md`)
- [x] Placeholder poster SVG per immagini TMDB mancanti o fallite

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
- [x] Importazione liste tramite file ZIP o JSON di TV Time (`ImportZipCard.tsx`, `importer.ts`)
- [x] Link a pagina Informazioni
- [x] Bottone logout
- [x] Route protetta (`/settings`)

### Importazione Dati (TV Time)
- [x] Parsing client-side di archivi ZIP con `jszip` (`importer.ts`)
- [x] Estrazione e normalizzazione JSON film (`RawMovie`) e serie TV (`RawSeries`)
- [x] Risoluzione ID TMDB tramite TVDB ID (`/find/{tvdb_id}`), IMDb ID (`/find/{imdb_id}`) e fallback ricerca per titolo
- [x] Mapping automatico dello stato del titolo (`da_vedere`, `in_corso`, `visto`)
- [x] Salvataggio ed upsert batch in `user_title_status` e `user_episode_watched` su Supabase (idempotente e sicuro contro importazioni duplicate)
- [x] UI Card responsive con anteprima conteggi, progress bar e report finale (`ImportZipCard.tsx`)
- [x] Modal interattivo elemento per elemento (`UnresolvedTitlesModal.tsx`) per gestire i titoli non trovati con ricerca live TMDB, scelta tra 3 alternative o eliminazione senza inserimento

### Hook e Data Fetching
- [x] `useTitleStatus` — stato di un titolo per l'utente (`useSupabase.ts`)
- [x] `useWatchedEpisodes` — episodi visti per una serie, con aggiornamento automatico stato
- [x] `useReviews` — recensioni con join su profili
- [x] `useUserLists` — tutti i titoli dell'utente
- [x] `useTitleDetails` — titolo e poster TMDB per un insieme di titoli, in un unico batch a concorrenza limitata (`useTitleDetails.ts`)
- [x] `useTheme` — stato dark/light con persistenza localStorage
- [x] `useLastWatchedOrder` — riordina i titoli per ultimo episodio visto, attivabile via flag (`useLastWatchedOrder.ts`); usato da `MyLists` e `ListDetail` per il solo stato "In corso"
- [x] `mapWithConcurrencyLimit` — helper di concorrenza condiviso (`lib/concurrency.ts`), estratto da `useNextEpisodes.ts` e riusato da `useTitleDetails`
- [x] `fetchLastWatchedPerShow` / `compareByLastWatched` — accesso alla RPC `get_last_watched_per_show` e comparatore per data di ultima visione (`lib/lastWatched.ts`), estratti da `useNextEpisodes.ts` dove il comparatore era duplicato due volte inline

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
- **Performance "Le mie liste"**: prima ogni riga faceva la propria chiamata TMDB in `useEffect`, quindi una lista da 150 titoli generava 150 richieste parallele non coordinate. Ora la fetch è centralizzata in `useTitleDetails`, invocato dalla pagina con i soli elementi effettivamente visibili (per l'anteprima: 6 serie + 6 film in griglia, 4 + 4 in elenco), con concorrenza 4 e aggiornamenti di stato accorpati ogni 100ms per evitare un re-render per ogni risposta. Attenzione nel modificare l'accorpamento: l'updater passato a `setDetails` **non deve chiudere sulla mappa `pending` mutabile**, perché React lo invoca in fase di render, quando `pending` è già stata svuotata — va sempre fatto uno snapshot (`Array.from(pending)`) prima di `pending.clear()`. I dettagli già risolti restano in mappa al cambio di tab, quindi tornare su una lista visitata non ricarica nulla
- **Importazione ZIP/JSON**: Utilizza `jszip` per decifrare l'archivio ZIP senza server. I titoli vengono mappati su TMDB interrogando in primis gli ID esterni (`tvdb_id`, `imdb_id`) tramite l'endpoint `/3/find/{id}` e in caso negativo tramite ricerca testuale. In caso di titoli non trovati, viene aperto un modal per la risoluzione elemento per elemento con suggerimenti live TMDB ed opzione di eliminazione. L'operazione è del tutto **idempotente**: eseguire l'importazione 2 o più volte consecutive agisce in `upsert` senza mai duplicare record nel database.
- **Build**: `npx tsc --noEmit` e `npx vite build` entrambi OK

---

## Prossimi passi (MVP completamento)

- [x] Attribution TMDB — logo "The Movie Database" in pagina Info (`Info.tsx`)
- [x] Pagina "Informazioni" con attribuzione e crediti
- [x] Gestione errori TMDB (messaggio + retry, nessun crash)
- [x] Toast di errore per fallimenti Supabase (voto/commento/stato)
- [x] Placeholder poster per immagini mancanti
- [ ] Abilitare PWA con Node >= 20
- [ ] Riabilitare email conferma per produzione
- [x] Deploy su Vercel

---

## TODO futuri (v2, fuori scope MVP)

- Sistema following/amicizie e feed sociale
- Notifiche push (nuove stagioni, uscite streaming)
- Pulsante "mostra comunque" per bypassare anti-spoiler
- Supporto offline-first completo
