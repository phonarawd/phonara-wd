import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import {
  assertFiatHintDisplayContractSync,
  assertFiatReferenceContractRegistrySync,
  FIAT_FORBIDDEN_IDENTIFIER_PATTERNS,
  FIAT_LEAK_SCAN_EXCLUDE_PATH_SUBSTRINGS,
  FIAT_LEAK_SCAN_ROOTS,
  FIAT_SETTLEMENT_LEAK_PATTERNS,
} from '../fiat-reference-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');

export type FiatLeakViolation = {
  readonly file: string;
  readonly line: number;
  readonly pattern: string;
  readonly excerpt: string;
};

export type FiatNamingViolation = {
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

function isExcludedFiatLeakPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return FIAT_LEAK_SCAN_EXCLUDE_PATH_SUBSTRINGS.some((part) => normalized.includes(part));
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

/** Repo scan — forbidden `krwHint` / `KrwDisplay` identifiers in apps/web presentation. */
export function scanFiatForbiddenNamingViolations(webSrcRoot = WEB_SRC): FiatNamingViolation[] {
  const violations: FiatNamingViolation[] = [];
  const files = collectTsSourceFiles(webSrcRoot);
  for (const file of files) {
    if (isExcludedFiatLeakPath(file)) continue;
    const content = readFileSync(file, 'utf8');
    const hits = scanContentForPatterns(content, FIAT_FORBIDDEN_IDENTIFIER_PATTERNS);
    const rel = relative(webSrcRoot, file).replace(/\\/g, '/');
    for (const hit of hits) {
      violations.push({ file: rel, ...hit });
    }
  }
  return violations;
}

/** Repo scan — fiat/KRW leak in trade/sports/casino/staking settlement surfaces. */
export function scanFiatSettlementLeakViolations(webSrcRoot = WEB_SRC): FiatLeakViolation[] {
  const violations: FiatLeakViolation[] = [];
  for (const root of FIAT_LEAK_SCAN_ROOTS) {
    const absolute = resolve(webSrcRoot, root);
    const files = statSync(absolute, { throwIfNoEntry: false })
      ? statSync(absolute).isFile()
        ? [absolute.replace(/\\/g, '/')]
        : collectTsSourceFiles(absolute)
      : [];
    for (const file of files) {
      if (isExcludedFiatLeakPath(file)) continue;
      const content = readFileSync(file, 'utf8');
      const hits = scanContentForPatterns(content, FIAT_SETTLEMENT_LEAK_PATTERNS);
      const rel = relative(webSrcRoot, file).replace(/\\/g, '/');
      for (const hit of hits) {
        violations.push({ file: rel, ...hit });
      }
    }
  }
  return violations;
}

/** Fiat#1 preflight closeout — registry + fiat leak grep gate (§13.1.4.5). */
export function assertFiatReferencePreflightSync(): void {
  assertFiatReferenceContractRegistrySync();
  assertFiatHintDisplayContractSync();

  const namingViolations = scanFiatForbiddenNamingViolations();
  if (namingViolations.length > 0) {
    const sample = namingViolations
      .slice(0, 3)
      .map((v) => `${v.file}:${v.line}`)
      .join(', ');
    throw new Error(`fiat-reference: forbidden naming violations: ${sample}`);
  }

  const leakViolations = scanFiatSettlementLeakViolations();
  if (leakViolations.length > 0) {
    const sample = leakViolations
      .slice(0, 3)
      .map((v) => `${v.file}:${v.line}`)
      .join(', ');
    throw new Error(`fiat-reference: settlement fiat leak violations: ${sample}`);
  }
}
