/**
 * §13.1.4.1 Currency precision SSOT — presentation-only (Fiat#2 · YAML #159).
 * Ledger settlement (PHON · USDT · KRW) defers to `@phonara/money` `toFixed(currency)`.
 * Base-asset qty display (BTC · majors) uses registry decimals — engine RPC remains authoritative.
 *
 * Authority: `p4-fiat-currency-precision-ssot` · Plan §13.1.4.1 · §20.13.2 Fiat#2
 * E-Wave (optional): `ew-e*-engine-currency-precision-registry`
 * @see domain/fiat-reference-display-contract.ts
 */

import type { Currency } from '@phonara/shared-types';
import { DECIMALS, Decimal, toDecimal, toFixed } from '@phonara/money';

/** Fiat#1 preflight — display-only fiat boundary must land before precision SSOT. */
export const P4_CURRENCY_PRECISION_PREREQUISITE_TODO = 'p4-fiat-reference-preflight' as const;

/** Fiat#2 owner todo — precision registry + @phonara/money sync + inline toFixed grep gate. */
export const P4_CURRENCY_PRECISION_SSOT_TODO = 'p4-fiat-currency-precision-ssot' as const;

/** Future engine registry table id (E-Wave · optional). */
export const CURRENCY_PRECISION_EWAVE_DB_REGISTRY =
  'ew-e*-engine-currency-precision-registry' as const;

/**
 * Non-waivable: this module formats presentation strings only.
 * Settlement truth stays engine/RPC; client float arithmetic is forbidden.
 */
export const CURRENCY_PRECISION_DISPLAY_ONLY_BOUNDARY = true as const;

export type CurrencyPrecisionDisplayContext = 'debit_preview' | 'settlement_display';

export type CurrencyRoundingMode = 'ROUND_DOWN' | 'ROUND_HALF_EVEN';

export type CurrencyPrecisionLedgerAuthority = 'phonara_money' | 'display_asset_only';

export type CurrencyPrecisionEntry = {
  readonly currency: string;
  readonly decimals: number;
  readonly rounding_mode_debit_preview: 'ROUND_DOWN';
  readonly rounding_mode_settlement_display: 'ROUND_HALF_EVEN';
  readonly ledgerAuthority: CurrencyPrecisionLedgerAuthority;
};

/** §13.1.4.1 — PHON 6 · USDT 6 · BTC 8 · KRW 0 (presentation registry). */
export const CURRENCY_PRECISION_DISPLAY_REGISTRY: readonly CurrencyPrecisionEntry[] = [
  {
    currency: 'PHON',
    decimals: 6,
    rounding_mode_debit_preview: 'ROUND_DOWN',
    rounding_mode_settlement_display: 'ROUND_HALF_EVEN',
    ledgerAuthority: 'phonara_money',
  },
  {
    currency: 'USDT',
    decimals: 6,
    rounding_mode_debit_preview: 'ROUND_DOWN',
    rounding_mode_settlement_display: 'ROUND_HALF_EVEN',
    ledgerAuthority: 'phonara_money',
  },
  {
    currency: 'KRW',
    decimals: 0,
    rounding_mode_debit_preview: 'ROUND_DOWN',
    rounding_mode_settlement_display: 'ROUND_HALF_EVEN',
    ledgerAuthority: 'phonara_money',
  },
  {
    currency: 'BTC',
    decimals: 8,
    rounding_mode_debit_preview: 'ROUND_DOWN',
    rounding_mode_settlement_display: 'ROUND_HALF_EVEN',
    ledgerAuthority: 'display_asset_only',
  },
] as const;

export const CURRENCY_PRECISION_LEDGER_CURRENCIES = [
  'PHON',
  'USDT',
  'KRW',
] as const satisfies readonly Currency[];

export type CurrencyPrecisionLedgerCurrency = (typeof CURRENCY_PRECISION_LEDGER_CURRENCIES)[number];

export const CURRENCY_PRECISION_DISPLAY_ASSET_CODES = ['BTC'] as const;

/** Forbidden — hardcoded magic precision in JSX/TSX presentation (§20.2 · §13.1.4.1). */
export const CURRENCY_PRECISION_FORBIDDEN_INLINE_PATTERNS: readonly RegExp[] = [
  /\.toFixed\s*\(\s*8\s*\)/,
];

/** Presentation roots scanned for inline money precision leaks. */
export const CURRENCY_PRECISION_SCAN_ROOTS = [
  'features/trading',
  'features/wallet',
  'features/sports',
  'features/casino',
  'product/surfaces/trade',
  'product/surfaces/wallet',
  'product/surfaces/sports',
  'product/surfaces/casino',
  'product/surfaces/staking',
  'product/primitives',
] as const;

