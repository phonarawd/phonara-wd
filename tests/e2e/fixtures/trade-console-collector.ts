import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, type Page } from '@playwright/test';

/** P1-F: warn allowlist cap — see trade-console-allowlist.json */
export const TRADE_CONSOLE_WARN_MAX_ENTRIES = 5;

export const TRADE_CONSOLE_ALLOWLIST_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../trade-console-allowlist.json',
);

export type TradeConsoleAllowlistEntry = {
  readonly pattern: string;
  readonly reason: string;
  /** YYYY-MM-DD — must be strictly after validation date (P4 re-review before extend). */
  readonly expires: string;
};

export type TradeConsoleAllowlistFile = {
  readonly _governance?: {
    readonly maxEntries?: number;
    readonly p4Review?: string;
  };
  readonly warn: readonly TradeConsoleAllowlistEntry[];
};

export type TradeConsoleCollector = {
  readonly errors: string[];
  readonly warns: string[];
  readonly unallowlistedWarns: string[];
};

/** Browser/dev noise — not app console.* violations; errors still hard-fail otherwise. */
const INFRA_CONSOLE_ERROR_PATTERNS = [
  /favicon/i,
  /Failed to load resource.*404/i,
  /Failed to load resource.*403/i,
  /Failed to load resource: the server responded with a status of 400 \(Bad Request\)/i,
  /Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)/i,
  /ResizeObserver loop/i,
  /** Aborted Supabase/fetch during Playwright navigation · route mocks · reload (E2E only). */
  /^Failed to fetch$/i,
  /** Firefox/Juggler worker abort during in-flight fetch/navigation (browser-matrix E9). */
  /NS_BINDING_ABORTED/i,
  /** WebKit logs opaque CORS noise for Supabase REST during stale-oracle polling (browser-matrix E8). */
  /\/rest\/v1\/oracle_prices\?.*due to access control checks\./i,
  /\/rest\/v1\/market_circuit_breakers\?.*due to access control checks\./i,
] as const;

const EXPIRES_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseExpiresUtc(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}

export function loadTradeConsoleAllowlistFile(): TradeConsoleAllowlistFile {
  const raw = readFileSync(TRADE_CONSOLE_ALLOWLIST_PATH, 'utf8');
  return JSON.parse(raw) as TradeConsoleAllowlistFile;
}

/** Structural + governance validation (vitest + E2E preflight). */
export function validateTradeConsoleAllowlist(
  file: TradeConsoleAllowlistFile,
  options?: { asOf?: Date },
): void {
  const asOf = options?.asOf ?? new Date();
  const entries = file.warn ?? [];

  if (!Array.isArray(entries)) {
    throw new Error('trade-console-allowlist: warn must be an array');
  }

  if (entries.length > TRADE_CONSOLE_WARN_MAX_ENTRIES) {
    throw new Error(
      `trade-console-allowlist: warn entries ${entries.length} exceed max ${TRADE_CONSOLE_WARN_MAX_ENTRIES}`,
    );
  }

  for (const [index, entry] of entries.entries()) {
    const label = `warn[${index}]`;
    if (!entry.pattern?.trim()) {
      throw new Error(`trade-console-allowlist: ${label} missing pattern`);
    }
    if (!entry.reason?.trim()) {
      throw new Error(`trade-console-allowlist: ${label} missing reason`);
    }
    if (!EXPIRES_RE.test(entry.expires)) {
      throw new Error(`trade-console-allowlist: ${label} expires must be YYYY-MM-DD`);
    }
    try {
      RegExp(entry.pattern);
    } catch {
      throw new Error(`trade-console-allowlist: ${label} invalid regex pattern`);
    }
    if (parseExpiresUtc(entry.expires) < asOf) {
      throw new Error(
        `trade-console-allowlist: ${label} expired (${entry.expires}) — remove or extend at P4 review`,
      );
    }
  }
}

function compileAllowlistPatterns(entries: readonly TradeConsoleAllowlistEntry[]): RegExp[] {
  return entries.map((entry) => new RegExp(entry.pattern));
}

function isInfraConsoleError(text: string): boolean {
  return INFRA_CONSOLE_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

function isAllowlistedWarn(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

let cachedAllowlistPatterns: RegExp[] | undefined;

function activeWarnAllowlistPatterns(): RegExp[] {
  if (!cachedAllowlistPatterns) {
    const file = loadTradeConsoleAllowlistFile();
    validateTradeConsoleAllowlist(file);
    cachedAllowlistPatterns = compileAllowlistPatterns(file.warn);
  }
  return cachedAllowlistPatterns;
}

/** Reset cached allowlist (unit tests only). */
export function resetTradeConsoleAllowlistCacheForTests(): void {
  cachedAllowlistPatterns = undefined;
}

/**
 * Attach P1-F runtime console governance to a Playwright page.
 * - type=error + pageerror → hard fail (no warn-style allowlist)
 * - type=warning → trade-console-allowlist.json only (≤5 · unexpired)
 */
export function attachTradeConsoleCollector(page: Page): TradeConsoleCollector {
  const collector: TradeConsoleCollector = {
    errors: [],
    warns: [],
    unallowlistedWarns: [],
  };

  const warnPatterns = activeWarnAllowlistPatterns();

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      if (!isInfraConsoleError(text)) {
        collector.errors.push(text);
      }
      return;
    }

    if (type === 'warning') {
      collector.warns.push(text);
      if (!isAllowlistedWarn(text, warnPatterns)) {
        collector.unallowlistedWarns.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    if (!isInfraConsoleError(err.message)) {
      collector.errors.push(err.message);
    }
  });

  return collector;
}

export function assertTradeConsoleClean(collector: TradeConsoleCollector, label: string): void {
  expect(
    collector.unallowlistedWarns,
    `${label} — unallowlisted console warnings (see tests/e2e/trade-console-allowlist.json)`,
  ).toEqual([]);
  expect(collector.errors, `${label} — browser console errors (hard fail · no allowlist)`).toEqual(
    [],
  );
}
