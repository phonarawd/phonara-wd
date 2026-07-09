/**
 * §13.1.4 Fiat Reference Money Stack — preflight + FiatHint layer (Fiat#1 · Fiat#4).
 * Settlement (PHON · USDT · base) stays engine/RPC authoritative.
 * Fiat (KRW · USD · JPY · …) is FiatHint display-only — never ledger settlement for trade/sports/casino.
 *
 * Authority: `p4-fiat-reference-preflight` · `p4-fiat-hint-display-contract` · Plan §13.1.4.3 · §20.13.2
 * @see docs/SSOT/PLATFORM_NARRATIVE_CANON.md · docs/SSOT/GLOBAL_EXPANSION.md
 */

import { Decimal, toDecimal } from '@phonara/money';

import {
  formatCurrencyPrecisionDisplay,
  findCurrencyPrecisionEntry,
} from './currency-precision-display-contract';

/** Prerequisite Launch E4 — concurrent wallet race test (YAML #157). */
export const P4_FIAT_REFERENCE_PREFLIGHT_PREREQUISITE_TODO =
  'launch-engine-e4-concurrent-race-test' as const;

/** Fiat#1 owner todo — contract + ComplaintRisk registry + fiat leak grep gate. */
export const P4_FIAT_REFERENCE_PREFLIGHT_TODO = 'p4-fiat-reference-preflight' as const;

/** Fiat#2 precision SSOT — must land before Fiat#3 rates hook. */
export const P4_FIAT_REFERENCE_RATES_PREREQUISITE_TODO = 'p4-fiat-currency-precision-ssot' as const;

/** Fiat#3 owner todo — 3-tier fallback hook + pair TTL + wallet queryKey sharing. */
export const P4_FIAT_REFERENCE_RATES_HOOK_TODO = 'p4-fiat-reference-rates-hook' as const;

/** Fiat#4 prerequisite — rate layer hook must land before FiatHint formatter. */
export const P4_FIAT_HINT_DISPLAY_PREREQUISITE_TODO = P4_FIAT_REFERENCE_RATES_HOOK_TODO;

/** Fiat#4 owner todo — `toFiatHint` · `LOCALE_FIAT_MAP` · `trade.fiatHint.*` i18n. */
export const P4_FIAT_HINT_DISPLAY_CONTRACT_TODO = 'p4-fiat-hint-display-contract' as const;

/** Fiat#5 prerequisite — FiatHint formatter must land before MoneyDisplayWithFiatHint primitive. */
export const P4_FIAT_MONEY_DISPLAY_HINT_PREREQUISITE_TODO = P4_FIAT_HINT_DISPLAY_CONTRACT_TODO;

/** Fiat#5 owner todo — `money-display-with-fiat-hint.tsx` · asOf tooltip · disclaimer slot. */
export const P4_FIAT_MONEY_DISPLAY_HINT_TODO = 'p4-fiat-money-display-hint' as const;

/** Fiat#6 prerequisite — MoneyDisplayWithFiatHint primitive before Wallet/Ledger wire. */
export const P4_PAGE_WALLET_FIAT_HINT_PREREQUISITE_TODO = P4_FIAT_MONEY_DISPLAY_HINT_TODO;

/** Fiat#6 owner todo — Wallet/Ledger balance + ledger row secondary hints · shared wallet rate hook. */
export const P4_PAGE_WALLET_FIAT_HINT_TODO = 'p4-page-wallet-fiat-hint' as const;

/** Fiat#7 prerequisite — Wallet wire + spot-pair desk before Trade FiatHint. */
export const P9_TRADE_FIAT_HINT_WIRE_PREREQUISITE_TODO = P4_PAGE_WALLET_FIAT_HINT_TODO;

/** Fiat#7 owner todo — Trade header · ticket · PnL secondary hints · 30s trade rate policy. */
export const P9_TRADE_FIAT_HINT_WIRE_TODO = 'p9-trade-fiat-hint-wire' as const;

/** Fiat#8 prerequisite — MoneyDisplayWithFiatHint + trade/wallet wires before Earn co-primary. */
export const P7_EARN_FIAT_HINT_CO_PRIMARY_PREREQUISITE_TODO = P4_FIAT_MONEY_DISPLAY_HINT_TODO;

/** Fiat#8 owner todo — Earn mission/referral/tier cards · PHON + ≈fiat co-primary · 60s earn policy. */
export const P7_EARN_FIAT_HINT_CO_PRIMARY_TODO = 'p7-earn-fiat-hint-co-primary' as const;

