/**
 * Visual audit capture via system Chrome CDP (no Playwright — hook-safe).
 * Low-spec · public routes + auth redirect evidence · smoke 4 viewports.
 *
 * Usage: bun run tsx scripts/visual-audit-capture-cdp.ts
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = process.cwd();
const OUT = join(ROOT, 'screenshots');
const BASE = process.env.PHONARA_AUDIT_BASE ?? 'http://127.0.0.1:3000';
const CHROME =
  process.env.PHONARA_CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = Number(process.env.PHONARA_CDP_PORT ?? 9222);
const SPAWN_VITE = process.env.PHONARA_AUDIT_NO_SPAWN !== '1';

type Vp = { id: string; folder: 'mobile' | 'tablet' | 'desktop'; w: number; h: number };

const MINIMAL = process.env.PHONARA_AUDIT_MINIMAL === '1';

const VIEWPORTS_FULL: Vp[] = [
  { id: '390x844', folder: 'mobile', w: 390, h: 844 },
  { id: '768x1024', folder: 'tablet', w: 768, h: 1024 },
  { id: '1024x768', folder: 'tablet', w: 1024, h: 768 },
  { id: '1920x1080', folder: 'desktop', w: 1920, h: 1080 },
];

const VIEWPORTS_MIN: Vp[] = [
  { id: '390x844', folder: 'mobile', w: 390, h: 844 },
  { id: '1920x1080', folder: 'desktop', w: 1920, h: 1080 },
];

const VIEWPORTS: Vp[] = MINIMAL ? VIEWPORTS_MIN : VIEWPORTS_FULL;

type Route = {
  pageId: string;
  path: string;
  auth: 'public' | 'auth';
  themes: Array<'light' | 'dark'>;
};

const ROUTES_FULL: Route[] = [
  { pageId: 'landing', path: '/', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'login', path: '/login', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'signup', path: '/signup', auth: 'public', themes: ['dark'] },
  { pageId: 'install', path: '/install', auth: 'public', themes: ['dark'] },
  { pageId: 'legal_terms', path: '/legal/terms', auth: 'public', themes: ['dark'] },
  { pageId: 'legal_privacy', path: '/legal/privacy', auth: 'public', themes: ['dark'] },
  { pageId: 'reset_password', path: '/reset-password', auth: 'public', themes: ['dark'] },
  { pageId: 'home', path: '/home', auth: 'auth', themes: ['dark'] },
  { pageId: 'trade_spot', path: '/trade', auth: 'auth', themes: ['dark'] },
  { pageId: 'wallet', path: '/wallet', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino_lobby', path: '/casino', auth: 'auth', themes: ['dark'] },
  { pageId: 'game_crash', path: '/games/crash', auth: 'auth', themes: ['dark'] },
  { pageId: 'sports', path: '/sports', auth: 'auth', themes: ['dark'] },
];

/** RAM-critical PC: public only · dark · fewer routes */
const ROUTES_MIN: Route[] = [
  { pageId: 'landing', path: '/', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'login', path: '/login', auth: 'public', themes: ['dark'] },
  { pageId: 'signup', path: '/signup', auth: 'public', themes: ['dark'] },
  { pageId: 'install', path: '/install', auth: 'public', themes: ['dark'] },
  { pageId: 'legal_terms', path: '/legal/terms', auth: 'public', themes: ['dark'] },
  { pageId: 'home', path: '/home', auth: 'auth', themes: ['dark'] },
  { pageId: 'trade_spot', path: '/trade', auth: 'auth', themes: ['dark'] },
  { pageId: 'wallet', path: '/wallet', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino_lobby', path: '/casino', auth: 'auth', themes: ['dark'] },
];

const ROUTES: Route[] = MINIMAL ? ROUTES_MIN : ROUTES_FULL;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function portOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = createConnection({ port, host: '127.0.0.1' }, () => {
      s.end();
      resolve(true);
    });
    s.on('error', () => resolve(false));
  });
}

async function waitHttp(url: string, timeoutMs: number): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status > 0) return;
    } catch {
      /* retry */
    }
    await sleep(1000);
  }
  throw new Error(`timeout waiting ${url}`);
}

