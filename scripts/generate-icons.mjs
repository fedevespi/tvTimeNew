/**
 * Genera tutte le icone di `public/` dalla sorgente `icon-source.png`.
 * Uso: npm run icons
 *
 * La sorgente è un badge quadrato arrotondato con angoli trasparenti e fondo
 * `#212832`. Due accortezze, entrambe con conseguenze visibili:
 *
 * 1. La sorgente **non è quadrata** (754×751): va prima messa su tela quadrata,
 *    altrimenti `resize` la stira e il logo esce deformato.
 * 2. L'icona `maskable` non può essere l'icona normale. Android ritaglia l'icona
 *    nella forma del launcher (cerchio, goccia, squircle), quindi il badge va
 *    rimpicciolito dentro la tela su un fondo pieno dello stesso colore: così il
 *    ritaglio mangia solo il fondo e il contorno del badge non si vede.
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = path.join(root, 'icon-source.png')
const OUT_DIR = path.join(root, 'public')

/** Fondo del badge nella sorgente: usato come tinta piatta per la maskable. */
const BADGE_BG = '#212832'

/**
 * Quanto del lato occupa il badge dentro l'icona maskable. La "safe zone" di
 * Android è il cerchio di diametro 80%: a 0.625 l'artwork arancione resta
 * comodamente dentro, e gli unici pixel che il ritaglio può togliere sono angoli
 * di fondo, indistinguibili dalla tela.
 */
const MASKABLE_SCALE = 0.625

/** Porta la sorgente su tela quadrata centrata, senza deformarla. */
async function squareSource() {
  const src = sharp(SOURCE)
  const { width, height } = await src.metadata()
  const side = Math.max(width, height)
  return src
    .extend({
      top: Math.floor((side - height) / 2),
      bottom: Math.ceil((side - height) / 2),
      left: Math.floor((side - width) / 2),
      right: Math.ceil((side - width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

async function writeResized(square, size, filename) {
  await sharp(square)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, filename))
  console.log(`  ${filename.padEnd(28)} ${size}×${size}`)
}

async function writeMaskable(square, size, filename) {
  const inner = Math.round(size * MASKABLE_SCALE)
  const badge = await sharp(square).resize(inner, inner).png().toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: BADGE_BG },
  })
    .composite([{ input: badge, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT_DIR, filename))
  console.log(`  ${filename.padEnd(28)} ${size}×${size}  (badge ${inner}px su ${BADGE_BG})`)
}

const square = await squareSource()
console.log('Icone generate in public/:')

await writeResized(square, 32, 'favicon.png')
await writeResized(square, 180, 'icon-180.png')
await writeResized(square, 192, 'pwa-192x192.png')
await writeResized(square, 512, 'pwa-512x512.png')
await writeMaskable(square, 512, 'pwa-512x512-maskable.png')
