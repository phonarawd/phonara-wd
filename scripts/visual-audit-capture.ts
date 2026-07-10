/**
 * Visual audit screenshot capture — Phase R Director pack.
 * Low-spec: one browser · workers 1 · public routes first · no Docker required.
 *
 * Usage:
 *   bun run tsx scripts/visual-audit-capture.ts
 *   PHONARA_AUDIT_BASE=http://127.0.0.1:3000 bun run tsx scripts/visual-audit-capture.ts
 *
 * Optional: start server yourself, or let this script spawn `bun run dev:web`.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';

const ROOT = process.cwd();
const OUT = join(ROOT, 'screenshots');
const BASE = process.env.PHONARA_AUDIT_BASE ?? 'http://127.0.0.1:3000';
const SPAWN_SERVER = process.env.PHONARA_AUDIT_NO_SPAWN !== '1';

type Viewport = {
  id: string;
  folder: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
};

/** Smoke 4 — SCREENSHOT_INDEX §2 */
const VIEWPORTS: Viewport[] = [
  { id: '390x844', folder: 'mobile', width: 390, height: 844 },
  { id: '768x1024', folder: 'tablet', width: 768, height: 1024 },
  { id: '1024x768', folder: 'tablet', width: 1024, height: 768 },
  { id: '1920x1080', folder: 'desktop', width: 1920, height: 1080 },
];

type RouteSpec = {
  pageId: string;
  path: string;
  /** Public = no auth. Auth routes may redirect to /login without session. */
  auth: 'public' | 'auth';
  themes?: Array<'light' | 'dark'>;
};

/** P0 + public legal/auth — 1차 smoke */
const ROUTES: RouteSpec[] = [
  { pageId: 'landing', path: '/', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'login', path: '/login', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'signup', path: '/signup', auth: 'public', themes: ['dark'] },
  { pageId: 'install', path: '/install', auth: 'public', themes: ['dark'] },
  { pageId: 'legal_terms', path: '/legal/terms', auth: 'public', themes: ['dark'] },
  { pageId: 'legal_privacy', path: '/legal/privacy', auth: 'public', themes: ['dark'] },
  { pageId: 'reset_password', path: '/reset-password', auth: 'public', themes: ['dark'] },
  // Auth-gated P0 — without session these document redirect-to-login (honest gap)
  { pageId: 'home', path: '/home', auth: 'auth', themes: ['dark'] },
  { pageId: 'trade_spot', path: '/trade', auth: 'auth', themes: ['dark'] },
  { pageId: 'trade_futures', path: '/trade/futures', auth: 'auth', themes: ['dark'] },
  { pageId: 'wallet', path: '/wallet', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino_lobby', path: '/casino', auth: 'auth', themes: ['dark'] },
  { pageId: 'game_crash', path: '/games/crash', auth: 'auth', themes: ['dark'] },
  { pageId: 'sports', path: '/sports', auth: 'auth', themes: ['dark'] },
];

type ManifestRow = {
  file: string;
  pageId: string;
  path: string;
  viewport: string;
  folder: string;
  theme: string;
  scroll: '01_top' | '02_mid' | '03_end';
  finalUrl: string;
  auth: string;
  redirectedToLogin: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok || res.status >= 200) return;
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`Server not ready: ${url}`);
}

async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
    try {
      localStorage.setItem('phonara-theme', t);
    } catch {
      // ignore
    }
  }, theme);
}

async function captureScrollTriple(
  page: Page,
  folder: string,
  baseName: string,
): Promise<Array<{ scroll: ManifestRow['scroll']; file: string }>> {
  const dir = join(OUT, folder);
  await mkdir(dir, { recursive: true });
  const out: Array<{ scroll: ManifestRow['scroll']; file: string }> = [];

  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(200);
  const f1 = `${baseName}_01.png`;
  await page.screenshot({ path: join(dir, f1), fullPage: false });
  out.push({ scroll: '01_top', file: join(folder, f1) });

  await page.evaluate(() => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, Math.floor(max / 2));
  });
  await sleep(200);
  const f2 = `${baseName}_02.png`;
  await page.screenshot({ path: join(dir, f2), fullPage: false });
  out.push({ scroll: '02_mid', file: join(folder, f2) });

  await page.evaluate(() => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, max);
  });
  await sleep(200);
  const f3 = `${baseName}_03.png`;
  await page.screenshot({ path: join(dir, f3), fullPage: false });
  out.push({ scroll: '03_end', file: join(folder, f3) });

  return out;
}

