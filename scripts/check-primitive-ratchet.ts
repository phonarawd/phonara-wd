/**
 * M-15 primitive ratchet (R7) — raw <button>/<input> outside product/primitives
 * may only stay flat or decrease. Signed exceptions: native file inputs, chart RGB.
 *
 * Default: advisory (warn · exit 0). `--strict` hard-fails on over-baseline or
 * arbitrary typography / unsigned chart RGB.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const strict = process.argv.includes('--strict');

/** Caps from R7 closeout census — ratchet may only decrease these numbers. */
const BASELINE = {
  rawButton: 43,
  rawButtonFiles: 23,
  rawInput: 15,
  rawInputFiles: 8,
  text11px: 0,
} as const;

const SCAN_DIRS = [
  'apps/web/src/product',
  'apps/admin/src/product',
  'apps/web/src/routes',
] as const;

const SKIP_DIRS = new Set(['node_modules', 'dist', '.turbo', '__tests__', 'primitives']);

const RAW_BUTTON = /<button\b/g;
const RAW_INPUT = /<input\b/g;
const TEXT_11PX = /\btext-\[11px\]\b/g;
const CHART_RGB = /\brgba?\s*\(/g;
const CHART_HEX = /#[0-9a-fA-F]{3,8}\b/g;

/** Whole-file signed exceptions (path relative to repo root). */
const FILE_ALLOWLIST = new Set([
  'apps/web/src/product/surfaces/trade/chart/chart-theme.ts',
]);

function rel(path: string): string {
  return relative(root, path).replaceAll('\\', '/');
}

function collectFiles(dir: string, ext: readonly string[]): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  let out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const path = join(abs, entry);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) out = out.concat(collectFiles(join(dir, entry), ext));
      continue;
    }
    if (ext.some((e) => entry.endsWith(e))) out.push(path);
  }
  return out;
}

function isInputAllowed(line: string, prevLine: string): boolean {
  if (/primitive-allow:/i.test(prevLine) || /primitive-allow:/i.test(line)) return true;
  if (/type=["']file["']/.test(line)) return true;
  if (/type=["']hidden["']/.test(line)) return true;
  return false;
}

function countMatches(source: string, re: RegExp): number {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  return [...source.matchAll(new RegExp(re.source, flags))].length;
}

type Census = {
  rawButton: number;
  rawButtonFiles: number;
  rawInput: number;
  rawInputFiles: number;
  text11px: number;
  chartRgbUnsigned: number;
};

function census(): Census {
  const files = [
    ...SCAN_DIRS.flatMap((d) => collectFiles(d, ['.tsx', '.ts'])),
  ];

  let rawButton = 0;
  let rawButtonFiles = 0;
  let rawInput = 0;
  let rawInputFiles = 0;
  let text11px = 0;
  let chartRgbUnsigned = 0;

  for (const path of files) {
    const key = rel(path);
    if (key.includes('/primitives/')) continue;
    const source = readFileSync(path, 'utf8');
    const lines = source.split(/\r?\n/);

    const buttonHits = countMatches(source, RAW_BUTTON);
    if (buttonHits > 0) {
      rawButton += buttonHits;
      rawButtonFiles += 1;
    }

    let inputHits = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (!RAW_INPUT.test(line)) {
        RAW_INPUT.lastIndex = 0;
        continue;
      }
      RAW_INPUT.lastIndex = 0;
      const prev = lines[i - 1] ?? '';
      if (isInputAllowed(line, prev)) continue;
      inputHits += countMatches(line, RAW_INPUT);
    }
    if (inputHits > 0) {
      rawInput += inputHits;
      rawInputFiles += 1;
    }

    text11px += countMatches(source, TEXT_11PX);

    if (FILE_ALLOWLIST.has(key)) continue;
    if (key.endsWith('chart-theme.ts') || /surfaces\/trade\/chart\//.test(key)) {
      const hasAllow = /primitive-allow:/i.test(source);
      if (!hasAllow) {
        chartRgbUnsigned += countMatches(source, CHART_RGB) + countMatches(source, CHART_HEX);
      }
    }
  }

  return { rawButton, rawButtonFiles, rawInput, rawInputFiles, text11px, chartRgbUnsigned };
}

function main(): void {
  const c = census();
  const findings: string[] = [];

  if (c.rawButton > BASELINE.rawButton) {
    findings.push(`raw <button> ${c.rawButton} > baseline ${BASELINE.rawButton}`);
  }
  if (c.rawButtonFiles > BASELINE.rawButtonFiles) {
    findings.push(
      `raw <button> files ${c.rawButtonFiles} > baseline ${BASELINE.rawButtonFiles}`,
    );
  }
  if (c.rawInput > BASELINE.rawInput) {
    findings.push(`raw <input> ${c.rawInput} > baseline ${BASELINE.rawInput}`);
  }
  if (c.rawInputFiles > BASELINE.rawInputFiles) {
    findings.push(
      `raw <input> files ${c.rawInputFiles} > baseline ${BASELINE.rawInputFiles}`,
    );
  }
  if (c.text11px > BASELINE.text11px) {
    findings.push(`text-[11px] ${c.text11px} > baseline ${BASELINE.text11px} (use text-xs)`);
  }
  if (c.chartRgbUnsigned > 0) {
    findings.push(
      `unsigned chart RGB/hex ${c.chartRgbUnsigned} (add primitive-allow + FILE_ALLOWLIST)`,
    );
  }

  console.log('[check:primitive-ratchet] census', c);
  console.log('[check:primitive-ratchet] baseline', BASELINE);

  if (findings.length === 0) {
    console.log('[check:primitive-ratchet] ✓ within baseline (signed residual OK)');
    process.exit(0);
  }

  for (const f of findings) {
    console[strict ? 'error' : 'warn'](`[check:primitive-ratchet] ${strict ? 'FAIL' : 'WARN'}: ${f}`);
  }

  if (strict) process.exit(1);
  process.exit(0);
}

main();
