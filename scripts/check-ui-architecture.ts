/**
 * Phase R UI architecture gate — consolidation debt checks + admin §29.4 jargon guard.
 * Pre-demolition shell paths must stay deleted; new violations fail (allowlist shrink only).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { collectPhaseRGuardViolations } from './check-phase-r-guards.ts';

const root = process.cwd();

type Violation = { id: string; message: string };

/** Resurrected pre-demolition presentation zones — must not exist in Phase R. */
const FORBIDDEN_PATHS = [
  'apps/web/src/components/ui',
  'apps/web/src/components/shell',
  'apps/web/src/presentation-import',
  'apps/web/src/styles/presentation-import-tokens.css',
  'apps/web/src/theme.css',
  'packages/ui',
] as const;

/** Forbidden import patterns in apps/web and apps/admin product layers. */
const FORBIDDEN_IMPORT_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /from\s+['"]@phonara\/ui['"]/, reason: '@phonara/ui was deleted in v5 Demolition' },
  {
    pattern: /from\s+['"][^'"]*\/components\/ui\//,
    reason: 'pre-demolition components/ui path',
  },
  {
    pattern: /from\s+['"][^'"]*presentation-import/,
    reason: 'pre-demolition presentation-import zone',
  },
];

function collectFiles(
  dir: string,
  ext: string,
  skip = new Set(['node_modules', 'dist', '.turbo']),
): string[] {
  if (!existsSync(dir)) return [];
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (!skip.has(entry)) out = out.concat(collectFiles(path, ext, skip));
      continue;
    }
    if (entry.endsWith(ext)) out.push(path.replaceAll('\\', '/'));
  }
  return out;
}

function read(path: string): string {
  return readFileSync(path.replaceAll('\\', '/'), 'utf8');
}

function checkForbiddenPaths(): Violation[] {
  const out: Violation[] = [];
  for (const rel of FORBIDDEN_PATHS) {
    if (existsSync(join(root, rel))) {
      out.push({ id: `forbidden-path:${rel}`, message: `Forbidden path exists: ${rel}` });
    }
  }
  return out;
}

function checkForbiddenImports(): Violation[] {
  const out: Violation[] = [];
  const dirs = ['apps/web/src', 'apps/admin/src'];
  for (const dir of dirs) {
    const abs = join(root, dir);
    for (const file of collectFiles(abs, '.tsx').concat(collectFiles(abs, '.ts'))) {
      const src = read(file);
      for (const rule of FORBIDDEN_IMPORT_PATTERNS) {
        if (rule.pattern.test(src)) {
          out.push({
            id: `forbidden-import:${file}`,
            message: `${file}: ${rule.reason}`,
          });
        }
      }
    }
  }
  return out;
}

function checkPhaseRProductRoots(): Violation[] {
  const out: Violation[] = [];
  const required = [
    'apps/web/src/product/tokens/index.css',
    'apps/web/src/product/primitives/index.ts',
    'apps/admin/src/product/layout/admin-shell.tsx',
    'apps/web/src/product/shell/appshell.tsx',
    'apps/web/src/product/shell/bottom-nav.tsx',
    'apps/web/src/product/shell/earn-shell.tsx',
    'apps/web/src/product/shell/earn-subnav.ts',
    'apps/web/src/product/shell/trade-subnav.ts',
    'apps/web/src/product/shell/sports-subnav.ts',
    'apps/web/src/product/shell/casino-subnav.ts',
    'apps/web/src/product/shell/wallet-subnav.ts',
    'apps/web/src/product/shell/pwa-shell.tsx',
    'apps/web/src/product/shell/skip-link.tsx',
  ];
  for (const rel of required) {
    if (!existsSync(join(root, rel))) {
      out.push({ id: `missing-phase-r:${rel}`, message: `Phase R product root missing: ${rel}` });
    }
  }
  return out;
}

