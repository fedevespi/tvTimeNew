import { useEffect, useState } from 'react'
import { ANDROID_PACKAGE_NAME, APK_RELEASE, type ApkRelease } from '@/lib/apk'
import { isAndroid, isStandalone } from '@/lib/platform'

/** `getInstalledRelatedApps` è solo Chromium e non è nei tipi standard del DOM. */
interface RelatedApplication {
  platform: string
  id?: string
  url?: string
}

type NavigatorWithRelatedApps = Navigator & {
  getInstalledRelatedApps?: () => Promise<RelatedApplication[]>
}

/**
 * L'APK va offerto solo a chi può farci qualcosa: un Android, aperto in una
 * scheda del browser, che non ha già l'app.
 *
 * I primi due controlli sono immediati. Il terzo no: `getInstalledRelatedApps`
 * è asincrono e esiste solo su Chrome Android, quindi la card compare subito e
 * al più sparisce un istante dopo. È l'ordine giusto — l'alternativa sarebbe
 * ritardare l'unica strada per installare l'app in attesa di un'API opzionale.
 */
export function useApkDownload(): { release: ApkRelease | null } {
  // Lo standalone copre sia la TWA sia la PWA installata: proporre il download
  // dell'APK da dentro l'app stessa non ha senso.
  const offerable = APK_RELEASE !== null && isAndroid() && !isStandalone()
  const [alreadyInstalled, setAlreadyInstalled] = useState(false)

  useEffect(() => {
    if (!offerable) return

    const nav = navigator as NavigatorWithRelatedApps
    // Dove l'API manca non si sa nulla, e nel dubbio la card si mostra:
    // proporre un download superfluo è meno grave che nascondere l'unico modo
    // di installare l'app.
    if (!nav.getInstalledRelatedApps) return

    let cancelled = false
    nav
      .getInstalledRelatedApps()
      .then((apps) => {
        if (!cancelled) {
          setAlreadyInstalled(apps.some((app) => app.id === ANDROID_PACKAGE_NAME))
        }
      })
      // Un rifiuto qui non è un errore da mostrare: vuol dire solo che non
      // sappiamo se l'app è installata, e si ricade sul mostrare la card.
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [offerable])

  return { release: offerable && !alreadyInstalled ? APK_RELEASE : null }
}
