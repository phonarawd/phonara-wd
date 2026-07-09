import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

import {
  assertCurrencyPrecisionContractRegistrySync,
  CURRENCY_PRECISION_FORBIDDEN_INLINE_PATTERNS,
  CURRENCY_PRECISION_SCAN_EXCLUDE_PATH_SUBSTRINGS,
  CURRENCY_PRECISION_SCAN_ROOTS,
} from '../currency-precision-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '..');

export type CurrencyPrecisionInlineViolation = {
  readonly file: string;
  readonly line: number;
  readonly pattern: string;
  readonly excerpt: string;
};

function collectTsSourceFiles(dir: string, acc: string[] = []): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const filePath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      collectTsSourceFiles(filePath, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(filePath.replace(/\\/g, '/'));
    }
  }
  return acc;
}

function isExcludedPrecisionScanPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return CURRENCY_PRECISION_SCAN_EXCLUDE_PATH_SUBSTRINGS.some((part) => normalized.includes(part));
}

function scanContentForPatterns(
  content: string,
  patterns: readonly RegExp[],
): { line: number; pattern: string; excerpt: string }[] {
  const hits: { line: number; pattern: string; excerpt: string }[] = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        hits.push({
          line: i + 1,
          pattern: pattern.source,
          excerpt: line.trim().slice(0, 120),
        });
      }
    }
  }
  return hits;
}

/** Repo scan — forbidden inline `.toFixed(8)` in money presentation surfaces. */
export function scanCurrencyPrecisionInlineViolations(
  webSrcRoot = WEB_SRC,
): CurrencyPrecisionInlineViolation[] {
  const violations: CurrencyPrecisionInlineViolation[] = [];
  for (const root of CURRENCY_PRECISION_SCAN_ROOTS) {
    const absolute = resolve(webSrcRoot, root);
    const files = statSync(absolute, { throwIfNoEntry: false })
      ? statSync(absolute).isFile()
        ? [absolute.replace(/\\/g, '/')]
        : collectTsSourceFiles(absolute)
      : [];
    for (const file of files) {
      if (isExcludedPrecisionScanPath(file)) continue;
      const content = readFileSync(file, 'utf8');
      const hits = scanContentForPatterns(content, CURRENCY_PRECISION_FORBIDDEN_INLINE_PATTERNS);
      const rel = relative(webSrcRoot, file).replace(/\\/g, '/');
      for (const hit of hits) {
        violations.push({ file: rel, ...hit });
      }
    }
  }
  return violations;
}

/** Fiat#2 closeout — registry sync + inline precision grep gate (§13.1.4.1). */
export function assertCurrencyPrecisionPreflightSync(): void {
  assertCurrencyPrecisionContractRegistrySync();

  const inlineViolations = scanCurrencyPrecisionInlineViolations();
  if (inlineViolations.length > 0) {
    const sample = inlineViolations
      .slice(0, 3)
      .map((v) => `${v.file}:${v.line}`)
      .join(', ');
    throw new Error(`currency-precision: forbidden inline precision violations: ${sample}`);
  }
}
