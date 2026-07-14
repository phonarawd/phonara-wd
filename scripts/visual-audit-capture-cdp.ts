/**
 * Visual audit capture via system Chrome CDP (no Playwright — hook-safe).
 * Low-spec · public routes + auth redirect evidence · smoke 4 viewports.
 *
 * Usage: bun run tsx scripts/visual-audit-capture-cdp.ts
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import { existsSync, readFileSync } from 'node:fs';
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
/** Opt-in: log in with `.local-trade-dev.credentials.json` before capturing auth routes (local Supabase only). */
const LOGIN_LOCAL_TRADE = process.env.PHONARA_AUDIT_LOGIN === '1';

type Vp = { id: string; folder: 'mobile' | 'tablet' | 'desktop'; w: number; h: number };

const MINIMAL = process.env.PHONARA_AUDIT_MINIMAL === '1';

/** Canonical Phase R 4-tier smoke widths — apps/web/src/product/tokens/viewport-contract.ts VIEWPORT_SMOKE_WIDTHS. */
const VIEWPORTS_FULL: Vp[] = [
  { id: '390x844', folder: 'mobile', w: 390, h: 844 },
  { id: '768x1024', folder: 'tablet', w: 768, h: 1024 },
  { id: '1024x900', folder: 'desktop', w: 1024, h: 900 },
  { id: '2560x1440', folder: 'desktop', w: 2560, h: 1440 },
];

/** MINIMAL keeps all 4 canonical widths (routes are what shrink in MINIMAL mode). */
const VIEWPORTS_MIN: Vp[] = VIEWPORTS_FULL;

const VIEWPORTS: Vp[] = MINIMAL ? VIEWPORTS_MIN : VIEWPORTS_FULL;

type Route = {
  pageId: string;
  path: string;
  auth: 'public' | 'auth';
  themes: Array<'light' | 'dark'>;
};

