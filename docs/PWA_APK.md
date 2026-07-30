# tvBoss — Da sito a app installabile (PWA → APK)

Ultimo aggiornamento: 2026-07-30 — **Fase 1 completata**, Fasi 2-4 da fare.

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

## Stato attuale (aggiornato il 2026-07-30, a Fase 1 conclusa)

| Cosa | Stato |
|---|---|
| `vite-plugin-pwa` | 0.20.5, **attivo** in `vite.config.ts` (manifest + Workbox) |
| `manifest.webmanifest` | generato dal plugin e servito con `application/manifest+json`. Il vecchio 404 non c'è più |
| Service worker | `dist/sw.js` generato, 16 voci in precache, `registerType: 'autoUpdate'` |
| Node | v20.19.1 → il blocco "abilitare PWA con Node >= 20" **non esiste più** |
| Icone | `favicon.png` 32, `icon-180.png` 180, `pwa-192x192`, `pwa-512x512`, `pwa-512x512-maskable`. Tutte generate da `npm run icons` |
| Sorgente logo | `icon-source.png` in root, PNG 754×751 (era `icon.jpg`, estensione sbagliata) |
| Resize immagini | `sharp` come devDependency + `scripts/generate-icons.mjs` |
| `.well-known/` in `public/` | **viene copiato** in `dist/` da Vite (verificato con un probe) → nessun workaround per `assetlinks.json` |
| Deploy | Vercel, nessun `vercel.json` |
| Toolchain Android | `java` non installato → Bubblewrap in locale richiederebbe JDK 17 + Android SDK |

---

## Decisioni ancora aperte

1. **Dominio di produzione.** Serve l'URL esatto: una TWA è legata a **una sola
   origine**, e cambiarla dopo significa ricompilare e rifirmare.
2. **Hosting dell'APK.** GitHub Releases (consigliato: nessun binario da qualche MB
   nel repo, più versioning e conteggio download gratis) oppure `public/` sul sito
   (più semplice, ma l'APK finisce in git e va ricommittato ad ogni rebuild).
   *Rimandata di proposito: si decide quando l'APK esiste davvero.*
3. **Package name Android.** Da fissare una volta e **mai più cambiare**, è
   l'identità dell'app per Android. Proposta: `it.advenias.tvboss`.
4. **Play Store sì/no.** Si può decidere dopo: PWABuilder produce già anche l'AAB,
   che è il formato richiesto dal negozio.

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

> **Nota sul modello di aggiornamento.** Da adesso ci sono due livelli di cache:
> `lib/localCache.ts` su localStorage e il service worker. Con `autoUpdate` il SW
> continua a servire la shell precedente fino al reload successivo — è la
> spiegazione da ricordare la prima volta che un deploy "non si vede".

---

## Fase 2 — Predisporre il dominio per la TWA

- [ ] Fissare dominio di produzione e package name (decisioni aperte 1 e 3).
- [ ] Creare `public/.well-known/assetlinks.json`: relation
      `delegate_permission/common.handle_all_urls`, target `android_app` con
      `package_name` e `sha256_cert_fingerprints`. La fingerprint arriva dalla
      Fase 3, quindi il file si completa dopo — ma il percorso si può predisporre.
- [ ] Nessun `vercel.json` serve per servirlo: già verificato che Vite copia
      `.well-known/` in `dist/`.
- [ ] Verificare col tester Digital Asset Links di Google **prima** di compilare.

---

## Fase 3 — Generare e firmare l'APK

- [ ] PWABuilder.com → URL del sito → Android → Generate. Restituisce APK (per il
      sideload), AAB (per il Play Store), il keystore e il contenuto già pronto di
      `assetlinks.json`. È il percorso preferito perché `java` non è installato e
      Bubblewrap in locale richiederebbe JDK 17 più l'Android SDK.
- [ ] Salvare keystore, password e alias in un password manager, **fuori dal
      repo**. Perso il keystore, gli APK già installati non sono più aggiornabili:
      gli utenti dovrebbero disinstallare e reinstallare a mano.
- [ ] Incollare la fingerprint SHA-256 in `assetlinks.json`, deployare, e solo
      **dopo** verificare.
- [ ] Provare su un dispositivo reale. Se in cima all'app compare la barra degli
      indirizzi di Chrome, `assetlinks.json` non è stato verificato: è il sintomo
      preciso da cercare, non un problema di grafica.

---

## Fase 4 — Il bottone di download

- [ ] Scegliere l'hosting (decisione aperta 2).
- [ ] Card in Impostazioni con nome file, versione e peso. Mostrarla **solo su
      Android** (`/Android/i.test(navigator.userAgent)`) e nasconderla se l'app sta
      già girando come TWA o in standalone: offrire il download dell'APK dentro
      l'APK non ha senso.
- [ ] Scrivere nella UI che Android chiederà di consentire l'installazione da fonti
      sconosciute e che Chrome mostrerà un avviso sul tipo di file. Un utente non
      avvisato legge quegli avvisi come "il sito è rotto".
- [ ] Se l'APK viene servito da `public/`: con l'attributo `download` Vercel va
      bene così com'è (`application/octet-stream`). Un `vercel.json` che imposti
      `application/vnd.android.package-archive` è opzionale, non necessario.
- [ ] Dire da qualche parte (Info o la card stessa) che l'app si aggiorna da sé col
      sito: nessun nuovo APK da scaricare per i cambi di contenuto.

---

## Cosa questo piano non risolve

- **iOS.** Non esiste un equivalente dell'APK. Su iPhone e iPad la strada resta la
  PWA della Fase 1, e il bottone di download non va nemmeno mostrato.
- **Distribuzione oltre la cerchia di amici.** Il sideload è pieno di attriti:
  avviso di Chrome sul file, fonti sconosciute da abilitare, possibile segnalazione
  di Play Protect. Per andare oltre serve il Play Store — l'AAB della Fase 3 è già
  il file giusto, mancano account sviluppatore (25$ una volta) e scheda del negozio.
