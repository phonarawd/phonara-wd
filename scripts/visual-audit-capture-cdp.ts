/**
 * Visual audit capture + real-browser assertions via system Chrome CDP
 * (no Playwright — hook-safe). Low-spec · public routes + auth redirect
 * evidence · smoke 4 viewports.
 *
 * Phase 0A/1B follow-up (2026-07-15): this script previously only took
 * screenshots — visual review of the PNGs was the only "verification".
 * That is not enough to confirm a CSS cascade fix or an axe pass; it now
 * also runs real-browser assertions in the same CDP session:
 *   - `.ds-shell-bottomnav` computed `display` at every viewport (catches
 *     the exact BottomNav-still-visible-at-desktop class of bug — a pure
 *     source-text/jsdom test cannot see real computed style, see
 *     `shell-elevation.test.tsx`'s own comment).
 *   - axe-core injected into the live page (critical/serious violations).
 *   - console error collection per navigation (source-attributed, not
 *     silently dropped — Definition of Done "Console" row).
 * Opt-in (`PHONARA_AUDIT_INTERACT=1`) casino bet-to-result interaction
 * pass + real rAF-measured FPS during the Crash replay animation.
 *
 * Usage: bun run tsx scripts/visual-audit-capture-cdp.ts
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readLocalSupabaseEnv } from './lib/db-connect';
import { killPortListeners } from './lib/e2e-lifecycle';

const ROOT = process.cwd();
const OUT = join(ROOT, 'screenshots');
const ENV_LOCAL = join(ROOT, '.env.local');
const BASE = process.env.PHONARA_AUDIT_BASE ?? 'http://127.0.0.1:3000';
const CHROME =
  process.env.PHONARA_CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = Number(process.env.PHONARA_CDP_PORT ?? 9222);
const SPAWN_VITE = process.env.PHONARA_AUDIT_NO_SPAWN !== '1';
/** Opt-in: log in with `.local-trade-dev.credentials.json` before capturing auth routes (local Supabase only). */
const LOGIN_LOCAL_TRADE = process.env.PHONARA_AUDIT_LOGIN === '1';
/** Opt-in: run the casino bet-to-result interaction + real-FPS pass (needs a logged-in session + funded wallet). */
const RUN_INTERACTION_PASS = process.env.PHONARA_AUDIT_INTERACT === '1';
/** Opt-out: skip the hard-fail exit code on assertion violations (capture-only mode, e.g. first-run baselines). */
const NO_ASSERT = process.env.PHONARA_AUDIT_NO_ASSERT === '1';

/** Canonical Phase R 4-tier smoke widths — apps/web/src/product/tokens/viewport-contract.ts VIEWPORT_SMOKE_WIDTHS. */
type Vp = {
  id: '390' | '768' | '1024' | '2560';
  folder: 'mobile' | 'tablet' | 'desktop';
  w: number;
  h: number;
};

const MINIMAL = process.env.PHONARA_AUDIT_MINIMAL === '1';

const VIEWPORTS_FULL: Vp[] = [
  { id: '390', folder: 'mobile', w: 390, h: 844 },
  { id: '768', folder: 'tablet', w: 768, h: 1024 },
  { id: '1024', folder: 'desktop', w: 1024, h: 900 },
  { id: '2560', folder: 'desktop', w: 2560, h: 1440 },
];

/** MINIMAL keeps all 4 canonical widths (routes are what shrink in MINIMAL mode). */
const VIEWPORTS_MIN: Vp[] = VIEWPORTS_FULL;

const VIEWPORTS: Vp[] = MINIMAL ? VIEWPORTS_MIN : VIEWPORTS_FULL;

/** Routes whose AppShell mounts the 5-tab BottomNav — Phase 0A affected-routes matrix. */
const BOTTOM_NAV_ROUTES = new Set([
  'home',
  'trade-spot',
  'wallet',
  'sports',
  'casino-lobby',
  'casino-crash',
  'casino-limbo',
  'casino-dice',
  'casino-mines',
  'casino-hilo',
]);

