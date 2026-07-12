import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const publicAssets = [
  'apps/web/public/brand/logo.svg',
  'apps/web/public/brand/logo-flat.svg',
  'apps/web/public/brand/logo-mono.svg',
  'apps/web/public/brand/splash-mark.svg',
  'apps/web/public/brand/favicon.svg',
  'apps/web/public/favicon.ico',
  'apps/web/public/favicon.svg',
  'apps/web/public/apple-touch-icon-180x180.png',
  'apps/web/public/pwa-64x64.png',
  'apps/web/public/pwa-192x192.png',
  'apps/web/public/pwa-512x512.png',
  'apps/web/public/maskable-icon-512x512.png',
  'apps/web/public/monochrome-512.png',
  'apps/web/public/og-card.png',
  'apps/web/public/screenshots/home-narrow.png',
  'apps/web/public/screenshots/wallet-narrow.png',
  'apps/web/public/screenshots/trade-wide.png',
  'apps/web/public/apple-splash-portrait-1170x2532.png',
  'apps/web/public/apple-splash-portrait-1320x2868.png',
  'apps/web/public/offline.html',
];

for (const asset of publicAssets) {
  assert(existsSync(join(root, asset)), `missing PWA asset: ${asset}`);
}

const logoSvg = read('apps/web/public/brand/logo.svg');
assert(logoSvg.includes('viewBox="0 0 512 512"'), 'brand/logo.svg must use 512 viewBox');
assert(logoSvg.includes('linearGradient'), 'brand/logo.svg must embed branded gradient surfaces');
assert(logoSvg.includes('feDropShadow'), 'brand/logo.svg must include premium depth treatment');

const logoMonoSvg = read('apps/web/public/brand/logo-mono.svg');
assert(logoMonoSvg.includes('viewBox="0 0 512 512"'), 'brand/logo-mono.svg must use 512 viewBox');
assert(!logoMonoSvg.includes('linearGradient'), 'brand/logo-mono.svg must be flat (no gradients)');

const splashMarkSvg = read('apps/web/public/brand/splash-mark.svg');
assert(
  splashMarkSvg.includes('viewBox="0 0 512 512"'),
  'brand/splash-mark.svg must use 512 viewBox',
);
assert(
  splashMarkSvg.includes('#7B6FE8'),
  'brand/splash-mark.svg must include core purple for dark-bg contrast',
);
const logoFlatSvg = read('apps/web/public/brand/logo-flat.svg');
assert(logoFlatSvg.includes('fill="currentColor"'), 'brand/logo-flat.svg must use currentColor');
assert(logoFlatSvg.includes('viewBox="0 0 512 512"'), 'brand/logo-flat.svg must use 512 viewBox');
assert(!logoFlatSvg.includes('linearGradient'), 'brand/logo-flat.svg must be flat (no gradients)');
assert(
  !logoFlatSvg.includes('feDropShadow'),
  'brand/logo-flat.svg must be flat (no depth filters)',
);