/** Fiat#9 prerequisite — FiatHint formatter before settings toggle wire. */
export const P5_PAGE_SETTINGS_FIAT_REFERENCE_PREREQUISITE_TODO = P4_FIAT_HINT_DISPLAY_CONTRACT_TODO;

/** Fiat#9 owner todo — `/settings/preferences` · `preferences.fiatHintEnabled` read. */
export const P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO = 'p5-page-settings-fiat-reference' as const;

/** Fiat#9G prerequisite — Wallet · Trade · Earn · Settings wires before core gate. */
export const P4_FIAT_REFERENCE_WORLD_CLASS_GATE_PREREQUISITE_TODOS = [
  P4_PAGE_WALLET_FIAT_HINT_TODO,
  P9_TRADE_FIAT_HINT_WIRE_TODO,
  P7_EARN_FIAT_HINT_CO_PRIMARY_TODO,
  P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO,
] as const;

/** Fiat#9G owner todo — core bundle gate · P10 page unblock · YAML #167. */
export const P4_FIAT_REFERENCE_WORLD_CLASS_GATE_TODO =
  'p4-gate-fiat-reference-world-class' as const;

/**
 * Non-waivable boundary: FiatHint values are never settlement truth.
 * Mirrors `DISPLAY_ONLY_ODDS_SOURCE` on the sports ingest seam.
 */
export const FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY = true as const;

export type FiatReferenceDisplayOnlyMeta = {
  readonly displayOnly: typeof FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY;
};

/** Trade · Sports · Casino · Staking settlement currencies (engine RPC only). */
export const FIAT_REFERENCE_SETTLEMENT_CURRENCIES = ['PHON', 'USDT'] as const;

export type FiatReferenceSettlementCurrency = (typeof FIAT_REFERENCE_SETTLEMENT_CURRENCIES)[number];

/** Locale-resolved fiat codes for FiatHint (display-only · never trade/sports/casino stake). */
export const FIAT_REFERENCE_HINT_FIAT_CODES = ['KRW', 'USD', 'JPY', 'VND'] as const;

export type FiatReferenceHintFiatCode = (typeof FIAT_REFERENCE_HINT_FIAT_CODES)[number];

/** Sentinel — locale default with FiatHint disabled (en · unknown locales). */
export const LOCALE_FIAT_OFF = 'OFF' as const;

export type LocaleFiatPreference = FiatReferenceHintFiatCode | typeof LOCALE_FIAT_OFF;

/**
 * §13.1.4.3 — locale → default target fiat (settings override in Fiat#9).
 * `en` defaults OFF; `ja` JPY slot reserved for E-Wave catalog expansion.
 */
export const LOCALE_FIAT_MAP: Readonly<Record<string, LocaleFiatPreference>> = {
  ko: 'KRW',
  en: LOCALE_FIAT_OFF,
  ja: 'JPY',
} as const;

export type FiatReferenceRateSnapshot = FiatReferenceDisplayOnlyMeta & {
  readonly rate: string;
  readonly capturedAt: string;
  readonly source: string;
  readonly stale: boolean;
};

/** Secondary span only (never primary MoneyDisplay on Trade). */
export type FiatHintView = FiatReferenceDisplayOnlyMeta & {
  readonly formattedHint: string;
  readonly targetFiat: LocaleFiatPreference;
  readonly asOf: string;
  readonly stale: boolean;
  readonly disabled: boolean;
  readonly sourceCurrency: string;
};

export const FIAT_HINT_I18N_KEY_PREFIX = 'trade.fiatHint' as const;

/** Canonical i18n keys — surfaces share one disclaimer + asOf tooltip grammar. */
export const FIAT_HINT_I18N_KEYS = {
  asOf: `${FIAT_HINT_I18N_KEY_PREFIX}.asOf`,
  disclaimer: `${FIAT_HINT_I18N_KEY_PREFIX}.disclaimer`,
  staleBadge: `${FIAT_HINT_I18N_KEY_PREFIX}.staleBadge`,
  unavailable: `${FIAT_HINT_I18N_KEY_PREFIX}.unavailable`,
} as const;

/** Presentation decimals for hint-only fiat codes not in Fiat#2 ledger registry. */
export const FIAT_HINT_DISPLAY_DECIMALS: Readonly<Record<FiatReferenceHintFiatCode, number>> = {
  KRW: 0,
  USD: 2,
  JPY: 0,
  VND: 0,
} as const;

