/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable app + offline support. The service worker precaches the whole app (including
    // the word list), so it works with no signal once installed.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'WordWise: British English vocabulary',
        short_name: 'WordWise',
        description:
          'A richer, more precise everyday vocabulary in British English, a few minutes a day.',
        lang: 'en-GB',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#FAF7F2',
        theme_color: '#FAF7F2',
        categories: ['education', 'books'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: "Today's words", short_name: 'Learn', url: '/learn' },
          { name: 'Review', short_name: 'Review', url: '/review' },
          { name: 'Mixed practice', short_name: 'Practice', url: '/practice/mixed' },
          { name: 'Browse words', short_name: 'Browse', url: '/browse' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
