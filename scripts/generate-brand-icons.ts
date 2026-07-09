/**
 * Phase R §25.9 brand asset pipeline — splash-mark.svg → PWA · logo.svg (3D) → OG card.
 *
 * Usage: bun run generate:brand
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const WEB_ROOT = join(process.cwd(), 'apps/web');
const WEB_PUBLIC = join(WEB_ROOT, 'public');
const BRAND_DIR = join(WEB_PUBLIC, 'brand');
const LOGO_SVG = join(BRAND_DIR, 'logo.svg');
const LOGO_MONO_SVG = join(BRAND_DIR, 'logo-mono.svg');
const DS_BG = '#0d0f14';
const CORE_PURPLE = '#7B6FE8';
const BRAND_OG_TITLE = 'PHONARA';
const BRAND_WORDMARK = 'phonara';

/** Generated next to logo.svg — copied to public root for manifest/vite paths */
const PUBLIC_ROOT_ASSETS = [
  'favicon.ico',
  'favicon.svg',
  'pwa-64x64.png',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'maskable-icon-512x512.png',
  'apple-touch-icon-180x180.png',
] as const;

function runAssetsGenerator(): void {
  const result = spawnSync(
    'bunx',
    ['@vite-pwa/assets-generator', '--config', 'pwa-assets.config.ts'],
    { cwd: WEB_ROOT, stdio: 'inherit' },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyBrandOutputsToPublicRoot(): void {
  for (const file of PUBLIC_ROOT_ASSETS) {
    const fromBrand = join(BRAND_DIR, file);
    const fromPublic = join(WEB_PUBLIC, file);
    const source = existsSync(fromBrand) ? fromBrand : fromPublic;
    if (!existsSync(source)) {
      console.error(`Missing generated asset: ${file}`);
      process.exit(1);
    }
    if (source !== join(WEB_PUBLIC, file)) {
      copyFileSync(source, join(WEB_PUBLIC, file));
      console.log(`copied ${file} → public/`);
    }
  }

  // Prefer hand-authored favicon with prefers-color-scheme over generator default
  copyFileSync(join(BRAND_DIR, 'favicon.svg'), join(WEB_PUBLIC, 'favicon.svg'));
  console.log('copied favicon.svg (prefers-color-scheme) → public/');

  const adminPublic = join(process.cwd(), 'apps/admin/public');
  copyFileSync(join(BRAND_DIR, 'favicon.svg'), join(adminPublic, 'favicon.svg'));
  copyFileSync(join(WEB_PUBLIC, 'favicon.ico'), join(adminPublic, 'favicon.ico'));
  console.log('copied favicon.svg + favicon.ico → apps/admin/public/');
}

function copyAppleSplashesToPublicRoot(): void {
  const splashFiles = readdirSync(BRAND_DIR).filter((name) => name.startsWith('apple-splash-'));
  for (const file of splashFiles) {
    copyFileSync(join(BRAND_DIR, file), join(WEB_PUBLIC, file));
    console.log(`copied ${file} → public/`);
  }
}

async function generateMonochrome512(): Promise<void> {
  const svg = readFileSync(existsSync(LOGO_MONO_SVG) ? LOGO_MONO_SVG : LOGO_SVG);
  const outPath = join(WEB_PUBLIC, 'monochrome-512.png');
  await sharp(svg, { density: 300 })
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outPath);
  console.log('wrote monochrome-512.png');
}

async function generateOgCard(): Promise<void> {
  const width = 1200;
  const height = 630;
  const logoSize = 228;

  const logoBuffer = await sharp(readFileSync(LOGO_SVG), { density: 300 })
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const backgroundSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#07110d"/>
          <stop offset="0.56" stop-color="${DS_BG}"/>
          <stop offset="1" stop-color="#071912"/>
        </linearGradient>
        <radialGradient id="halo" cx="26%" cy="48%" r="42%">
          <stop offset="0" stop-color="${CORE_PURPLE}" stop-opacity="0.38"/>
          <stop offset="0.42" stop-color="${CORE_PURPLE}" stop-opacity="0.14"/>
          <stop offset="1" stop-color="${CORE_PURPLE}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
          <stop offset="0.38" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="36" fill="url(#bg)"/>
      <circle cx="286" cy="316" r="236" fill="url(#halo)"/>
      <path d="M0 520C162 420 330 372 542 358c194-14 358-2 658 86V630H0z" fill="#091b14" fill-opacity="0.52"/>
      <path d="M0 0H910L722 630H0z" fill="url(#sheen)"/>
      <path d="M624 188H1078" stroke="${CORE_PURPLE}" stroke-opacity="0.28" stroke-width="2"/>
    </svg>
  `);
  const backgroundBuffer = await sharp(backgroundSvg).png().toBuffer();

  const wordmarkSvg = Buffer.from(`
    <svg width="640" height="112" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="word" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#F0F2F5"/>
          <stop offset="0.35" stop-color="#D4CCFF"/>
          <stop offset="0.65" stop-color="#A99EF2"/>
          <stop offset="1" stop-color="#7B6FE8"/>
        </linearGradient>
      </defs>
      <text x="0" y="72" font-family="Pretendard, system-ui, -apple-system, Segoe UI, sans-serif"
        font-size="70" font-weight="600" letter-spacing="8.4" fill="url(#word)">${BRAND_OG_TITLE}</text>
      <text x="2" y="102" font-family="Pretendard, system-ui, -apple-system, Segoe UI, sans-serif"
        font-size="17" font-weight="500" letter-spacing="5.1" fill="#D4CCFF" fill-opacity="0.78">EARN · TRADE · SPORTS · CASINO</text>
    </svg>
  `);

  const wordmarkBuffer = await sharp(wordmarkSvg).png().toBuffer();

  await sharp(backgroundBuffer)
    .composite([
      { input: logoBuffer, top: Math.round((height - logoSize) / 2) - 52, left: 112 },
      { input: wordmarkBuffer, top: Math.round((height - 112) / 2) - 42, left: 360 },
    ])
    .png()
    .toFile(join(WEB_PUBLIC, 'og-card.png'));

  console.log('wrote og-card.png');
}

type ScreenshotSpec = {
  file: string;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  layout: 'narrow' | 'wide';
};

function buildScreenshotSvg(spec: ScreenshotSpec): Buffer {
  const { width, height, title, subtitle, layout } = spec;
  const isWide = layout === 'wide';
  const navY = isWide ? 72 : 108;
  const cardW = isWide ? 420 : width - 80;
  const cardH = isWide ? 220 : 168;
  const cardX = isWide ? 64 : 40;
  const cardY = isWide ? navY + 48 : navY + 56;

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#10141c"/>
          <stop offset="1" stop-color="${DS_BG}"/>
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#A99EF2"/>
          <stop offset="1" stop-color="${CORE_PURPLE}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect x="0" y="0" width="${width}" height="${navY}" fill="#0a0c11" fill-opacity="0.92"/>
      <circle cx="${isWide ? 52 : 44}" cy="${navY / 2}" r="18" fill="url(#accent)" fill-opacity="0.9"/>
      <text x="${isWide ? 84 : 76}" y="${navY / 2 + 8}" font-family="Pretendard, system-ui, sans-serif"
        font-size="${isWide ? 26 : 22}" font-weight="500" letter-spacing="1.1" fill="#F0F2F5">${BRAND_WORDMARK}</text>
      <text x="${isWide ? width - 64 : width - 48}" y="${navY / 2 + 8}" text-anchor="end"
        font-family="system-ui, sans-serif" font-size="20" fill="${CORE_PURPLE}" fill-opacity="0.95">${title}</text>
      <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="24" fill="#151922" stroke="#243042" stroke-width="2"/>
      <rect x="${cardX + 24}" y="${cardY + 28}" width="${isWide ? 180 : 140}" height="16" rx="8" fill="#2a3340"/>
      <rect x="${cardX + 24}" y="${cardY + 60}" width="${cardW - 48}" height="12" rx="6" fill="#222a35"/>
      <rect x="${cardX + 24}" y="${cardY + 84}" width="${cardW - 120}" height="12" rx="6" fill="#222a35"/>
      <rect x="${cardX + 24}" y="${cardY + cardH - 52}" width="${isWide ? 200 : 160}" height="36" rx="18" fill="url(#accent)" fill-opacity="0.92"/>
      <text x="${cardX + 24}" y="${cardY + cardH - 28}" font-family="system-ui, sans-serif"
        font-size="18" font-weight="600" fill="#0d1a14">${subtitle}</text>
      ${
        isWide
          ? `<rect x="${cardX + cardW + 32}" y="${cardY}" width="${width - cardX - cardW - 96}" height="${height - cardY - 64}" rx="24" fill="#12161f" stroke="#243042" stroke-width="2"/>
             <rect x="${cardX + cardW + 56}" y="${cardY + 36}" width="${width - cardX - cardW - 144}" height="14" rx="7" fill="#2a3340"/>
             <rect x="${cardX + cardW + 56}" y="${cardY + 72}" width="${width - cardX - cardW - 200}" height="10" rx="5" fill="#222a35"/>`
          : `<rect x="40" y="${cardY + cardH + 28}" width="${width - 80}" height="120" rx="20" fill="#12161f" stroke="#243042" stroke-width="2"/>
             <rect x="64" y="${cardY + cardH + 56}" width="${width - 160}" height="12" rx="6" fill="#2a3340"/>
             <rect x="64" y="${cardY + cardH + 84}" width="${width - 220}" height="10" rx="5" fill="#222a35"/>`
      }
      <rect x="0" y="${height - (isWide ? 0 : 88)}" width="${width}" height="${isWide ? 0 : 88}" fill="#0a0c11"/>
      ${
        isWide
          ? ''
          : `<circle cx="${width * 0.2}" cy="${height - 44}" r="6" fill="${CORE_PURPLE}"/>
             <circle cx="${width * 0.4}" cy="${height - 44}" r="6" fill="#3a4454"/>
             <circle cx="${width * 0.6}" cy="${height - 44}" r="6" fill="#3a4454"/>
             <circle cx="${width * 0.8}" cy="${height - 44}" r="6" fill="#3a4454"/>`
      }
    </svg>
  `);
}