const FIAT_HINT_CURRENCY_SYMBOL: Readonly<Record<FiatReferenceHintFiatCode, string>> = {
  KRW: '₩',
  USD: '$',
  JPY: '¥',
  VND: '₫',
} as const;

export const FIAT_REFERENCE_RATE_QUERY_KEY_BASE = ['exchange-rate'] as const;

/** Canonical pairs for §13.1.4.2 rate layer (display-only). */
export const FIAT_REFERENCE_RATE_PAIRS = [
  { base: 'USDT', quote: 'KRW' },
  { base: 'PHON', quote: 'USDT' },
  { base: 'PHON', quote: 'KRW' },
] as const;

export type FiatReferenceRatePair = (typeof FIAT_REFERENCE_RATE_PAIRS)[number];

export type FiatReferencePairKey =
  `${FiatReferenceRatePair['base']}/${FiatReferenceRatePair['quote']}`;

/** Shared TanStack Query key — wallet deposit/withdraw controllers reuse this shape. */
export function buildFiatReferenceRateQueryKey(
  base: string,
  quote: string,
): readonly [...typeof FIAT_REFERENCE_RATE_QUERY_KEY_BASE, string, string, 'active'] {
  return [...FIAT_REFERENCE_RATE_QUERY_KEY_BASE, base, quote, 'active'] as const;
}

/** §13.1.4.2 default stale TTL seconds (pair-specific overrides in Fiat#3 hook). */
export const FIAT_REFERENCE_STALE_TTL_SECONDS = {
  'USDT/KRW': 15 * 60,
  'PHON/USDT': 5 * 60,
  'PHON/KRW': 15 * 60,
} as const;

export type FiatHintComplaintMitigation = 'live' | 'disabled+key' | 'built_hidden';

export type FiatHintComplaintRisk = {
  readonly id: string;
  readonly control: string;
  readonly rpcPath: string | null;
  readonly failSymptom: string;
  readonly ownerTodo: string;
  readonly mitigatedBy: FiatHintComplaintMitigation;
};

/** §32.7 — Fiat Reference ComplaintRisk registry (§13.1.4.5). */
export const FIAT_HINT_COMPLAINT_RISKS: readonly FiatHintComplaintRisk[] = [
  {
    id: 'fiat-hint-ledger-leak',
    control: 'Ledger/RPC settlement currency',
    rpcPath: 'wallet_ledger · order/bet RPC params',
    failSymptom: 'KRW or fiat amount in ledger row or trade/sports/casino settlement RPC',
    ownerTodo: P4_FIAT_REFERENCE_PREFLIGHT_TODO,
    mitigatedBy: 'live',
  },
  {
    id: 'fiat-hint-stale-hidden',
    control: 'FiatHint stale badge',
    rpcPath: 'exchange_rate_snapshots · useFiatReferenceRates',
    failSymptom: 'stale rate but fresh-looking hint',
    ownerTodo: 'p4-fiat-reference-rates-hook',
    mitigatedBy: 'live',
  },
  {
    id: 'fiat-hint-locale-hardcode-krw',
    control: 'Locale→targetFiat map',
    rpcPath: null,
    failSymptom: 'en shows KRW · ja blocked',
    ownerTodo: 'p4-fiat-hint-display-contract',
    mitigatedBy: 'live',
  },
  {
    id: 'fiat-hint-casino-drift',
    control: 'Casino session-locked rate',
    rpcPath: 'CasinoFiatRateSession',
    failSymptom: 'spin session hint changes per spin',
    ownerTodo: 'p10-casino-fiat-hint-session-lock',
    mitigatedBy: 'live',
  },
  {
    id: 'fiat-hint-sports-odds-order',
    control: 'Sports stake+return hint timing',
    rpcPath: 'rpc_place_sports_bet return',
    failSymptom: 'hint before RPC return · client odds multiply',
    ownerTodo: 'p10-sports-fiat-hint-wire',
    mitigatedBy: 'live',
  },
] as const;

export const FIAT_HINT_COMPLAINT_RISK_IDS = FIAT_HINT_COMPLAINT_RISKS.map((row) => row.id);

/** §13.1.4.3 — forbidden identifiers (use fiatHint · FiatHint · toFiatHint). */
export const FIAT_FORBIDDEN_IDENTIFIER_PATTERNS: readonly RegExp[] = [
  /\bkrwHint\b/,
  /\bKrwDisplay\b/,
  /\bKrwHint\b/,
];

