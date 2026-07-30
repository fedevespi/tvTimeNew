# tvBoss — Da sito a app installabile (PWA → APK)

Ultimo aggiornamento: 2026-07-30

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

## Stato attuale (verificato il 2026-07-30)

| Cosa | Stato |
|---|---|
| `vite-plugin-pwa` | 0.20.5 installato, ma **commentato** in `vite.config.ts` |
| `manifest.webmanifest` | `index.html:9` lo linka, **il file non esiste** → 404 |
| Node | v20.19.1 → il blocco "abilitare PWA con Node >= 20" **non esiste più** |
| Icone | solo `favicon.png` 32×32 e `icon-180.png` 180×179. **Mancano 192 e 512**, obbligatorie per l'installabilità |
| Sorgente logo | `icon.jpg` in root: in realtà un **PNG 754×751** (estensione sbagliata). Risoluzione sufficiente per generare tutto |
| Resize immagini | nessuna libreria disponibile (`sharp`/`jimp` assenti) |
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

## Fase 1 — PWA installabile

Nessun APK, nessuna firma, nessun sideload. Su Android compare il prompt "Installa
app" nativo di Chrome; su iPhone è l'unica strada possibile.

- [ ] Generare `pwa-192x192.png` e `pwa-512x512.png` dalla sorgente. Attenzione:
      la sorgente è 754×**751**, non è quadrata — va portata a quadrato con
      padding, non stirata, altrimenti le icone risultano deformate.
- [ ] Generare anche una icona **maskable** 512. Android ritaglia l'icona nella
      forma del launcher (cerchio, goccia, squircle secondo il dispositivo): il
      nostro logo è già un quadrato arrotondato con sfondo scuro, quindi va
      rimpicciolito dentro la tela lasciando ~20% di margine, o gli angoli e la
      pellicola in basso a destra vengono tagliati.
- [ ] Come generarle: `npm i -D sharp` più un piccolo script, oppure l'image
      generator di PWABuilder. Oggi non c'è nessuno dei due.
- [ ] Rinominare `icon.jpg` → `icon-source.png`: è un PNG, l'estensione mente.
- [ ] Scommentare e configurare `VitePWA` in `vite.config.ts`: `name` e
      `short_name` `tvBoss`, `start_url: '/'`, `scope: '/'`,
      `display: 'standalone'`, `lang: 'it'`, `theme_color` e `background_color`
      `#0f172a` (già il valore del meta `theme-color` in `index.html`), più le tre
      icone.
- [ ] **Rimuovere `<link rel="manifest">` da `index.html`.** Il plugin inietta il
      proprio tag durante il build: quello scritto a mano resterebbe duplicato — ed
      è esattamente la riga che oggi punta a un 404.
- [ ] Workbox, attenti a cosa si mette in cache. Precache dei soli asset buildati
      (hashati, quindi sicuri), `navigateFallback: 'index.html'` per il routing
      SPA, `cleanupOutdatedCaches: true`. **Non** mettere in runtime cache le
      chiamate a Supabase: un token o una lista serviti da una cache stantia sono
      un bug di correttezza, non un'ottimizzazione. Le immagini TMDB invece sono
      candidate legittime (CacheFirst con scadenza).
- [ ] Tenere presente che si aggiunge un **secondo livello di cache**:
      `lib/localCache.ts` già persiste risposte TMDB su localStorage. E con
      `registerType: 'autoUpdate'` il service worker continua a servire la shell
      vecchia fino al reload successivo — è la spiegazione da ricordare quando un
      aggiornamento "non si vede".
- [ ] Bottone "Installa app" in Impostazioni: intercettare `beforeinstallprompt`,
      conservare l'evento, mostrare il bottone solo se disponibile, chiamare
      `prompt()` al click. Nasconderlo se l'app è già installata
      (`matchMedia('(display-mode: standalone)')` oppure evento `appinstalled`).
- [ ] iOS **non** emette `beforeinstallprompt`: lì al posto del bottone servono le
      istruzioni ("Condividi → Aggiungi alla schermata Home"), altrimenti su
      iPhone la card resta muta senza spiegazione.
- [ ] Verificare con Chrome DevTools → Application → Manifest e con Lighthouse.
      L'installabilità richiede HTTPS (localhost è esentato).

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