type Route = {
  /** kebab-case surface id — screenshot-naming-convention §"surface" (matches this plan's own examples). */
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
  { pageId: 'legal-terms', path: '/legal/terms', auth: 'public', themes: ['dark'] },
  { pageId: 'legal-privacy', path: '/legal/privacy', auth: 'public', themes: ['dark'] },
  { pageId: 'reset-password', path: '/reset-password', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'verify-email', path: '/verify-email', auth: 'public', themes: ['dark', 'light'] },
  { pageId: 'home', path: '/home', auth: 'auth', themes: ['dark'] },
  { pageId: 'trade-spot', path: '/trade', auth: 'auth', themes: ['dark'] },
  { pageId: 'wallet', path: '/wallet', auth: 'auth', themes: ['dark'] },
  { pageId: 'sports', path: '/sports', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-lobby', path: '/casino', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-crash', path: '/games/crash', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-limbo', path: '/games/limbo', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-dice', path: '/games/dice', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-mines', path: '/games/mines', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-hilo', path: '/games/hilo', auth: 'auth', themes: ['dark'] },
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
        { pageId: 'legal-terms', path: '/legal/terms', auth: 'public', themes: ['dark'] },
        {
          pageId: 'reset-password',
          path: '/reset-password',
          auth: 'public',
          themes: ['dark', 'light'],
        },
        {
          pageId: 'verify-email',
          path: '/verify-email',
          auth: 'public',
          themes: ['dark', 'light'],
        },
        { pageId: 'home', path: '/home', auth: 'auth', themes: ['dark'] },
        { pageId: 'trade-spot', path: '/trade', auth: 'auth', themes: ['dark'] },
        { pageId: 'wallet', path: '/wallet', auth: 'auth', themes: ['dark'] },
        { pageId: 'casino-lobby', path: '/casino', auth: 'auth', themes: ['dark'] },
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

function upsertEnvLocal(lines: string[], key: string, value: string): string[] {
  const prefix = `${key}=`;
  let found = false;
  const out = lines.map((line) => {
    if (line.startsWith(prefix)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) out.push(`${key}=${value}`);
  return out;
}

/** Align Vite with the live `supabase status` port (54621≠54321 on this PC). */
function syncLocalViteEnvForAudit(): boolean {
  const local = readLocalSupabaseEnv();
  if (!local) {
    console.log(
      '[cdp-audit] WARN: supabase status unreadable — Vite may hit wrong API port (login/interact will fail)',
    );
    return false;
  }
  const lines = existsSync(ENV_LOCAL) ? readFileSync(ENV_LOCAL, 'utf8').split(/\r?\n/) : [];
  let out = upsertEnvLocal(lines, 'VITE_SUPABASE_URL', local.VITE_SUPABASE_URL);
  out = upsertEnvLocal(out, 'VITE_SUPABASE_ANON_KEY', local.VITE_SUPABASE_ANON_KEY);
  writeFileSync(ENV_LOCAL, `${out.join('\n').replace(/\n*$/, '')}\n`, 'utf8');
  console.log('[cdp-audit] synced VITE_SUPABASE_* → .env.local', local.VITE_SUPABASE_URL);
  return true;
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

type CdpEventMessage = { method?: string; params?: unknown; id?: undefined };
type CdpClient = {
  send: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<T>;
  /** Subscribe to CDP events (e.g. `Runtime.consoleAPICalled`) — dropped entirely before this was added. */
  on: (method: string, handler: (params: unknown) => void) => void;
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
  const listeners = new Map<string, Array<(params: unknown) => void>>();

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(String(ev.data)) as {
      id?: number;
      result?: unknown;
      error?: { message?: string };
    } & CdpEventMessage;
    if (msg.id == null) {
      if (msg.method) {
        for (const handler of listeners.get(msg.method) ?? []) handler(msg.params);
      }
      return;
    }
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
    on(method: string, handler: (params: unknown) => void) {
      const arr = listeners.get(method) ?? [];
      arr.push(handler);
      listeners.set(method, arr);
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

type EvalResult<T> = { result: { value: T } };

async function evaluate<T>(cdp: CdpClient, expression: string): Promise<T> {
  const res = await cdp.send<EvalResult<T>>('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value as T;
}

/** Real computed style of `.ds-shell-bottomnav` — Phase 0A's own regression note: this is the
 * one check a jsdom/vitest unit test structurally cannot perform (no `css: true` project). */
async function readBottomNavDisplay(cdp: CdpClient): Promise<string | null> {
  return evaluate<string | null>(
    cdp,
    `(() => {
      const el = document.querySelector('[data-testid="bottom-nav"]');
      if (!el) return null;
      return getComputedStyle(el).display;
    })()`,
  );
}

let axeSourceCache: string | null = null;
function readAxeSource(): string {
  if (axeSourceCache) return axeSourceCache;
  const axePath = join(ROOT, 'node_modules', 'axe-core', 'axe.min.js');
  axeSourceCache = readFileSync(axePath, 'utf8');
  return axeSourceCache;
}

type AxeSummary = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  violations: Array<{ id: string; impact: string; nodes: number }>;
};

/** Inject the real axe-core UMD bundle (already a devDependency) into the live page and run it —
 * no Playwright / `@axe-core/playwright` needed, matching this script's existing hook-safe constraint. */
async function runAxeCheck(cdp: CdpClient): Promise<AxeSummary> {
  const alreadyLoaded = await evaluate<boolean>(cdp, `typeof window.axe !== 'undefined'`);
  if (!alreadyLoaded) {
    await cdp.send('Runtime.evaluate', { expression: readAxeSource() });
  }
  const raw = await evaluate<{
    violations: Array<{ id: string; impact: string | null; nodes: unknown[] }>;
  }>(
    cdp,
    `axe.run(document, { resultTypes: ['violations'] }).then((r) => ({
      violations: r.violations.map((v) => ({ id: v.id, impact: v.impact ?? 'unknown', nodes: v.nodes.length })),
    }))`,
  );
  const violations = raw?.violations ?? [];
  return {
    critical: violations.filter((v) => v.impact === 'critical').length,
    serious: violations.filter((v) => v.impact === 'serious').length,
    moderate: violations.filter((v) => v.impact === 'moderate').length,
    minor: violations.filter((v) => v.impact === 'minor').length,
    violations: violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? 'unknown',
      nodes: v.nodes,
    })),
  };
}

/** Per-navigation console error collector — registered once, read+cleared around each `Page.navigate`. */
function createConsoleErrorTracker(cdp: CdpClient): { errors: string[]; reset: () => void } {
  const state = { errors: [] as string[] };
  cdp.on('Runtime.consoleAPICalled', (params) => {
    const p = params as { type?: string; args?: Array<{ value?: unknown; description?: string }> };
    if (p.type !== 'error' && p.type !== 'assert') return;
    const text = (p.args ?? [])
      .map((a) =>
        typeof a.value === 'string' ? a.value : (a.description ?? JSON.stringify(a.value)),
      )
      .join(' ');
    state.errors.push(text.slice(0, 300));
  });
  cdp.on('Runtime.exceptionThrown', (params) => {
    const p = params as {
      exceptionDetails?: { text?: string; exception?: { description?: string } };
    };
    const text =
      p.exceptionDetails?.exception?.description ??
      p.exceptionDetails?.text ??
      'uncaught exception';
    state.errors.push(String(text).slice(0, 300));
  });
  return {
    get errors() {
      return state.errors;
    },
    reset() {
      state.errors = [];
    },
  } as unknown as { errors: string[]; reset: () => void };
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
  /** Phase 0A regression check — `.ds-shell-bottomnav` computed `display`, or null if not mounted on this route. */
  bottomNavDisplay: string | null;
  /** Phase 0A pass/fail against the policy: hidden (`none`) at >=1024px, grid at <1024px. Null = route has no BottomNav. */
  bottomNavPolicyOk: boolean | null;
  /** axe-core critical-impact violation count — only populated on the primary (1024/dark) capture per route to bound cost. */
  axeCritical: number | null;
  axeSerious: number | null;
  consoleErrorCount: number;
  consoleErrors: string[];
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
async function waitForLoginForm(cdp: CdpClient, timeoutMs = 45000): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const res = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
      expression: `!!document.querySelector('[data-testid="login-email"]')`,
      returnByValue: true,
    });
    if (res.result?.value) return true;
    await sleep(500);
  }
  return false;
}

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
  const formReady = await waitForLoginForm(cdp);
  if (!formReady) {
    console.log('[cdp-audit] login form not ready before timeout');
    return false;
  }
  await sleep(400);

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
    join(debugDir, 'login-debug-1280-dark-filled.png'),
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
    join(debugDir, 'login-debug-1280-dark-after-click.png'),
    Buffer.from(afterClickShot.data, 'base64'),
  );

  for (let i = 0; i < 30; i++) {
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

/** Sets a React-controlled input's value via the native setter + `input` event (same pattern as `loginViaForm`). */
function setNativeValueScript(testId: string, value: string): string {
  return `
    (function () {
      const el = document.querySelector('[data-testid="${testId}"]');
      if (!el) return false;
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc && desc.set) desc.set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })();
  `;
}

function clickScript(testId: string): string {
  return `
    (function () {
      const el = document.querySelector('[data-testid="${testId}"]');
      if (!el) return { found: false, disabled: null };
      const disabled = !!el.disabled;
      if (!disabled) el.click();
      return { found: true, disabled };
    })();
  `;
}

type InteractionResult = {
  gameCode: string;
  steps: Record<string, unknown>;
  fpsDuringReplay: number | null;
  axe: AxeSummary | null;
  consoleErrors: string[];
};

/**
 * Casino one-shot bet-to-result interaction pass (opt-in, `PHONARA_AUDIT_INTERACT=1`).
 * Reuses this repo's existing hook-safe CDP click pattern (native-value-set + `.click()`,
 * no Playwright) — the exact method the plan's "Functional QA method" section specifies.
 * Scope: one-shot bet placement + result render + PF panel + (crash/dice) real rAF-measured
 * FPS during the replay animation. Live mid-round cash-out is out of scope here: advancing a
 * shared live round requires `rpc_live_crash_advance` (service_role-only, revoked from
 * anon/authenticated — supabase/migrations/20260810000001_ew_e23_casino_live.sql:1905), i.e. a
 * real scheduler loop, which is genuine Playwright/CI E2E fixture territory (G13), not a
 * presentation-layer screenshot tool.
 */
const ALL_INTERACTION_GAMES = ['crash', 'limbo', 'dice', 'hilo', 'mines'] as const;
type InteractionGameCode = (typeof ALL_INTERACTION_GAMES)[number];

/** When `PHONARA_AUDIT_ROUTES` narrows capture, run interaction only for matching casino games. */
function interactionGamesForAudit(): InteractionGameCode[] {
  if (!ONLY_PAGE_IDS) return [...ALL_INTERACTION_GAMES];
  const scoped = ALL_INTERACTION_GAMES.filter((g) => ONLY_PAGE_IDS!.has(`casino-${g}`));
  return scoped.length > 0 ? scoped : [...ALL_INTERACTION_GAMES];
}

const HILO_STAGE_STATE_SCRIPT = `(() => {
  const stage = document.querySelector('[data-testid="casino-hilo-stage"]');
  const card = document.querySelector('[data-testid="casino-hilo-card-hero"]');
  const mult = document.querySelector('[data-testid="casino-hilo-live-mult"]')
    || document.querySelector('[data-testid="casino-hilo-round-mult"]');
  if (!stage) return null;
  return JSON.stringify({
    won: stage.getAttribute('data-won'),
    phase: stage.getAttribute('data-stage-phase'),
    guessCount: stage.getAttribute('data-guess-count'),
    card: card ? card.textContent : null,
    mult: mult ? mult.textContent : null,
  });
})()`;

function casinoResultTextScript(gameCode: InteractionGameCode): string {
  if (gameCode === 'dice') {
    return `(() => { const el = document.querySelector('[data-testid="casino-dice-roll"]'); return el ? el.textContent : null; })()`;
  }
  if (gameCode === 'hilo') {
    return HILO_STAGE_STATE_SCRIPT;
  }
  if (gameCode === 'mines') {
    return `(() => {
      const stage = document.querySelector('[data-testid="casino-mines-stage"]');
      if (!stage) return null;
      const mult = document.querySelector('[data-testid="casino-mines-cashout-mult"]');
      return JSON.stringify({
        won: stage.getAttribute('data-won'),
        hitMine: stage.getAttribute('data-hit-mine'),
        phase: stage.getAttribute('data-stage-phase'),
        mult: mult ? mult.textContent : null,
      });
    })()`;
  }
  const testId = `casino-${gameCode}-result`;
  return `(() => { const el = document.querySelector('[data-testid="${testId}"]'); return el ? el.textContent : null; })()`;
}

async function startFpsCounter(cdp: CdpClient): Promise<void> {
  await cdp.send('Runtime.evaluate', {
    expression: `
      window.__phonaraFpsFrames = 0;
      window.__phonaraFpsRunning = true;
      (function tick() {
        if (!window.__phonaraFpsRunning) return;
        window.__phonaraFpsFrames++;
        requestAnimationFrame(tick);
      })();
    `,
  });
}

async function stopFpsCounter(cdp: CdpClient, windowMs: number): Promise<number> {
  const frames = await evaluate<number>(
    cdp,
    `(() => { window.__phonaraFpsRunning = false; return window.__phonaraFpsFrames; })()`,
  );
  return Math.round((frames / windowMs) * 1000 * 10) / 10;
}

async function captureDesktopScreenshot(cdp: CdpClient, fileName: string): Promise<void> {
  const shotDir = join(OUT, 'desktop');
  await mkdir(shotDir, { recursive: true });
  const shot = await cdp.send<{ data: string }>('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  await writeFile(join(shotDir, fileName), Buffer.from(shot.data, 'base64'));
}

const HILO_SMART_GUESS_SCRIPT = `
(function () {
  const card = document.querySelector('[data-testid="casino-hilo-card-hero"]')?.textContent?.trim();
  const rankMap = { A: 1, J: 11, Q: 12, K: 13 };
  let r = rankMap[card] ?? parseInt(card, 10);
  if (!r || Number.isNaN(r)) return 'higher';
  if (r <= 6) return 'higher';
  if (r >= 8) return 'lower';
  return 'higher';
})()`;

function hiloStageParsed(raw: unknown): {
  won: string | null;
  phase: string | null;
  guessCount: string | null;
  card: string | null;
  mult: string | null;
} | null {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as ReturnType<typeof hiloStageParsed>;
  } catch {
    return null;
  }
}

function hiloCashoutSettled(raw: unknown): boolean {
  const parsed = hiloStageParsed(raw);
  return parsed?.won === 'true' && parsed.phase === 'settled';
}

function hiloSessionActive(raw: unknown): boolean {
  const parsed = hiloStageParsed(raw);
  return Boolean(parsed && parsed.phase !== 'settled' && parsed.won !== 'false');
}

/**
 * Hilo phase1c-hilo closeout: live hi/lo/skip + cash-out (real progressive RPC)
 * then oneshot bet→result for Mines/Dice parity. Card-flip FPS measured during
 * the live guess window (280ms/card token synced with `hiloFlipStepMs()`).
 *
 * Engine guard: `rpc_progressive_cashout` requires guesses.length > 0 AND
 * current_multiplier > 1 — skip alone keeps mult at 1.0, so the cashout path
 * must include a winning hi/lo guess first (card-rank heuristic, retry up to 5x).
 */
async function runHiloInteractionPass(
  cdp: CdpClient,
  consoleTracker: { errors: string[]; reset: () => void },
): Promise<InteractionResult> {
  const steps: Record<string, unknown> = {};
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  consoleTracker.reset();
  await cdp.send('Page.navigate', { url: `${BASE}/games/hilo` });
  await sleep(2600);
  await cdp.send('Runtime.evaluate', {
    expression: `document.documentElement.setAttribute('data-theme', 'dark');`,
  });
  await sleep(300);

  steps['stakeSet'] = await evaluate(cdp, setNativeValueScript('casino-stake-input', '1'));
  steps['guessQueue'] = await evaluate(
    cdp,
    `(() => {
      const el = document.querySelector('[data-testid="casino-hilo-guess-queue"]');
      return el ? el.textContent : null;
    })()`,
  );
  await sleep(200);

  steps['liveMode'] = await evaluate(cdp, clickScript('casino-play-mode-live'));
  await sleep(400);

  let fpsDuringReplay: number | null = null;
  const liveFpsWindowMs = 4500;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    if (attempt > 1) {
      await cdp.send('Page.navigate', { url: `${BASE}/games/hilo` });
      await sleep(2600);
      await cdp.send('Runtime.evaluate', {
        expression: `document.documentElement.setAttribute('data-theme', 'dark');`,
      });
      await sleep(300);
      steps[`liveRetry${attempt}`] = true;
      steps['liveMode'] = await evaluate(cdp, clickScript('casino-play-mode-live'));
      await sleep(400);
    }

    steps[`livePlaceBet${attempt}`] = await evaluate(cdp, clickScript('casino-live-place-bet'));
    await sleep(2800);
    steps[`liveAfterStart${attempt}`] = await evaluate(cdp, HILO_STAGE_STATE_SCRIPT);

    const smartGuess = await evaluate<string>(cdp, HILO_SMART_GUESS_SCRIPT);
    steps[`liveSmartGuess${attempt}`] = smartGuess;
    await startFpsCounter(cdp);
    steps[`liveGuess${attempt}`] = await evaluate(
      cdp,
      clickScript(`casino-hilo-guess-${smartGuess}`),
    );
    await sleep(1800);
    steps[`afterSmartGuess${attempt}`] = await evaluate(cdp, HILO_STAGE_STATE_SCRIPT);

    if (!hiloSessionActive(steps[`afterSmartGuess${attempt}`])) {
      await stopFpsCounter(cdp, liveFpsWindowMs);
      continue;
    }

    steps[`liveGuessSkip${attempt}`] = await evaluate(cdp, clickScript('casino-hilo-guess-skip'));
    await sleep(1400);
    steps[`afterSkip${attempt}`] = await evaluate(cdp, HILO_STAGE_STATE_SCRIPT);

    if (!hiloSessionActive(steps[`afterSkip${attempt}`])) {
      await stopFpsCounter(cdp, liveFpsWindowMs);
      continue;
    }

    steps[`liveCashout${attempt}`] = await evaluate(cdp, clickScript('casino-hilo-live-cashout'));
    await sleep(2500);
    fpsDuringReplay = await stopFpsCounter(cdp, liveFpsWindowMs);
    steps['liveResultText'] = await evaluate(cdp, HILO_STAGE_STATE_SCRIPT);
    steps['liveCashoutSucceeded'] = hiloCashoutSettled(steps['liveResultText']);
    steps['liveCashoutAttempt'] = attempt;
    if (steps['liveCashoutSucceeded'] === true) break;
  }

  steps['errorBanner'] = await evaluate(
    cdp,
    `(() => { const el = document.querySelector('[data-testid="casino-error"]'); return el ? el.textContent : null; })()`,
  );
  if (steps['liveCashoutSucceeded'] === true) {
    await captureDesktopScreenshot(cdp, 'casino-hilo-1024-dark-live-cashout.png');
  }

  // --- Oneshot bet→result (parity with Mines/Dice interaction captures) ---
  await cdp.send('Page.navigate', { url: `${BASE}/games/hilo` });
  await sleep(2600);
  await cdp.send('Runtime.evaluate', {
    expression: `document.documentElement.setAttribute('data-theme', 'dark');`,
  });
  await sleep(300);
  steps['stakeSetOneshot'] = await evaluate(cdp, setNativeValueScript('casino-stake-input', '1'));
  await sleep(200);
  steps['prepareHash'] = await evaluate(cdp, clickScript('casino-prepare-hash'));
  await sleep(1200);
  steps['placeBet'] = await evaluate(cdp, clickScript('casino-place-bet'));
  await sleep(1200);
  steps['resultText'] = await evaluate(cdp, HILO_STAGE_STATE_SCRIPT);
  steps['pfHashReady'] = await evaluate(
    cdp,
    `(() => { const el = document.querySelector('[data-testid="casino-pf-hash-status"]'); return el ? el.textContent : null; })()`,
  );
  await captureDesktopScreenshot(cdp, 'casino-hilo-1024-dark-bet-result.png');

  const axe = await runAxeCheck(cdp);
  return { gameCode: 'hilo', steps, fpsDuringReplay, axe, consoleErrors: [...consoleTracker.errors] };
}

