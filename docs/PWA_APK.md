# tvBoss — Da sito a app installabile (PWA → APK)

Ultimo aggiornamento: 2026-07-31 — **Fasi 1, 2 e 4 fatte, e la PWA è in
produzione** su `https://tv-time-new.vercel.app` (verificato live). Resta la
**Fase 3**, che non si fa da qui: generare l'APK su PWABuilder e incollare la
fingerprint. Finché non esiste una release, la card di download non compare.

**Obiettivo finale:** un bottone in Impostazioni che scarica l'APK di tvBoss, così
che il sito si usi come un'app installata.

---

## Come ci si arriva, e perché in quest'ordine

L'APK non viene generato dal sito né al volo: si compila una volta con l'approccio
**TWA** (Trusted Web Activity), in cui l'APK è un *guscio* che apre il sito live nel
motore di Chrome, a schermo intero e senza barra degli indirizzi. Due conseguenze
danno la forma a tutto il piano:

1. **L'APK non va rigenerato ad ogni deploy.** Aggiorni il sito, l'app mostra la
   versione nuova. Si ricompila solo cambiando nome, icona, package o versione.
2. **Una TWA pretende una PWA valida** sull'origine di produzione: manifest
   conforme, icone delle dimensioni giuste, HTTPS. Quindi la Fase 1 non è un
   ripiego in attesa dell'APK — è il suo prerequisito, e va fatta comunque.

Da qui l'ordine: PWA installabile → dominio predisposto → APK firmato → bottone.

---

## Stato attuale (aggiornato il 2026-07-31, a Fasi 1, 2 e 4 concluse)