async function generateManifestScreenshots(): Promise<void> {
  const screenshotsDir = join(WEB_PUBLIC, 'screenshots');
  mkdirSync(screenshotsDir, { recursive: true });

  const specs: ScreenshotSpec[] = [
    {
      file: 'home-narrow.png',
      width: 1170,
      height: 2532,
      title: 'Home',
      subtitle: 'Start earning',
      layout: 'narrow',
    },
    {
      file: 'wallet-narrow.png',
      width: 1170,
      height: 2532,
      title: 'Wallet',
      subtitle: 'View balance',
      layout: 'narrow',
    },
    {
      file: 'trade-wide.png',
      width: 1920,
      height: 1080,
      title: 'Trade',
      subtitle: 'Open position',
      layout: 'wide',
    },
  ];

  for (const spec of specs) {
    const svg = buildScreenshotSvg(spec);
    await sharp(svg).png().toFile(join(screenshotsDir, spec.file));
    console.log(`wrote screenshots/${spec.file}`);
  }
}

async function main(): Promise<void> {
  if (!existsSync(LOGO_SVG)) {
    console.error(`Missing master SVG: ${LOGO_SVG}`);
    process.exit(1);
  }

  mkdirSync(BRAND_DIR, { recursive: true });

  runAssetsGenerator();
  copyBrandOutputsToPublicRoot();
  copyAppleSplashesToPublicRoot();
  await generateMonochrome512();
  await generateOgCard();
  await generateManifestScreenshots();

  console.log('generate:brand complete');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
