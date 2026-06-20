import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const webSrc = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'phonara-icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'PHONARA',
        short_name: 'PHONARA',
        description: 'PHON-powered crypto trading & rewards platform',
        theme_color: '#0b0b0f',
        background_color: '#0b0b0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'ko',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Trade',
            short_name: 'Trade',
            description: 'Spot and futures trading',
            url: '/trade',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Wallet',
            short_name: 'Wallet',
            description: 'Wallet and deposits',
            url: '/wallet',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Casino',
            short_name: 'Casino',
            description: 'Casino games',
            url: '/casino',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      injectManifest: {
        // App shell assets: cache-first, long TTL. The custom service worker
        // keeps the /offline.html navigateFallback and Supabase API denylist.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  // Env files live at the monorepo root (.env.local etc.), not in apps/web.
  // `envDir` is resolved relative to the project root (this directory), so '../..'
  // points at the repo root. Without this, vite loads no env and the app boots
  // with an undefined Supabase config. Kept as a relative string (no node: imports)
  // so the web typecheck project doesn't need @types/node.
  envDir: '../..',
  resolve: {
    alias: {
      '@/games': `${webSrc}/components/games`,
      '@': webSrc,
      'react-router-dom': `${webSrc}/shims/react-router-dom.tsx`,
    },
  },
  optimizeDeps: {
    include: [
      'framer-motion',
      'lucide-react',
      'vaul',
      'cmdk',
      'embla-carousel-react',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'input-otp',
      'react-day-picker',
      'canvas-confetti',
      'pixi.js',
      'pixi-filters',
      'matter-js',
      'comlink',
      'lightweight-charts',
      '@tanstack/react-virtual',
      '@tanstack/react-table',
      'html-to-image',
      'qrcode.react',
      'react-helmet-async',
      '@use-gesture/react',
    ],
  },
  server: {
    port: 3000,
  },
  build: {
    rolldownOptions: {
      output: {
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true,
          },
        },
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pixi.js')) return 'pixi-vendor';
          if (id.includes('node_modules/pixi-filters')) return 'pixi-filters-vendor';
          if (id.includes('node_modules/matter-js')) return 'matter-vendor';
          if (id.includes('node_modules/lightweight-charts')) return 'charts-vendor';
          if (id.includes('node_modules/@supabase')) return 'supabase-vendor';
          if (id.includes('node_modules/@tanstack')) return 'tanstack-vendor';
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/components/games/crash/')) return 'game-crash';
          if (id.includes('/components/games/plinko/')) return 'game-plinko';
          if (id.includes('/components/games/mines/')) return 'game-mines';
          if (id.includes('/components/games/dice/')) return 'game-dice';
          if (id.includes('/components/games/limbo/')) return 'game-limbo';
          if (id.includes('/components/games/hilo/')) return 'game-hilo';
          if (id.includes('/components/games/shared/')) return 'game-shared';
          if (id.includes('/packages/game-engine/') || id.includes('/features/casino/'))
            return 'casino-domain';
          if (id.includes('/packages/trading-engine/') || id.includes('/features/trading/'))
            return 'trading-domain';
          return undefined;
        },
      },
    },
  },
});
