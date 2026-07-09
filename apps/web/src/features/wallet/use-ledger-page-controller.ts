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
} from './ledger-entry-filters';
import { ledgerPageFiltersFromSearch, type LedgerPageSearch } from './ledger-page-display';
import { mapWalletLedgerRow } from './wallet-ledger-display';

export type LedgerPageControllerView = {
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

export function useLedgerPageController(search: LedgerPageSearch): LedgerPageControllerView {
  const { loading: authLoading } = useAuth();
  const { entries, loading: ledgerLoading, error, refresh } = useLedger(LEDGER_FETCH_LIMIT);

  const filters = ledgerPageFiltersFromSearch(search);

  const allRows = useMemo(() => entries.map(mapWalletLedgerRow), [entries]);

  const filteredRows = useMemo(
    () =>
      filterLedgerRows(allRows, {
        type: filters.type,
        currency: filters.currency,
        period: filters.period,
      }),
    [allRows, filters.type, filters.currency, filters.period],
  );

  const totalPages = ledgerPageCount(filteredRows.length);
  const page = clampLedgerPage(filters.page, totalPages);

  const rows = useMemo(() => paginateLedgerRows(filteredRows, page), [filteredRows, page]);

  const loading = authLoading || ledgerLoading;
  const empty = !loading && !error && allRows.length === 0;
  const filterEmpty = !loading && !error && allRows.length > 0 && filteredRows.length === 0;

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    errorKey: error,
    rows,
    filteredCount: filteredRows.length,
    page,
    totalPages,
    empty,
    filterEmpty,
    refresh: onRefresh,
  };
}
