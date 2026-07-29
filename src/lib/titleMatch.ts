/**
 * Abbinamento fra un titolo grezzo (export di TV Time) e i risultati di ricerca
 * di TMDB.
 *
 * Serve perché la ricerca per titolo è l'ultima risorsa dell'import, quando gli
 * id esterni non bastano: accettare il primo risultato qualunque esso sia lega il
 * titolo a un'opera diversa, che poi compare nelle liste dell'utente al posto di
 * quella vera. Meglio nessun abbinamento — l'elemento finisce fra i "non risolti"
 * e si sceglie a mano — che un abbinamento sbagliato salvato in silenzio.
 */

export interface MatchCandidate {
  id: number
  /** Titolo localizzato: la ricerca TMDB gira con `language=it-IT`. */
  title: string
  /** Titolo originale, di norma quello che compare negli export di TV Time. */
  originalTitle?: string
  /** Anno di uscita o di prima messa in onda, quando TMDB lo conosce. */
  year?: number
}

export interface MatchQuery {
  title: string
  year?: number
}

/** Similarità minima fra i titoli perché un candidato sia preso in considerazione. */
const MIN_TITLE_SIMILARITY = 0.7
/** Punteggio minimo complessivo, similarità più correzione sull'anno. */
const MIN_SCORE = 0.7

/**
 * L'anno di uscita può slittare di uno fra paesi diversi, quindi ±1 resta un
 * indizio a favore. Oltre, è un'altra opera: la penalità è tale da respingere
 * anche un titolo identico, che è il caso dei remake e dei reboot omonimi.
 */
const SAME_YEAR_BONUS = 0.15
const NEAR_YEAR_BONUS = 0.05
const WRONG_YEAR_PENALTY = -0.35

/** Forma confrontabile: senza accenti, punteggiatura né differenze di maiuscole. */
export function normalizeTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Separa l'anno fra parentesi in coda al titolo, come lo scrive TV Time:
 * "Doctor Who (2005)". Prima veniva buttato via; è invece l'unico elemento che
 * distingue una serie dal suo reboot omonimo.
 */
export function splitTrailingYear(value: string): MatchQuery {
  const match = value.match(/^(.*[^\s])\s*\((\d{4})\)\s*$/)
  const title = match?.[1]
  const year = match?.[2]
  if (!title || !year) return { title: value.trim() }
  return { title, year: Number(year) }
}

/** Anno di una data TMDB in formato `YYYY-MM-DD`, se leggibile. */
export function parseYear(date: string | null | undefined): number | undefined {
  if (!date) return undefined
  const year = Number(date.slice(0, 4))
  return Number.isInteger(year) && year > 1800 ? year : undefined
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const substitution = (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1)
      curr[j] = Math.min((prev[j] ?? 0) + 1, (curr[j - 1] ?? 0) + 1, substitution)
    }
    const swap = prev
    prev = curr
    curr = swap
  }

  return prev[b.length] ?? 0
}

/** Somiglianza fra due titoli, da 0 (nulla in comune) a 1 (identici). */
export function similarity(a: string, b: string): number {
  const left = normalizeTitle(a)
  const right = normalizeTitle(b)
  if (!left || !right) return 0
  if (left === right) return 1

  const longest = Math.max(left.length, right.length)
  return 1 - levenshtein(left, right) / longest
}

function yearAdjustment(queryYear: number | undefined, candidateYear: number | undefined): number {
  if (queryYear === undefined || candidateYear === undefined) return 0
  const diff = Math.abs(queryYear - candidateYear)
  if (diff === 0) return SAME_YEAR_BONUS
  if (diff === 1) return NEAR_YEAR_BONUS
  return WRONG_YEAR_PENALTY
}

/**
 * Il candidato che corrisponde alla richiesta, o `null` se nessuno convince.
 *
 * Il titolo si confronta sia con quello localizzato sia con l'originale: la
 * ricerca risponde in italiano, mentre gli export di TV Time sono in inglese
 * ("Il Trono di Spade" non somiglia a "Game of Thrones", `original_name` sì).
 * A pari punteggio vince il primo, perché TMDB restituisce già per rilevanza.
 */
export function pickBestMatch(candidates: MatchCandidate[], query: MatchQuery): MatchCandidate | null {
  let best: MatchCandidate | null = null
  let bestScore = 0

  for (const candidate of candidates) {
    const titleScore = Math.max(
      similarity(query.title, candidate.title),
      candidate.originalTitle ? similarity(query.title, candidate.originalTitle) : 0
    )
    if (titleScore < MIN_TITLE_SIMILARITY) continue

    const score = titleScore + yearAdjustment(query.year, candidate.year)
    if (score < MIN_SCORE || score <= bestScore) continue

    best = candidate
    bestScore = score
  }

  return best
}
