import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { messages } from '@phonara/i18n';

import {
  TRADE_I18N_CONTRACT_WIRED_KEYS,
  TRADE_I18N_SURFACE_SCAN_ROOTS,
  classifyTradeI18nKey,
  isTradeCatalogKey,
  resolveTradeI18nDeferRule,
} from '../trade-i18n-surface-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');
const I18N_INDEX = resolve(REPO_ROOT, 'packages/i18n/src/index.ts');
const I18N_PRESENTATION_EN = resolve(REPO_ROOT, 'packages/i18n/src/locales/presentation-en.ts');

const TRADE_KEY_LITERAL_RE = /'((?:trade|desk\.trade|seo\.trade)[^']+)'/g;
const TRADE_KEY_USAGE_RE = /(?:trade|desk\.trade|seo\.trade)\.[a-zA-Z0-9_.]+/g;

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const filePath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(filePath, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(filePath.replace(/\\/g, '/'));
    }
  }
  return acc;
}

export function extractTradeCatalogKeys(): string[] {
  const keys = new Set<string>();
  for (const file of [I18N_INDEX, I18N_PRESENTATION_EN]) {
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(TRADE_KEY_LITERAL_RE)) {
      keys.add(match[1]!);
    }
  }
  return [...keys].sort();
}

export function scanTradeSurfaceWiredKeys(): Set<string> {
  const wired = new Set<string>(TRADE_I18N_CONTRACT_WIRED_KEYS);

  for (const root of TRADE_I18N_SURFACE_SCAN_ROOTS) {
    const absolute = resolve(WEB_SRC, root);
    if (!statSync(absolute, { throwIfNoEntry: false })) continue;
    const files = statSync(absolute).isFile()
      ? [absolute.replace(/\\/g, '/')]
      : collectSourceFiles(absolute);

    for (const file of files) {
      if (file.includes('trade-i18n-surface-display-contract')) continue;
      const content = readFileSync(file, 'utf8');
      for (const match of content.matchAll(TRADE_KEY_USAGE_RE)) {
        wired.add(match[0]!);
      }
    }
  }

  return wired;
}

export function auditTradeI18nSurfaceCoverage(): {
  catalogKeys: string[];
  wiredKeys: Set<string>;
  unclassified: string[];
  deferCounts: { B: number; C: number };
} {
  const catalogKeys = extractTradeCatalogKeys();
  const wiredKeys = scanTradeSurfaceWiredKeys();
  const unclassified: string[] = [];
  let deferB = 0;
  let deferC = 0;

  for (const key of catalogKeys) {
    if (!isTradeCatalogKey(key)) continue;
    if (wiredKeys.has(key)) continue;
    const defer = resolveTradeI18nDeferRule(key);
    if (!defer) {
      unclassified.push(key);
      continue;
    }
    if (defer.deferTier === 'B') deferB += 1;
    else deferC += 1;
    const classified = classifyTradeI18nKey(key, wiredKeys);
    if (classified.status !== 'defer' || !classified.ownerTodo) {
      unclassified.push(key);
    }
  }

  return { catalogKeys, wiredKeys, unclassified, deferCounts: { B: deferB, C: deferC } };
}

export function listTradeCatalogEnglishValues(): string[] {
  return extractTradeCatalogKeys().map((key) => messages.en[key as keyof typeof messages.en] ?? '');
}
