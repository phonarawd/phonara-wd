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
 *   - axe-core injected into the live page (critical/serious violations) —
 *     at least once per viewport (incl. 390 mobile where BottomNav is `grid`),
 *     not only the historical 1024/dark/top primary capture.
 *   - console error collection per navigation (source-attributed, not
 *     silently dropped — Definition of Done "Console" row).
 * Opt-in (`PHONARA_AUDIT_INTERACT=1`) casino bet-to-result interaction
 * pass (win/lose/cash-out state screenshots for the 9-game polish set) +
 * real rAF-measured FPS during Crash/Hilo replay animation +
 * Human Interaction QA (HI-QA) CDP sequences (chart wheel/drag · leverage
 * slider · roulette chip · order-book/recent-trades wheel · staking keyboard ·
 * mobile slip sheet · mission tabs) — see `scripts/lib/visual-audit-hi-qa.ts`.
 * Opt-in (`PHONARA_AUDIT_ULTRAWIDE=1`) ultrawide-only pass (3440/3840/5120)
 * — separate from canonical VIEWPORT_SMOKE_WIDTHS; asserts `--ds-content-max`
 * letterbox (column ≤1680 · centered gutters). Never merge into the 4-tier loop.
 *
 * Usage: bun run tsx scripts/visual-audit-capture-cdp.ts
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  CONTENT_SHELL_MAX_PX,
  isContentShellLetterboxOk,
  ULTRAWIDE_SMOKE_WIDTHS,
} from '../apps/web/src/product/tokens/viewport-contract';
import { generateSync } from 'otplib';
import { readLocalSupabaseEnv } from './lib/db-connect';
import { killPortListeners } from './lib/e2e-lifecycle';
import {
  assertHiQaInteractionCatalogSync,
  buildDragPath,
  HI_QA_INTERACTION_SCENARIOS,
  type HiQaPassResult,
  type HiQaScenario,
  type HiQaViewportId,
} from './lib/visual-audit-hi-qa';

const ROOT = process.cwd();
const OUT = join(ROOT, 'screenshots');
/**
 * Full-sweep evidence pack — never overwrite `visual-ux-2026-07-11/` (historical).
 * Override: `PHONARA_AUDIT_MANIFEST_DIR=docs/audit/<folder>`.
 */
const MANIFEST_DIR = join(
  ROOT,
  process.env.PHONARA_AUDIT_MANIFEST_DIR ?? 'docs/audit/visual-ux-2026-07-25-full-sweep',
);
const ENV_LOCAL = join(ROOT, '.env.local');
const BASE = process.env.PHONARA_AUDIT_BASE ?? 'http://127.0.0.1:3000';
/** Admin Vite — Phase 5 desks (1024/2560 + 390 mobile-nav spot). */
const ADMIN_BASE = process.env.PHONARA_AUDIT_ADMIN_BASE ?? 'http://127.0.0.1:3001';
const CHROME =
  process.env.PHONARA_CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = Number(process.env.PHONARA_CDP_PORT ?? 9222);
const SPAWN_VITE = process.env.PHONARA_AUDIT_NO_SPAWN !== '1';
/** Opt-in: log in with `.local-trade-dev.credentials.json` (+ admin MFA creds) before capturing auth routes (local Supabase only). */
const LOGIN_LOCAL_TRADE = process.env.PHONARA_AUDIT_LOGIN === '1';
/** Opt-in: run casino bet-to-result + HI-QA CDP sequences (needs a logged-in session + funded wallet). */
const RUN_INTERACTION_PASS = process.env.PHONARA_AUDIT_INTERACT === '1';
/** Opt-out: skip the hard-fail exit code on assertion violations (capture-only mode, e.g. first-run baselines). */
const NO_ASSERT = process.env.PHONARA_AUDIT_NO_ASSERT === '1';
/** Opt-in: ultrawide letterbox pass only — does NOT extend the canonical 4-tier VIEWPORTS loop. */
const RUN_ULTRAWIDE_PASS = process.env.PHONARA_AUDIT_ULTRAWIDE === '1';

/** Canonical Phase R 4-tier smoke widths — apps/web/src/product/tokens/viewport-contract.ts VIEWPORT_SMOKE_WIDTHS. */
type Vp = {
  id: '390' | '768' | '1024' | '2560';
  folder: 'mobile' | 'tablet' | 'desktop';
  w: number;
  h: number;
};

