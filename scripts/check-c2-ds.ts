/**
 * Pre-demolition C2 DS closeout gate.
 *
 * v5 Demolition deleted the presentation token/router/game-ui paths this gate
 * used to inspect. The gate is inactive until Phase R defines a new token/UI SOT.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const webFonts = join(root, 'apps', 'web', 'public', 'fonts');
const themePath = join(root, 'apps', 'web', 'src', 'theme.css');
const appGlobalsPath = join(root, 'apps', 'web', 'src', 'ui', 'styles', 'app-globals.css');
const mainPath = join(root, 'apps', 'web', 'src', 'main.tsx');
const routerPath = join(root, 'apps', 'web', 'src', 'router.ts');
const vitePath = join(root, 'apps', 'web', 'vite.config.ts');
const gameLoaderPath = join(
  root,
  'apps',
  'web',
  'src',
  'components',
  'games',
  'game-surface-loader.tsx',
);
const gameUiNoTouch = join(root, 'packages', 'game-ui', 'NO_TOUCH.md');
const legacyC2GateEnabled = process.env.PHONARA_ENABLE_PRE_DEMOLITION_C2_DS === '1';

const REQUIRED_FONTS = [
  'PretendardVariable.woff2',
  'Pretendard-Regular.woff2',
  'Pretendard-Medium.woff2',
  'Pretendard-SemiBold.woff2',
  'Pretendard-Bold.woff2',
  'JetBrainsMono[wght].woff2',
  'SpaceGrotesk[wght].woff2',
] as const;

const FORBIDDEN_ENTRY_IMPORTS = [
  'pixi.js',
  'pixi-filters',
  'matter-js',
  'lightweight-charts',
  '@phonara/game-ui',
] as const;

const failures: string[] = [];

function fail(msg: string): void {
  failures.push(msg);
}

// v5 Demolition — presentation paths are deliberately absent; C2 visual checks resume in Phase R.
if (
  !legacyC2GateEnabled ||
  !existsSync(themePath) ||
  !existsSync(routerPath) ||
  !existsSync(gameLoaderPath)
) {
  console.log(
    'check:c2-ds SKIP — v5 Demolition deleted presentation token/router/game-ui paths; Phase R must redefine this gate before enabling it',
  );
  process.exit(0);
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fg: string, bg: string): number {
  const [fr, fgG, fb] = hexToRgb(fg);
  const [br, bgG, bb] = hexToRgb(bg);
  const l1 = relativeLuminance(fr, fgG, fb);
  const l2 = relativeLuminance(br, bgG, bb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseDarkRootPairs(css: string): Array<{ label: string; fg: string; bg: string }> {
  const darkBlock = css.match(/:root\s*\{[^}]*--background:\s*(#[0-9a-fA-F]{3,8})[^}]*\}/s);
  if (!darkBlock) return [];

  const block = darkBlock[0];
  const pick = (name: string): string | null => {
    const m = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
    return m?.[1] ?? null;
  };

  const background = pick('--background');
  const foreground = pick('--foreground');
  const mutedFg = pick('--muted-foreground');
  const primary = pick('--primary');
  const primaryFg = pick('--primary-foreground');

  const pairs: Array<{ label: string; fg: string; bg: string }> = [];
  if (background && foreground) {
    pairs.push({ label: 'foreground/background', fg: foreground, bg: background });
  }
  if (background && mutedFg) {
    pairs.push({ label: 'muted-foreground/background', fg: mutedFg, bg: background });
  }
  if (primary && primaryFg) {
    pairs.push({ label: 'primary-foreground/primary', fg: primaryFg, bg: primary });
  }
  return pairs;
}

// —— Fonts (P6) ——
for (const file of REQUIRED_FONTS) {
  const path = join(webFonts, file);
  if (!existsSync(path) || readFileSync(path).length < 4_000) {
    fail(`missing or too small: public/fonts/${file} — run bun run setup:fonts`);
  }
}

const theme = read(themePath);
const fontFaceBlocks = theme.match(/@font-face\s*\{[^}]+\}/g) ?? [];
if (fontFaceBlocks.length === 0) {
  fail('theme.css has no @font-face blocks');
} else {
  for (const block of fontFaceBlocks) {
    if (!block.includes('font-display: swap')) {
      fail('@font-face missing font-display: swap');
      break;
    }
  }
}

// —— P5 touch target ——
if (!theme.includes('--touch-target-min: 44px')) {
  fail('theme.css missing --touch-target-min: 44px');
}
if (!theme.includes("[data-touch-target='tab']")) {
  fail('theme.css missing tab touch-target base rule');
}

// —— P5 contrast AA (dark :root literals) ——
const appGlobals = read(appGlobalsPath);
const contrastPairs = parseDarkRootPairs(appGlobals);
for (const { label, fg, bg } of contrastPairs) {
  const ratio = contrastRatio(fg, bg);
  if (ratio < 4.5) {
    fail(`WCAG AA fail ${label}: ${ratio.toFixed(2)}:1 (${fg} on ${bg}) — need ≥4.5:1`);
  }
}

// —— P6 lazy boundary ——
for (const file of [mainPath, routerPath]) {
  const src = read(file);
  for (const mod of FORBIDDEN_ENTRY_IMPORTS) {
    if (new RegExp(`from\\s+['"]${mod.replace('/', '\\/')}['"]`).test(src)) {
      fail(`${file.split(/[/\\]/).pop()} imports ${mod} — entry chunk must stay lean`);
    }
  }
}

const vite = read(vitePath);
for (const chunk of ['pixi-vendor', 'trading-domain', 'game-plinko', 'charts-vendor']) {
  if (!vite.includes(`'${chunk}'`) && !vite.includes(`"${chunk}"`)) {
    fail(`vite.config.ts missing manualChunks chunk: ${chunk}`);
  }
}

const gameLoader = read(gameLoaderPath);
if (!gameLoader.includes('lazy(')) {
  fail('game-surface-loader.tsx must lazy-load game surfaces');
}

// —— game-ui no-touch (pre-demolition C2 only) ——
// v5 Demolition deleted packages/game-ui; absence is expected until Phase R redefines UI packages.
if (existsSync(gameUiNoTouch)) {
  const gitDiff = spawnSync('git', ['diff', '--quiet', 'packages/game-ui'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (gitDiff.status === 1) {
    fail('git diff packages/game-ui is non-empty — C2 must not modify game-ui');
  }
}

// —— Report ——
if (failures.length > 0) {
  console.error('check:c2-ds FAIL\n');
  for (const f of failures) {
    console.error(`  • ${f}`);
  }
  process.exit(1);
}

console.log(
  'check:c2-ds OK — fonts self-hosted · font-display swap · touch≥44px · AA contrast · lazy boundary · game-ui diff ∅',
);
if (contrastPairs.length > 0) {
  for (const { label, fg, bg } of contrastPairs) {
    console.log(`  contrast ${label}: ${contrastRatio(fg, bg).toFixed(2)}:1`);
  }
}
