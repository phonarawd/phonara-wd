import { describe, expect, it } from 'vitest';

import { DECIMALS, toFixed } from '@phonara/money';

import {
  assertCurrencyPrecisionContractRegistrySync,
  assertCurrencyPrecisionMatchesMoneyDecimals,
  CURRENCY_PRECISION_DISPLAY_ASSET_CODES,
  CURRENCY_PRECISION_DISPLAY_ONLY_BOUNDARY,
  CURRENCY_PRECISION_DISPLAY_REGISTRY,
  CURRENCY_PRECISION_EWAVE_DB_REGISTRY,
  CURRENCY_PRECISION_FORBIDDEN_INLINE_PATTERNS,
  CURRENCY_PRECISION_LEDGER_CURRENCIES,
  CURRENCY_PRECISION_SCAN_ROOTS,
  findCurrencyPrecisionEntry,
  formatCurrencyPrecisionDisplay,
  isCurrencyPrecisionLedgerCurrency,
  P4_CURRENCY_PRECISION_PREREQUISITE_TODO,
  P4_CURRENCY_PRECISION_SSOT_TODO,
  resolveCurrencyRoundingMode,
} from '../currency-precision-display-contract';
import {
  assertCurrencyPrecisionPreflightSync,
  scanCurrencyPrecisionInlineViolations,
} from './currency-precision-display-audit-lib';

describe('currency-precision-display-contract §13.1.4.1 Fiat#2', () => {
  it('registers Fiat#2 todo with Fiat#1 prerequisite', () => {
    expect(P4_CURRENCY_PRECISION_SSOT_TODO).toBe('p4-fiat-currency-precision-ssot');
    expect(P4_CURRENCY_PRECISION_PREREQUISITE_TODO).toBe('p4-fiat-reference-preflight');
  });

  it('marks presentation-only boundary non-waivable', () => {
    expect(CURRENCY_PRECISION_DISPLAY_ONLY_BOUNDARY).toBe(true);
  });

  it('anchors optional E-Wave engine registry id', () => {
    expect(CURRENCY_PRECISION_EWAVE_DB_REGISTRY).toBe('ew-e*-engine-currency-precision-registry');
  });

  it('registers PHON/USDT/BTC/KRW decimals and rounding modes', () => {
    expect(CURRENCY_PRECISION_DISPLAY_REGISTRY.map((row) => row.currency)).toEqual([
      'PHON',
      'USDT',
      'KRW',
      'BTC',
    ]);
    expect(findCurrencyPrecisionEntry('PHON')).toMatchObject({
      decimals: 6,
      rounding_mode_debit_preview: 'ROUND_DOWN',
      rounding_mode_settlement_display: 'ROUND_HALF_EVEN',
      ledgerAuthority: 'phonara_money',
    });
    expect(findCurrencyPrecisionEntry('USDT')).toMatchObject({ decimals: 6 });
    expect(findCurrencyPrecisionEntry('BTC')).toMatchObject({
      decimals: 8,
      ledgerAuthority: 'display_asset_only',
    });
    expect(findCurrencyPrecisionEntry('KRW')).toMatchObject({ decimals: 0 });
  });

  it('separates ledger currencies from display-only base assets', () => {
    expect(CURRENCY_PRECISION_LEDGER_CURRENCIES).toEqual(['PHON', 'USDT', 'KRW']);
    expect(CURRENCY_PRECISION_DISPLAY_ASSET_CODES).toEqual(['BTC']);
    expect(isCurrencyPrecisionLedgerCurrency('PHON')).toBe(true);
    expect(isCurrencyPrecisionLedgerCurrency('BTC')).toBe(false);
  });

  it('resolves rounding mode by presentation context', () => {
    expect(resolveCurrencyRoundingMode('debit_preview')).toBe('ROUND_DOWN');
    expect(resolveCurrencyRoundingMode('settlement_display')).toBe('ROUND_HALF_EVEN');
  });

  it('delegates ledger debit_preview to @phonara/money toFixed (ROUND_DOWN SSOT)', () => {
    expect(formatCurrencyPrecisionDisplay('1.9999999', 'PHON', 'debit_preview')).toBe(
      toFixed('1.9999999', 'PHON'),
    );
    expect(formatCurrencyPrecisionDisplay('1.9999999', 'USDT', 'debit_preview')).toBe(
      toFixed('1.9999999', 'USDT'),
    );
    expect(formatCurrencyPrecisionDisplay('1300.9', 'KRW', 'debit_preview')).toBe(
      toFixed('1300.9', 'KRW'),
    );
  });

  it('uses ROUND_HALF_EVEN for settlement_display at registry decimals', () => {
    expect(formatCurrencyPrecisionDisplay('1.9999995', 'PHON', 'settlement_display')).toBe(
      '2.000000',
    );
    expect(formatCurrencyPrecisionDisplay('0.123456789', 'BTC', 'settlement_display')).toBe(
      '0.12345679',
    );
    expect(formatCurrencyPrecisionDisplay('1300.5', 'KRW', 'settlement_display')).toBe('1300');
  });

  it('uses ROUND_DOWN for BTC debit_preview at 8dp', () => {
    expect(formatCurrencyPrecisionDisplay('0.123456789', 'BTC', 'debit_preview')).toBe(
      '0.12345678',
    );
  });

  it('syncs registry decimals with @phonara/money DECIMALS for ledger currencies', () => {
    expect(DECIMALS.PHON).toBe(6);
    expect(DECIMALS.USDT).toBe(6);
    expect(DECIMALS.KRW).toBe(0);
    expect(() => assertCurrencyPrecisionMatchesMoneyDecimals()).not.toThrow();
  });

  it('assertCurrencyPrecisionContractRegistrySync stays green', () => {
    expect(() => assertCurrencyPrecisionContractRegistrySync()).not.toThrow();
  });

  it('assertCurrencyPrecisionPreflightSync stays green (registry + inline grep)', () => {
    expect(() => assertCurrencyPrecisionPreflightSync()).not.toThrow();
  });

  it('defines precision scan roots including trade and wallet surfaces', () => {
    expect(CURRENCY_PRECISION_SCAN_ROOTS).toContain('features/trading');
    expect(CURRENCY_PRECISION_SCAN_ROOTS).toContain('product/surfaces/wallet');
    expect(CURRENCY_PRECISION_SCAN_ROOTS).toContain('product/primitives');
  });

  it('finds zero forbidden inline toFixed(8) in presentation scan roots', () => {
    expect(scanCurrencyPrecisionInlineViolations()).toEqual([]);
    expect(CURRENCY_PRECISION_FORBIDDEN_INLINE_PATTERNS.length).toBeGreaterThanOrEqual(1);
  });

  it('throws on unknown currency codes', () => {
    expect(() => formatCurrencyPrecisionDisplay('1', 'ETH')).toThrow(/unknown currency/);
  });
});
