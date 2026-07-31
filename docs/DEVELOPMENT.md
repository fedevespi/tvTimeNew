# tvBoss — Sviluppo

Ultimo aggiornamento: 2026-07-31 (**APK Android generato, firmato e autorizzato**: package `com.fedevespi.tvboss`, fingerprint in `assetlinks.json` e legame verificato dall'API di Google — Fasi 2, 3 e 4 di `PWA_APK.md`. La PWA è anche **finalmente in produzione**: era rimasta sul branch `tvboss-pwa` mentre Vercel pubblica `master`. Resta da pubblicare la release GitHub e compilare `APK_RELEASE`, che accende la card di download)

---

## Stato attuale

MVP funzionante. Auth, database, navigazione, pagine principali e anti-spoiler implementati. App utilizzabile con registrazione/login,icerca, scoprerta di titoli, gestione liste personali e recensioni.

---

## Feature completate

### Autenticazione
- [x] Registrazione con username, email, password (`Register.tsx`)
- [x] Login con email/password (`Login.tsx`)
- [x] Protected routes — reindirizza a `/login` se non autenticato (`App.tsx`): Home (`/`), Liste, Continua a guardare, Impostazioni. Restano pubbliche Scopri, i dettagli film/serie e Info
- [x] Logout (`Layout.tsx` header)
- [x] Auto-creazione profilo via trigger database (`002_profile_trigger.sql`)

### Home
- [x] Route protetta: senza sessione si viene reindirizzati a `/login` invece di vedere una Home vuota
- [x] Slider "Prossimi episodi" (`NextEpisodesSlider.tsx`, `Home.tsx`), route `/`: mostra fino a 10 serie TV "in corso" con il prossimo episodio non ancora visto e già uscito, ordinate per ultimo episodio visto
- [x] Calcolo del prossimo episodio da vedere (`useNextEpisodes.ts`): individua la stagione che contiene l'episodio dal progresso già noto per stagione e scarica **solo quella**; esclude le serie il cui prossimo episodio non è ancora uscito (che finiscono in "In arrivo")
- [x] Riga statistiche in cima alla Home (`HomeStatsRow.tsx`, `useHomeStats.ts`): episodi visti negli ultimi 7 e 30 giorni, serie in corso, titoli da vedere, da un'unica RPC `get_home_stats`; i due contatori delle liste sono link alle liste corrispondenti
- [x] Sezione "In arrivo" (`UpcomingSlider.tsx`): prossimi episodi **non ancora trasmessi** delle serie seguite con data in forma breve ("Oggi", "Domani", "venerdì", "31 lug" — `lib/dates.ts`). Nessuna richiesta aggiuntiva: i dati vengono raccolti nella stessa passata di "Prossimi episodi", sia dagli episodi futuri incontrati sia da `next_episode_to_air` per le serie già in pari
- [x] Sezione "Dalla tua watchlist" (`WatchlistSlider.tsx`): fino a 12 titoli "Da vedere" (serie e film) e pulsante dado "Cosa guardo stasera?" che apre un titolo casuale estratto da **tutta** la watchlist, non solo dai visibili
- [x] Intestazione e carosello condivisi da tutte le sezioni (`HomeSection.tsx`), con skeleton animati durante il caricamento al posto della pagina vuota
- [x] Cache TMDB in-memory per sessione **e persistente su localStorage** con TTL dinamico (`tmdb.ts`, `lib/localCache.ts`): una stagione conclusa è immutabile e dura 7 giorni, una in onda 30 minuti
- [x] Ordinamento e riduzione del carico su Home tramite funzioni Postgres economiche `get_last_watched_per_show` (`003`), `get_watched_progress_per_show` (`004`) e `get_in_progress_shows_progress` (`005`): elabora solo le serie necessarie a riempire lo slider (con margine per le escluse), non tutte le serie in corso — la pagina "Continua a guardare" elabora comunque tutte le serie
- [x] Card riutilizzabile `NextEpisodeCard.tsx`: immagine dell'episodio (fallback al poster della serie se mancante), nome serie + `SxEy`, pulsante rapido per segnare l'episodio come visto senza uscire dalla Home
- [x] "Segna come visto" ottimistico: la card sparisce subito e l'aggiornamento dello stato serie avviene dopo, senza attesa
- [x] Click sulla card apre `TvDetail.tsx` con la stagione del prossimo episodio già preselezionata (parametro `?season=`)
- [x] Pagina dedicata "Continua a guardare" (`ContinueWatching.tsx`, route protetta `/continue-watching`) con tutte le serie in corso, stessa card in griglia
- [x] Ogni sezione è nascosta del tutto se non ha contenuto (nessuna serie in corso, nessun episodio in arrivo, watchlist vuota)

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
- [x] Header sticky con brand "tvBoss" (logo + wordmark), link Info, Settings e login/logout (`Layout.tsx`)
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
- [x] Card "Installa app" (`InstallAppCard.tsx`, `useInstallPrompt.ts`): prompt nativo su Chromium, istruzioni manuali su iOS, nascosta se già installata o non supportata
- [x] Card "App per Android" (`DownloadApkCard.tsx`, `useApkDownload.ts`): scarica l'APK con nome file, versione e peso, e avvisa in anticipo degli avvisi di sideload. Si mostra solo su Android fuori da standalone/TWA e non a chi ha già l'app (`getInstalledRelatedApps()`). **Dormiente:** `APK_RELEASE` in `lib/apk.ts` è `null` finché non esiste una release, e con `null` la card non compare
- [x] Link a pagina Informazioni
- [x] Bottone logout
- [x] Route protetta (`/settings`)

### Importazione Dati (TV Time)
- [x] Parsing client-side di archivi ZIP con `jszip` (`importer.ts`)
- [x] Estrazione e normalizzazione JSON film (`RawMovie`) e serie TV (`RawSeries`)
- [x] Risoluzione ID TMDB tramite TVDB ID (`/find/{tvdb_id}`), IMDb ID (`/find/{imdb_id}`) e fallback ricerca per titolo
- [x] Verifica dell'abbinamento sulla ricerca per titolo (`lib/titleMatch.ts`): similarità sul titolo normalizzato, confronto anche con il titolo originale e vincolo sull'anno — un risultato non convincente finisce fra i "non risolti" invece di essere associato a caso
- [x] Mapping automatico dello stato del titolo (`da_vedere`, `in_corso`, `visto`)
- [x] Salvataggio ed upsert batch in `user_title_status` e `user_episode_watched` su Supabase (idempotente e sicuro contro importazioni duplicate)
- [x] Errori di salvataggio contati e riportati (`notSavedCount`, `saveError`): un batch rifiutato non ferma i successivi ma l'esito non dichiara più un successo che non c'è stato
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
- [x] `useUserLists` accetta filtri opzionali `status` / `mediaType` applicati **lato server**: la Home chiede solo le serie "in corso" o solo la watchlist invece di scaricare l'intera libreria per filtrarla in memoria
- [x] `useHomeStats` — contatori della Home dalla RPC `get_home_stats`, con ultimo valore noto da localStorage mentre revalida (`useHomeStats.ts`)
- [x] `mapWithConcurrencyLimit` — helper di concorrenza condiviso (`lib/concurrency.ts`), estratto da `useNextEpisodes.ts` e riusato da `useTitleDetails`
- [x] `fetchLastWatchedPerShow` / `compareByLastWatched` — accesso alla RPC `get_last_watched_per_show` e comparatore per data di ultima visione (`lib/lastWatched.ts`), estratti da `useNextEpisodes.ts` dove il comparatore era duplicato due volte inline
- [x] `loadInProgressProgress` — serie in corso e loro progresso in una sola RPC, con ripiego sui due passaggi separati se la migrazione `005` non è stata eseguita (`lib/watchedProgress.ts`)
- [x] `fetchWatchedProgress` / `seasonProgress` — progresso per stagione di serie note in una sola RPC, con ripiego per singola serie se la migrazione `004` non è stata eseguita (`lib/watchedProgress.ts`)
- [x] `readCache` / `writeCache` — cache TTL su localStorage tolerante alla quota piena e allo storage disabilitato (`lib/localCache.ts`), usata da `tmdb.ts`, `useNextEpisodes.ts` e `useHomeStats.ts`

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
| `003_last_watched_per_show.sql` | `get_last_watched_per_show`: data dell'ultimo episodio visto per serie |
| `004_home_data.sql` | `get_watched_progress_per_show` (progresso per stagione), `get_home_stats` (contatori Home), indici su `watched_at` e su `(user_id, media_type, status)` |
| `005_in_progress_progress.sql` | `get_in_progress_shows_progress`: serie in corso **e** loro progresso in un'unica chiamata (LEFT JOIN, così le serie senza episodi visti compaiono comunque) |

> Le migrazioni vanno eseguite a mano nell'SQL Editor di Supabase. Se `004` o `005`
> non sono state eseguite la Home funziona comunque: `loadInProgressProgress` e
> `fetchWatchedProgress` rilevano l'errore della RPC e ricadono sui passaggi
> separati / sulle query per singola serie, e la riga statistiche resta nascosta.
> Vale la pena tenere questi ripieghi: senza di essi un errore della RPC verrebbe
> letto come "nessun episodio visto" e la Home proporrebbe il primo episodio di
> ogni serie.

---

## Note tecniche

- **Node.js**: il progetto richiede Node >= 20 per il plugin PWA. Requisito soddisfatto (v20.19.1)
- **PWA**: attiva (`vite-plugin-pwa` in `vite.config.ts`). Manifest e service worker sono **generati dal build**, non scritti a mano: `index.html` non deve contenere un `<link rel="manifest">`, perché il plugin inietta il proprio e quello a mano resterebbe duplicato. Il service worker **non gira in `vite dev`**: per provarlo serve `npm run build && npm run preview`. Cache a runtime solo per le immagini TMDB; Supabase è dichiarato `NetworkOnly` di proposito. Piano per arrivare all'APK scaricabile in [`PWA_APK.md`](PWA_APK.md)
- **APK Android (TWA)**: l'APK è un guscio che apre il sito live, quindi **non va rigenerato a ogni deploy** — il contenuto arriva dal sito e l'app lo mostra al lancio successivo. Si ricompila solo cambiando nome, icona, package, dominio o versione da distribuire, e in quel caso va firmato **con lo stesso keystore**, altrimenti Android rifiuta l'installazione sopra l'app esistente. Package definitivo `com.fedevespi.tvboss`, definito in `src/lib/apk.ts` e importato da `vite.config.ts` per il manifest. Dettagli e passi rimasti in [`PWA_APK.md`](PWA_APK.md)
- **`assetlinks.json`**: `public/.well-known/assetlinks.json` è ciò che autorizza l'APK ad aprire il sito senza la barra degli indirizzi. Non si modifica a mano: `npm run assetlinks -- <fingerprint-SHA-256>` valida e normalizza (il tipico errore è incollare la SHA-1, che si somiglia). Se nella TWA compare la barra degli indirizzi di Chrome, è questo il file da guardare — non è un problema di grafica
- **Icone**: tutte quelle in `public/` sono generate da `scripts/generate-icons.mjs` (`npm run icons`) a partire da `icon-source.png`. Modificarle a mano significa perderle al prossimo `npm run icons`: si cambia la sorgente e si rigenera
- **Supabase**: email conferma disabilitata per sviluppo (da riabilitare in produzione)
- **TMDB**: lingua italiana (`it-IT`) per tutte le chiamate API
- **Performance "Le mie liste"**: prima ogni riga faceva la propria chiamata TMDB in `useEffect`, quindi una lista da 150 titoli generava 150 richieste parallele non coordinate. Ora la fetch è centralizzata in `useTitleDetails`, invocato dalla pagina con i soli elementi effettivamente visibili (per l'anteprima: 6 serie + 6 film in griglia, 4 + 4 in elenco), con concorrenza 4 e aggiornamenti di stato accorpati ogni 100ms per evitare un re-render per ogni risposta. Attenzione nel modificare l'accorpamento: l'updater passato a `setDetails` **non deve chiudere sulla mappa `pending` mutabile**, perché React lo invoca in fase di render, quando `pending` è già stata svuotata — va sempre fatto uno snapshot (`Array.from(pending)`) prima di `pending.clear()`. I dettagli già risolti restano in mappa al cambio di tab, quindi tornare su una lista visitata non ricarica nulla
- **Performance Home**: il collo di bottiglia non era il numero di serie ma le richieste **in serie** per ognuna. Prima, per ogni serie in corso: 1 `getTvDetail` (con `credits`, inutili in Home) + 1 query Supabase + una scansione stagione per stagione con `await` dentro un `for`, quindi fino a 15 round-trip sequenziali per una serie con 15 stagioni quasi tutte viste. Ora:
  1. una sola RPC `get_in_progress_shows_progress` restituisce insieme le serie in corso e quanti episodi sono visti in ciascuna loro stagione — prima erano due viaggi in fila, perché la seconda query aveva bisogno degli ID restituiti dalla prima;
  2. la stagione da scaricare si deduce da quei conteggi (la prima con `watched_count < episode_count`), quindi **2 richieste TMDB per serie** — riepilogo + una stagione — invece di 1+N, con concorrenza 8;
  3. le risposte TMDB sono anche persistite su localStorage, quindi al rientro in Home la maggior parte non viene nemmeno richiesta;
  4. il risultato dell'ultima visita è salvato come snapshot e mostrato immediatamente, poi revalidato in background; al primo caricamento assoluto (nessuno snapshot) le card compaiono man mano, invece di attendere l'ultima serie con `return null`.

  Due punti a cui fare attenzione toccando `useNextEpisodes.ts`: l'ordine dei candidati è già l'ordine finale (ordinati per ultima visione **prima** delle richieste TMDB), ed è ciò che consente di mostrare i risultati parziali senza riordinarli dopo — se si cambia criterio di ordinamento va rivisto anche il rendering progressivo. E se i conteggi indicano tutte le stagioni complete si ricontrolla comunque l'ultima, perché `episode_count` di TMDB non sempre coincide con gli episodi effettivamente elencati.
- **Importazione ZIP/JSON**: Utilizza `jszip` per decifrare l'archivio ZIP senza server. I titoli vengono mappati su TMDB interrogando in primis gli ID esterni (`tvdb_id`, `imdb_id`) tramite l'endpoint `/3/find/{id}` e in caso negativo tramite ricerca testuale. In caso di titoli non trovati, viene aperto un modal per la risoluzione elemento per elemento con suggerimenti live TMDB ed opzione di eliminazione. L'operazione è del tutto **idempotente**: eseguire l'importazione 2 o più volte consecutive agisce in `upsert` senza mai duplicare record nel database.

  Attenzione alla ricerca testuale: un id esterno identifica l'opera senza ambiguità, ma la ricerca per titolo no. Prima il fallback accettava `results[0]` qualunque fosse, e ogni titolo non azzeccato al primo colpo veniva legato a un'opera diversa che poi compariva nelle liste dell'utente al posto di quella vera. Ora il risultato passa da `pickBestMatch` (`lib/titleMatch.ts`), che pretende una similarità minima sul titolo normalizzato — confrontato **sia** con `title`/`name` **sia** con `original_title`/`original_name`, perché la ricerca gira in `it-IT` mentre gli export di TV Time sono in inglese — e corregge il punteggio con l'anno (±1 accettato, oltre respinto anche a titolo identico: è il caso dei reboot omonimi, per i quali l'anno fra parentesi in coda al titolo, "Doctor Who (2005)", non va più scartato ma usato). Se nessun candidato convince l'elemento finisce fra i "non risolti" e si sceglie a mano: **meglio nessun abbinamento che uno sbagliato salvato in silenzio**. Toccando le soglie di `titleMatch.ts` si sposta questo compromesso — alzarle manda più titoli nel modal, abbassarle riporta gli abbinamenti a caso.
- **Build**: `npx tsc --noEmit` e `npx vite build` entrambi OK

---

## Prossimi passi (MVP completamento)

- [x] Attribution TMDB — logo "The Movie Database" in pagina Info (`Info.tsx`)
- [x] Pagina "Informazioni" con attribuzione e crediti
- [x] Gestione errori TMDB (messaggio + retry, nessun crash)
- [x] Toast di errore per fallimenti Supabase (voto/commento/stato)
- [x] Placeholder poster per immagini mancanti
- [x] Abilitare PWA (Fase 1 di [`PWA_APK.md`](PWA_APK.md): manifest, service worker, icone 192/512, bottone "Installa app"). Verificata live sul deploy HTTPS; resta da confermare su un dispositivo Android reale (prompt di installazione, resa della maskable nel launcher, Lighthouse → Installability)
- [x] Predisporre il dominio per la TWA e scrivere la card di download (Fasi 2 e 4 di [`PWA_APK.md`](PWA_APK.md))
- [x] **PWA in produzione** su `https://tv-time-new.vercel.app`: il lavoro stava su `tvboss-pwa` mentre Vercel pubblica `master`, quindi il sito live era fermo a prima della rinomina in tvBoss. Risolto col merge; manifest, service worker, icone e `assetlinks.json` verificati a 200 live
- [x] **APK generato, firmato e autorizzato** (Fase 3): package `com.fedevespi.tvboss`, `versionName` 1.0.0.0, fingerprint in `assetlinks.json` e legame **verificato dall'API Digital Asset Links di Google**. Il pacchetto PWABuilder (keystore incluso) è escluso da git
- [ ] APK scaricabile da Impostazioni: resta da pubblicare `tvBoss.apk` come asset di una release GitHub e compilare `APK_RELEASE` in `src/lib/apk.ts`, che accende la card
- [ ] Riabilitare email conferma per produzione
- [x] Deploy su Vercel

---

## TODO futuri (v2, fuori scope MVP)

- Sistema following/amicizie e feed sociale
- Notifiche push (nuove stagioni, uscite streaming)
- Pulsante "mostra comunque" per bypassare anti-spoiler
- Supporto offline-first completo
