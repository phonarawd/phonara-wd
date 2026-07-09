import type {
  LedgerCurrencyFilter,
  LedgerPeriodFilter,
} from '@/features/wallet/ledger-entry-filters';
import {
  LEDGER_CURRENCY_FILTER_OPTIONS,
  LEDGER_PERIOD_FILTER_OPTIONS,
  ledgerCurrencyFilterLabelKey,
  ledgerPeriodFilterLabelKey,
  parseLedgerCurrencyFilter,
  parseLedgerPeriodFilter,
} from '@/features/wallet/ledger-page-display';

export type RewardsHistoryPageSearch = {
  currency?: LedgerCurrencyFilter;
  period?: LedgerPeriodFilter;
  page?: number;
};

export { LEDGER_CURRENCY_FILTER_OPTIONS, LEDGER_PERIOD_FILTER_OPTIONS };
export { ledgerCurrencyFilterLabelKey, ledgerPeriodFilterLabelKey };

function parseRewardsHistoryPage(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(1, Math.floor(raw));
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw)) {
    return Math.max(1, parseInt(raw, 10));
  }
  return 1;
}

export function parseRewardsHistoryPageSearch(
  search: Record<string, unknown>,
): RewardsHistoryPageSearch {
  const currency = parseLedgerCurrencyFilter(search['currency']);
  const period = parseLedgerPeriodFilter(search['period']);
  const page = parseRewardsHistoryPage(search['page']);

  return {
    currency: currency === 'all' ? undefined : currency,
    period: period === 'all' ? undefined : period,
    page: page > 1 ? page : undefined,
  };
}

export function rewardsHistoryFiltersFromSearch(search: RewardsHistoryPageSearch): {
  currency: LedgerCurrencyFilter;
  period: LedgerPeriodFilter;
  page: number;
} {
  return {
    currency: search.currency ?? 'all',
    period: search.period ?? 'all',
    page: search.page ?? 1,
  };
}

export function hasActiveRewardsHistoryFilters(filters: {
  currency: LedgerCurrencyFilter;
  period: LedgerPeriodFilter;
}): boolean {
  return filters.currency !== 'all' || filters.period !== 'all';
}