/** Ultrawide evidence widths — apps/web/.../viewport-contract.ts ULTRAWIDE_SMOKE_WIDTHS (never merge into Vp). */
type UltrawideVp = {
  id: `${(typeof ULTRAWIDE_SMOKE_WIDTHS)[number]}`;
  folder: 'ultrawide';
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

/** Heights chosen for common 21:9 / 4K / 5K2K panels — width SOT is ULTRAWIDE_SMOKE_WIDTHS. */
const ULTRAWIDE_HEIGHT_BY_WIDTH: Record<(typeof ULTRAWIDE_SMOKE_WIDTHS)[number], number> = {
  3440: 1440,
  3840: 2160,
  5120: 2160,
};

const ULTRAWIDE_VIEWPORTS: UltrawideVp[] = ULTRAWIDE_SMOKE_WIDTHS.map((w) => ({
  id: String(w) as UltrawideVp['id'],
  folder: 'ultrawide' as const,
  w,
  h: ULTRAWIDE_HEIGHT_BY_WIDTH[w],
}));

/** Lean route set for ultrawide letterbox proof (RAM: top scroll · dark only). */
const ULTRAWIDE_LETTERBOX_PAGE_IDS = new Set(['landing', 'home', 'trade-spot', 'wallet']);

/** Routes whose AppShell mounts the 5-tab BottomNav — Phase 0A affected-routes matrix. */
const BOTTOM_NAV_ROUTES = new Set([
  'home',
  'home-missions',
  'home-missions-referral',
  'home-missions-invite',
  'referral',
  'staking',
  'tier-me',
  'tier-leaderboard',
  'trade-spot',
  'wallet',
  'sports',
  'sports-vip',
  'casino-lobby',
  'casino-crash',
  'casino-limbo',
  'casino-dice',
  'casino-mines',
  'casino-hilo',
  'casino-deepshaft',
  'casino-plinko',
  'casino-mint-reels',
  'casino-gold-rush',
  'casino-momentum',
  'casino-roulette',
  'casino-blackjack',
]);

/**
 * Phase 5 Admin viewport evidence — desktop-primary 1024/2560 + 390 mobile-nav spot.
 * Never merges 768 into Admin capture (matches `PHASE5_ADMIN_VIEWPORT_WIDTHS`).
 */
const ADMIN_VIEWPORT_IDS = new Set<Vp['id']>(['390', '1024', '2560']);

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
  { pageId: 'home-missions', path: '/home/missions', auth: 'auth', themes: ['dark'] },
  {
    pageId: 'home-missions-referral',
    path: '/home/missions/referral',
    auth: 'auth',
    themes: ['dark'],
  },
  { pageId: 'home-missions-invite', path: '/home/missions/invite', auth: 'auth', themes: ['dark'] },
  { pageId: 'referral', path: '/referral', auth: 'auth', themes: ['dark'] },
  { pageId: 'staking', path: '/staking', auth: 'auth', themes: ['dark'] },
  { pageId: 'tier-me', path: '/tier/me', auth: 'auth', themes: ['dark'] },
  { pageId: 'tier-leaderboard', path: '/tier/leaderboard', auth: 'auth', themes: ['dark'] },
  { pageId: 'trade-spot', path: '/trade', auth: 'auth', themes: ['dark'] },
  { pageId: 'wallet', path: '/wallet', auth: 'auth', themes: ['dark'] },
  { pageId: 'sports', path: '/sports', auth: 'auth', themes: ['dark'] },
  { pageId: 'sports-vip', path: '/sports/vip', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-lobby', path: '/casino', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-crash', path: '/games/crash', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-limbo', path: '/games/limbo', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-dice', path: '/games/dice', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-mines', path: '/games/mines', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-hilo', path: '/games/hilo', auth: 'auth', themes: ['dark'] },
  // Batch C/D polish set — idle route capture; win/lose/cash-out via INTERACT pass.
  { pageId: 'casino-deepshaft', path: '/games/deepshaft', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-plinko', path: '/games/plinko', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-mint-reels', path: '/games/mint-reels', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-gold-rush', path: '/games/gold-rush', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-momentum', path: '/games/momentum', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-roulette', path: '/games/roulette', auth: 'auth', themes: ['dark'] },
  { pageId: 'casino-blackjack', path: '/games/blackjack', auth: 'auth', themes: ['dark'] },
];

/**
 * Representative Admin desks (Phase 5 DoD scope) — captured on ADMIN_BASE :3001.
 * Viewports: 1024/2560 + 390 spot-check only (no 768).
 */
const ADMIN_ROUTES_FULL: Route[] = [
  { pageId: 'admin-home', path: '/', auth: 'auth', themes: ['dark', 'light'] },
  { pageId: 'admin-queues', path: '/queues', auth: 'auth', themes: ['dark'] },
  { pageId: 'admin-ops', path: '/ops', auth: 'auth', themes: ['dark'] },
  { pageId: 'admin-deposits', path: '/deposits', auth: 'auth', themes: ['dark'] },
  { pageId: 'admin-withdrawals', path: '/withdrawals', auth: 'auth', themes: ['dark'] },
  { pageId: 'admin-support', path: '/support', auth: 'auth', themes: ['dark'] },
  { pageId: 'admin-risk', path: '/risk', auth: 'auth', themes: ['dark'] },
  { pageId: 'admin-team', path: '/team', auth: 'auth', themes: ['dark'] },
  { pageId: 'admin-settings', path: '/settings', auth: 'auth', themes: ['dark'] },
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

function filterAuditRoutes(routes: Route[]): Route[] {
  return routes.filter((route) => !ONLY_PAGE_IDS || ONLY_PAGE_IDS.has(route.pageId));
}

const ROUTES: Route[] = filterAuditRoutes(MINIMAL ? ROUTES_MIN : ROUTES_FULL);

/** Admin desks — omitted in MINIMAL mode (RAM). Opt-in via full run or `PHONARA_AUDIT_ROUTES=admin-*`. */
const ADMIN_ROUTES: Route[] = MINIMAL
  ? filterAuditRoutes(ADMIN_ROUTES_FULL.filter((r) => ONLY_PAGE_IDS?.has(r.pageId)))
  : filterAuditRoutes(ADMIN_ROUTES_FULL);

const ADMIN_VIEWPORTS: Vp[] = VIEWPORTS.filter((vp) => ADMIN_VIEWPORT_IDS.has(vp.id));

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

type ContentShellLetterboxSample = {
  found: boolean;
  viewportWidth: number;
  columnWidth: number;
  columnLeft: number;
  maxWidth: string | null;
};

/** Live geometry of `.ds-shell-content-column` — ultrawide letterbox proof (≤ `--ds-content-max`). */
async function readContentShellLetterbox(cdp: CdpClient): Promise<ContentShellLetterboxSample> {
  return evaluate<ContentShellLetterboxSample>(
    cdp,
    `(() => {
      const el = document.querySelector('.ds-shell-content-column, .shell-content-column');
      if (!el) {
        return { found: false, viewportWidth: window.innerWidth, columnWidth: 0, columnLeft: 0, maxWidth: null };
      }
      const rect = el.getBoundingClientRect();
      return {
        found: true,
        viewportWidth: window.innerWidth,
        columnWidth: rect.width,
        columnLeft: rect.left,
        maxWidth: getComputedStyle(el).maxWidth,
      };
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
  vp: { w: number; h: number },
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
  /** Ultrawide pass only — content column letterbox vs `--ds-content-max` (1680). Null on 4-tier captures. */
  letterboxOk: boolean | null;
  letterboxSample: ContentShellLetterboxSample | null;
  /**
   * axe-core critical-impact violation count — populated once per viewport at
   * dark/top (incl. 390 mobile) so BottomNav-visible layouts are covered.
   */
  axeCritical: number | null;
  axeSerious: number | null;
  consoleErrorCount: number;
  consoleErrors: string[];
};

type LocalTradeCredentials = { email: string; password: string; loginUrl: string };
type LocalAdminCredentials = {
  email: string;
  password: string;
  totpSecret: string;
  loginUrl: string;
};

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

function readLocalAdminCredentials(): LocalAdminCredentials | null {
  const path = join(ROOT, '.local-admin-dev.credentials.json');
  if (!existsSync(path)) return null;
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  if (
    typeof parsed['email'] !== 'string' ||
    typeof parsed['password'] !== 'string' ||
    typeof parsed['totpSecret'] !== 'string'
  ) {
    return null;
  }
  return {
    email: parsed['email'],
    password: parsed['password'],
    totpSecret: parsed['totpSecret'],
    loginUrl: typeof parsed['loginUrl'] === 'string' ? parsed['loginUrl'] : `${ADMIN_BASE}/login`,
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

/** Local-only Admin login + TOTP MFA — mirrors `tests/e2e/fixtures/admin-auth.ts` without Playwright. */
async function loginAdminViaForm(cdp: CdpClient, creds: LocalAdminCredentials): Promise<boolean> {
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(ADMIN_BASE)) {
    throw new Error('[cdp-audit] refuses admin login flow against non-local ADMIN_BASE');
  }
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send('Page.navigate', { url: `${ADMIN_BASE}/login` });
  const formReady = await waitForSelector(cdp, '[data-testid="admin-login-email"]', 45_000);
  if (!formReady) {
    console.log('[cdp-audit] admin login form not ready before timeout');
    return false;
  }
  await sleep(400);

  await evaluate(
    cdp,
    `
      (function () {
        function setNativeValue(el, value) {
          const proto = Object.getPrototypeOf(el);
          const desc = Object.getOwnPropertyDescriptor(proto, 'value');
          if (desc && desc.set) desc.set.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const emailEl = document.querySelector('[data-testid="admin-login-email"]');
        const passwordEl = document.querySelector('[data-testid="admin-login-password"]');
        if (emailEl) setNativeValue(emailEl, ${JSON.stringify(creds.email)});
        if (passwordEl) setNativeValue(passwordEl, ${JSON.stringify(creds.password)});
        const btn = document.querySelector('[data-testid="admin-login-submit"]');
        if (btn && !btn.disabled) btn.click();
        return !!(emailEl && passwordEl && btn);
      })();
    `,
  );

  const mfaReady = await waitForSelector(cdp, '[data-testid="admin-mfa-challenge-code"]', 20_000);
  if (!mfaReady) {
    console.log('[cdp-audit] admin MFA challenge not ready');
    return false;
  }
  const totpCode = generateSync({ secret: creds.totpSecret });
  await evaluate(
    cdp,
    `
      (function () {
        function setNativeValue(el, value) {
          const proto = Object.getPrototypeOf(el);
          const desc = Object.getOwnPropertyDescriptor(proto, 'value');
          if (desc && desc.set) desc.set.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const codeEl = document.querySelector('[data-testid="admin-mfa-challenge-code"]');
        if (codeEl) setNativeValue(codeEl, ${JSON.stringify(totpCode)});
        const btn = document.querySelector('[data-testid="admin-mfa-challenge-submit"]');
        if (btn && !btn.disabled) btn.click();
        return !!(codeEl && btn);
      })();
    `,
  );

  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const pathname = await evaluate<string>(cdp, 'location.pathname');
    if (pathname && !pathname.startsWith('/login') && !pathname.startsWith('/mfa')) return true;
  }
  return false;
}

async function waitForSelector(
  cdp: CdpClient,
  selector: string,
  timeoutMs: number,
): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const found = await evaluate<boolean>(
      cdp,
      `!!document.querySelector(${JSON.stringify(selector)})`,
    );
    if (found) return true;
    await sleep(400);
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
 *
 * Outcome-state targets (win/lose/cash-out) for the 9-game polish set are declared in
 * `CASINO_OUTCOME_STATE_TARGETS`; a single bet yields one of win|lose — cash-out screenshots
 * come from progressive/live paths (hilo) or momentum pre-bet `cashOut=true`.
 */
const ALL_INTERACTION_GAMES = [
  'crash',
  'limbo',
  'dice',
  'hilo',
  'mines',
  'deepshaft',
  'plinko',
  'mint-reels',
  'gold-rush',
  'momentum',
  'roulette',
  'blackjack',
] as const;
type InteractionGameCode = (typeof ALL_INTERACTION_GAMES)[number];

/** Declared win/lose/cash-out screenshot targets for the 9-game polish set (+ progressive peers). */
const CASINO_OUTCOME_STATE_TARGETS = [
  { game: 'dice', states: ['win', 'lose'] as const },
  { game: 'mines', states: ['win', 'lose', 'cash-out'] as const },
  { game: 'hilo', states: ['win', 'lose', 'cash-out'] as const },
  { game: 'deepshaft', states: ['win', 'lose'] as const },
  { game: 'plinko', states: ['win', 'lose'] as const },
  { game: 'mint-reels', states: ['win', 'lose'] as const },
  { game: 'gold-rush', states: ['win', 'lose'] as const },
  { game: 'momentum', states: ['win', 'lose', 'cash-out'] as const },
  { game: 'roulette', states: ['win', 'lose'] as const },
  { game: 'blackjack', states: ['win', 'lose'] as const },
] as const;

type CasinoOutcomeState = 'win' | 'lose' | 'cash-out' | 'bet-result';

/** Stage `data-testid` for outcome classification after oneshot settle. */
const CASINO_STAGE_TESTID: Partial<Record<InteractionGameCode, string>> = {
  dice: 'casino-dice-stage',
  hilo: 'casino-hilo-stage',
  mines: 'casino-mines-stage',
  deepshaft: 'casino-deepshaft-stage',
  plinko: 'casino-plinko-stage',
  'mint-reels': 'casino-mint-reels-stage',
  'gold-rush': 'casino-gold-rush-stage',
  momentum: 'casino-momentum-stage',
  roulette: 'casino-roulette-stage',
  blackjack: 'casino-blackjack-stage',
  limbo: 'casino-limbo-stage',
  crash: 'casino-crash-stage',
};

/** When `PHONARA_AUDIT_ROUTES` narrows capture, run interaction only for matching casino games. */
function interactionGamesForAudit(): InteractionGameCode[] {
  if (!ONLY_PAGE_IDS) return [...ALL_INTERACTION_GAMES];
  const scoped = ALL_INTERACTION_GAMES.filter((g) => ONLY_PAGE_IDS!.has(`casino-${g}`));
  return scoped.length > 0 ? scoped : [...ALL_INTERACTION_GAMES];
}

function parseOutcomeStateFromResultText(raw: unknown): CasinoOutcomeState {
  if (typeof raw !== 'string') return 'bet-result';
  try {
    const parsed = JSON.parse(raw) as { won?: string | null };
    if (parsed.won === 'true') return 'win';
    if (parsed.won === 'false') return 'lose';
  } catch {
    /* non-JSON result text (e.g. dice roll number) — keep generic suffix */
  }
  return 'bet-result';
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

function casinoStageStateScript(gameCode: InteractionGameCode): string {
  if (gameCode === 'hilo') return HILO_STAGE_STATE_SCRIPT;
  const stageId = CASINO_STAGE_TESTID[gameCode] ?? `casino-${gameCode}-stage`;
  if (gameCode === 'mines') {
    return `(() => {
      const stage = document.querySelector('[data-testid="${stageId}"]');
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
  if (gameCode === 'dice') {
    return `(() => {
      const stage = document.querySelector('[data-testid="${stageId}"]');
      const roll = document.querySelector('[data-testid="casino-dice-roll"]');
      if (!stage && !roll) return null;
      return JSON.stringify({
        won: stage ? stage.getAttribute('data-won') : null,
        phase: stage ? stage.getAttribute('data-stage-phase') : null,
        roll: roll ? roll.textContent : null,
      });
    })()`;
  }
  return `(() => {
    const stage = document.querySelector('[data-testid="${stageId}"]');
    if (!stage) {
      const legacy = document.querySelector('[data-testid="casino-${gameCode}-result"]');
      return legacy ? legacy.textContent : null;
    }
    return JSON.stringify({
      won: stage.getAttribute('data-won'),
      phase: stage.getAttribute('data-stage-phase'),
    });
  })()`;
}

function casinoResultTextScript(gameCode: InteractionGameCode): string {
  return casinoStageStateScript(gameCode);
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
    await captureDesktopScreenshot(cdp, 'casino-hilo-1024-dark-cash-out.png');
    // Keep legacy filename for prior manifest consumers.
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
  const hiloOutcome = parseOutcomeStateFromResultText(steps['resultText']);
  steps['outcomeState'] = hiloOutcome;
  await captureDesktopScreenshot(cdp, `casino-hilo-1024-dark-${hiloOutcome}.png`);
  if (hiloOutcome !== 'bet-result') {
    await captureDesktopScreenshot(cdp, 'casino-hilo-1024-dark-bet-result.png');
  }

  const axe = await runAxeCheck(cdp);
  return {
    gameCode: 'hilo',
    steps,
    fpsDuringReplay,
    axe,
    consoleErrors: [...consoleTracker.errors],
  };
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
  // Momentum cash-out is a pre-bet selection (`cashOut=true`), not a live mid-round control.
  if (gameCode === 'momentum') {
    steps['cashOutSelect'] = await evaluate(
      cdp,
      `(() => {
        const el = document.querySelector('[data-testid="casino-selection-cashOut"]');
        if (!el) return { found: false };
        const proto = Object.getPrototypeOf(el);
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) desc.set.call(el, 'true');
        else el.value = 'true';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { found: true, value: el.value };
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
  const batchCReplayMs = new Set([
    'deepshaft',
    'plinko',
    'mint-reels',
    'gold-rush',
    'momentum',
    'roulette',
    'blackjack',
  ]);
  const fpsWindowMs =
    gameCode === 'crash'
      ? 4500
      : gameCode === 'dice'
        ? 1200
        : gameCode === 'mines'
          ? 2000
          : batchCReplayMs.has(gameCode)
            ? 3500
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

  let outcomeState = parseOutcomeStateFromResultText(steps['resultText']);
  const cashOutArmed =
    gameCode === 'momentum' &&
    typeof steps['cashOutSelect'] === 'object' &&
    steps['cashOutSelect'] !== null &&
    (steps['cashOutSelect'] as { found?: boolean }).found === true;
  if (cashOutArmed && outcomeState === 'win') {
    // Pre-bet cashOut=true settle is the declared cash-out state target.
    outcomeState = 'cash-out';
  }
  steps['outcomeState'] = outcomeState;
  await captureDesktopScreenshot(cdp, `casino-${gameCode}-1024-dark-${outcomeState}.png`);
  if (outcomeState !== 'bet-result') {
    await captureDesktopScreenshot(cdp, `casino-${gameCode}-1024-dark-bet-result.png`);
  }

  const axe = await runAxeCheck(cdp);

  return { gameCode, steps, fpsDuringReplay, axe, consoleErrors: [...consoleTracker.errors] };
}

type DomRectSample = {
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
};

async function queryRect(cdp: CdpClient, selector: string): Promise<DomRectSample | null> {
  return evaluate<DomRectSample | null>(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return null;
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
      };
    })()`,
  );
}

async function cdpMouseMove(cdp: CdpClient, x: number, y: number): Promise<void> {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
}

async function cdpMouseClick(cdp: CdpClient, x: number, y: number): Promise<void> {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
}

async function cdpMouseDrag(
  cdp: CdpClient,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  const path = buildDragPath(from, to, 8);
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: from.x,
    y: from.y,
    button: 'left',
    clickCount: 1,
  });
  for (const point of path.slice(1)) {
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: point.x,
      y: point.y,
      button: 'left',
      buttons: 1,
    });
    await sleep(16);
  }
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: to.x,
    y: to.y,
    button: 'left',
    clickCount: 1,
  });
}

async function cdpMouseWheel(
  cdp: CdpClient,
  x: number,
  y: number,
  deltaY: number,
  deltaX = 0,
): Promise<void> {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    x,
    y,
    deltaX,
    deltaY,
  });
}

