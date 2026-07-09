import { useCallback, useMemo } from 'react';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { useLedger } from '@/hooks/use-wallet';
import {
  clampLedgerPage,
  filterLedgerRows,
  LEDGER_FETCH_LIMIT,
  ledgerPageCount,
  paginateLedgerRows,
  type LedgerRowView,
} from '@/features/wallet/ledger-entry-filters';
import { mapWalletLedgerRow } from '@/features/wallet/wallet-ledger-display';

import {
  rewardsHistoryFiltersFromSearch,
  type RewardsHistoryPageSearch,
} from './rewards-history-page-display';

export type RewardsHistoryControllerView = {
  loading: boolean;
  errorKey: MessageKey | null;
  rows: LedgerRowView[];
  filteredCount: number;
  page: number;
  totalPages: number;
  empty: boolean;
  filterEmpty: boolean;
  refresh: () => void;
};

/** `/rewards/history` — wallet_ledger rows filtered to reward kinds only. */
export function useRewardsHistoryController(
  search: RewardsHistoryPageSearch,
): RewardsHistoryControllerView {
  const { loading: authLoading } = useAuth();
  const { entries, loading: ledgerLoading, error, refresh } = useLedger(LEDGER_FETCH_LIMIT);

  const filters = rewardsHistoryFiltersFromSearch(search);

  const allRows = useMemo(() => entries.map(mapWalletLedgerRow), [entries]);

  const rewardRows = useMemo(
    () =>
      filterLedgerRows(allRows, {
        type: 'reward',
        currency: filters.currency,
        period: filters.period,
      }),
    [allRows, filters.currency, filters.period],
  );

  const totalPages = ledgerPageCount(rewardRows.length);
  const page = clampLedgerPage(filters.page, totalPages);

  const rows = useMemo(() => paginateLedgerRows(rewardRows, page), [rewardRows, page]);

  const loading = authLoading || ledgerLoading;
  const hasAnyRewards = useMemo(
    () => filterLedgerRows(allRows, { type: 'reward', currency: 'all', period: 'all' }).length > 0,
    [allRows],
  );
  const empty = !loading && !error && !hasAnyRewards;
  const filterEmpty = !loading && !error && hasAnyRewards && rewardRows.length === 0;

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    errorKey: error,
    rows,
    filteredCount: rewardRows.length,
    page,
    totalPages,
    empty,
    filterEmpty,
    refresh: onRefresh,
  };
}
