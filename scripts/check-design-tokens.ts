/**
 * Phase R design token gate (§25.8.1).
 *
 * P4 default: `--advisory` — token SOT hard-fail; style/legacy issues warn · exit 0.
 * P13 closeout: `--strict` — all violations fail.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolveRoot();
const args = process.argv.slice(2);
const strict = args.includes('--strict') || args.includes('--strict-style');
const advisory = !strict;

const COLORS_CSS = join(root, 'apps/web/src/product/tokens/colors.css');
const THEME_CSS = join(root, 'apps/web/src/product/tokens/theme.css');
const MOTION_CSS = join(root, 'apps/web/src/product/tokens/motion.css');
const ELEVATION_CSS = join(root, 'apps/web/src/product/tokens/elevation.css');
const LAYOUT_CSS = join(root, 'apps/web/src/product/tokens/layout.css');
const INDEX_CSS = join(root, 'apps/web/src/product/tokens/index.css');
const AURORA_TSX = join(root, 'apps/web/src/product/shell/aurora-background.tsx');
const AURORA_CSS = join(root, 'apps/web/src/product/shell/aurora-background.css');

const SURFACE_DIRS = ['apps/web/src/product/surfaces', 'apps/admin/src/product/surfaces'] as const;

const PRODUCT_SCAN_DIRS = ['apps/web/src/product', 'apps/admin/src/product'] as const;

const SKIP_DIRS = new Set(['node_modules', 'dist', '.turbo', '__tests__']);

const HEX_IN_JSX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_IN_JSX = /\b(?:rgb|rgba|hsl|hsla)\s*\(/g;
const TAILWIND_HEX = /(?:text|bg|border|from|to|via|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g;
const LEGACY_CLASS =
  /\b(?:text-primary|text-muted-foreground|bg-primary(?:\/[\d]+)?|border-primary(?:\/[\d]+)?)\b/g;
const MOTION_REF = /(?:duration|transition(?:-[\w-]+)?)-\(--ds-motion-([a-z-]+)\)/g;
const SURFACE_HOVER_UTILITY = /\b(?:hover:)?bg-surface-hover\b/;
/** §34.9 8pt spacing ratchet — page stacks should prefer gap-ds-8+; raw gap-6 is advisory. */
const RAW_GAP_6 = /\bgap-6\b/;

/** P3 baseline — legacy shadcn classes absorbed until P13 purge (§25.8.1). */
const P3_LEGACY_ALLOWLIST = new Set([
  'apps/web/src/product/surfaces/auth/auth-callback-page.tsx',
  'apps/web/src/product/surfaces/landing/ads-consent-sheet.tsx',
  'apps/web/src/product/surfaces/landing/landing-footer.tsx',
  'apps/web/src/product/surfaces/landing/landing-page.tsx',
  'apps/web/src/product/surfaces/legal/risk-document-body.tsx',
  'apps/web/src/product/surfaces/login/auth-entry-layout.tsx',
  'apps/web/src/product/surfaces/login/login-form.tsx',
  'apps/web/src/product/surfaces/reset-password/reset-password-form.tsx',
  'apps/web/src/product/surfaces/signup/signup-consent-panel.tsx',
  'apps/web/src/product/surfaces/signup/signup-form.tsx',
  'apps/web/src/product/surfaces/verify-email/verify-email-form.tsx',
  'apps/web/src/routes/__root.tsx',
  'apps/admin/src/product/layout/admin-nav.tsx',
  'apps/admin/src/product/surfaces/admin-earn-rewards-page.tsx',
  'apps/admin/src/product/surfaces/admin-user-tier-page.tsx',
]);

type Finding = { id: string; message: string; hard: boolean };

function resolveRoot(): string {
  return join(import.meta.dirname, '..');
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function rel(path: string): string {
  return relative(root, path).replaceAll('\\', '/');
}

function collectFiles(dir: string, ext: string): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  let out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const path = join(abs, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) out = out.concat(collectFiles(join(dir, entry), ext));
      continue;
    }
    if (entry.endsWith(ext)) out.push(path);
  }
  return out;
}

