import { useCallback, useEffect, useState } from 'react'
import { APK_RELEASE } from '@/lib/apk'
import { isAndroid, isIOS, isStandalone } from '@/lib/platform'

/**
 * `beforeinstallprompt` non è nei tipi standard del DOM: è una specifica solo
 * Chromium, e su Safari/Firefox non viene mai emessa.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Stato dell'installazione dell'app. Tre esiti possibili, da distinguere perché
 * richiedono UI diverse: prompt nativo disponibile, solo istruzioni manuali
 * (iOS), oppure niente da offrire.
 */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      // Senza `preventDefault` Chrome gestisce l'evento da sé e non resta nulla
      // da invocare al click sul nostro bottone.
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!promptEvent) return false
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    // L'evento si consuma comunque, accettato o rifiutato: va scartato in ogni
    // caso, e se l'utente rifiuta Chrome ne emetterà un altro più avanti.
    setPromptEvent(null)
    return outcome === 'accepted'
  }, [promptEvent])

  /**
   * Su Android, dove c'è un APK da offrire, la PWA non si propone: due inviti a
   * installare la stessa app sulla stessa schermata confondono, e la TWA è il
   * risultato migliore — icona nel launcher e nessuna barra degli indirizzi.
   *
   * Non è una porta chiusa: Chrome mantiene il proprio "Installa app" nel menu,
   * quindi chi preferisce la PWA la ottiene comunque. Qui smettiamo solo di
   * pubblicizzarla, dove esiste un'alternativa migliore.
   *
   * iOS e desktop non sono toccati: l'APK non li riguarda, e lì questa card è
   * l'unica strada.
   */
  const supersededByApk = APK_RELEASE !== null && isAndroid()

  return {
    /** Già installata: non c'è niente da proporre. */
    installed,
    /** Prompt nativo disponibile: un bottone può installare davvero. */
    canInstall: !installed && !supersededByApk && promptEvent !== null,
    /** Su iOS il prompt non esiste: l'unica strada sono le istruzioni manuali. */
    needsManualInstructions: !installed && isIOS(),
    install,
  }
}