/**
 * Settlement-surface leak patterns — outbound RPC args must not carry fiat settlement.
 * Wallet KRW deposit/withdraw paths are excluded via `FIAT_LEAK_SCAN_EXCLUDE_PATH_SUBSTRINGS`.
 */
export const FIAT_SETTLEMENT_LEAK_PATTERNS: readonly RegExp[] = [
  /margin_currency\s*:\s*['"]KRW['"]/,
  /stake_currency\s*:\s*['"]KRW['"]/,
  /p_margin_currency\s*:\s*['"]KRW['"]/,
  /p_stake_currency\s*:\s*['"]KRW['"]/,
  /amount_krw\s*:/,
  /fiat_amount\s*:/,
  /fiatHintAmount\s*:/,
  /(?:callRpc|\.rpc)\s*\([^)]*['"]KRW['"]/,
];

/** Presentation roots scanned for fiat settlement leaks (trade/sports/casino/staking — not wallet KRW rail). */
export const FIAT_LEAK_SCAN_ROOTS = [
  'features/trading',
  'features/sports',
  'features/casino',
  'features/earn',
  'product/surfaces/trade',
  'product/surfaces/sports',
  'product/surfaces/casino',
  'product/surfaces/staking',
] as const;

/** Legitimate KRW engine paths — wallet deposit/withdraw + contract/tests. */
export const FIAT_LEAK_SCAN_EXCLUDE_PATH_SUBSTRINGS = [
  'features/wallet/krw',
  'features/wallet/use-krw',
  'product/surfaces/wallet/krw',
  'domain/fiat-reference-display-contract',
  '__tests__',
  '.test.',
] as const;

export function findFiatHintComplaintRisk(id: string): FiatHintComplaintRisk | undefined {
  return FIAT_HINT_COMPLAINT_RISKS.find((row) => row.id === id);
}

export function listFiatHintComplaintRisksByOwnerTodo(ownerTodo: string): FiatHintComplaintRisk[] {
  return FIAT_HINT_COMPLAINT_RISKS.filter((row) => row.ownerTodo === ownerTodo);
}

function withThousandsGrouping(value: string): string {
  const [whole = '0', fraction] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction !== undefined ? `${grouped}.${fraction}` : grouped;
}

function isFiatHintRateUnavailable(
  rateSnapshot: FiatReferenceRateSnapshot | null | undefined,
): boolean {
  if (!rateSnapshot) return true;
  try {
    return !toDecimal(rateSnapshot.rate).gt(0);
  } catch {
    return true;
  }
}

export function isFiatHintTargetActive(
  targetFiat: LocaleFiatPreference | null | undefined,
): targetFiat is FiatReferenceHintFiatCode {
  return (
    targetFiat != null &&
    targetFiat !== LOCALE_FIAT_OFF &&
    (FIAT_REFERENCE_HINT_FIAT_CODES as readonly string[]).includes(targetFiat)
  );
}

/**
 * Resolve locale default target fiat — respects user toggle (Fiat#9) before map lookup.
 * `en` stays OFF unless operator enables co-hint in a future global slice.
 */
export function resolveLocaleTargetFiat(locale: string, hintEnabled = true): LocaleFiatPreference {
  if (!hintEnabled) return LOCALE_FIAT_OFF;
  const language = locale.split('-')[0]?.toLowerCase() ?? 'en';
  return LOCALE_FIAT_MAP[language] ?? LOCALE_FIAT_OFF;
}

function formatFiatHintNumeric(amount: string, targetFiat: FiatReferenceHintFiatCode): string {
  const precisionEntry = findCurrencyPrecisionEntry(targetFiat);
  if (precisionEntry) {
    return formatCurrencyPrecisionDisplay(amount, targetFiat, 'settlement_display');
  }

  const decimals = FIAT_HINT_DISPLAY_DECIMALS[targetFiat];
  return toDecimal(amount).toDecimalPlaces(decimals, Decimal.ROUND_HALF_EVEN).toFixed(decimals);
}

/**
 * Canonical fiat amount formatter — replaces ad-hoc `formatKrwWon` at FiatHint call sites.
 * Returns currency symbol + grouped digits (no `≈` prefix; `toFiatHint` adds that).
 */
export function formatFiatHintAmount(
  amount: string | null | undefined,
  targetFiat: FiatReferenceHintFiatCode,
): string {
  if (amount == null || amount === '') return '—';
  try {
    const numeric = formatFiatHintNumeric(amount, targetFiat);
    const grouped = withThousandsGrouping(numeric);
    return `${FIAT_HINT_CURRENCY_SYMBOL[targetFiat]}${grouped}`;
  } catch {
    return '—';
  }
}

/**
 * §13.1.4.3 — display-only fiat secondary hint from settlement amount + rate snapshot.
 * Caller supplies the resolved pair rate (from `useFiatReferenceRates`); no client-side odds multiply.
 */
export function toFiatHint(
  amount: string,
  sourceCurrency: string,
  targetFiat: LocaleFiatPreference | null | undefined,
  rateSnapshot: FiatReferenceRateSnapshot | null | undefined,
): FiatHintView {
  if (!isFiatHintTargetActive(targetFiat)) {
    return {
      displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
      formattedHint: '',
      targetFiat: LOCALE_FIAT_OFF,
      asOf: '',
      stale: false,
      disabled: true,
      sourceCurrency,
    };
  }

  const unavailable = isFiatHintRateUnavailable(rateSnapshot);
  const stale = rateSnapshot?.stale ?? true;

  if (unavailable) {
    return {
      displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
      formattedHint: '—',
      targetFiat,
      asOf: rateSnapshot?.capturedAt ?? '',
      stale: true,
      disabled: false,
      sourceCurrency,
    };
  }

  const converted = toDecimal(amount).mul(toDecimal(rateSnapshot!.rate)).toFixed();

  const formattedAmount = formatFiatHintAmount(converted, targetFiat);
  const formattedHint = formattedAmount === '—' ? '—' : `≈ ${formattedAmount}`;

  return {
    displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
    formattedHint,
    targetFiat,
    asOf: rateSnapshot!.capturedAt,
    stale,
    disabled: false,
    sourceCurrency,
  };
}

/** Fiat#4 closeout — locale map + i18n key registry sync. */
export function assertFiatHintDisplayContractSync(): void {
  if (LOCALE_FIAT_MAP['ko'] !== 'KRW') {
    throw new Error('fiat-hint: ko locale must default to KRW');
  }
  if (LOCALE_FIAT_MAP['en'] !== LOCALE_FIAT_OFF) {
    throw new Error('fiat-hint: en locale must default to OFF');
  }
  if (LOCALE_FIAT_MAP['ja'] !== 'JPY') {
    throw new Error('fiat-hint: ja locale must reserve JPY slot');
  }

  const localeRisk = findFiatHintComplaintRisk('fiat-hint-locale-hardcode-krw');
  if (!localeRisk || localeRisk.ownerTodo !== P4_FIAT_HINT_DISPLAY_CONTRACT_TODO) {
    throw new Error(
      'fiat-hint: fiat-hint-locale-hardcode-krw must be owned by p4-fiat-hint-display-contract',
    );
  }

  const expectedKeys = ['asOf', 'disclaimer', 'staleBadge', 'unavailable'] as const;
  for (const key of expectedKeys) {
    const fullKey = FIAT_HINT_I18N_KEYS[key];
    if (!fullKey.startsWith(`${FIAT_HINT_I18N_KEY_PREFIX}.`)) {
      throw new Error(`fiat-hint: invalid i18n key ${fullKey}`);
    }
  }
}

/** Registry sync — grep gate runs in `domain/__tests__/fiat-reference-display-audit-lib`. */
export function assertFiatReferenceContractRegistrySync(): void {
  if (!FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY) {
    throw new Error('fiat-reference: display_only boundary must stay true');
  }

  const expectedIds = [
    'fiat-hint-ledger-leak',
    'fiat-hint-stale-hidden',
    'fiat-hint-locale-hardcode-krw',
    'fiat-hint-casino-drift',
    'fiat-hint-sports-odds-order',
  ] as const;

  for (const id of expectedIds) {
    const row = findFiatHintComplaintRisk(id);
    if (!row) {
      throw new Error(`fiat-reference: missing ComplaintRisk row ${id}`);
    }
    if (!['live', 'disabled+key', 'built_hidden'].includes(row.mitigatedBy)) {
      throw new Error(`fiat-reference: complaint risk ${id} has invalid mitigatedBy`);
    }
  }

  const ledgerLeak = findFiatHintComplaintRisk('fiat-hint-ledger-leak');
  if (!ledgerLeak || ledgerLeak.ownerTodo !== P4_FIAT_REFERENCE_PREFLIGHT_TODO) {
    throw new Error(
      'fiat-reference: fiat-hint-ledger-leak must be owned by p4-fiat-reference-preflight',
    );
  }
}