function checkTokenSot(): Finding[] {
  const out: Finding[] = [];
  if (!existsSync(COLORS_CSS)) {
    out.push({
      id: 'missing-colors-css',
      message: 'Missing apps/web/src/product/tokens/colors.css',
      hard: true,
    });
    return out;
  }
  if (!existsSync(THEME_CSS)) {
    out.push({
      id: 'missing-theme-css',
      message: 'Missing apps/web/src/product/tokens/theme.css',
      hard: true,
    });
    return out;
  }
  if (!existsSync(ELEVATION_CSS)) {
    out.push({
      id: 'missing-elevation-css',
      message: 'Missing apps/web/src/product/tokens/elevation.css (§34.6–34.9)',
      hard: true,
    });
  } else {
    const elevation = read(ELEVATION_CSS);
    for (const token of [
      '--ds-shadow-1',
      '--ds-shadow-2',
      '--ds-shadow-3',
      '--ds-shadow-4',
      '--ds-z-chrome',
      '--ds-z-overlay',
      '--ds-z-toast',
    ]) {
      if (!new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`).test(elevation)) {
        out.push({
          id: `missing-elevation-token:${token}`,
          message: `elevation.css missing ${token}`,
          hard: true,
        });
      }
    }
    if (existsSync(INDEX_CSS) && !read(INDEX_CSS).includes('elevation.css')) {
      out.push({
        id: 'elevation-not-imported',
        message: 'tokens/index.css must @import elevation.css',
        hard: true,
      });
    }
  }

  if (!existsSync(LAYOUT_CSS)) {
    out.push({
      id: 'missing-layout-css',
      message: 'Missing apps/web/src/product/tokens/layout.css (§34.10 Orbit Grid)',
      hard: true,
    });
  } else {
    const layout = read(LAYOUT_CSS);
    if (!layout.includes('repeat(12, minmax(0, 1fr))')) {
      out.push({
        id: 'missing-orbit-12col',
        message: 'layout.css missing desktop 12-col Orbit Grid (§34.10–34.11)',
        hard: true,
      });
    }
    if (!layout.includes('.ds-shell-col-span-8') || !layout.includes('.ds-shell-col-span-4')) {
      out.push({
        id: 'missing-orbit-col-span',
        message: 'layout.css missing .ds-shell-col-span-8/4 helpers (§34.10–34.11)',
        hard: true,
      });
    }
  }

  if (!existsSync(AURORA_TSX) || !existsSync(AURORA_CSS)) {
    out.push({
      id: 'missing-aurora-background',
      message:
        'Missing aurora-background.tsx+css under product/shell (§34.10 Shell elevation)',
      hard: true,
    });
  }

  const colors = read(COLORS_CSS);
  const theme = read(THEME_CSS);

  if (!/--ds-surface-hover\s*:/.test(colors)) {
    out.push({
      id: 'missing-ds-surface-hover',
      message: 'colors.css missing --ds-surface-hover (§25.8.1 light-dark dual)',
      hard: true,
    });
  }

  const requiredThemeBridges: Array<{ token: string; note?: string }> = [
    { token: '--color-surface-hover' },
    { token: '--color-primary', note: 'legacy bridge (P3 only)' },
    { token: '--color-muted-foreground', note: 'legacy bridge (P3 only)' },
    { token: '--shadow-1', note: 'elevation ladder (§34.6)' },
    { token: '--shadow-2', note: 'elevation ladder (§34.6)' },
    { token: '--z-index-toast', note: 'elevation z ladder (§34.6)' },
  ];

  for (const { token, note } of requiredThemeBridges) {
    if (!new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`).test(theme)) {
      out.push({
        id: `missing-theme-bridge:${token}`,
        message: `theme.css missing ${token}${note ? ` — ${note}` : ''}`,
        hard: true,
      });
    }
  }

  if (SURFACE_HOVER_UTILITY.test(read(join(root, 'apps/web/src/product/primitives/button.tsx')))) {
    if (!/--color-surface-hover\s*:/.test(theme)) {
      out.push({
        id: 'surface-hover-without-bridge',
        message:
          'hover:bg-surface-hover used but --color-surface-hover bridge missing in theme.css',
        hard: true,
      });
    }
  }

  return out;
}