export const CURRENCY_PRECISION_SCAN_EXCLUDE_PATH_SUBSTRINGS = [
  'domain/currency-precision-display-contract',
  'domain/fiat-reference-display-contract',
  '__tests__',
  '.test.',
  'money-input.ts',
  'order-book-display.ts',
  'format-ticker-display.ts',
  'format-funding-rate-display.ts',
  'format-liquidation-distance.ts',
] as const;

const ROUNDING_MODE_TO_DECIMAL: Record<CurrencyRoundingMode, Decimal.Rounding> = {
  ROUND_DOWN: Decimal.ROUND_DOWN,
  ROUND_HALF_EVEN: Decimal.ROUND_HALF_EVEN,
};

export function isCurrencyPrecisionLedgerCurrency(
  currency: string,
): currency is CurrencyPrecisionLedgerCurrency {
  return (CURRENCY_PRECISION_LEDGER_CURRENCIES as readonly string[]).includes(currency);
}

export function findCurrencyPrecisionEntry(currency: string): CurrencyPrecisionEntry | undefined {
  return CURRENCY_PRECISION_DISPLAY_REGISTRY.find((row) => row.currency === currency);
}

export function resolveCurrencyRoundingMode(
  context: CurrencyPrecisionDisplayContext,
): CurrencyRoundingMode {
  return context === 'debit_preview' ? 'ROUND_DOWN' : 'ROUND_HALF_EVEN';
}

export function resolveDecimalRoundingForContext(
  context: CurrencyPrecisionDisplayContext,
): Decimal.Rounding {
  return ROUNDING_MODE_TO_DECIMAL[resolveCurrencyRoundingMode(context)];
}

/**
 * Canonical presentation formatter — debit/withdraw preview uses ROUND_DOWN;
 * settlement display uses ROUND_HALF_EVEN at registry decimals.
 * Ledger currencies delegate debit_preview to `@phonara/money` `toFixed` (ROUND_DOWN SSOT).
 */
export function formatCurrencyPrecisionDisplay(
  amount: string,
  currency: string,
  context: CurrencyPrecisionDisplayContext = 'settlement_display',
): string {
  const entry = findCurrencyPrecisionEntry(currency);
  if (!entry) {
    throw new Error(`[currency-precision] unknown currency: ${currency}`);
  }

  if (
    context === 'debit_preview' &&
    entry.ledgerAuthority === 'phonara_money' &&
    isCurrencyPrecisionLedgerCurrency(currency)
  ) {
    return toFixed(amount, currency);
  }

  const rounding = resolveDecimalRoundingForContext(context);
  return toDecimal(amount).toDecimalPlaces(entry.decimals, rounding).toFixed(entry.decimals);
}

/** Registry sync — `@phonara/money` DECIMALS must match ledger rows (presentation guard). */
export function assertCurrencyPrecisionMatchesMoneyDecimals(): void {
  for (const currency of CURRENCY_PRECISION_LEDGER_CURRENCIES) {
    const entry = findCurrencyPrecisionEntry(currency);
    if (!entry) {
      throw new Error(`currency-precision: missing registry row for ${currency}`);
    }
    const moneyDecimals = DECIMALS[currency];
    if (entry.decimals !== moneyDecimals) {
      throw new Error(
        `currency-precision: ${currency} registry decimals (${entry.decimals}) != @phonara/money DECIMALS (${moneyDecimals})`,
      );
    }
  }
}

export function assertCurrencyPrecisionContractRegistrySync(): void {
  if (!CURRENCY_PRECISION_DISPLAY_ONLY_BOUNDARY) {
    throw new Error('currency-precision: display_only boundary must stay true');
  }

  const expectedCurrencies = ['PHON', 'USDT', 'KRW', 'BTC'] as const;
  for (const currency of expectedCurrencies) {
    const entry = findCurrencyPrecisionEntry(currency);
    if (!entry) {
      throw new Error(`currency-precision: missing registry row ${currency}`);
    }
    if (entry.rounding_mode_debit_preview !== 'ROUND_DOWN') {
      throw new Error(`currency-precision: ${currency} debit_preview must be ROUND_DOWN`);
    }
    if (entry.rounding_mode_settlement_display !== 'ROUND_HALF_EVEN') {
      throw new Error(`currency-precision: ${currency} settlement_display must be ROUND_HALF_EVEN`);
    }
  }

  const btc = findCurrencyPrecisionEntry('BTC');
  if (!btc || btc.decimals !== 8 || btc.ledgerAuthority !== 'display_asset_only') {
    throw new Error('currency-precision: BTC must be 8dp display_asset_only');
  }

  assertCurrencyPrecisionMatchesMoneyDecimals();
}
