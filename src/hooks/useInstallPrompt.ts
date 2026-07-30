import { useCallback, useEffect, useState } from 'react'

/**
 * `beforeinstallprompt` non è nei tipi standard del DOM: è una specifica solo
 * Chromium, e su Safari/Firefox non viene mai emessa.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** L'app è già aperta come applicazione installata, non nel browser. */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari su iOS non implementa `display-mode` e usa una proprietà tutta sua.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ si dichiara "MacIntel": il touch è ciò che lo distingue da un Mac.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
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

  return {
    /** Già installata: non c'è niente da proporre. */
    installed,
    /** Prompt nativo disponibile: un bottone può installare davvero. */
    canInstall: !installed && promptEvent !== null,
    /** Su iOS il prompt non esiste: l'unica strada sono le istruzioni manuali. */
    needsManualInstructions: !installed && isIOS(),
    install,
  }
}
