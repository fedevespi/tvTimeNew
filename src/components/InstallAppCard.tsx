import { Download, Share } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/**
 * Invito a installare tvBoss come app. Si mostra solo quando c'è davvero
 * qualcosa da fare: nulla se l'app è già installata, e nulla su browser che non
 * supportano l'installazione, per non promettere una funzione inesistente.
 */
export function InstallAppCard() {
  const { canInstall, needsManualInstructions, install } = useInstallPrompt()

  if (!canInstall && !needsManualInstructions) return null

  return (
    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/15 rounded-xl shrink-0">
          {canInstall ? (
            <Download size={20} className="text-accent" />
          ) : (
            <Share size={20} className="text-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 dark:text-white font-medium">Installa app</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {canInstall
              ? 'Aggiungi tvBoss alla schermata Home'
              : 'Tocca Condividi, poi "Aggiungi alla schermata Home"'}
          </p>
        </div>
        {canInstall && (
          <button
            onClick={install}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors shrink-0"
          >
            Installa
          </button>
        )}
      </div>
    </div>
  )
}