/** §27.2 — `components/` stub absorbed into `product/shell/` (no new files in components/). */
function checkWebComponentsStubAbsorbed(): Violation[] {
  const rel = 'apps/web/src/components';
  const abs = join(root, rel);
  if (!existsSync(abs)) return [];
  const entries = readdirSync(abs);
  if (entries.length === 0) return [];
  return [
    {
      id: 'components-stub-residue',
      message: `${rel} must be empty after p6-shell-appshell — move residue to product/: ${entries.join(', ')}`,
    },
  ];
}

/** BottomNav Tab1 must use nav.earn (돈벌기) — nav.home forbidden (§12.19.4). */
function checkBottomNavEarnTabContract(): Violation[] {
  const out: Violation[] = [];
  const file = 'apps/web/src/product/shell/bottom-nav.tsx';
  const src = read(file);
  if (!src.includes("'nav.earn'") && !src.includes('"nav.earn"')) {
    out.push({
      id: 'bottomnav-missing-nav-earn',
      message: `${file}: Tab1 must use i18n key nav.earn`,
    });
  }
  if (src.includes("'nav.home'") || src.includes('"nav.home"')) {
    out.push({
      id: 'bottomnav-forbidden-nav-home',
      message: `${file}: nav.home forbidden on BottomNav Tab1 (§12.19.4)`,
    });
  }
  const tabMatches = src.match(/id:\s*'(?:earn|wallet|trade|sports|casino)'/g) ?? [];
  if (tabMatches.length !== 5) {
    out.push({
      id: 'bottomnav-tab-count',
      message: `${file}: BottomNav must declare exactly 5 tabs (§12.19)`,
    });
  }
  return out;
}

/** Legacy Bet hub embed — Phase R product import FAIL (§12.19.2). */
function checkBetHubEmbedIsolation(): Violation[] {
  const out: Violation[] = [];
  const productDir = join(root, 'apps/web/src/product');
  for (const file of collectFiles(productDir, '.tsx').concat(collectFiles(productDir, '.ts'))) {
    const normalized = file.replaceAll('\\', '/');
    if (normalized.endsWith('surface-domain-boundary.ts')) continue;
    const src = read(file);
    if (/bet-hub-casino-embed/.test(src)) {
      out.push({
        id: `bet-hub-embed-import:${file}`,
        message: `${file}: bet-hub-casino-embed import forbidden in Phase R product layer`,
      });
    }
  }
  return out;
}