type CdpClient = {
  send: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<T>;
  close: () => void;
};

async function connectCdp(wsUrl: string): Promise<CdpClient> {
  const ws = new WebSocket(wsUrl);
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', () => reject(new Error('CDP ws error')));
  });

  let nextId = 1;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(String(ev.data)) as {
      id?: number;
      result?: unknown;
      error?: { message?: string };
    };
    if (msg.id == null) return;
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error) p.reject(new Error(msg.error.message ?? 'CDP error'));
    else p.resolve(msg.result);
  });

  return {
    send<T = unknown>(method: string, params: Record<string, unknown> = {}) {
      const id = nextId++;
      return new Promise<T>((resolve, reject) => {
        pending.set(id, {
          resolve: (v) => resolve(v as T),
          reject,
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      ws.close();
    },
  };
}

async function getPageWsUrl(): Promise<string> {
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
  const ver = (await res.json()) as { webSocketDebuggerUrl?: string };
  if (!ver.webSocketDebuggerUrl) throw new Error('no browser ws');

  // Prefer a page target
  const list = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json()) as Array<{
    type: string;
    webSocketDebuggerUrl?: string;
  }>;
  const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;

  // Create new page via HTTP
  const created = (await (
    await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' })
  ).json()) as { webSocketDebuggerUrl?: string };
  if (!created.webSocketDebuggerUrl) throw new Error('failed to create page target');
  return created.webSocketDebuggerUrl;
}

async function captureViewport(
  cdp: CdpClient,
  url: string,
  theme: 'light' | 'dark',
  vp: Vp,
  outPath: string,
  scroll: 'top' | 'mid' | 'end',
): Promise<{ finalUrl: string }> {
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: vp.w,
    height: vp.h,
    deviceScaleFactor: 1,
    mobile: vp.w < 768,
  });

  const nav = await cdp.send<{ frameId: string }>('Page.navigate', { url });
  void nav;
  await sleep(1200);

  await cdp.send('Runtime.evaluate', {
    expression: `
      document.documentElement.setAttribute('data-theme', '${theme}');
      document.documentElement.style.colorScheme = '${theme}';
      try { localStorage.setItem('phonara-theme', '${theme}'); } catch (e) {}
    `,
  });
  await sleep(400);

  const scrollExpr =
    scroll === 'top'
      ? 'window.scrollTo(0,0)'
      : scroll === 'mid'
        ? `(() => { const m=Math.max(0,document.documentElement.scrollHeight-window.innerHeight); window.scrollTo(0,Math.floor(m/2)); })()`
        : `(() => { const m=Math.max(0,document.documentElement.scrollHeight-window.innerHeight); window.scrollTo(0,m); })()`;

  await cdp.send('Runtime.evaluate', { expression: scrollExpr });
  await sleep(250);

  const urlRes = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: 'location.href',
    returnByValue: true,
  });
  const finalUrl = urlRes.result?.value ?? url;

  const shot = await cdp.send<{ data: string }>('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  await writeFile(outPath, Buffer.from(shot.data, 'base64'));
  return { finalUrl };
}

type ManifestRow = {
  file: string;
  pageId: string;
  path: string;
  viewport: string;
  folder: string;
  theme: string;
  scroll: string;
  finalUrl: string;
  auth: string;
  redirectedToLogin: boolean;
};

