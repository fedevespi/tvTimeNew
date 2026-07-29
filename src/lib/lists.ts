import type { MediaType, TitleStatus, ViewMode } from '@/types'

/**
 * Elementi mostrati nell'anteprima di ogni sezione in "Le mie liste".
 * La griglia è a 2 colonne, quindi 6 poster occupano 3 righe compatte;
 * in elenco ogni riga è più alta e 4 bastano a non allungare l'atterraggio.
 */
const PREVIEW_SIZES: Record<ViewMode, number> = { grid: 6, list: 4 }

export function previewSize(viewMode: ViewMode): number {
  return PREVIEW_SIZES[viewMode]
}

export const STATUS_LABELS: Record<TitleStatus, string> = {
  da_vedere: 'Da vedere',
  in_corso: 'In corso',
  visto: 'Visto',
}

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  tv: 'Serie TV',
  movie: 'Film',
}

const FULL_LIST_TITLES: Record<TitleStatus, Record<MediaType, string>> = {
  da_vedere: { tv: 'Serie TV da vedere', movie: 'Film da vedere' },
  in_corso: { tv: 'Serie TV in corso', movie: 'Film in corso' },
  visto: { tv: 'Serie TV viste', movie: 'Film visti' },
}

export function fullListTitle(status: TitleStatus, mediaType: MediaType): string {
  return FULL_LIST_TITLES[status][mediaType]
}

export function emptyListMessage(status: TitleStatus, mediaType: MediaType): string {
  return mediaType === 'tv'
    ? `Nessuna serie TV in "${STATUS_LABELS[status]}".`
    : `Nessun film in "${STATUS_LABELS[status]}".`
}

export function listPath(status: TitleStatus, mediaType: MediaType): string {
  return `/lists/${status}/${mediaType}`
}

export function isTitleStatus(value: string | undefined): value is TitleStatus {
  return value === 'da_vedere' || value === 'in_corso' || value === 'visto'
}

export function isMediaType(value: string | undefined): value is MediaType {
  return value === 'tv' || value === 'movie'
}
