import { Smartphone } from 'lucide-react'
import { useApkDownload } from '@/hooks/useApkDownload'
import { apkFileName, formatApkSize } from '@/lib/apk'

/**
 * Download dell'APK Android. Compare solo dove serve davvero (vedi
 * `useApkDownload`) e dice in anticipo le due cose che altrimenti si scoprono
 * nel momento sbagliato: che Android e Chrome mostreranno degli avvisi, e che
 * l'app poi si aggiorna da sé.
 */
export function DownloadApkCard() {
  const { release } = useApkDownload()

  if (!release) return null

  return (
    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/15 rounded-xl shrink-0">
          <Smartphone size={20} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 dark:text-white font-medium">App per Android</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
            {apkFileName(release)} · v{release.version} · {formatApkSize(release)}
          </p>
        </div>
        <a
          href={release.url}
          // L'APK sta su GitHub: `download` verrebbe ignorato perché l'origine è
          // diversa, ed è GitHub stesso a servirlo come allegato. Nuova scheda
          // per non far uscire l'utente dall'app durante il redirect.
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors shrink-0"
        >
          Scarica
        </a>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 space-y-1.5">
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          Chrome avviserà che questo tipo di file può essere dannoso e Android
          chiederà di consentire l'installazione da questa fonte: è normale per le
          app che non arrivano dal Play Store.
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          Una volta installata si aggiorna da sé insieme al sito: non serve
          riscaricarla per avere le novità.
        </p>
      </div>
    </div>
  )
}
