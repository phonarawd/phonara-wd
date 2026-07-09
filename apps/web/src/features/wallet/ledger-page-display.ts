import type { MessageKey } from '@phonara/i18n';
import type { Tables } from '@phonara/shared-types';

import type {
  LedgerCurrencyFilter,
  LedgerPeriodFilter,
  LedgerTypeFilter,
} from './ledger-entry-filters';

export type LedgerPageSearch = {
  filter?: LedgerTypeFilter;
  currency?: LedgerCurrencyFilter;
  period?: LedgerPeriodFilter;
  page?: number;
};

export const LEDGER_TYPE_FILTER_OPTIONS: readonly LedgerTypeFilter[] = [
  'all',
  'deposit',
  'withdraw',
  'bet',
  'reward',
] as const;

export const LEDGER_CURRENCY_FILTER_OPTIONS: readonly LedgerCurrencyFilter[] = [
  'all',
  'PHON',
  'USDT',
  'KRW',
] as const;

export const LEDGER_PERIOD_FILTER_OPTIONS: readonly LedgerPeriodFilter[] = [
  'all',
  '7d',
  '30d',
  '90d',
] as const;

const TYPE_LABEL_KEYS: Record<LedgerTypeFilter, MessageKey> = {
  all: 'wallet.ledger.filters.type.all',
  deposit: 'wallet.ledger.filters.type.deposit',
  withdraw: 'wallet.ledger.filters.type.withdraw',
  bet: 'wallet.ledger.filters.type.bet',
  reward: 'wallet.ledger.filters.type.reward',
};

const PERIOD_LABEL_KEYS: Record<LedgerPeriodFilter, MessageKey> = {
  all: 'wallet.ledger.filters.period.all',
  '7d': 'wallet.ledger.filters.period.7d',
  '30d': 'wallet.ledger.filters.period.30d',
  '90d': 'wallet.ledger.filters.period.90d',
};

const CURRENCY_CODE_KEYS: Record<Tables<'wallet_ledger'>['currency'], MessageKey> = {
  PHON: 'wallet.currency.phon',
  USDT: 'wallet.currency.usdt',
  KRW: 'wallet.currency.krw',
};

const DIRECTION_LABEL_KEYS: Record<string, MessageKey> = {
  credit: 'ledger.direction.credit',
  debit: 'ledger.direction.debit',
  lock: 'ledger.direction.lock',
  unlock: 'ledger.direction.unlock',
  reverse: 'ledger.direction.reverse',
};

export function ledgerDirectionLabelKey(direction: string): MessageKey {
  return DIRECTION_LABEL_KEYS[direction] ?? 'ledger.direction.unknown';
}

export function ledgerTypeFilterLabelKey(type: LedgerTypeFilter): MessageKey {
  return TYPE_LABEL_KEYS[type];
}

export function ledgerCurrencyFilterLabelKey(currency: LedgerCurrencyFilter): MessageKey {
  if (currency === 'all') return 'wallet.ledger.filters.currency.all';
  return CURRENCY_CODE_KEYS[currency];
}

export function ledgerPeriodFilterLabelKey(period: LedgerPeriodFilter): MessageKey {
  return PERIOD_LABEL_KEYS[period];
}

/** Maps legacy `?filter=trade` (plan §12.19) to bet category. */
export function parseLedgerTypeFilter(raw: unknown): LedgerTypeFilter {
  if (raw === 'trade') return 'bet';
  if (
    raw === 'deposit' ||
    raw === 'withdraw' ||
    raw === 'bet' ||
    raw === 'reward' ||
    raw === 'all'
  ) {
    return raw;
  }
  return 'all';
}

export function parseLedgerCurrencyFilter(raw: unknown): LedgerCurrencyFilter {
  if (raw === 'PHON' || raw === 'USDT' || raw === 'KRW') return raw;
  return 'all';
}

export function parseLedgerPeriodFilter(raw: unknown): LedgerPeriodFilter {
  if (raw === '7d' || raw === '30d' || raw === '90d') return raw;
  return 'all';
}

function parseLedgerPage(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(1, Math.floor(raw));
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw)) {
    return Math.max(1, parseInt(raw, 10));
  }
  return 1;
}

export function parseLedgerPageSearch(search: Record<string, unknown>): LedgerPageSearch {
  const type = parseLedgerTypeFilter(search['filter']);
  const currency = parseLedgerCurrencyFilter(search['currency']);
  const period = parseLedgerPeriodFilter(search['period']);
  const page = parseLedgerPage(search['page']);

  return {
    filter: type === 'all' ? undefined : type,
    currency: currency === 'all' ? undefined : currency,
    period: period === 'all' ? undefined : period,
    page: page > 1 ? page : undefined,
  };
}

export function ledgerPageFiltersFromSearch(search: LedgerPageSearch): {
  type: LedgerTypeFilter;
  currency: LedgerCurrencyFilter;
  period: LedgerPeriodFilter;
  page: number;
} {
  return {
    type: search.filter ?? 'all',
    currency: search.currency ?? 'all',
    period: search.period ?? 'all',
    page: search.page ?? 1,
  };
}

export function hasActiveLedgerFilters(filters: {
  type: LedgerTypeFilter;
  currency: LedgerCurrencyFilter;
  period: LedgerPeriodFilter;
}): boolean {
  return filters.type !== 'all' || filters.currency !== 'all' || filters.period !== 'all';
}
