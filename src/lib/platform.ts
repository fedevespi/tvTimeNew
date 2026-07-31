/**
 * Riconoscimento della piattaforma e del contesto in cui l'app sta girando.
 *
 * Sta in un modulo a parte perché serve a due card diverse di Impostazioni che
 * si escludono a vicenda: quella che installa la PWA e quella che scarica
 * l'APK. Duplicare questi controlli significherebbe farli divergere.
 */

/**
 * L'app gira dentro la TWA, cioè dentro l'APK.
 *
 * Il referrer `android-app://` è il segnale specifico della TWA. Da solo non
 * basta — sopravvive alla navigazione client-side ma non a un reload — ed è per
 * questo che `isStandalone` lo mette in OR col display-mode invece di fidarsi
 * di uno dei due.
 */
export function isTwa(): boolean {
  return document.referrer.startsWith('android-app://')
}

/** L'app è aperta come applicazione installata, non in una scheda del browser. */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari su iOS non implementa `display-mode` e usa una proprietà tutta sua.
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    isTwa()
  )
}

export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent)
}

export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ si dichiara "MacIntel": il touch è ciò che lo distingue da un Mac.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}