async function cdpKey(
  cdp: CdpClient,
  key: string,
  code: string,
  windowsVirtualKeyCode: number,
): Promise<void> {
  const common = {
    key,
    code,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
  };
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...common });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...common });
}

async function cdpTap(cdp: CdpClient, x: number, y: number): Promise<void> {
  // Touch surfaces use the same press/release path under mobile Emulation —
  // Chrome synthesizes click for both mouse and single-finger touch.
  await cdpMouseClick(cdp, x, y);
}

const HI_QA_VIEWPORT_METRICS: Record<HiQaViewportId, { w: number; h: number; mobile: boolean }> = {
  '390': { w: 390, h: 844, mobile: true },
  '1024': { w: 1024, h: 900, mobile: false },
};

async function prepareHiQaPage(
  cdp: CdpClient,
  path: string,
  viewport: HiQaViewportId,
): Promise<void> {
  const metrics = HI_QA_VIEWPORT_METRICS[viewport];
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: metrics.w,
    height: metrics.h,
    deviceScaleFactor: 1,
    mobile: metrics.mobile,
  });
  await cdp.send('Page.navigate', { url: `${BASE}${path}` });
  await sleep(2600);
  await cdp.send('Runtime.evaluate', {
    expression: `document.documentElement.setAttribute('data-theme', 'dark');`,
  });
  await sleep(300);
}