async function captureHoverSamples(page: Page): Promise<string[]> {
  const dir = join(OUT, 'hover');
  await mkdir(dir, { recursive: true });
  const files: string[] = [];

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await setTheme(page, 'dark');
  await sleep(500);

  const submit = page.locator('button[type="submit"]').first();
  if (await submit.count()) {
    await submit.hover();
    await sleep(200);
    const f = 'login_btn_hover_01.png';
    await page.screenshot({ path: join(dir, f), fullPage: false });
    files.push(join('hover', f));
  }

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await setTheme(page, 'dark');
  await sleep(800);
  const cta = page.locator('a[href*="signup"], a[href*="login"]').first();
  if (await cta.count()) {
    await cta.hover();
    await sleep(200);
    const f = 'landing_cta_hover_01.png';
    await page.screenshot({ path: join(dir, f), fullPage: false });
    files.push(join('hover', f));
  }

  return files;
}

async function main(): Promise<void> {
  let child: ChildProcess | null = null;
  const manifest: ManifestRow[] = [];
  const startedAt = new Date().toISOString();

  if (SPAWN_SERVER) {
    console.log('[visual-audit] spawning bun run dev:web …');
    child = spawn('bun', ['run', 'dev:web'], {
      cwd: ROOT,
      stdio: 'pipe',
      env: { ...process.env, BROWSER: 'none' },
      shell: true,
    });
    child.stdout?.on('data', (d: Buffer) => {
      const s = d.toString();
      if (s.includes('Local:') || s.includes('ready')) process.stdout.write(s);
    });
    child.stderr?.on('data', (d: Buffer) => process.stderr.write(d));
  }

  try {
    await waitForServer(BASE, 180_000);
    console.log('[visual-audit] server ready', BASE);

    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(45_000);

    for (const route of ROUTES) {
      for (const theme of route.themes ?? ['dark']) {
        for (const vp of VIEWPORTS) {
          // Auth routes: only capture mobile+desktop to save RAM/time
          if (route.auth === 'auth' && (vp.width === 768 || vp.width === 1024)) {
            continue;
          }

          console.log(`[capture] ${route.pageId} ${vp.id} ${theme}`);
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(`${BASE}${route.path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 60_000,
          });
          await sleep(600);
          await setTheme(page, theme);
          await sleep(300);

          const finalUrl = page.url();
          const redirectedToLogin = /\/login/.test(new URL(finalUrl).pathname);
          const baseName = `${route.pageId}_${vp.folder}_${theme}`;
          const shots = await captureScrollTriple(page, vp.folder, baseName);

          for (const shot of shots) {
            manifest.push({
              file: shot.file.replace(/\\/g, '/'),
              pageId: route.pageId,
              path: route.path,
              viewport: vp.id,
              folder: vp.folder,
              theme,
              scroll: shot.scroll,
              finalUrl,
              auth: route.auth,
              redirectedToLogin,
            });
          }
        }
      }
    }

    const hoverFiles = await captureHoverSamples(page);
    console.log('[visual-audit] hover samples', hoverFiles.length);

    await browser.close();

    const summary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      base: BASE,
      note: 'Auth-gated routes without local session redirect to /login. Docker/stack login pass needed for true home/trade/wallet/casino shots.',
      counts: {
        png: manifest.length + hoverFiles.length,
        routes: ROUTES.length,
        viewports: VIEWPORTS.length,
        hover: hoverFiles.length,
        authRedirects: manifest.filter((m) => m.redirectedToLogin).length,
      },
      hoverFiles,
      manifest,
    };

    await mkdir(join(ROOT, 'docs/audit/visual-ux-2026-07-11'), { recursive: true });
    await writeFile(
      join(ROOT, 'docs/audit/visual-ux-2026-07-11/capture-manifest.json'),
      JSON.stringify(summary, null, 2),
      'utf8',
    );
    console.log('[visual-audit] done', summary.counts);
  } finally {
    if (child && !child.killed) {
      child.kill('SIGTERM');
      await sleep(1500);
      if (!child.killed) child.kill('SIGKILL');
    }
  }
}

main().catch((err) => {
  console.error('[visual-audit] FAIL', err);
  process.exit(1);
});
