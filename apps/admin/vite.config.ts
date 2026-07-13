import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const adminSrc = fileURLToPath(new URL('./src', import.meta.url));
const webProduct = fileURLToPath(new URL('../web/src/product', import.meta.url));
const i18nReactSrc = fileURLToPath(new URL('../../packages/i18n/src/react.tsx', import.meta.url));
const i18nSrc = fileURLToPath(new URL('../../packages/i18n/src/index.ts', import.meta.url));

/** Phase R admin entry — TanStack Router + shared web design tokens/primitives. */
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    react(),
  ],
  envDir: '../..',
  publicDir: './public',
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      // Admin-only primitives (§29.6) — must resolve before shared web primitives alias.
      {
        find: '@/product/primitives/admin-table',
        replacement: `${adminSrc}/product/primitives/admin-table.tsx`,
      },
      { find: '@/product/primitives', replacement: `${webProduct}/primitives` },
      { find: '@/product/tokens', replacement: `${webProduct}/tokens` },
      {
        find: '@/product/layout/content-shell',
        replacement: `${webProduct}/layout/content-shell.tsx`,
      },
      { find: '@/product/i18n', replacement: `${adminSrc}/product/i18n` },
      { find: '@', replacement: adminSrc },
      { find: '@phonara/i18n/react', replacement: i18nReactSrc },
      { find: '@phonara/i18n', replacement: i18nSrc },
    ],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
      '@tanstack/react-router',
      '@tanstack/react-query',
      '@tanstack/react-table',
      '@supabase/supabase-js',
      'zod',
      'lucide-react',
    ],
    holdUntilCrawlEnd: false,
  },
  esbuild: { target: 'esnext' },
  server: {
    port: 3001,
    strictPort: true,
    host: '127.0.0.1',
    warmup: {
      clientFiles: [
        `${adminSrc.replace(/\\/g, '/')}/main.tsx`,
        `${adminSrc.replace(/\\/g, '/')}/router.ts`,
        `${adminSrc.replace(/\\/g, '/')}/routes/__root.tsx`,
        `${adminSrc.replace(/\\/g, '/')}/routes/index.tsx`,
        `${adminSrc.replace(/\\/g, '/')}/routes/login.tsx`,
      ],
    },
  },
  build: {
    sourcemap: false,
  },
});
