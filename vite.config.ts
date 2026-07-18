import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered manually in main.tsx (virtual:pwa-register) so we can
      // show our own "update available" toast instead of the plugin's default.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon-180.png'],
      manifest: {
        name: 'Bancada — Gestão para Assistência Técnica',
        short_name: 'Bancada',
        description:
          'Sistema de gestão para assistências técnicas de celular: OS, estoque, financeiro e equipe, sincronizados em tempo real.',
        lang: 'pt-BR',
        start_url: '/app/dashboard',
        scope: '/',
        display: 'standalone',
        background_color: '#f7f9fc',
        theme_color: '#2f6fed',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell + static assets precached; navigations fall back to the
        // cached shell offline. Only GETs to the future Supabase REST API
        // are cached at runtime — this is read-only offline support for
        // recently viewed data, not offline writes.
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.hostname.endsWith('supabase.co'),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'supabase-data',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
