import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import {
  PHONARA_VITE_ESBUILD,
  PHONARA_VITE_OPTIMIZE_DEPS,
  phonaraViteDevWarmup,
} from './vite-dev-performance';
import { pwaManifestCopy } from './pwa-manifest';

const webSrc = fileURLToPath(new URL('./src', import.meta.url));
const pwaRegisterDevStub = fileURLToPath(
  new URL('./src/lib/pwa-register-dev-stub.ts', import.meta.url),
);
const i18nReactSrc = fileURLToPath(new URL('../../packages/i18n/src/react.tsx', import.meta.url));
const i18nSrc = fileURLToPath(new URL('../../packages/i18n/src/index.ts', import.meta.url));
const headersFile = fileURLToPath(new URL('./public/_headers', import.meta.url));

/**
 * Mirror Pages `_headers` CSP on Vite dev/preview so ZA-21 chart feed
 * allowlist can be verified locally (Cloudflare `_headers` is not applied by Vite).
 */
function readPagesCspHeader(): string | undefined {
  try {
    const source = readFileSync(headersFile, 'utf8');
    const match = source.match(/^ {2}Content-Security-Policy:\s*(.+)$/m);
    return match?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const pagesCsp = readPagesCspHeader();

const LOCAL_SUPABASE_CONNECT =
  'http://127.0.0.1:54321 ws://127.0.0.1:54321 http://localhost:54321 ws://localhost:54321';

/** E2E + local stack: Pages CSP omits localhost Supabase — append for Vite dev/preview only. */
function augmentCspForLocalDev(csp: string): string {
  if (csp.includes('127.0.0.1:54321')) return csp;
  return csp.replace(/connect-src ([^;]+)/, `connect-src $1 ${LOCAL_SUPABASE_CONNECT}`);
}

function resolveViteSecurityHeaders(
  command: 'build' | 'serve',
): Record<string, string> | undefined {
  if (!pagesCsp) return undefined;
  const csp = command === 'serve' ? augmentCspForLocalDev(pagesCsp) : pagesCsp;
  return { 'Content-Security-Policy': csp };
}

/** Phase R web entry — TanStack Router file routes + PWA injectManifest shell. */
export default defineConfig(({ command }) => {
  const securityHeaders = resolveViteSecurityHeaders(command);
  const pwaPlugin: PluginOption = VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    registerType: 'prompt',
    includeAssets: [
      'offline.html',
      'favicon.ico',
      'favicon.svg',
      'brand/logo.svg',
      'apple-touch-icon-180x180.png',
      'og-card.png',
      'monochrome-512.png',
      'screenshots/home-narrow.png',
      'screenshots/wallet-narrow.png',
      'screenshots/trade-wide.png',
    ],
    manifest: {
      id: '/',
      name: 'PHONARA',
      short_name: 'PHONARA',
      description: pwaManifestCopy.description,
      lang: 'ko',
      dir: 'ltr',
      start_url: '/home?source=pwa',
      scope: '/',
      display: 'standalone',
      display_override: ['standalone', 'minimal-ui'],
      orientation: 'portrait',
      theme_color: '#0d0f14',
      background_color: '#0d0f14',
      categories: ['finance', 'entertainment'],
      prefer_related_applications: false,
      launch_handler: {
        client_mode: 'navigate-existing',
      },
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: 'monochrome-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'monochrome',
        },
      ],
      shortcuts: [...pwaManifestCopy.shortcuts],
      screenshots: [
        {
          src: 'screenshots/home-narrow.png',
          sizes: '1170x2532',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Earn · Home',
        },
        {
          src: 'screenshots/wallet-narrow.png',
          sizes: '1170x2532',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Wallet',
        },
        {
          src: 'screenshots/trade-wide.png',
          sizes: '1920x1080',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Trade · Desktop',
        },
      ],
    },
    injectManifest: {
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
    },
    devOptions: {
      enabled: false,
    },
  });

  return {
    plugins: [
      TanStackRouterVite({
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.ts',
        autoCodeSplitting: true,
      }),
      tailwindcss(),
      react(),
      // PWA manifest/service-worker graph is build-only — skipping it saves dev cold start.
      ...(command === 'build' ? [pwaPlugin] : []),
    ],
    envDir: '../..',
    resolve: {
      alias: {
        '@': webSrc,
        '@phonara/i18n/react': i18nReactSrc,
        '@phonara/i18n': i18nSrc,
        // PWA plugin is build-only; dev resolves the same import to a no-op stub.
        ...(command === 'build' ? {} : { 'virtual:pwa-register': pwaRegisterDevStub }),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: PHONARA_VITE_OPTIMIZE_DEPS,
    esbuild: PHONARA_VITE_ESBUILD,
    server: {
      host: '127.0.0.1',
      port: 3000,
      strictPort: true,
      warmup: phonaraViteDevWarmup(webSrc),
      ...(securityHeaders ? { headers: securityHeaders } : {}),
    },
    preview: {
      host: '127.0.0.1',
      port: 3000,
      strictPort: true,
      ...(securityHeaders ? { headers: securityHeaders } : {}),
    },
    build: {
      sourcemap: false,
    },
  };
});
