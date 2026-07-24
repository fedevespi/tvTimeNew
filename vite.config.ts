import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // PWA - abilitare con Node >= 20
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    //   manifest: {
    //     name: 'tvTime',
    //     short_name: 'tvTime',
    //     description: 'Traccia film e serie TV che hai visto, che vuoi vedere e cosa c\'è in circolazione.',
    //     theme_color: '#0f172a',
    //     background_color: '#0f172a',
    //     display: 'standalone',
    //     icons: [
    //       { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    //       { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
    //     ]
    //   }
    // })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