async function runCasinoInteractionPass(
  cdp: CdpClient,
  gameCode: InteractionGameCode,
  consoleTracker: { errors: string[]; reset: () => void },
): Promise<InteractionResult> {
  if (gameCode === 'hilo') {
    return runHiloInteractionPass(cdp, consoleTracker);
  }

  const steps: Record<string, unknown> = {};
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  consoleTracker.reset();
  await cdp.send('Page.navigate', { url: `${BASE}/games/${gameCode}` });
  await sleep(2600);
  await cdp.send('Runtime.evaluate', {
    expression: `document.documentElement.setAttribute('data-theme', 'dark');`,
  });
  await sleep(300);

  steps['stakeSet'] = await evaluate(cdp, setNativeValueScript('casino-stake-input', '1'));
  if (gameCode === 'limbo') {
    steps['targetSet'] = await evaluate(
      cdp,
      setNativeValueScript('casino-selection-target', '2.00'),
    );
  }
  if (gameCode === 'dice') {
    steps['targetSet'] = await evaluate(
      cdp,
      setNativeValueScript('casino-selection-target', '50.00'),
    );
  }
  if (gameCode === 'mines') {
    // Default oneshot selection pre-fills revealedCells:[0,1,2] (game-config.ts).
    steps['pickedCount'] = await evaluate(
      cdp,
      `(() => {
        const el = document.querySelector('[data-testid="casino-mines-picked-count"]');
        return el ? el.textContent : null;
      })()`,
    );
  }
  await sleep(200);

  steps['prepareHash'] = await evaluate(cdp, clickScript('casino-prepare-hash'));
  await sleep(1200);

  // Start the real-FPS rAF counter *before* the bet click so replay animations
  // (crash curve 1.5–4s · dice roll-marker wobble ~480ms) are inside the window.
  if (gameCode === 'crash' || gameCode === 'dice') {
    await startFpsCounter(cdp);
  }

  steps['placeBet'] = await evaluate(cdp, clickScript('casino-place-bet'));
  const fpsWindowMs =
    gameCode === 'crash'
      ? 4500
      : gameCode === 'dice'
        ? 1200
        : gameCode === 'mines'
          ? 2000
          : 1800;
  await sleep(fpsWindowMs);

  let fpsDuringReplay: number | null = null;
  if (gameCode === 'crash' || gameCode === 'dice') {
    fpsDuringReplay = await stopFpsCounter(cdp, fpsWindowMs);
  }

  steps['resultText'] = await evaluate(cdp, casinoResultTextScript(gameCode));
  steps['pfHashReady'] = await evaluate(
    cdp,
    `(() => { const el = document.querySelector('[data-testid="casino-pf-hash-status"]'); return el ? el.textContent : null; })()`,
  );
  steps['errorBanner'] = await evaluate(
    cdp,
    `(() => { const el = document.querySelector('[data-testid="casino-error"]'); return el ? el.textContent : null; })()`,
  );

  await captureDesktopScreenshot(cdp, `casino-${gameCode}-1024-dark-bet-result.png`);

  const axe = await runAxeCheck(cdp);

  return { gameCode, steps, fpsDuringReplay, axe, consoleErrors: [...consoleTracker.errors] };
}