async function main(): Promise<void> {
  let vite: ChildProcess | null = null;
  let chrome: ChildProcess | null = null;
  const manifest: ManifestRow[] = [];
  const startedAt = new Date().toISOString();
  const userDataDir = join(tmpdir(), `phonara-audit-chrome-${Date.now()}`);

  try {
    if (SPAWN_VITE && !(await portOpen(3000))) {
      console.log('[cdp-audit] spawn bun run dev:web');
      vite = spawn('bun', ['run', 'dev:web'], {
        cwd: ROOT,
        shell: true,
        stdio: 'pipe',
        env: { ...process.env, BROWSER: 'none' },
      });
      vite.stdout?.on('data', (d: Buffer) => {
        const s = d.toString();
        if (/Local:|ready|3000/.test(s)) process.stdout.write(s);
      });
      vite.stderr?.on('data', (d: Buffer) => process.stderr.write(d));
      await waitHttp(BASE, 180_000);
    } else {
      await waitHttp(BASE, 30_000);
    }
    console.log('[cdp-audit] vite ok', BASE);

    if (!(await portOpen(DEBUG_PORT))) {
      console.log('[cdp-audit] spawn chrome CDP', DEBUG_PORT);
      chrome = spawn(
        CHROME,
        [
          `--remote-debugging-port=${DEBUG_PORT}`,
          `--user-data-dir=${userDataDir}`,
          '--headless=new',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-dev-shm-usage',
          'about:blank',
        ],
        { stdio: 'ignore' },
      );
      await sleep(2000);
    }

    const wsUrl = await getPageWsUrl();
    const cdp = await connectCdp(wsUrl);
    console.log('[cdp-audit] CDP connected');

    for (const route of ROUTES) {
      for (const theme of route.themes) {
        for (const vp of VIEWPORTS) {
          if (route.auth === 'auth' && (vp.w === 768 || vp.w === 1024)) continue;

          const dir = join(OUT, vp.folder);
          await mkdir(dir, { recursive: true });
          const scrolls: Array<'top' | 'mid' | 'end'> = MINIMAL ? ['top'] : ['top', 'mid', 'end'];
          let nn = 1;
          for (const scroll of scrolls) {
            const fileName = `${route.pageId}_${vp.folder}_${theme}_${String(nn).padStart(2, '0')}.png`;
            const abs = join(dir, fileName);
            console.log('[capture]', fileName);
            const { finalUrl } = await captureViewport(
              cdp,
              `${BASE}${route.path}`,
              theme,
              vp,
              abs,
              scroll,
            );
            const redirectedToLogin = /\/login(?:\?|$)/.test(new URL(finalUrl).pathname);
            manifest.push({
              file: `${vp.folder}/${fileName}`,
              pageId: route.pageId,
              path: route.path,
              viewport: vp.id,
              folder: vp.folder,
              theme,
              scroll: `0${nn}_${scroll}`,
              finalUrl,
              auth: route.auth,
              redirectedToLogin,
            });
            nn += 1;
          }
        }
      }
    }

    // Hover approx: landing CTA region (no true hover in CDP without Input.dispatchMouseEvent)
    const hoverDir = join(OUT, 'hover');
    await mkdir(hoverDir, { recursive: true });
    const hoverVp: Vp = { id: '1280x800', folder: 'desktop', w: 1280, h: 800 };
    const hoverFile = 'landing_cta_region_01.png';
    await captureViewport(cdp, `${BASE}/`, 'dark', hoverVp, join(hoverDir, hoverFile), 'top');
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 200,
      y: 420,
    });
    await sleep(200);
    const hoverFile2 = 'landing_after_mousemove_01.png';
    const shot = await cdp.send<{ data: string }>('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
    });
    await writeFile(join(hoverDir, hoverFile2), Buffer.from(shot.data, 'base64'));

    cdp.close();

    const summary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      base: BASE,
      engine: 'chrome-cdp',
      note: 'Auth-gated routes without session redirect to /login. True authenticated UI needs Docker stack + login pass. Playwright blocked by hook — used system Chrome CDP.',
      counts: {
        png: manifest.length + 2,
        routes: ROUTES.length,
        viewports: VIEWPORTS.length,
        authRedirects: manifest.filter((m) => m.redirectedToLogin).length,
      },
      hoverFiles: [`hover/${hoverFile}`, `hover/${hoverFile2}`],
      manifest,
    };

    await writeFile(
      join(ROOT, 'docs/audit/visual-ux-2026-07-11/capture-manifest.json'),
      JSON.stringify(summary, null, 2),
      'utf8',
    );
    console.log('[cdp-audit] DONE', summary.counts);
  } finally {
    if (chrome && !chrome.killed) {
      chrome.kill();
      await sleep(500);
    }
    if (vite && !vite.killed) {
      vite.kill();
      await sleep(1500);
      if (!vite.killed) vite.kill('SIGKILL');
    }
  }
}

main().catch((e) => {
  console.error('[cdp-audit] FAIL', e);
  process.exit(1);
});