const ROUTES_FULL: Route[] = [
  // `landing=1` forces the marketing LandingPage regardless of a leftover
  // Supabase session in the capture browser profile — `/` otherwise
  // redirects to `/home` for any authenticated session (see
  // `landing-route-guard.ts`), which silently swaps in the wrong surface
  // for Landing-density audits (2026-07-15 Phase 0B finding).
  { pageId: 'landing', path: '/?landing=1', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'login', path: '/login', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'signup', path: '/signup', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'install', path: '/install', auth: 'public', themes: ['dark'] },
  { pageId: 'legal_terms', path: '/legal/terms', auth: 'public', themes: ['dark'] },
  { pageId: 'legal_privacy', path: '/legal/privacy', auth: 'public', themes: ['dark'] },
  { pageId: 'reset_password', path: '/reset-password', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'verify_email', path: '/verify-email', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'home', path: '/home', auth: 'auth', themes: ['dark'] },
  { pageId: 'trade_spot', path: '/trade', auth: 'auth', themes: ['dark'] },
  { pageId: 'wallet', path: '/wallet', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino_lobby', path: '/casino', auth: 'auth', themes: ['dark'] },
  { pageId: 'game_crash', path: '/games/crash', auth: 'auth', themes: ['dark'] },
  { pageId: 'sports', path: '/sports', auth: 'auth', themes: ['dark'] },
];

/** RAM-critical PC: public only · dark · fewer routes */
const ROUTES_MIN: Route[] =
  process.env.PHONARA_AUDIT_DEBUG_LOGIN_ONLY === '1'
    ? [{ pageId: 'home', path: '/home', auth: 'auth', themes: ['dark'] }]
    : [
        // See ROUTES_FULL comment — `landing=1` bypasses the authenticated `/home` redirect.
        { pageId: 'landing', path: '/?landing=1', auth: 'public', themes: ['dark', 'light'] },
        { pageId: 'login', path: '/login', auth: 'public', themes: ['dark', 'light'] },
        { pageId: 'signup', path: '/signup', auth: 'public', themes: ['dark', 'light'] },
        { pageId: 'install', path: '/install', auth: 'public', themes: ['dark'] },
        { pageId: 'legal_terms', path: '/legal/terms', auth: 'public', themes: ['dark'] },
        {
          pageId: 'reset_password',
          path: '/reset-password',
          auth: 'public',
          themes: ['dark', 'light'],
        },
        {
          pageId: 'verify_email',
          path: '/verify-email',
          auth: 'public',
          themes: ['dark', 'light'],
        },
        { pageId: 'home', path: '/home', auth: 'auth', themes: ['dark'] },
        { pageId: 'trade_spot', path: '/trade', auth: 'auth', themes: ['dark'] },
        { pageId: 'wallet', path: '/wallet', auth: 'auth', themes: ['dark'] },
        { pageId: 'casino_lobby', path: '/casino', auth: 'auth', themes: ['dark'] },
      ];

/** Opt-in: narrow a run to specific `pageId`s (comma-separated) — e.g. a single-surface re-verify pass. */
const ONLY_PAGE_IDS = process.env.PHONARA_AUDIT_ROUTES
  ? new Set(
      process.env.PHONARA_AUDIT_ROUTES.split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    )
  : null;

const ROUTES: Route[] = (MINIMAL ? ROUTES_MIN : ROUTES_FULL).filter(
  (route) => !ONLY_PAGE_IDS || ONLY_PAGE_IDS.has(route.pageId),
);

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
  // Low-spec dev-server cold compile can outlast the original 1200ms wait,
  // leaving the boot-splash captured instead of the mounted route (2026-07-15 finding).
  await sleep(2600);

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

type LocalTradeCredentials = { email: string; password: string; loginUrl: string };

function readLocalTradeCredentials(): LocalTradeCredentials | null {
  const path = join(ROOT, '.local-trade-dev.credentials.json');
  if (!existsSync(path)) return null;
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  if (typeof parsed['email'] !== 'string' || typeof parsed['password'] !== 'string') return null;
  return {
    email: parsed['email'],
    password: parsed['password'],
    loginUrl: typeof parsed['loginUrl'] === 'string' ? parsed['loginUrl'] : `${BASE}/login`,
  };
}

/** Local-only login via `login-form.tsx` data-testids — never used against a non-local BASE. */
async function loginViaForm(cdp: CdpClient, creds: LocalTradeCredentials): Promise<boolean> {
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(BASE)) {
    throw new Error('[cdp-audit] refuses login flow against non-local BASE');
  }
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send('Page.navigate', { url: `${BASE}/login` });
  await sleep(2600);

  const fillResult = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: `
      (function () {
        function setNativeValue(el, value) {
          const proto = Object.getPrototypeOf(el);
          const desc = Object.getOwnPropertyDescriptor(proto, 'value');
          if (desc && desc.set) desc.set.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const emailEl = document.querySelector('[data-testid="login-email"]');
        const passwordEl = document.querySelector('[data-testid="login-password"]');
        if (emailEl) setNativeValue(emailEl, ${JSON.stringify(creds.email)});
        if (passwordEl) setNativeValue(passwordEl, ${JSON.stringify(creds.password)});
        return JSON.stringify({
          foundEmail: !!emailEl,
          foundPassword: !!passwordEl,
          emailValueAfter: emailEl ? emailEl.value : null,
          passwordValueAfter: passwordEl ? passwordEl.value : null,
        });
      })();
    `,
    returnByValue: true,
  });
  console.log('[cdp-audit] login fill diagnostic:', fillResult.result?.value);
  await sleep(400);

  const debugDir = join(OUT, 'hover');
  await mkdir(debugDir, { recursive: true });
  const beforeClickShot = await cdp.send<{ data: string }>('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  await writeFile(
    join(debugDir, 'login_debug_filled_01.png'),
    Buffer.from(beforeClickShot.data, 'base64'),
  );

  const clickResult = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: `
      (function () {
        const btn = document.querySelector('[data-testid="login-submit"]');
        const disabled = btn ? btn.disabled : null;
        if (btn) btn.click();
        return JSON.stringify({ foundButton: !!btn, disabled });
      })();
    `,
    returnByValue: true,
  });
  console.log('[cdp-audit] login click diagnostic:', clickResult.result?.value);

  await sleep(1500);
  const afterClickShot = await cdp.send<{ data: string }>('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  await writeFile(
    join(debugDir, 'login_debug_after_click_01.png'),
    Buffer.from(afterClickShot.data, 'base64'),
  );

  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    const res = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
      expression: 'location.pathname',
      returnByValue: true,
    });
    const pathname = res.result?.value ?? '';
    if (pathname && !pathname.startsWith('/login')) return true;
  }
  return false;
}

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
      // A flat 2000ms sleep raced Chrome's cold-start (new user-data-dir +
      // AV scan of the exe) often enough on this low-spec machine to fail
      // with ECONNREFUSED (2026-07-15 finding) — poll the debug port instead.
      const chromeReadyAt = Date.now();
      while (!(await portOpen(DEBUG_PORT))) {
        if (Date.now() - chromeReadyAt > 30_000) {
          throw new Error(`timeout waiting for chrome CDP port ${DEBUG_PORT}`);
        }
        await sleep(300);
      }
    }

    const wsUrl = await getPageWsUrl();
    const cdp = await connectCdp(wsUrl);
    console.log('[cdp-audit] CDP connected');

    let loggedIn = false;
    if (LOGIN_LOCAL_TRADE) {
      const creds = readLocalTradeCredentials();
      if (!creds) {
        console.warn(
          '[cdp-audit] PHONARA_AUDIT_LOGIN=1 but no .local-trade-dev.credentials.json found',
        );
      } else {
        console.log('[cdp-audit] logging in as', creds.email);
        loggedIn = await loginViaForm(cdp, creds);
        console.log(
          loggedIn ? '[cdp-audit] login OK' : '[cdp-audit] login FAILED (still on /login)',
        );
      }
    }

    for (const route of ROUTES) {
      for (const theme of route.themes) {
        for (const vp of VIEWPORTS) {
          if (route.auth === 'auth' && vp.w === 768) continue;

          const dir = join(OUT, vp.folder);
          await mkdir(dir, { recursive: true });
          const scrolls: Array<'top' | 'mid' | 'end'> = MINIMAL ? ['top'] : ['top', 'mid', 'end'];
          let nn = 1;
          for (const scroll of scrolls) {
            const fileName = `${route.pageId}_${vp.id}_${theme}_${String(nn).padStart(2, '0')}.png`;
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
      loggedIn,
      note: loggedIn
        ? 'Logged in as local-trade-dev; auth-gated routes captured with a real session.'
        : 'Auth-gated routes without session redirect to /login. True authenticated UI needs Docker stack + login pass. Playwright blocked by hook — used system Chrome CDP.',
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