async function main(): Promise<void> {
  let vite: ChildProcess | null = null;
  let chrome: ChildProcess | null = null;
  let spawnedVite = false;
  const manifest: ManifestRow[] = [];
  const interactions: InteractionResult[] = [];
  const bottomNavViolations: string[] = [];
  const axeCriticalFindings: string[] = [];
  const startedAt = new Date().toISOString();
  const userDataDir = join(tmpdir(), `phonara-audit-chrome-${Date.now()}`);

  const teardownAuditChildren = async (): Promise<void> => {
    if (chrome?.pid) {
      if (process.platform === 'win32')
        spawnSync('taskkill', ['/pid', String(chrome.pid), '/T', '/F']);
      else chrome.kill();
      chrome = null;
      await sleep(300);
    }
    if (vite?.pid) {
      if (process.platform === 'win32')
        spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F']);
      else vite.kill('SIGKILL');
      vite = null;
      await sleep(300);
    }
    // Belt-and-suspenders: Windows `shell: true` spawns often leave the real
    // Vite listener as a grandchild when Cursor/agent interrupts mid-capture.
    if (spawnedVite) {
      const killed = killPortListeners(3000);
      if (killed > 0) {
        console.log(`[cdp-audit] swept ${killed} orphan listener(s) on port 3000`);
      }
    }
  };

  const onInterrupt = (): void => {
    void teardownAuditChildren().finally(() => process.exit(130));
  };
  process.once('SIGINT', onInterrupt);
  process.once('SIGTERM', onInterrupt);

  try {
    if (SPAWN_VITE && !(await portOpen(3000))) {
      if (LOGIN_LOCAL_TRADE) {
        syncLocalViteEnvForAudit();
      }
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
      spawnedVite = true;
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
    await cdp.send('Runtime.enable');
    const consoleTracker = createConsoleErrorTracker(cdp);

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
            const stateSuffix = scrolls.length > 1 ? `-${String(nn).padStart(2, '0')}` : '';
            const fileName = `${route.pageId}-${vp.id}-${theme}${stateSuffix}.png`;
            const abs = join(dir, fileName);
            console.log('[capture]', fileName);
            consoleTracker.reset();
            const { finalUrl } = await captureViewport(
              cdp,
              `${BASE}${route.path}`,
              theme,
              vp,
              abs,
              scroll,
            );
            // A route whose *own* target path is `/login` (or `/login?...`) is not a
            // redirect — it is intentionally there. Only auth-gated routes that bounce
            // to `/login` because the session was missing/expired count as redirected
            // (2026-07-15 finding: the naive regex false-positived on `/login` itself,
            // which silently skipped axe/console checks on the login page).
            const redirectedToLogin =
              !/^\/login(?:\?|$)/.test(route.path) &&
              /\/login(?:\?|$)/.test(new URL(finalUrl).pathname);

            let bottomNavDisplay: string | null = null;
            let bottomNavPolicyOk: boolean | null = null;
            if (BOTTOM_NAV_ROUTES.has(route.pageId) && !redirectedToLogin) {
              bottomNavDisplay = await readBottomNavDisplay(cdp);
              if (bottomNavDisplay !== null) {
                const shouldBeHidden = vp.w >= 1024;
                bottomNavPolicyOk = shouldBeHidden
                  ? bottomNavDisplay === 'none'
                  : bottomNavDisplay !== 'none';
                if (!bottomNavPolicyOk) {
                  bottomNavViolations.push(
                    `${route.pageId}@${vp.id}px: display=${bottomNavDisplay} (expected ${
                      shouldBeHidden ? 'none' : 'non-none'
                    })`,
                  );
                }
              }
            }

            let axeCritical: number | null = null;
            let axeSerious: number | null = null;
            if (vp.id === '1024' && theme === 'dark' && scroll === 'top' && !redirectedToLogin) {
              const axe = await runAxeCheck(cdp);
              axeCritical = axe.critical;
              axeSerious = axe.serious;
              if (axe.critical > 0) {
                axeCriticalFindings.push(
                  `${route.pageId}: ${axe.critical} critical (${axe.violations
                    .filter((v) => v.impact === 'critical')
                    .map((v) => v.id)
                    .join(', ')})`,
                );
              }
            }

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
              bottomNavDisplay,
              bottomNavPolicyOk,
              axeCritical,
              axeSerious,
              consoleErrorCount: consoleTracker.errors.length,
              consoleErrors: [...consoleTracker.errors],
            });
            nn += 1;
          }
        }
      }
    }

    if (RUN_INTERACTION_PASS && loggedIn) {
      for (const gameCode of interactionGamesForAudit()) {
        console.log('[cdp-audit] interaction pass:', gameCode);
        const result = await runCasinoInteractionPass(cdp, gameCode, consoleTracker);
        interactions.push(result);
        if (result.axe && result.axe.critical > 0) {
          axeCriticalFindings.push(
            `casino-${gameCode} (interaction): ${result.axe.critical} critical`,
          );
        }
        if (gameCode === 'hilo' && result.steps['liveCashoutSucceeded'] !== true) {
          axeCriticalFindings.push(
            'casino-hilo (interaction): live hi/lo/skip→cash-out did not settle won:true',
          );
        }
        if (
          gameCode === 'hilo' &&
          result.fpsDuringReplay !== null &&
          result.fpsDuringReplay < 55
        ) {
          axeCriticalFindings.push(
            `casino-hilo (interaction): FPS ${result.fpsDuringReplay} below 55 threshold`,
          );
        }
      }
    }

    // Hover approx: landing CTA region (no true hover in CDP without Input.dispatchMouseEvent)
    const hoverDir = join(OUT, 'hover');
    await mkdir(hoverDir, { recursive: true });
    const hoverVp: Vp = { id: '1024', folder: 'desktop', w: 1280, h: 800 };
    const hoverFile = 'landing-1280-dark-cta-region.png';
    await captureViewport(cdp, `${BASE}/`, 'dark', hoverVp, join(hoverDir, hoverFile), 'top');
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 200,
      y: 420,
    });
    await sleep(200);
    const hoverFile2 = 'landing-1280-dark-after-mousemove.png';
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
      assertions: {
        bottomNavViolations,
        axeCriticalFindings,
      },
      hoverFiles: [`hover/${hoverFile}`, `hover/${hoverFile2}`],
      manifest,
      interactions,
    };

    await writeFile(
      join(ROOT, 'docs/audit/visual-ux-2026-07-11/capture-manifest.json'),
      JSON.stringify(summary, null, 2),
      'utf8',
    );
    console.log('[cdp-audit] DONE', summary.counts);
    console.log(
      '[cdp-audit] bottomNavViolations:',
      bottomNavViolations.length ? bottomNavViolations : 'none',
    );
    console.log(
      '[cdp-audit] axeCriticalFindings:',
      axeCriticalFindings.length ? axeCriticalFindings : 'none',
    );
    for (const interaction of interactions) {
      console.log(
        `[cdp-audit] interaction ${interaction.gameCode}:`,
        JSON.stringify(interaction.steps),
      );
      if (interaction.fpsDuringReplay !== null) {
        console.log(
          `[cdp-audit] ${interaction.gameCode} measured FPS during replay:`,
          interaction.fpsDuringReplay,
        );
      }
    }

    const hardFailures = bottomNavViolations.length > 0 || axeCriticalFindings.length > 0;
    if (hardFailures && !NO_ASSERT) {
      console.error(
        '[cdp-audit] FAIL — assertion violations found (see above). Set PHONARA_AUDIT_NO_ASSERT=1 to capture without failing.',
      );
      process.exitCode = 1;
    }
  } finally {
    process.off('SIGINT', onInterrupt);
    process.off('SIGTERM', onInterrupt);
    await teardownAuditChildren();
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error('[cdp-audit] FAIL', e);
    process.exit(1);
  });
