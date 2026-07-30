const PREFIX = 'tvboss:cache:'
/**
 * Prefisso usato quando l'app si chiamava tvTime. Non si legge né si scrive più,
 * ma le voci rimaste vanno intercettate dalle purghe: altrimenti occuperebbero
 * quota per sempre, senza che nulla le possa più sfrattare.
 */
const LEGACY_PREFIX = 'tvtime:cache:'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

/**
 * Voci più grandi di così non vengono persistite: una singola risposta enorme
 * riempirebbe la quota da sola, sfrattando tutto il resto della cache.
 */
const MAX_ENTRY_BYTES = 192 * 1024

/** In Safari privato o con storage disabilitato l'accesso solleva un'eccezione. */
function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function forEachCacheKey(store: Storage, fn: (key: string) => void) {
  const keys: string[] = []
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i)
    if (key?.startsWith(PREFIX) || key?.startsWith(LEGACY_PREFIX)) keys.push(key)
  }
  // La rimozione altera gli indici: si raccolgono prima tutte le chiavi.
  for (const key of keys) fn(key)
}

function purgeExpired(store: Storage) {
  const now = Date.now()
  forEachCacheKey(store, key => {
    try {
      const entry = JSON.parse(store.getItem(key) ?? '') as CacheEntry<unknown>
      if (typeof entry?.expiresAt !== 'number' || entry.expiresAt < now) store.removeItem(key)
    } catch {
      store.removeItem(key)
    }
  })
}

function purgeAll(store: Storage) {
  forEachCacheKey(store, key => store.removeItem(key))
}

/** Valore ancora valido, oppure `null` se assente, scaduto o illeggibile. */
export function readCache<T>(key: string): T | null {
  const store = storage()
  if (!store) return null

  const fullKey = PREFIX + key
  const raw = store.getItem(fullKey)
  if (!raw) return null

  try {
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (typeof entry?.expiresAt !== 'number') {
      store.removeItem(fullKey)
      return null
    }
    if (entry.expiresAt < Date.now()) {
      store.removeItem(fullKey)
      return null
    }
    return entry.value
  } catch {
    store.removeItem(fullKey)
    return null
  }
}

/**
 * Scrive un valore con scadenza. La cache è un'ottimizzazione, non una fonte di
 * verità: se la quota è piena si liberano prima le voci scadute e, se non basta,
 * si azzera la cache senza propagare errori al chiamante.
 */
export function writeCache<T>(key: string, value: T, ttlMs: number): void {
  const store = storage()
  if (!store) return

  let raw: string
  try {
    raw = JSON.stringify({ value, expiresAt: Date.now() + ttlMs } satisfies CacheEntry<T>)
  } catch {
    return
  }
  if (raw.length > MAX_ENTRY_BYTES) return

  const fullKey = PREFIX + key
  try {
    store.setItem(fullKey, raw)
  } catch {
    purgeExpired(store)
    try {
      store.setItem(fullKey, raw)
    } catch {
      purgeAll(store)
    }
  }
}
