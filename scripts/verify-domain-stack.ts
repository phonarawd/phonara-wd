#!/usr/bin/env tsx
/**
 * PHONARA domain + visual stack audit — Trade · Earn · Sports · Casino · PWA · perf.
 * Run: bun run check:domain-stack (also invoked from `bun run setup`).
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSyncSafe } from './lib/spawn-safe';

const root = resolve(import.meta.dirname, '..');
const webRoot = join(root, 'apps', 'web');
const fontsDir = join(webRoot, 'public', 'fonts');
const themePath = join(webRoot, 'src', 'theme.css');
const presentationAuditActive =
  process.env.PHONARA_ENABLE_PHASE_R_PRESENTATION_AUDIT === '1' && existsSync(themePath);

type Row = { domain: string; item: string; ok: boolean; detail: string };

const rows: Row[] = [];

function record(domain: string, item: string, ok: boolean, detail: string): void {
  rows.push({ domain, item, ok, detail });
}

function probe(command: string, args: string[]): boolean {
  return spawnSyncSafe(command, args, { encoding: 'utf8', stdio: 'pipe' }).status === 0;
}

function pkgInWeb(name: string): boolean {
  return (
    existsSync(join(webRoot, 'node_modules', name, 'package.json')) ||
    existsSync(join(root, 'node_modules', name, 'package.json'))
  );
}

function engineBuilt(name: string): boolean {
  return existsSync(join(root, 'packages', name, 'dist', 'index.js'));
}

function fontOk(filename: string, minBytes = 8_000): boolean {
  const path = join(fontsDir, filename);
  if (!existsSync(path)) return false;
  return statSync(path).size >= minBytes;
}

function readIncludes(rel: string, needle: string): boolean {
  const path = join(root, rel);
  return existsSync(path) && readFileSync(path, 'utf8').includes(needle);
}

function recordPresentation(
  domain: string,
  item: string,
  ok: boolean,
  detail: string,
  phaseRDetail = 'v5 Demolition으로 presentation path 삭제됨 · Phase R에서 재정의',
): void {
  record(
    domain,
    item,
    presentationAuditActive ? ok : true,
    presentationAuditActive ? detail : phaseRDetail,
  );
}

// —— System toolchain ——
record('Core', 'Bun', probe('bun', ['--version']), 'runtime + package manager');
record('Core', 'Node.js', probe('node', ['--version']), 'optional peer');
record('Core', 'Git', probe('git', ['--version']), 'version control');
record('Core', 'Docker', probe('docker', ['--version']), 'local Supabase / E2E');
record(
  'Core',
  'Supabase CLI',
  probe('bunx', ['supabase', '--version']),
  'migrations + local stack',
);
record('Core', 'Playwright', probe('bunx', ['playwright', '--version']), 'E2E browser automation');
record('Core', 'Wrangler', probe('bunx', ['wrangler', '--version']), 'Cloudflare Pages deploy');
record('Core', 'GitHub CLI', probe('gh', ['--version']), 'PR / CI ops');

const playwrightCache = join(
  process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'),
  'ms-playwright',
);
record(
  'Core',
  'Playwright Chromium',
  existsSync(playwrightCache),
  existsSync(playwrightCache) ? 'browser cache present' : 'run: bun run setup:playwright',
);

// —— Trade ——
recordPresentation(
  'Trade',
  'lightweight-charts',
  pkgInWeb('lightweight-charts'),
  'candlestick / terminal charts',
);
record('Trade', '@phonara/trading-engine', engineBuilt('trading-engine'), 'futures / spot engine');
record('Trade', '@phonara/market-display', engineBuilt('market-display'), 'ticker / depth display');
record(
  'Trade',
  'decimal.js (money)',
  pkgInWeb('decimal.js') || existsSync(join(root, 'node_modules', 'decimal.js')),
  'no float money',
);
recordPresentation(
  'Trade',
  'Vite charts chunk',
  readIncludes('apps/web/vite.config.ts', "'charts-vendor'"),
  'lazy-loaded chart bundle',
);

// —— Earn ——
recordPresentation('Earn', 'framer-motion', pkgInWeb('framer-motion'), 'reward / tier motion');
recordPresentation(
  'Earn',
  'tier design tokens',
  readIncludes('apps/web/src/theme.css', '--color-tier-gold'),
  'theme.css tier palette',
);
record('Earn', '@phonara/money', engineBuilt('money'), 'PHON / reward amounts');

// —— Sports ——
record(
  'Sports',
  '@phonara/sportsbook-engine',
  engineBuilt('sportsbook-engine'),
  'odds / settlement',
);
record('Sports', '@phonara/sports-ingest', engineBuilt('sports-ingest'), 'odds ingest workers');
recordPresentation(
  'Sports',
  'TanStack Virtual',
  pkgInWeb('@tanstack/react-virtual'),
  'fixture list performance',
);

// —— Casino / realtime games ——
for (const pkg of ['pixi.js', 'pixi-filters', 'matter-js', 'comlink', 'canvas-confetti'] as const) {
  recordPresentation('Casino', pkg, pkgInWeb(pkg), 'WebGL / physics / workers');
}
record('Casino', '@phonara/game-engine', engineBuilt('game-engine'), 'provably-fair settlement');
recordPresentation(
  'Casino',
  'Pixi code-split',
  readIncludes('apps/web/vite.config.ts', "'pixi-vendor'"),
  'per-game lazy bundles',
);
recordPresentation(
  'Casino',
  'React Compiler',
  readIncludes('apps/web/vite.config.ts', 'babel-plugin-react-compiler'),
  '60fps UI reconciliation',
);

// —— Fonts & visual fidelity ——
for (const f of [
  'PretendardVariable.woff2',
  'Pretendard-Regular.woff2',
  'Pretendard-Medium.woff2',
  'Pretendard-SemiBold.woff2',
  'Pretendard-Bold.woff2',
] as const) {
  recordPresentation('Visual', f, fontOk(f), 'self-hosted KO UI (OFL)');
}
recordPresentation(
  'Visual',
  'JetBrains Mono (trade mono)',
  fontOk('JetBrainsMono[wght].woff2', 4_000),
  'self-hosted tabular nums · trade/casino font-mono',
);
recordPresentation(
  'Visual',
  'tabular-nums contract',
  readIncludes('apps/web/src/theme.css', 'font-feature-settings'),
  'money digit alignment',
);
recordPresentation(
  'Visual',
  'PWA icons',
  existsSync(join(webRoot, 'public', 'pwa-512x512.png')),
  'install / home-screen',
);

// —— Perf / lag prevention ——
recordPresentation(
  'Perf',
  'manualChunks',
  readIncludes('apps/web/vite.config.ts', 'manualChunks'),
  'route/game splits',
);
recordPresentation(
  'Perf',
  'optimizeDeps (Pixi/Charts)',
  readIncludes('apps/web/vite.config.ts', "'pixi.js'"),
  'dev cold-start',
);
recordPresentation(
  'Perf',
  'reduced-motion',
  readIncludes('apps/web/src/styles/surfaces.css', 'prefers-reduced-motion'),
  'a11y + CPU save',
);
recordPresentation(
  'Perf',
  'visibility pause hooks',
  readIncludes('apps/web/src/hooks/useLiveCount.ts', 'usePageVisible'),
  'background tab CPU',
);
record(
  'Perf',
  'Lighthouse audit deps',
  pkgInWeb('lighthouse') && pkgInWeb('chrome-launcher'),
  'RC visual/a11y probe',
);

// —— Packages build ——
for (const pkg of [
  'shared-types',
  'i18n',
  'money',
  'wallet-ledger',
  'trading-engine',
  'market-display',
  'game-engine',
  'sportsbook-engine',
  'sports-ingest',
] as const) {
  record('Engine', `@phonara/${pkg}`, engineBuilt(pkg), 'dist built');
}

// —— Report ——
const failed = rows.filter((r) => !r.ok);
const passed = rows.filter((r) => r.ok);

process.stdout.write('\n=== PHONARA domain stack audit ===\n\n');

const domains = [...new Set(rows.map((r) => r.domain))];
for (const domain of domains) {
  process.stdout.write(`[${domain}]\n`);
  for (const row of rows.filter((r) => r.domain === domain)) {
    process.stdout.write(`  ${row.ok ? '✓' : '✗'} ${row.item} — ${row.detail}\n`);
  }
  process.stdout.write('\n');
}

process.stdout.write(`Summary: ${passed.length}/${rows.length} OK\n`);
if (!presentationAuditActive) {
  process.stdout.write(
    'Note: v5 Demolition deleted presentation paths; visual/UI stack rows are deferred until Phase R explicitly enables this audit.\n',
  );
}

if (failed.length > 0) {
  process.stdout.write('\nFix:\n');
  for (const row of failed) {
    process.stdout.write(`  • ${row.domain} / ${row.item}: ${row.detail}\n`);
  }
  process.stdout.write('\nRun: bun run setup\n');
  process.exit(1);
}

process.stdout.write(
  'check:domain-stack OK — engine stack verified · presentation rows deferred when demolished\n',
);
