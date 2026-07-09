import { describe, expect, it } from 'vitest';

import {
  TRADE_CONSOLE_ALLOWLIST_PATH,
  TRADE_CONSOLE_WARN_MAX_ENTRIES,
  loadTradeConsoleAllowlistFile,
  resetTradeConsoleAllowlistCacheForTests,
  validateTradeConsoleAllowlist,
  type TradeConsoleAllowlistFile,
} from '../e2e/fixtures/trade-console-collector';

describe('trade-console-allowlist.json · P1-F governance', () => {
  it('loads from canonical path', () => {
    expect(TRADE_CONSOLE_ALLOWLIST_PATH.endsWith('trade-console-allowlist.json')).toBe(true);
    const file = loadTradeConsoleAllowlistFile();
    expect(file.warn).toBeDefined();
    expect(Array.isArray(file.warn)).toBe(true);
  });

  it('enforces ≤5 warn entries with pattern, reason, and unexpired expires', () => {
    const file = loadTradeConsoleAllowlistFile();
    expect(file.warn.length).toBeLessThanOrEqual(TRADE_CONSOLE_WARN_MAX_ENTRIES);
    expect(() => validateTradeConsoleAllowlist(file)).not.toThrow();
  });

  it('documents P4 re-review in governance metadata', () => {
    const file = loadTradeConsoleAllowlistFile();
    expect(file._governance?.maxEntries).toBe(TRADE_CONSOLE_WARN_MAX_ENTRIES);
    expect(file._governance?.p4Review).toMatch(/P4/i);
  });

  it('rejects expired allowlist entries', () => {
    const expired: TradeConsoleAllowlistFile = {
      warn: [
        {
          pattern: 'legacy warn',
          reason: 'fixture',
          expires: '2020-01-01',
        },
      ],
    };
    expect(() => validateTradeConsoleAllowlist(expired, { asOf: new Date('2026-07-08') })).toThrow(
      /expired/i,
    );
  });

  it('rejects more than max warn entries', () => {
    const tooMany: TradeConsoleAllowlistFile = {
      warn: Array.from({ length: TRADE_CONSOLE_WARN_MAX_ENTRIES + 1 }, (_, index) => ({
        pattern: `warn-${index}`,
        reason: 'fixture',
        expires: '2099-12-31',
      })),
    };
    expect(() => validateTradeConsoleAllowlist(tooMany)).toThrow(/exceed max/i);
  });

  it('cache reset does not break validation', () => {
    resetTradeConsoleAllowlistCacheForTests();
    expect(() => validateTradeConsoleAllowlist(loadTradeConsoleAllowlistFile())).not.toThrow();
  });
});
