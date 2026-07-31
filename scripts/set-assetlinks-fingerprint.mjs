/**
 * Scrive le fingerprint SHA-256 dei certificati di firma in
 * `public/.well-known/assetlinks.json`, il file che autorizza l'APK ad aprire il
 * sito senza barra degli indirizzi.
 *
 * Uso: npm run assetlinks -- AA:BB:...:FF [seconda-fingerprint]
 *
 * Perché uno script per due righe di JSON: il modo tipico di rompere una TWA è
 * sbagliare proprio questo file, e il sintomo è muto — l'app si apre con la barra
 * degli indirizzi di Chrome in cima, senza alcun messaggio di errore. Le tre
 * trappole che questo script intercetta:
 *
 * 1. incollare la fingerprint **SHA-1** invece della SHA-256: sono 20 coppie di
 *    cifre invece di 32, e a occhio si somigliano molto;
 * 2. incollarla in minuscolo o separata da spazi, come la stampano alcuni tool:
 *    Google la vuole in maiuscolo separata da due punti;
 * 3. dimenticare la **seconda** fingerprint quando si passa dal Play Store, che
 *    rifirma l'app con una chiave propria. Servono sia quella di upload sia
 *    quella di Google, altrimenti la verifica salta per i soli utenti che hanno
 *    installato dal negozio — il caso più difficile da riprodurre in casa.
 *
 * Il `package_name` non si tocca: resta quello già scritto nel file, che è la
 * stessa stringa di `ANDROID_PACKAGE_NAME` in `src/lib/apk.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(root, 'public', '.well-known', 'assetlinks.json')

/** 32 byte in esadecimale: è ciò che distingue una SHA-256 da una SHA-1. */
const SHA256_BYTES = 32

function fail(message) {
  console.error(`\n  ✗ ${message}\n`)
  process.exit(1)
}

/**
 * Porta la fingerprint nella forma che Google pretende, accettando le varianti
 * in cui i tool la stampano: minuscola, con spazi, o senza separatori.
 */
function normalize(input) {
  const bytes = input.trim().toUpperCase().split(/[:\s]+/).filter(Boolean)

  // Senza separatori arriva come un'unica stringa: la spezzo a coppie.
  const pairs = bytes.length === 1 ? bytes[0].match(/.{1,2}/g) ?? [] : bytes

  if (pairs.some((b) => !/^[0-9A-F]{2}$/.test(b))) {
    fail(`"${input}" non è una fingerprint esadecimale valida.`)
  }
  if (pairs.length === 20) {
    fail(
      `"${input}" ha 20 byte: è una SHA-1, non una SHA-256.\n` +
        `    Cerca la riga "SHA-256" nell'output di PWABuilder o di keytool.`
    )
  }
  if (pairs.length !== SHA256_BYTES) {
    fail(`Una SHA-256 ha ${SHA256_BYTES} byte, questa ne ha ${pairs.length}.`)
  }

  return pairs.join(':')
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error(
    '\n  Uso: npm run assetlinks -- <fingerprint-sha256> [fingerprint-play-store]\n\n' +
      '  La fingerprint arriva da PWABuilder insieme al keystore (Fase 3 di\n' +
      '  docs/PWA_APK.md). Passane due se l\'app è anche sul Play Store.\n'
  )
  process.exit(1)
}

const fingerprints = args.map(normalize)
if (new Set(fingerprints).size !== fingerprints.length) {
  fail('Hai passato due volte la stessa fingerprint.')
}

const statements = JSON.parse(readFileSync(FILE, 'utf8'))
for (const statement of statements) {
  statement.target.sha256_cert_fingerprints = fingerprints
}
writeFileSync(FILE, `${JSON.stringify(statements, null, 2)}\n`)

const target = statements[0]?.target
console.log(`\n  ✓ ${path.relative(root, FILE)} aggiornato`)
console.log(`    package: ${target?.package_name}`)
for (const fingerprint of fingerprints) console.log(`    sha256:  ${fingerprint}`)
console.log(
  '\n  Adesso, in questo ordine:\n' +
    '    1. commit + deploy, perché la verifica legge il file dal sito live;\n' +
    '    2. controlla su https://developers.google.com/digital-asset-links/tools/generator\n' +
    '    3. solo dopo installa l\'APK. Se in cima compare la barra degli indirizzi\n' +
    '       di Chrome, la verifica non è passata: è quello il sintomo da cercare.\n'
)