const pwaAssetsConfig = read('apps/web/pwa-assets.config.ts');
assert(
  pwaAssetsConfig.includes("'public/brand/splash-mark.svg'"),
  'pwa-assets.config.ts must derive PWA icons from splash-mark.svg (explicit accent for dark bg)',
);
assert(
  !pwaAssetsConfig.includes("'public/brand/logo.svg'"),
  'pwa-assets.config.ts must not use 3D logo.svg for PWA icon generation',
);
const maskablePaddingMatch = pwaAssetsConfig.match(/maskable:\s*\{[\s\S]*?padding:\s*([\d.]+)/);
assert(maskablePaddingMatch, 'pwa-assets.config.ts must declare maskable padding');
const maskablePadding = Number(maskablePaddingMatch[1]);
assert(
  maskablePadding >= 0.16,
  `maskable padding must be >= 0.16 for safe zone (got ${maskablePadding})`,
);

const faviconSvg = read('apps/web/public/favicon.svg');
assert(
  faviconSvg.includes('prefers-color-scheme'),
  'favicon.svg must embed prefers-color-scheme styles',
);
assert(faviconSvg.includes('#7B6FE8'), 'favicon.svg must use v8 core purple (#7B6FE8)');
assert(!faviconSvg.includes('#5B4FCF'), 'favicon.svg must not use legacy v7 purple (#5B4FCF)');
assert(!faviconSvg.includes('linearGradient'), 'favicon.svg must be flat-derived (no gradients)');
assert(!faviconSvg.includes('feDropShadow'), 'favicon.svg must be flat-derived (no depth filters)');

const indexHtml = read('apps/web/index.html');
assert(indexHtml.includes('viewport-fit=cover'), 'index.html must preserve viewport-fit=cover');
assert(indexHtml.includes('mobile-web-app-capable'), 'index.html missing mobile install metadata');
assert(indexHtml.includes('apple-touch-icon'), 'index.html missing Apple touch icon');
assert(indexHtml.includes('rel="manifest"'), 'index.html missing manifest link');
assert(indexHtml.includes('sizes="48x48"'), 'index.html favicon.ico must use 48x48 (minimal-2023)');
assert(indexHtml.includes('/favicon.svg'), 'index.html must link favicon.svg');
assert(indexHtml.includes('/og-card.png'), 'index.html must reference og-card.png');
assert(
  indexHtml.includes('apple-touch-startup-image'),
  'index.html must include apple splash links',
);

const offlineHtml = read('apps/web/public/offline.html');
assert(offlineHtml.includes('viewport-fit=cover'), 'offline.html must be safe-area aware');
assert(offlineHtml.includes('phonara.locale'), 'offline.html must resolve the stored app locale');
assert(
  !offlineHtml.includes('#6366f1'),
  'offline.html must use Midnight Vault trust tokens, not legacy indigo',
);
assert(
  !/\s(?:src|href)=["']https?:\/\//.test(offlineHtml),
  'offline.html must not depend on remote assets',
);

const viteConfig = read('apps/web/vite.config.ts');
assert(
  viteConfig.includes("strategies: 'injectManifest'"),
  'PWA must use injectManifest for the custom service worker',
);
assert(viteConfig.includes("filename: 'sw.ts'"), 'PWA must build the custom service worker');
assert(viteConfig.includes('shortcuts:'), 'PWA manifest must declare app shortcuts');
assert(viteConfig.includes("name: 'PHONARA'"), 'PWA manifest name must be PHONARA');
assert(
  viteConfig.includes("start_url: '/home?source=pwa'"),
  'PWA manifest start_url must be /home?source=pwa',
);
assert(viteConfig.includes('launch_handler:'), 'PWA manifest must declare launch_handler');
assert(viteConfig.includes('screenshots:'), 'PWA manifest must declare screenshots');
assert(viteConfig.includes("purpose: 'monochrome'"), 'PWA manifest must include monochrome icon');

const rootRoute = read('apps/web/src/routes/__root.tsx');
assert(
  rootRoute.includes('PwaShell'),
  'root route must mount PwaShell for SW registration and install UX',
);
assert(rootRoute.includes('SkipLink'), 'root route must mount SkipLink for keyboard navigation');

assert(
  viteConfig.includes("registerType: 'prompt'"),
  'PWA must use prompt registerType for user-confirmed SW updates',
);

const pwaShell = read('apps/web/src/product/shell/pwa-shell.tsx');
assert(
  pwaShell.includes("from 'virtual:pwa-register'") && pwaShell.includes('registerSW('),
  'PwaShell must register the service worker through vite-plugin-pwa virtual:pwa-register',
);
assert(
  pwaShell.includes('notifyPwaSwUpdateReady'),
  'PwaShell must wire SW update UX via notifyPwaSwUpdateReady (productToast strict toast.pwa.updateAvailable)',
);
assert(
  pwaShell.includes('InstallPromptProvider'),
  'PwaShell must provide InstallPromptProvider for /install and deferred prompt UX',
);
assert(
  pwaShell.includes('children'),
  'PwaShell must accept children so InstallPromptProvider wraps the route outlet',
);

const serviceWorker = read('apps/web/src/sw.ts');
assert(
  serviceWorker.includes("const OFFLINE_URL = '/offline.html'"),
  'service worker must preserve offline.html fallback',
);
assert(
  serviceWorker.includes("event.data?.type === 'SKIP_WAITING'"),
  'service worker must wait for user-confirmed skipWaiting',
);
assert(
  serviceWorker.includes('isSupabaseApi'),
  'service worker must denylist Supabase API paths from navigation fallback',
);
assert(
  serviceWorker.includes("addEventListener('push'"),
  'service worker must scaffold push handling',
);
assert(
  serviceWorker.includes("addEventListener('notificationclick'"),
  'service worker must handle notification clicks',
);

const manifestPath = join(root, 'apps/web/dist/manifest.webmanifest');
assert(
  existsSync(manifestPath),
  'apps/web/dist/manifest.webmanifest missing; run bun run build first',
);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  id?: string;
  name?: string;
  short_name?: string;
  display?: string;
  display_override?: string[];
  start_url?: string;
  theme_color?: string;
  background_color?: string;
  launch_handler?: { client_mode?: string };
  icons?: Array<{ src?: string; sizes?: string; purpose?: string }>;
  shortcuts?: Array<{ name?: string; url?: string }>;
  screenshots?: Array<{ src?: string; form_factor?: string }>;
};

assert(manifest.id === '/', 'manifest id must be /');
assert(manifest.name === 'PHONARA', 'manifest name must be PHONARA');
assert(manifest.short_name === 'PHONARA', 'manifest short_name must be PHONARA');
assert(manifest.display === 'standalone', 'manifest display must be standalone');
assert(
  Array.isArray(manifest.display_override) && manifest.display_override.includes('standalone'),
  'manifest display_override must include standalone',
);
assert(manifest.start_url === '/home?source=pwa', 'manifest start_url must be /home?source=pwa');
assert(manifest.theme_color === '#0d0f14', 'manifest theme_color must match --ds-bg (#0d0f14)');
assert(
  manifest.background_color === '#0d0f14',
  'manifest background_color must match --ds-bg (#0d0f14)',
);
assert(
  manifest.launch_handler?.client_mode === 'navigate-existing',
  'manifest launch_handler.client_mode must be navigate-existing',
);
assert(
  manifest.icons?.some((icon) => icon.sizes === '192x192'),
  'manifest missing 192x192 icon',
);
assert(
  manifest.icons?.some((icon) => icon.sizes === '512x512'),
  'manifest missing 512x512 icon',
);
assert(
  manifest.icons?.some((icon) => icon.purpose === 'maskable'),
  'manifest missing maskable icon',
);
assert(
  manifest.icons?.some((icon) => icon.purpose === 'monochrome'),
  'manifest missing monochrome icon',
);
assert(
  Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 4,
  'manifest must include four shortcuts',
);
assert(
  manifest.shortcuts?.some((shortcut) => shortcut.url === '/home?source=shortcut'),
  'manifest missing /home shortcut',
);
assert(
  manifest.shortcuts?.some((shortcut) => shortcut.url === '/wallet?source=shortcut'),
  'manifest missing /wallet shortcut',
);
assert(
  manifest.shortcuts?.some((shortcut) => shortcut.url === '/trade?source=shortcut'),
  'manifest missing /trade shortcut',
);
assert(
  manifest.shortcuts?.some((shortcut) => shortcut.url === '/casino?source=shortcut'),
  'manifest missing /casino shortcut',
);
assert(
  Array.isArray(manifest.screenshots) && manifest.screenshots.length >= 3,
  'manifest must include screenshots',
);
assert(
  manifest.screenshots?.filter((shot) => shot.form_factor === 'narrow').length >= 2,
  'manifest must include at least two narrow screenshots',
);
assert(
  manifest.screenshots?.some((shot) => shot.form_factor === 'wide'),
  'manifest must include a wide screenshot',
);

for (const builtAsset of ['apps/web/dist/sw.js', 'apps/web/dist/offline.html']) {
  assert(existsSync(join(root, builtAsset)), `missing built PWA asset: ${builtAsset}`);
}

const chromeScanDirs = [
  'apps/web/src/product/surfaces',
  'apps/web/src/product/layout',
  'apps/admin/src/product',
];
const chromeScanExts = ['.tsx', '.ts'];

function collectChromeFiles(dir: string): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  let files: string[] = [];
  for (const entry of readdirSync(abs)) {
    const path = join(abs, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry === '__tests__') continue;
      files = files.concat(collectChromeFiles(join(dir, entry)));
      continue;
    }
    if (chromeScanExts.some((ext) => entry.endsWith(ext))) {
      files.push(path);
    }
  }
  return files;
}

for (const dir of chromeScanDirs) {
  for (const file of collectChromeFiles(dir)) {
    const content = readFileSync(file, 'utf8');
    assert(
      !content.includes('/brand/logo.svg'),
      `${relative(root, file)} must not reference 3D /brand/logo.svg in chrome`,
    );
  }
}

process.stdout.write(
  'check:pwa OK - manifest, offline fallback, safe-area, and service worker assets verified\n',
);