| Cosa | Stato |
|---|---|
| `vite-plugin-pwa` | 0.20.5, **attivo** in `vite.config.ts` (manifest + Workbox) |
| `manifest.webmanifest` | generato dal plugin e servito con `application/manifest+json`. Il vecchio 404 non c'è più |
| Service worker | `dist/sw.js` generato, 16 voci in precache, `registerType: 'autoUpdate'` |
| Node | v20.19.1 → il blocco "abilitare PWA con Node >= 20" **non esiste più** |
| Icone | `favicon.png` 32, `icon-180.png` 180, `pwa-192x192`, `pwa-512x512`, `pwa-512x512-maskable`. Tutte generate da `npm run icons` |
| Sorgente logo | `icon-source.png` in root, PNG 754×751 (era `icon.jpg`, estensione sbagliata) |
| Resize immagini | `sharp` come devDependency + `scripts/generate-icons.mjs` |
| `.well-known/` in `public/` | **viene copiato** in `dist/` da Vite (verificato sul build) → nessun workaround per `assetlinks.json` |
| `assetlinks.json` | esiste, col package definitivo. `sha256_cert_fingerprints` vuoto in attesa della Fase 3 |
| Package Android | `com.fedevespi.tvboss`, definito in `src/lib/apk.ts` e importato da `vite.config.ts` |
| APK | **non ancora generato.** `APK_RELEASE` è `null`, quindi la card di download non compare |
| Deploy | Vercel su `https://tv-time-new.vercel.app`, nessun `vercel.json` (e non serve: l'APK starà su GitHub Releases) |
| Produzione | pubblica **`master`**, allineato a `7808a28`: manifest, service worker, icone e `assetlinks.json` verificati a 200 live |
| Toolchain Android | `java` non installato → Bubblewrap in locale richiederebbe JDK 17 + Android SDK. Si usa PWABuilder |

---

## Decisioni fissate (2026-07-31)

1. **Package name: `com.fedevespi.tvboss`.** Definito una volta in
   `src/lib/apk.ts` (`ANDROID_PACKAGE_NAME`), da cui `vite.config.ts` lo importa
   per il manifest: così non può divergere fra le due. La terza copia è
   `public/.well-known/assetlinks.json`, che è un file di dati e non può
   importarlo — lì lo script della Fase 3 non lo tocca mai, per non riscriverlo
   per sbaglio. **Non si cambia più:** un package diverso è un'app diversa, che
   non si installa sopra quella già presente sui dispositivi.
2. **Origine: `https://tv-time-new.vercel.app`** — il dominio Vercel predefinito.
   È l'URL da dare a PWABuilder. Se in futuro si passa a un dominio custom,
   l'APK va rigenerato e rifirmato: una TWA è legata a una sola origine.
3. **Hosting dell'APK: GitHub Releases.** Nessun binario da megabyte nella storia
   di git, più versioning e conteggio download gratis.
4. **Play Store: rimandato.** PWABuilder produce già anche l'AAB, quindi la
   decisione non costa nulla dopo. Se si fa, servono anche la fingerprint di
   Google (vedi Fase 3), l'account sviluppatore da 25 $ e la scheda del negozio.

### Il modello di aggiornamento, che è il motivo per cui l'ordine è questo

L'APK **non contiene l'app**: contiene l'istruzione di aprire l'origine di
produzione a schermo pieno. Quindi codice, pagine, feature e fix arrivano dal
sito, e si ricompila solo cambiando **nome, icona, package, dominio o versione da
distribuire**. In pratica: una volta, e poi quasi mai.

Due conseguenze da ricordare la prima volta che si ricompila:

- il nuovo APK va firmato **con lo stesso keystore**, altrimenti Android rifiuta
  l'installazione sopra l'app esistente (`App not installed`) e gli utenti devono
  disinstallare e reinstallare a mano;
- chi ha già l'app **non riceve il nuovo APK da sé**: il sideload non ha
  aggiornamenti automatici. È l'unico motivo pratico per considerare il Play Store.

---

## Fase 1 — PWA installabile ✅ (fatta)

Nessun APK, nessuna firma, nessun sideload. Su Android compare il prompt "Installa
app" nativo di Chrome; su iPhone è l'unica strada possibile.

- [x] Icone generate da `scripts/generate-icons.mjs` (`npm run icons`), che è
      proprietario di **tutte** le icone di `public/`: se il logo cambia si
      rigenera tutto con un comando invece di rifarle a mano.
- [x] Icona **maskable** dedicata. Android ritaglia nella forma del launcher, così
      il badge è rimpicciolito al 62,5% su fondo pieno `#212832` — lo stesso colore
      del badge, verificato pixel per pixel, quindi il ritaglio non lascia alcun
      contorno visibile.
- [x] `icon.jpg` → `icon-source.png`: era un PNG, l'estensione mentiva.
- [x] `VitePWA` attivo e configurato in `vite.config.ts`: `tvBoss`,
      `start_url: '/'`, `scope: '/'`, `display: 'standalone'`, `lang: 'it'`,
      `theme_color`/`background_color` `#0f172a`, le tre icone.
- [x] Rimosso `<link rel="manifest">` da `index.html`. Verificato sul build che il
      plugin ne inietta **uno solo**: quello a mano sarebbe stato un duplicato, ed
      era la riga che puntava al 404.
- [x] Workbox: precache dei soli asset buildati (16 voci),
      `navigateFallback: '/index.html'` per il routing SPA,
      `cleanupOutdatedCaches: true`, e `navigateFallbackDenylist` su
      `/.well-known/` già predisposto per la Fase 2. Runtime cache **solo** per
      `image.tmdb.org` (CacheFirst, 300 voci / 30 giorni). Supabase è dichiarato
      esplicitamente `NetworkOnly`: non perché serva oggi, ma perché rende
      difficile che una regola aggiunta in futuro se lo mangi per sbaglio — liste
      o token serviti da cache stantia sono un bug di correttezza.
- [x] Bottone "Installa app" in Impostazioni (`InstallAppCard.tsx` +
      `useInstallPrompt.ts`): intercetta `beforeinstallprompt` con
      `preventDefault()`, si nasconde su `appinstalled` o
      `display-mode: standalone`, e non compare affatto dove l'installazione non è
      supportata, per non promettere una funzione inesistente.
- [x] Ramo iOS con le istruzioni "Condividi → Aggiungi alla schermata Home": lì
      `beforeinstallprompt` non viene mai emesso e la card sarebbe rimasta muta.
- [x] Verificato in locale con `npm run build && npm run preview`: manifest servito
      come `application/manifest+json`, `sw.js` e `registerSW.js` a 200, regole
      `CacheFirst` e `NetworkOnly` presenti nel service worker generato.

**Cosa resta, e richiede un dispositivo reale:** il prompt "Installa app" su Chrome
Android, la resa della maskable nel launcher, e Lighthouse → Installability sul
deploy Vercel. L'installabilità richiede HTTPS e localhost è esentato, quindi la
preview locale non la dimostra.

> Il 2026-07-31 si è scoperto **perché** quelle verifiche non erano ancora
> possibili: la PWA non era mai arrivata in produzione, perché Vercel pubblica
> `master` mentre la Fase 1 viveva su `tvboss-pwa`. Risolto lo stesso giorno col
> merge — vedi la sezione qui sotto. Le tre verifiche restano da fare, ma ora
> l'origine di produzione le rende possibili.

> **Nota sul modello di aggiornamento.** Da adesso ci sono due livelli di cache:
> `lib/localCache.ts` su localStorage e il service worker. Con `autoUpdate` il SW
> continua a servire la shell precedente fino al reload successivo — è la
> spiegazione da ricordare la prima volta che un deploy "non si vede".

---

## Fase 2 — Predisporre il dominio per la TWA ✅ (fatta)

- [x] Package name fissato: `com.fedevespi.tvboss` (decisione 1).
- [x] `public/.well-known/assetlinks.json` creato: relation
      `delegate_permission/common.handle_all_urls`, target `android_app` col
      package. **`sha256_cert_fingerprints` è un array vuoto**, e non è una
      dimenticanza: la fingerprint esiste solo dopo la Fase 3, e un array vuoto
      dice il vero — nessuna app è ancora autorizzata. Un valore finto lì
      direbbe una bugia che poi bisogna ricordarsi di correggere.
- [x] `npm run assetlinks -- <fingerprint>` per riempirlo
      (`scripts/set-assetlinks-fingerprint.mjs`). Vale uno script perché il modo
      tipico di rompere una TWA è sbagliare questo file, e il sintomo è muto:
      normalizza maiuscole e separatori, rifiuta una SHA-1 spacciata per SHA-256
      dicendolo esplicitamente, accetta la seconda fingerprint del Play Store, e
      non riscrive mai il `package_name`.
- [x] Verificato sul build che Vite copia `.well-known/` in `dist/`: nessun
      `vercel.json` serve.
- [x] Verificato che il service worker **non** precacha `assetlinks.json`:
      `globPatterns` non include i `.json`, e in più `navigateFallbackDenylist`
      tiene `/.well-known/` fuori dal fallback SPA. Confermato sul `sw.js`
      generato — l'unica occorrenza di `well-known` è la denylist.
- [x] Manifest: `related_applications` col package e
      `prefer_related_applications: false`. Serve a `getInstalledRelatedApps()`
      (vedi Fase 4). ⚠️ Quel `false` va lasciato stare: a `true` Chrome smette di
      emettere `beforeinstallprompt` e il bottone della Fase 1 muore in silenzio.
- [ ] Verificare col tester Digital Asset Links di Google — **possibile solo dopo
      la Fase 3**, perché prima non c'è nessuna fingerprint da verificare.

---

## La PWA è in produzione ✅ (2026-07-31)

C'è stato un momento in cui non lo era, e vale la pena tenerne traccia perché è
un errore che può ripetersi: Vercel pubblica **`master`**, ma la rinomina in
tvBoss e tutte le Fasi 1-2-4 stavano su **`tvboss-pwa`**, mai unito. Il sito live
era fermo a `f2bd0dd`, con `<title>tvTime</title>` e il `<link rel="manifest">`
scritto a mano che puntava a un 404 — proprio la riga che la Fase 1 aveva
rimosso. Nessuna delle verifiche della Fase 1 era quindi mai stata possibile, e
aprire PWABuilder avrebbe letto un sito senza manifest.

Risolto col fast-forward di `tvboss-pwa` in `master` (`7808a28`). **Il branch di
lavoro non è la produzione: il merge in `master` è un passo del piano, non un
dettaglio di igiene del repository.**

Ricontrollato con `curl` dopo il deploy — tutto su
`https://tv-time-new.vercel.app`:

| URL | Esito |
|---|---|
| `/` | 200, `<title>tvBoss</title>`, **un solo** `rel="manifest"` (iniettato dal plugin) |
| `/manifest.webmanifest` | 200 `application/manifest+json`, con `related_applications` e `prefer_related_applications: false` |
| `/sw.js`, `/registerSW.js` | 200 `application/javascript` |
| `/pwa-192x192`, `/pwa-512x512`, `/pwa-512x512-maskable`, `/icon-180` | 200 `image/png` |
| `/.well-known/assetlinks.json` | 200 `application/json`, package `com.fedevespi.tvboss`, fingerprint ancora vuote |

Il `; charset=utf-8` che Vercel aggiunge al content-type di `assetlinks.json` va
bene: la verifica di Google guarda il tipo `application/json`, non il parametro.
Annotato perché a prima vista sembra un problema e non lo è.

**Cosa questo abilita da subito**, senza aspettare l'APK: il prompt "Installa
app" su Chrome Android, la resa della maskable nel launcher e Lighthouse →
Installability sono ora verificabili, perché l'origine è in HTTPS e non è
localhost.

---

## Fase 3 — Generare e firmare l'APK ⬅️ **il passo che resta**

Non si può fare da riga di comando qui: `java` non è installato e Bubblewrap in
locale richiederebbe JDK 17 più l'Android SDK. Si fa dal browser, una volta.

- [x] PWA in produzione: prerequisito soddisfatto (sezione qui sopra).
- [ ] PWABuilder.com → `https://tv-time-new.vercel.app` → **Android** → *Generate*. I campi da
      controllare: Package ID **`com.fedevespi.tvboss`**, versione `1.0.0` /
      versionCode `1`, display mode `standalone`, Signing key **New** (è la prima
      volta: sarà PWABuilder a generare il keystore).
- [ ] Nello zip che restituisce: l'APK firmato (sideload), l'AAB (Play Store),
      `signing.keystore` e `assetlinks.json` già compilato.
- [ ] Salvare **keystore, password e alias** in un password manager, fuori dal
      repo. Perso il keystore, gli APK già installati non sono più aggiornabili.
- [ ] `npm run assetlinks -- <fingerprint-SHA-256>`, poi commit e deploy. In
      quest'ordine: la verifica legge il file dal sito live, quindi deve esserci
      già quando l'APK viene installato.
- [ ] Verificare sul tester Digital Asset Links di Google.
- [ ] Provare su un dispositivo reale. Se in cima all'app compare la barra degli
      indirizzi di Chrome, `assetlinks.json` non è stato verificato: è il sintomo
      preciso da cercare, non un problema di grafica.
- [ ] Pubblicare l'APK come asset di una release GitHub (decisione 3).

---

## Fase 4 — Il bottone di download ✅ (fatta, dormiente)

Il codice c'è tutto. **Per accenderlo basta un'unica modifica:** compilare
`APK_RELEASE` in `src/lib/apk.ts` con `version`, `url` dell'asset GitHub e
`sizeBytes`. Finché resta `null` la card non compare — invece di offrire un link
rotto per i mesi in cui l'APK non esiste.

- [x] Hosting scelto: GitHub Releases (decisione 3).
- [x] `DownloadApkCard.tsx` con nome file, versione e peso. Il nome file è
      ricavato dall'URL (`apkFileName`) invece di essere un campo a parte: due
      campi che devono coincidere sono due campi che possono divergere.
- [x] `useApkDownload.ts` decide quando mostrarla: solo Android, solo fuori da
      standalone/TWA (offrire l'APK dentro l'APK non ha senso), e non a chi ha
      già l'app installata — quest'ultimo tramite `getInstalledRelatedApps()`.
      Dove quell'API manca non si sa nulla e **la card si mostra**: proporre un
      download superfluo è meno grave che nascondere l'unico modo di installare.
- [x] Rilevamento piattaforma spostato in `src/lib/platform.ts`, condiviso con
      `useInstallPrompt`: erano gli stessi controlli in due posti, e in due posti
      divergono. Aggiunto `isTwa()` (referrer `android-app://`), in OR col
      display-mode perché nessuno dei due regge da solo — il referrer non
      sopravvive a un reload.
- [x] Nella card sta scritto che Chrome avviserà sul tipo di file e che Android
      chiederà di consentire l'installazione da questa fonte. Un utente non
      avvisato legge quegli avvisi come "il sito è rotto".
- [x] E che l'app si aggiorna da sé insieme al sito: nessun APK da riscaricare
      per i cambi di contenuto.
- [x] Nessun `vercel.json`: l'APK sta su GitHub, che lo serve già come allegato.
      Per lo stesso motivo la card **non** usa l'attributo `download`, che i
      browser ignorano cross-origin.

### Una cosa da decidere quando l'APK esisterà davvero

Su Chrome Android le due card possono comparire insieme: "Installa app" (PWA, un
tap) e "App per Android" (APK, con gli avvisi di sideload). Oggi non succede,
perché `APK_RELEASE` è `null`. Restano entrambe di proposito — l'utente vede le
due strade e sceglie — ma se sullo schermo risultasse confuso, il posto dove
intervenire è l'ordine o la visibilità delle card in `Settings.tsx`.

---

## Cosa questo piano non risolve

- **iOS.** Non esiste un equivalente dell'APK. Su iPhone e iPad la strada resta la
  PWA della Fase 1, e il bottone di download non va nemmeno mostrato.
- **Distribuzione oltre la cerchia di amici.** Il sideload è pieno di attriti:
  avviso di Chrome sul file, fonti sconosciute da abilitare, possibile segnalazione
  di Play Protect. Per andare oltre serve il Play Store — l'AAB della Fase 3 è già
  il file giusto, mancano account sviluppatore (25$ una volta) e scheda del negozio.