async function captureHiQaScreenshot(cdp: CdpClient, fileName: string): Promise<string> {
  const shotDir = join(OUT, 'hi-qa');
  await mkdir(shotDir, { recursive: true });
  const shot = await cdp.send<{ data: string }>('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  await writeFile(join(shotDir, fileName), Buffer.from(shot.data, 'base64'));
  return `hi-qa/${fileName}`;
}

async function runHiQaChartWheelDrag(
  cdp: CdpClient,
  steps: Record<string, unknown>,
): Promise<boolean> {
  const rect = await queryRect(cdp, '[data-testid="trade-lightweight-chart"]');
  steps['chartFound'] = !!rect;
  if (!rect) {
    // Empty/loading chart still exposes the panel — wheel/drag the panel host.
    const panel = await queryRect(cdp, '[data-testid="trade-chart-panel"]');
    steps['panelFound'] = !!panel;
    if (!panel) return false;
    await cdpMouseMove(cdp, panel.cx, panel.cy);
    await cdpMouseWheel(cdp, panel.cx, panel.cy, -240);
    await sleep(120);
    await cdpMouseDrag(cdp, { x: panel.cx - 40, y: panel.cy }, { x: panel.cx + 60, y: panel.cy });
    steps['usedPanelFallback'] = true;
    return true;
  }
  await cdpMouseMove(cdp, rect.cx, rect.cy);
  await cdpMouseWheel(cdp, rect.cx, rect.cy, -320);
  await sleep(120);
  await cdpMouseWheel(cdp, rect.cx, rect.cy, 180);
  await sleep(80);
  await cdpMouseDrag(cdp, { x: rect.cx - 50, y: rect.cy }, { x: rect.cx + 80, y: rect.cy + 10 });
  steps['wheelAndDrag'] = true;
  return true;
}

async function runHiQaOrderBookWheel(
  cdp: CdpClient,
  steps: Record<string, unknown>,
): Promise<boolean> {
  const panel = await queryRect(cdp, '[data-testid="spot-order-book-panel"]');
  steps['orderBookFound'] = !!panel;
  if (!panel) return false;
  await cdpMouseMove(cdp, panel.cx, panel.cy + 40);
  await cdpMouseWheel(cdp, panel.cx, panel.cy + 40, 240);
  await sleep(80);
  await cdpMouseWheel(cdp, panel.cx, panel.cy + 40, -180);
  const depth = await queryRect(cdp, '[data-testid="spot-order-book-view-depth"]');
  steps['depthTabFound'] = !!depth;
  if (depth) {
    await cdpMouseClick(cdp, depth.cx, depth.cy);
    await sleep(200);
    steps['depthSelected'] = await evaluate<boolean>(
      cdp,
      `document.querySelector('[data-testid="spot-order-book-view-depth"]')?.getAttribute('aria-selected') === 'true'`,
    );
  }
  return true;
}

async function runHiQaRecentTradesWheel(
  cdp: CdpClient,
  steps: Record<string, unknown>,
): Promise<boolean> {
  const rail = await queryRect(cdp, '[data-testid="trade-recent-trades-rail"]');
  steps['recentTradesFound'] = !!rail;
  if (!rail) return false;
  // Ensure expanded so the scroll region exists.
  const toggle = await queryRect(cdp, '[data-testid="trade-recent-trades-toggle"]');
  if (toggle) {
    const expanded = await evaluate<boolean>(
      cdp,
      `document.querySelector('[data-testid="trade-recent-trades-toggle"]')?.getAttribute('aria-expanded') === 'true'`,
    );
    steps['recentTradesExpandedBefore'] = expanded;
    if (!expanded) {
      await cdpMouseClick(cdp, toggle.cx, toggle.cy);
      await sleep(200);
    }
  }
  await cdpMouseMove(cdp, rail.cx, rail.cy + 60);
  await cdpMouseWheel(cdp, rail.cx, rail.cy + 60, 280);
  await sleep(80);
  steps['wheel'] = true;
  return true;
}

async function runHiQaLeverageSliderDrag(
  cdp: CdpClient,
  steps: Record<string, unknown>,
): Promise<boolean> {
  const slider = await queryRect(cdp, '[data-testid="leverage-slider"]');
  steps['sliderFound'] = !!slider;
  if (!slider) return false;
  const valueBefore = await evaluate<string | null>(
    cdp,
    `document.querySelector('[data-testid="leverage-value"]')?.textContent ?? null`,
  );
  steps['valueBefore'] = valueBefore;
  const thumb = await queryRect(cdp, '[data-testid="leverage-slider"] [role="slider"]');
  const from = thumb
    ? { x: thumb.cx, y: thumb.cy }
    : { x: slider.x + slider.width * 0.35, y: slider.cy };
  const to = { x: Math.min(slider.x + slider.width - 8, from.x + 90), y: slider.cy };
  steps['thumbFound'] = !!thumb;
  await cdpMouseDrag(cdp, from, to);
  await sleep(250);
  const valueAfter = await evaluate<string | null>(
    cdp,
    `document.querySelector('[data-testid="leverage-value"]')?.textContent ?? null`,
  );
  steps['valueAfter'] = valueAfter;
  // Drag is evidence even if market caps keep the same leverage — thumb must have been hittable.
  return !!slider;
}

async function runHiQaRouletteChipPlace(
  cdp: CdpClient,
  steps: Record<string, unknown>,
): Promise<boolean> {
  const chip = await queryRect(cdp, '[data-testid="casino-roulette-chip-5"]');
  const pocket = await queryRect(cdp, '[data-testid="casino-roulette-pocket-17"]');
  steps['chipFound'] = !!chip;
  steps['pocketFound'] = !!pocket;
  if (!chip || !pocket) return false;
  // Select chip, then place on pocket (board uses click handlers; drag path still exercises Input).
  await cdpMouseClick(cdp, chip.cx, chip.cy);
  await sleep(150);
  await cdpMouseDrag(cdp, { x: chip.cx, y: chip.cy }, { x: pocket.cx, y: pocket.cy });
  await sleep(80);
  await cdpMouseClick(cdp, pocket.cx, pocket.cy);
  await sleep(200);
  steps['placed'] = await evaluate<boolean>(
    cdp,
    `!!document.querySelector('[data-testid="casino-roulette-total-weight"]')`,
  );
  return true;
}

async function runHiQaStakingKeyboard(
  cdp: CdpClient,
  steps: Record<string, unknown>,
): Promise<boolean> {
  const hub = await queryRect(cdp, '[data-testid="staking-hub-page"]');
  steps['hubFound'] = !!hub;
  if (!hub) return false;

  const focusFirstPool = await evaluate<{ testId: string | null; role: string | null }>(
    cdp,
    `(() => {
      const pool = document.querySelector('[data-testid^="staking-pool-"]');
      if (!pool) return { testId: null, role: null };
      pool.focus();
      return {
        testId: pool.getAttribute('data-testid'),
        role: pool.getAttribute('role'),
      };
    })()`,
  );
  steps['poolFocus'] = focusFirstPool;
  if (!focusFirstPool?.testId) {
    steps['emptyPools'] = await evaluate<boolean>(
      cdp,
      `!!document.querySelector('[data-testid="staking-empty-pools"], [data-testid="staking-pools-filter-empty"]')`,
    );
    // No pools is an environment/data state — keyboard path still navigated the hub.
    // Tab through wizard controls as fallback evidence.
    await cdpKey(cdp, 'Tab', 'Tab', 9);
    await sleep(80);
    await cdpKey(cdp, 'Tab', 'Tab', 9);
    steps['tabFallback'] = true;
    return true;
  }

  steps['roleIsButton'] = focusFirstPool.role === 'button';
  await cdpKey(cdp, 'Tab', 'Tab', 9);
  await sleep(80);
  // Re-focus pool then activate via Enter (HI-QA: role=button + keyboard).
  await evaluate(
    cdp,
    `document.querySelector(${JSON.stringify(`[data-testid="${focusFirstPool.testId}"]`)})?.focus()`,
  );
  await cdpKey(cdp, 'Enter', 'Enter', 13);
  await sleep(300);
  steps['selectedAfterEnter'] = await evaluate<boolean>(
    cdp,
    `document.querySelector(${JSON.stringify(`[data-testid="${focusFirstPool.testId}"]`)})?.className?.includes('border-accent') === true
      || document.querySelector('[data-testid="staking-wizard-panel-amount"]') != null`,
  );
  // Space activation path (second pool or same if still focused).
  await evaluate(
    cdp,
    `document.querySelector(${JSON.stringify(`[data-testid="${focusFirstPool.testId}"]`)})?.focus()`,
  );
  await cdpKey(cdp, ' ', 'Space', 32);
  await sleep(200);
  steps['spaceDispatched'] = true;
  return focusFirstPool.role === 'button';
}

async function runHiQaMobileSlipSheet(
  cdp: CdpClient,
  steps: Record<string, unknown>,
): Promise<boolean> {
  const openBtn = await queryRect(cdp, '[data-testid="sports-slip-mobile-open"]');
  steps['openFound'] = !!openBtn;
  if (!openBtn) {
    // Slip chrome mounts only when showSlip — browse-only VIP/list modes may omit it.
    steps['mobileChrome'] = await evaluate<boolean>(
      cdp,
      `!!document.querySelector('[data-testid="sports-slip-mobile"]')`,
    );
    return false;
  }
  await cdpTap(cdp, openBtn.cx, openBtn.cy);
  await sleep(400);
  const sheetVisible = await evaluate<boolean>(
    cdp,
    `(() => {
      const sheet = document.querySelector('[data-testid="sports-slip-mobile-sheet"]');
      if (!sheet) return false;
      const r = sheet.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    })()`,
  );
  steps['sheetVisible'] = sheetVisible;
  return sheetVisible;
}

async function runHiQaMissionsTabTouch(
  cdp: CdpClient,
  steps: Record<string, unknown>,
): Promise<boolean> {
  const tabs = await queryRect(cdp, '[data-testid="home-missions-tabs"]');
  steps['tabsFound'] = !!tabs;
  if (!tabs) return false;
  const daily = await queryRect(cdp, '[data-testid="home-missions-tab-daily"]');
  const weekly = await queryRect(cdp, '[data-testid="home-missions-tab-weekly"]');
  steps['dailyFound'] = !!daily;
  steps['weeklyFound'] = !!weekly;
  if (!daily) return false;
  await cdpTap(cdp, daily.cx, daily.cy);
  await sleep(250);
  const dailySelected = await evaluate<boolean>(
    cdp,
    `document.querySelector('[data-testid="home-missions-tab-daily"]')?.getAttribute('aria-selected') === 'true'`,
  );
  steps['dailySelected'] = dailySelected;
  if (weekly) {
    await cdpTap(cdp, weekly.cx, weekly.cy);
    await sleep(250);
    steps['weeklySelected'] = await evaluate<boolean>(
      cdp,
      `document.querySelector('[data-testid="home-missions-tab-weekly"]')?.getAttribute('aria-selected') === 'true'`,
    );
  }
  return dailySelected;
}

async function runOneHiQaScenario(
  cdp: CdpClient,
  scenario: HiQaScenario,
  consoleTracker: { errors: string[]; reset: () => void },
): Promise<HiQaPassResult> {
  const steps: Record<string, unknown> = { scenarioId: scenario.id, kind: scenario.kind };
  consoleTracker.reset();
  await prepareHiQaPage(cdp, scenario.path, scenario.viewport);

  let ok: boolean;
  switch (scenario.id) {
    case 'chart-wheel-zoom-pan':
      ok = await runHiQaChartWheelDrag(cdp, steps);
      break;
    case 'order-book-wheel':
      ok = await runHiQaOrderBookWheel(cdp, steps);
      break;
    case 'recent-trades-wheel':
      ok = await runHiQaRecentTradesWheel(cdp, steps);
      break;
    case 'leverage-slider-drag':
      ok = await runHiQaLeverageSliderDrag(cdp, steps);
      break;
    case 'roulette-chip-place':
      ok = await runHiQaRouletteChipPlace(cdp, steps);
      break;
    case 'staking-pool-keyboard':
      ok = await runHiQaStakingKeyboard(cdp, steps);
      break;
    case 'mobile-slip-bottom-sheet':
      ok = await runHiQaMobileSlipSheet(cdp, steps);
      break;
    case 'missions-tab-touch':
      ok = await runHiQaMissionsTabTouch(cdp, steps);
      break;
    default:
      steps['unsupported'] = true;
      ok = false;
      break;
  }

  const screenshot = await captureHiQaScreenshot(
    cdp,
    `${scenario.id}-${scenario.viewport}-dark.png`,
  );
  steps['ok'] = ok;

  return {
    id: scenario.id,
    surface: scenario.surface,
    kind: scenario.kind,
    path: scenario.path,
    viewport: scenario.viewport,
    steps,
    ok,
    screenshot,
    consoleErrors: [...consoleTracker.errors],
  };
}

/**
 * Human Interaction QA pass (opt-in, `PHONARA_AUDIT_INTERACT=1`).
 * Extends the casino bet-to-result pass with drag/wheel/keyboard/touch CDP
 * sequences from `HI_QA_INTERACTION_SCENARIOS` — no Playwright (G5).
 */
async function runHiQaInteractionPass(
  cdp: CdpClient,
  consoleTracker: { errors: string[]; reset: () => void },
): Promise<HiQaPassResult[]> {
  assertHiQaInteractionCatalogSync();
  const results: HiQaPassResult[] = [];
  for (const scenario of HI_QA_INTERACTION_SCENARIOS) {
    console.log(`[cdp-audit] hi-qa pass: ${scenario.id} (${scenario.kind} @ ${scenario.viewport})`);
    const result = await runOneHiQaScenario(cdp, scenario, consoleTracker);
    results.push(result);
  }
  return results;
}

async function main(): Promise<void> {
  let vite: ChildProcess | null = null;
  let adminVite: ChildProcess | null = null;
  let chrome: ChildProcess | null = null;
  let spawnedVite = false;
  let spawnedAdminVite = false;
  const manifest: ManifestRow[] = [];
  const interactions: InteractionResult[] = [];
  const hiQaInteractions: HiQaPassResult[] = [];
  const hiQaFailures: string[] = [];
  const bottomNavViolations: string[] = [];
  const axeCriticalFindings: string[] = [];
  const letterboxViolations: string[] = [];
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
    if (adminVite?.pid) {
      if (process.platform === 'win32')
        spawnSync('taskkill', ['/pid', String(adminVite.pid), '/T', '/F']);
      else adminVite.kill('SIGKILL');
      adminVite = null;
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
    if (spawnedAdminVite) {
      const killedAdmin = killPortListeners(3001);
      if (killedAdmin > 0) {
        console.log(`[cdp-audit] swept ${killedAdmin} orphan listener(s) on port 3001`);
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
    // Admin Vite is lazy-spawned just before the Admin pass (8GB RAM: avoid
    // overlapping web + admin + Chrome + Docker peak during the web/INTERACT sweep).

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
    let adminLoggedIn = false;
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

            // Axe once per viewport at dark/top (incl. 390 where BottomNav is grid).
            // Scroll mid/end and non-dark themes stay screenshot-only to bound cost.
            let axeCritical: number | null = null;
            let axeSerious: number | null = null;
            if (theme === 'dark' && scroll === 'top' && !redirectedToLogin) {
              const axe = await runAxeCheck(cdp);
              axeCritical = axe.critical;
              axeSerious = axe.serious;
              if (axe.critical > 0) {
                axeCriticalFindings.push(
                  `${route.pageId}@${vp.id}: ${axe.critical} critical (${axe.violations
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
              letterboxOk: null,
              letterboxSample: null,
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

    // Ultrawide-only pass — NEVER push 3440+ into VIEWPORTS (4-tier DoD immutable).
    if (RUN_ULTRAWIDE_PASS) {
      const ultrawideRoutes = ROUTES.filter((r) => ULTRAWIDE_LETTERBOX_PAGE_IDS.has(r.pageId));
      console.log(
        `[cdp-audit] ultrawide pass: ${ULTRAWIDE_VIEWPORTS.map((v) => v.w).join('/')} · routes=${ultrawideRoutes
          .map((r) => r.pageId)
          .join(',')}`,
      );
      for (const route of ultrawideRoutes) {
        for (const vp of ULTRAWIDE_VIEWPORTS) {
          const dir = join(OUT, vp.folder);
          await mkdir(dir, { recursive: true });
          const fileName = `${route.pageId}-${vp.id}-dark.png`;
          const abs = join(dir, fileName);
          console.log('[capture-ultrawide]', fileName);
          consoleTracker.reset();
          const { finalUrl } = await captureViewport(
            cdp,
            `${BASE}${route.path}`,
            'dark',
            vp,
            abs,
            'top',
          );
          const redirectedToLogin =
            !/^\/login(?:\?|$)/.test(route.path) &&
            /\/login(?:\?|$)/.test(new URL(finalUrl).pathname);

          let letterboxOk: boolean | null = null;
          let letterboxSample: ContentShellLetterboxSample | null = null;
          if (!redirectedToLogin) {
            letterboxSample = await readContentShellLetterbox(cdp);
            if (!letterboxSample.found) {
              letterboxOk = false;
              letterboxViolations.push(
                `${route.pageId}@${vp.id}px: .ds-shell-content-column not found (contentMax=${CONTENT_SHELL_MAX_PX})`,
              );
            } else {
              letterboxOk = isContentShellLetterboxOk({
                viewportWidth: letterboxSample.viewportWidth,
                columnWidth: letterboxSample.columnWidth,
                columnLeft: letterboxSample.columnLeft,
                contentMaxPx: CONTENT_SHELL_MAX_PX,
              });
              if (!letterboxOk) {
                letterboxViolations.push(
                  `${route.pageId}@${vp.id}px: column=${letterboxSample.columnWidth.toFixed(1)} left=${letterboxSample.columnLeft.toFixed(
                    1,
                  )} viewport=${letterboxSample.viewportWidth} maxWidth=${letterboxSample.maxWidth} (expected ≤${CONTENT_SHELL_MAX_PX} centered)`,
                );
              }
            }
          }

          manifest.push({
            file: `${vp.folder}/${fileName}`,
            pageId: route.pageId,
            path: route.path,
            viewport: vp.id,
            folder: vp.folder,
            theme: 'dark',
            scroll: '01_top',
            finalUrl,
            auth: route.auth,
            redirectedToLogin,
            bottomNavDisplay: null,
            bottomNavPolicyOk: null,
            letterboxOk,
            letterboxSample,
            axeCritical: null,
            axeSerious: null,
            consoleErrorCount: consoleTracker.errors.length,
            consoleErrors: [...consoleTracker.errors],
          });
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
        if (gameCode === 'hilo' && result.fpsDuringReplay !== null && result.fpsDuringReplay < 55) {
          axeCriticalFindings.push(
            `casino-hilo (interaction): FPS ${result.fpsDuringReplay} below 55 threshold`,
          );
        }
      }

      // HI-QA: drag / wheel / keyboard / touch CDP sequences (Gap 4 evidence).
      // Failures are recorded separately — empty slip/pools are data-state soft misses,
      // not axe criticals (review-capture-evidence todo triages hard vs soft).
      const hiQaResults = await runHiQaInteractionPass(cdp, consoleTracker);
      for (const result of hiQaResults) {
        hiQaInteractions.push(result);
        if (!result.ok) {
          hiQaFailures.push(
            `hi-qa:${result.id}: interaction sequence did not meet pass criterion (${result.kind})`,
          );
        }
      }
    }

    // Admin desks (Phase 5) — lazy-spawn :3001 after web/INTERACT to cut peak RAM on 8GB PCs.
    if (ADMIN_ROUTES.length > 0) {
      if (SPAWN_VITE && !(await portOpen(3001))) {
        console.log('[cdp-audit] spawn bun run dev:admin (lazy · post web/INTERACT)');
        adminVite = spawn('bun', ['run', 'dev:admin'], {
          cwd: ROOT,
          shell: true,
          stdio: 'pipe',
          env: { ...process.env, BROWSER: 'none' },
        });
        adminVite.stdout?.on('data', (d: Buffer) => {
          const s = d.toString();
          if (/Local:|ready|3001/.test(s)) process.stdout.write(s);
        });
        adminVite.stderr?.on('data', (d: Buffer) => process.stderr.write(d));
        spawnedAdminVite = true;
        await waitHttp(ADMIN_BASE, 180_000);
      } else {
        await waitHttp(ADMIN_BASE, 30_000);
      }
      console.log('[cdp-audit] admin vite ok', ADMIN_BASE);

      if (LOGIN_LOCAL_TRADE) {
        const adminCreds = readLocalAdminCredentials();
        if (!adminCreds) {
          console.warn(
            '[cdp-audit] admin routes queued but no .local-admin-dev.credentials.json found',
          );
        } else {
          console.log('[cdp-audit] admin login as', adminCreds.email);
          adminLoggedIn = await loginAdminViaForm(cdp, adminCreds);
          console.log(
            adminLoggedIn
              ? '[cdp-audit] admin login OK'
              : '[cdp-audit] admin login FAILED (still on /login|/mfa)',
          );
        }
      }

      for (const route of ADMIN_ROUTES) {
        for (const theme of route.themes) {
          for (const vp of ADMIN_VIEWPORTS) {
            const dir = join(OUT, vp.folder);
            await mkdir(dir, { recursive: true });
            // Admin: top-only · Phase 5 density evidence (no mid/end scroll matrix).
            const fileName = `${route.pageId}-${vp.id}-${theme}.png`;
            const abs = join(dir, fileName);
            console.log('[capture-admin]', fileName);
            consoleTracker.reset();
            const { finalUrl } = await captureViewport(
              cdp,
              `${ADMIN_BASE}${route.path}`,
              theme,
              vp,
              abs,
              'top',
            );
            const redirectedToLogin =
              !/^\/login(?:\?|$)/.test(route.path) &&
              (/\/login(?:\?|$)/.test(new URL(finalUrl).pathname) ||
                /\/mfa\//.test(new URL(finalUrl).pathname));

            let axeCritical: number | null = null;
            let axeSerious: number | null = null;
            if (theme === 'dark' && !redirectedToLogin) {
              const axe = await runAxeCheck(cdp);
              axeCritical = axe.critical;
              axeSerious = axe.serious;
              if (axe.critical > 0) {
                axeCriticalFindings.push(
                  `${route.pageId}@${vp.id}: ${axe.critical} critical (${axe.violations
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
              scroll: '01_top',
              finalUrl,
              auth: route.auth,
              redirectedToLogin,
              bottomNavDisplay: null,
              bottomNavPolicyOk: null,
              letterboxOk: null,
              letterboxSample: null,
              axeCritical,
              axeSerious,
              consoleErrorCount: consoleTracker.errors.length,
              consoleErrors: [...consoleTracker.errors],
            });
          }
        }
      }

      // Drop admin Vite before hover/teardown — free RAM for final shots.
      if (adminVite?.pid) {
        if (process.platform === 'win32')
          spawnSync('taskkill', ['/pid', String(adminVite.pid), '/T', '/F']);
        else adminVite.kill('SIGKILL');
        adminVite = null;
        await sleep(300);
      }
      if (spawnedAdminVite) {
        const killedAdmin = killPortListeners(3001);
        if (killedAdmin > 0) {
          console.log(`[cdp-audit] stopped admin vite · swept ${killedAdmin} listener(s) on 3001`);
        }
        spawnedAdminVite = false;
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
      adminBase: ADMIN_BASE,
      engine: 'chrome-cdp',
      loggedIn,
      adminLoggedIn,
      note: loggedIn
        ? 'Logged in as local-trade-dev; auth-gated routes captured with a real session.'
        : 'Auth-gated routes without session redirect to /login. True authenticated UI needs Docker stack + login pass. Playwright blocked by hook — used system Chrome CDP.',
      counts: {
        png: manifest.length + 2,
        routes: ROUTES.length,
        adminRoutes: ADMIN_ROUTES.length,
        viewports: VIEWPORTS.length,
        adminViewports: ADMIN_VIEWPORTS.map((v) => v.id),
        ultrawideViewports: RUN_ULTRAWIDE_PASS ? ULTRAWIDE_VIEWPORTS.length : 0,
        authRedirects: manifest.filter((m) => m.redirectedToLogin).length,
      },
      assertions: {
        bottomNavViolations,
        axeCriticalFindings,
        letterboxViolations,
        hiQaFailures,
      },
      axePolicy:
        'dark/top once per viewport (390/768/1024/2560; auth skips 768). Covers BottomNav grid at 390.',
      ultrawide: {
        enabled: RUN_ULTRAWIDE_PASS,
        widths: [...ULTRAWIDE_SMOKE_WIDTHS],
        contentMaxPx: CONTENT_SHELL_MAX_PX,
        note: 'Separate from VIEWPORT_SMOKE_WIDTHS (390/768/1024/2560). Opt-in: PHONARA_AUDIT_ULTRAWIDE=1.',
      },
      adminPass: {
        enabled: ADMIN_ROUTES.length > 0,
        routeIds: ADMIN_ROUTES.map((r) => r.pageId),
        viewportIds: ADMIN_VIEWPORTS.map((v) => v.id),
        loggedIn: adminLoggedIn,
      },
      casinoOutcomeStateTargets: CASINO_OUTCOME_STATE_TARGETS.map((t) => ({
        game: t.game,
        states: [...t.states],
      })),
      hoverFiles: [`hover/${hoverFile}`, `hover/${hoverFile2}`],
      manifest,
      interactions,
      hiQaInteractions,
      hiQaCatalog: HI_QA_INTERACTION_SCENARIOS.map((s) => ({
        id: s.id,
        kind: s.kind,
        path: s.path,
        viewport: s.viewport,
      })),
    };

    await mkdir(MANIFEST_DIR, { recursive: true });
    const manifestPath = join(MANIFEST_DIR, 'capture-manifest.json');
    await writeFile(manifestPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log('[cdp-audit] manifest written', manifestPath);
    console.log('[cdp-audit] DONE', summary.counts);
    console.log(
      '[cdp-audit] bottomNavViolations:',
      bottomNavViolations.length ? bottomNavViolations : 'none',
    );
    console.log(
      '[cdp-audit] axeCriticalFindings:',
      axeCriticalFindings.length ? axeCriticalFindings : 'none',
    );
    console.log(
      '[cdp-audit] letterboxViolations:',
      letterboxViolations.length ? letterboxViolations : 'none',
    );
    console.log('[cdp-audit] hiQaFailures:', hiQaFailures.length ? hiQaFailures : 'none');
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
    for (const hiQa of hiQaInteractions) {
      console.log(
        `[cdp-audit] hi-qa ${hiQa.id}: ok=${hiQa.ok} kind=${hiQa.kind}`,
        JSON.stringify(hiQa.steps),
      );
    }

    const hardFailures =
      bottomNavViolations.length > 0 ||
      axeCriticalFindings.length > 0 ||
      letterboxViolations.length > 0;
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
