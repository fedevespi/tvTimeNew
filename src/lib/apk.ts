/**
 * L'APK di tvBoss è una TWA: un guscio Android che apre il sito live a schermo
 * pieno nel motore di Chrome. Da qui due conseguenze che danno la forma a questo
 * file e alla card di download:
 *
 * 1. Il contenuto dell'app arriva dal sito, quindi l'APK **non** va rigenerato a
 *    ogni deploy. Si ricompila solo cambiando nome, icona, package, dominio o la
 *    versione da distribuire agli utenti (vedi `docs/PWA_APK.md`).
 * 2. Finché non esiste una release pubblicata non c'è niente da offrire, ed è il
 *    caso in cui `APK_RELEASE` resta `null`.
 */

/**
 * Identità dell'app per Android. Fissata una volta e da non cambiare mai più:
 * cambiarla significa pubblicare un'app *diversa*, che non si installa sopra
 * quella già presente sui dispositivi.
 *
 * Deve coincidere con `package_name` in `public/.well-known/assetlinks.json` e
 * col package dichiarato dall'APK. Se i tre non coincidono Android non verifica
 * il legame fra sito e app, e il sintomo è la barra degli indirizzi di Chrome in
 * cima alla TWA.
 */
export const ANDROID_PACKAGE_NAME = 'com.fedevespi.tvboss'

export interface ApkRelease {
  /** `versionName` dell'APK, la stessa che Android mostra nelle info dell'app. */
  version: string
  /**
   * Percorso dell'APK **sul nostro dominio** (da `public/`), non su GitHub.
   *
   * Ospitarlo su GitHub Releases sembrava la scelta migliore — niente binari in
   * git — ma non funziona: `github.com` dichiara App Links per
   * `com.github.android`, quindi su Android il link veniva dirottato all'app
   * GitHub invece di scaricare il file. È lo stesso meccanismo di
   * `assetlinks.json` che fa aprire tvBoss a schermo pieno, qui però contro di
   * noi. Neanche un fetch+blob è possibile: gli asset GitHub non mandano CORS.
   *
   * Stessa origine significa anche che l'attributo `download` funziona: i browser
   * lo ignorano cross-origin.
   */
  url: string
  /** Peso del file in byte, per dirlo all'utente *prima* che scarichi. */
  sizeBytes: number
}

/**
 * La release da offrire, oppure `null` se non ne esiste ancora una — e in quel
 * caso la card non compare affatto, invece di offrire un link rotto.
 *
 * Per attivare il download: caricare l'APK come asset di una release GitHub e
 * incollare qui i tre valori. È l'unico punto da toccare.
 */
export const APK_RELEASE: ApkRelease | null = {
  // `versionName` letto dall'AndroidManifest dell'APK, non il tag della release
  // (`v1.0.0`): e' questa la stringa che Android mostra nelle info dell'app,
  // quindi e' quella con cui un utente puo' capire se ha gia' l'ultima versione.
  version: '1.0.0.0',
  // Serve `public/tvBoss.apk`. Sostituendolo vanno aggiornati anche `version` e
  // `sizeBytes` qui sotto: sono i tre campi che descrivono lo stesso file, e
  // disallineati farebbero annunciare alla card qualcosa che non e' cio' che scarica.
  url: '/tvBoss.apk',
  sizeBytes: 1900273,
}

/** Nome del file come l'utente lo ritrova nei Download, ricavato dall'URL. */
export function apkFileName(release: ApkRelease): string {
  return release.url.split('/').pop() || 'tvboss.apk'
}

/**
 * Peso in MB con una cifra: la precisione al byte non serve a chi legge. Virgola
 * decimale come nel resto dell'interfaccia (cfr. `lib/dates.ts`), che è in
 * italiano.
 */
const SIZE_FORMAT = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 })

export function formatApkSize(release: ApkRelease): string {
  return `${SIZE_FORMAT.format(release.sizeBytes / 1_000_000)} MB`
}
