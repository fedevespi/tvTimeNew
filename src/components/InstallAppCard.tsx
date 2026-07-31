import { Share } from 'lucide-react'
import { isIOS, isStandalone } from '@/lib/platform'

/**
 * Istruzioni per installare tvBoss su iPhone e iPad.
 *
 * **Solo iOS, di proposito.** Su Android si offre l'APK, che dà un risultato
 * migliore — icona nel launcher, nessuna barra degli indirizzi — e rende questa
 * card superflua; su desktop l'installazione della PWA era un extra che non
 * valeva una card. iOS è l'unica piattaforma dove *non esiste alternativa*: fuori
 * dall'App Store non si installa niente, quindi «Aggiungi alla schermata Home» è
 * il solo modo in cui tvBoss diventa un'app su iPhone.
 *
 * Per lo stesso motivo qui non c'è nessun bottone: Safari non emette mai
 * `beforeinstallprompt`, quindi non c'è un'azione da invocare, solo qualcosa da
 * spiegare. Il codice che gestiva quel prompt (`useInstallPrompt`) è stato
 * rimosso quando la card è diventata iOS-only — serviva ad Android e al desktop,
 * e tenerlo avrebbe suggerito una capacità che non usiamo più.
 */
export function InstallAppCard() {
  // Aperta dalla schermata Home: è già installata, non c'è niente da spiegare.
  if (!isIOS() || isStandalone()) return null

  return (
    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
      <div className="flex items-center gap-3">
        {/* Icona inline come le altre righe di Impostazioni (DESIGN_SYSTEM.md). */}
        <Share size={20} className="text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 dark:text-white font-medium">Installa app</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Tocca Condividi, poi "Aggiungi alla schermata Home"
          </p>
        </div>
      </div>
    </div>
  )
}
