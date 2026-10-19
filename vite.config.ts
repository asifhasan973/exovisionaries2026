import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon.png',
        'apple-touch-icon.png',
        'icons.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
        'pwa-192x192.svg',
        'pwa-512x512.svg'
      ],
      manifest: {
        name: 'Zero To Beyond · NASA Space Mission Game',
        short_name: 'Zero To Beyond',
        description: 'Build your dream Moon rocket, pick your brave astronaut crew, and blast off into Earth orbit in this 3D space adventure!',
        theme_color: '#100b26',
        background_color: '#030712',
        display: 'standalone',
        orientation: 'landscape',
        scope: '/',
        start_url: '/',
        categories: ['games', 'education'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB to accommodate high-res space imagery and character dossiers

        // Visuals and code caching, excluding heavy voice/audio files to preserve bandwidth
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,json}']
      }
    })
  ],
})

