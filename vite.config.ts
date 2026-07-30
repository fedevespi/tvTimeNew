import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Il service worker non gira in `vite dev`: per provarlo serve
      // `npm run build && npm run preview`.
      devOptions: { enabled: false },
      includeAssets: ['favicon.png', 'icon-180.png'],
      manifest: {
        name: 'tvBoss',
        short_name: 'tvBoss',
        description: 'Traccia film e serie TV che hai visto, che vuoi vedere e cosa c\'è in circolazione.',
        lang: 'it',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Icona dedicata: Android ritaglia nella forma del launcher e su questa
          // il badge è rimpicciolito su fondo pieno (vedi scripts/generate-icons.mjs).
          { src: 'pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        // App a pagina singola: ogni navigazione sconosciuta va servita da index.html.
        navigateFallback: '/index.html',
        // `.well-known` resta fuori: ci andrà assetlinks.json per la TWA (fase 2 di
        // docs/PWA_APK.md), che deve arrivare dalla rete e non dalla shell dell'app.
        navigateFallbackDenylist: [/^\/\.well-known\//],
        runtimeCaching: [
          {
            // I poster sono immutabili e pesanti: l'unica cosa che vale davvero
            // la pena mettere in cache a runtime.
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Regola difensiva, non un'ottimizzazione: Supabase non va mai in
            // cache. Un token o una lista serviti da una copia stantia sono un
            // bug di correttezza, e questa riga rende difficile che una regola
            // aggiunta in futuro se li mangi per sbaglio.
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