/** §3.4 — sonner import only allowed in toast-zone.tsx. */
function checkSonnerGlueIsolation(): Violation[] {
  const out: Violation[] = [];
  const webSrc = join(root, 'apps/web/src');
  const allowSuffix = 'apps/web/src/product/primitives/toast-zone.tsx';
  for (const file of collectFiles(webSrc, '.tsx').concat(collectFiles(webSrc, '.ts'))) {
    const normalized = file.replaceAll('\\', '/');
    if (normalized.endsWith(allowSuffix)) continue;
    if (/from\s+['"]sonner['"]/.test(read(file))) {
      out.push({
        id: `sonner-glue:${normalized}`,
        message: `${normalized}: raw sonner import forbidden — use productToast from toast-zone (§3.4)`,
      });
    }
  }
  return out;
}

/** Product layer must not import absorbed `components/` stubs. */
function checkNoLegacyComponentsImports(): Violation[] {
  const out: Violation[] = [];
  const productDir = join(root, 'apps/web/src/product');
  const pattern = /from\s+['"][^'"]*\/components\/(pwa-shell|skip-link)/;
  for (const file of collectFiles(productDir, '.tsx').concat(collectFiles(productDir, '.ts'))) {
    if (pattern.test(read(file))) {
      out.push({
        id: `legacy-components-import:${file}`,
        message: `${file}: import product/shell instead of components/ stub`,
      });
    }
  }
  const rootRoute = read('apps/web/src/routes/__root.tsx');
  if (/from\s+['"][^'"]*\/components\//.test(rootRoute)) {
    out.push({
      id: 'root-legacy-components-import',
      message: 'routes/__root.tsx must import PwaShell/SkipLink from product/shell',
    });
  }
  return out;
}

/** earnSubnav registry must cover §12.19.4 routes (P9 staking row included). */
function checkEarnSubnavRegistry(): Violation[] {
  const out: Violation[] = [];
  const src = read('apps/web/src/product/shell/earn-subnav.ts');
  const requiredRoutes = [
    '/home',
    '/home/missions',
    '/home/attendance',
    '/referral',
    '/tier/me',
    '/tier/benefits',
    '/earn/cashback',
    '/earn/play',
    '/share/earnings',
    '/staking',
  ];
  for (const route of requiredRoutes) {
    if (!src.includes(`'${route}'`) && !src.includes(`"${route}"`)) {
      out.push({
        id: `earn-subnav-missing:${route}`,
        message: `earn-subnav.ts missing §12.19.4 route: ${route}`,
      });
    }
  }
  return out;
}

/** Scan admin surfaces for hardcoded user-visible jargon (not i18n keys, imports, or internal tab ids). */
function checkAdminJargonExposure(): Violation[] {
  const out: Violation[] = [];
  const surfacesDir = join(root, 'apps/admin/src/product/surfaces');
  const files = collectFiles(surfacesDir, '.tsx').filter((f) => !f.includes('__tests__'));

  const skipLine = (line: string): boolean => {
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('import ')) return true;
    if (
      t.includes("'admin.") ||
      t.includes('"admin.') ||
      t.includes('titleKey') ||
      t.includes('confirmKey')
    )
      return true;
    if (
      /\bvoid\s+handle/.test(t) ||
      t.includes('Promise<void>') ||
      /:\s*void\b/.test(t) ||
      /=>\s*void\b/.test(t)
    )
      return true;
    if (/value=["'](queue|desk|void|settle)["']/.test(t)) return true;
    if (/id=["'][^"']*(queue|desk)[^"']*["']/.test(t) || /aria-labelledby=/.test(t)) return true;
    if (/type\s+\w+\s*=/.test(t) && /\bvoid\b/.test(t)) return true;
    if (/from\s+['"][^'"]*queue[^'"]*['"]/.test(t)) return true;
    return false;
  };

  for (const file of files) {
    const lines = read(file).split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (skipLine(line)) continue;
      if (/>\s*[^<{t(][^<]*\b(rpc_|queue|desk|settle|void)\b/i.test(line)) {
        out.push({
          id: `admin-jargon-jsx:${file}:${i + 1}`,
          message: `${file}:${i + 1}: hardcoded jargon in JSX text — use i18n admin.* keys (§29.4)`,
        });
      }
    }
  }
  return out;
}

function checkPhaseRGuards(): Violation[] {
  return collectPhaseRGuardViolations().map((v) => ({
    id: v.id.startsWith('phase-r') ? v.id : `phase-r-guard:${v.id}`,
    message: v.message,
  }));
}

function main(): void {
  const strict =
    process.argv.includes('--strict') || process.env.PHONARA_UI_ARCH_CHECK_STRICT === '1';
  const violations = [
    ...checkForbiddenPaths(),
    ...checkForbiddenImports(),
    ...checkPhaseRProductRoots(),
    ...checkWebComponentsStubAbsorbed(),
    ...checkBottomNavEarnTabContract(),
    ...checkBetHubEmbedIsolation(),
    ...checkSonnerGlueIsolation(),
    ...checkNoLegacyComponentsImports(),
    ...checkEarnSubnavRegistry(),
    ...checkAdminJargonExposure(),
    ...checkPhaseRGuards(),
  ];

  if (violations.length === 0) {
    console.log('check:ui-architecture OK — Phase R product boundaries clean');
    return;
  }

  for (const v of violations) {
    console.error(`[ui-arch] ${v.id}: ${v.message}`);
  }

  if (strict) {
    console.error(`check:ui-architecture FAIL — ${violations.length} violation(s)`);
    process.exit(1);
  }

  console.error(
    `check:ui-architecture WARN — ${violations.length} violation(s) (non-strict; use --strict to fail)`,
  );
}

main();
