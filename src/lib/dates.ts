const WEEKDAY_FORMAT = new Intl.DateTimeFormat('it-IT', { weekday: 'long' })
const DAY_MONTH_FORMAT = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' })
const DAY_MONTH_YEAR_FORMAT = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Le date TMDB sono `YYYY-MM-DD`: senza ora vengono lette come UTC e possono slittare di un giorno. */
function parseAirDate(iso: string): Date | null {
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * Data di uscita in forma breve e leggibile: "Oggi", "Domani", il giorno della
 * settimana entro una settimana, poi giorno e mese (con anno se diverso).
 */
export function formatAirDate(iso: string, now: Date = new Date()): string {
  const date = parseAirDate(iso)
  if (!date) return ''

  const days = Math.round((startOfDay(date) - startOfDay(now)) / MS_PER_DAY)
  if (days <= 0) return 'Oggi'
  if (days === 1) return 'Domani'
  if (days < 7) return WEEKDAY_FORMAT.format(date)
  return date.getFullYear() === now.getFullYear()
    ? DAY_MONTH_FORMAT.format(date)
    : DAY_MONTH_YEAR_FORMAT.format(date)
}