function checkSpacingRatchet(findings: Finding[]): void {
  for (const dir of SURFACE_DIRS) {
    for (const file of collectFiles(dir, '.tsx')) {
      const path = rel(file);
      const lines = read(file).split('\n');
      lines.forEach((line, index) => {
        if (line.includes('design-token-allow:')) return;
        if (!RAW_GAP_6.test(line)) return;
        findings.push({
          id: 'raw-gap-6',
          message: `${path}:${index + 1}  [spacing-ratchet] prefer gap-ds-8+ on page stacks (raw gap-6 · §34.9)`,
          hard: false,
        });
      });
    }
  }
}

function parseKnownMotionTokens(): Set<string> {
  const motion = existsSync(MOTION_CSS) ? read(MOTION_CSS) : '';
  const names = new Set<string>();
  for (const match of motion.matchAll(/--ds-motion-([a-z-]+)\s*:/g)) {
    names.add(match[1]!);
  }
  return names;
}

function checkSurfaces(findings: Finding[]): void {
  for (const dir of SURFACE_DIRS) {
    for (const file of collectFiles(dir, '.tsx')) {
      const path = rel(file);
      const content = read(file);
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('design-token-allow:')) return;
        const ln = index + 1;

        for (const match of line.matchAll(HEX_IN_JSX)) {
          findings.push({
            id: 'hex-literal',
            message: `${path}:${ln}  [hex-literal] ${match[0]}`,
            hard: strict,
          });
        }
        for (const match of line.matchAll(TAILWIND_HEX)) {
          findings.push({
            id: 'tailwind-hex',
            message: `${path}:${ln}  [tailwind-hex] ${match[0]}`,
            hard: strict,
          });
        }
        if (RGB_IN_JSX.test(line)) {
          findings.push({
            id: 'rgb-literal',
            message: `${path}:${ln}  [rgb-literal] use --ds-* tokens instead of rgb()/rgba()`,
            hard: strict,
          });
        }
      });
    }
  }
}

function checkLegacyClasses(findings: Finding[]): void {
  const diffAdded = collectGitDiffAddedLines();

  for (const dir of PRODUCT_SCAN_DIRS) {
    for (const file of collectFiles(dir, '.tsx')) {
      const path = rel(file);
      const content = read(file);
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('design-token-allow:')) return;
        if (!LEGACY_CLASS.test(line)) return;
        LEGACY_CLASS.lastIndex = 0;

        const ln = index + 1;
        const inAllowlist = P3_LEGACY_ALLOWLIST.has(path);
        const addedInDiff = diffAdded.get(path)?.includes(ln) ?? false;

        if (!inAllowlist || addedInDiff) {
          const kind = addedInDiff ? 'legacy-class-diff' : 'legacy-class-new-file';
          findings.push({
            id: kind,
            message: `${path}:${ln}  [legacy-class] shadcn legacy (text-primary|muted-foreground|bg-primary) - use text-accent|text-foreground-muted (P4+ SSOT 25.2)`,
            hard: strict,
          });
        }
      });
    }
  }

  if (strict) {
    for (const path of P3_LEGACY_ALLOWLIST) {
      const abs = join(root, path);
      if (!existsSync(abs)) continue;
      const content = read(abs);
      if (LEGACY_CLASS.test(content)) {
        LEGACY_CLASS.lastIndex = 0;
        findings.push({
          id: 'legacy-class-p13',
          message: `${path}  [legacy-class] P13 purge required - legacy class still present`,
          hard: true,
        });
      }
    }
  }
}

function checkUnknownMotionRefs(findings: Finding[], known: Set<string>): void {
  for (const dir of PRODUCT_SCAN_DIRS) {
    for (const file of collectFiles(dir, '.tsx')) {
      const path = rel(file);
      const content = read(file);

      for (const match of content.matchAll(MOTION_REF)) {
        const token = match[1]!;
        if (!known.has(token)) {
          findings.push({
            id: 'unknown-motion-token',
            message: `${path}  [unknown-motion] --ds-motion-${token} not defined in motion.css`,
            hard: strict,
          });
        }
      }

      for (const match of content.matchAll(/var\(--ds-motion-([a-z-]+)\)/g)) {
        const token = match[1]!;
        if (!known.has(token)) {
          findings.push({
            id: 'unknown-motion-var',
            message: `${path}  [unknown-motion] var(--ds-motion-${token}) not defined in motion.css`,
            hard: strict,
          });
        }
      }
    }
  }
}

function collectGitDiffAddedLines(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  const result = spawnSync(
    'git',
    [
      'diff',
      '--unified=0',
      'HEAD',
      '--',
      'apps/web/src/product',
      'apps/admin/src/product',
      'apps/web/src/routes',
    ],
    { cwd: root, encoding: 'utf8' },
  );

  if (result.status !== 0 && !result.stdout) return out;

  let currentFile: string | null = null;
  let lineNo = 0;

  for (const rawLine of result.stdout.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice('+++ b/'.length);
      continue;
    }
    if (!currentFile) continue;
    if (line.startsWith('@@')) {
      const hunk = line.match(/\+(\d+)(?:,(\d+))?/);
      lineNo = hunk ? Number.parseInt(hunk[1]!, 10) : 0;
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const nums = out.get(currentFile) ?? [];
      nums.push(lineNo);
      out.set(currentFile, nums);
      lineNo += 1;
      continue;
    }
    if (line.startsWith(' ') || line.startsWith('-')) {
      if (!line.startsWith('-')) lineNo += 1;
    }
  }

  return out;
}

function main(): void {
  const findings: Finding[] = [];

  findings.push(...checkTokenSot());

  checkSurfaces(findings);
  checkLegacyClasses(findings);
  checkUnknownMotionRefs(findings, parseKnownMotionTokens());
  checkSpacingRatchet(findings);

  const hard = findings.filter((f) => f.hard);
  const soft = findings.filter((f) => !f.hard);

  if (hard.length > 0) {
    console.error(`check:design-tokens FAIL (${strict ? 'strict' : 'token-sot'})\n`);
    if (strict) {
      console.error(
        '  strict mode is P13 closeout only - P4 preflight uses default advisory (exit 0).\n',
      );
    }
    for (const f of hard) console.error(`  - ${f.message}`);
    process.exit(1);
  }

  if (soft.length > 0) {
    const label = advisory ? 'advisory' : 'warn';
    if (!advisory) {
      console.error(`check:design-tokens FAIL (${label}): ${soft.length} note(s)\n`);
      for (const f of soft.slice(0, 30)) console.error(`  - ${f.message}`);
      if (soft.length > 30) console.error(`  - ... and ${soft.length - 30} more`);
      process.exit(1);
    }
  }

  const mode = strict ? 'strict' : 'advisory';
  console.log(
    `check:design-tokens OK - token SOT, elevation, surface-hover bridge, legacy diff, motion, spacing ratchet (${mode})`,
  );

  if (soft.length > 0) {
    console.warn(`check:design-tokens advisory: ${soft.length} note(s)\n`);
    for (const f of soft.slice(0, 30)) console.warn(`  - ${f.message}`);
    if (soft.length > 30) console.warn(`  - ... and ${soft.length - 30} more`);
  }
}

main();
