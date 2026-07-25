import { useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import {
  hasActiveRewardsHistoryFilters,
  LEDGER_CURRENCY_FILTER_OPTIONS,
  LEDGER_PERIOD_FILTER_OPTIONS,
  ledgerCurrencyFilterLabelKey,
  ledgerPeriodFilterLabelKey,
  rewardsHistoryFiltersFromSearch,
  type RewardsHistoryPageSearch,
} from '@/features/earn/rewards-history-page-display';
import { useRewardsHistoryController } from '@/features/earn/use-rewards-history-controller';
import { ledgerReasonLabelKey } from '@/features/wallet/ledger-labels';
import { ledgerDirectionLabelKey } from '@/features/wallet/ledger-page-display';
import { useI18n, useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { MoneyDisplay } from '@/product/primitives/money-display';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/product/primitives/select';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function RewardsHistoryLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="rewards-history-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Canonical `/rewards/history` — reward-kind ledger filter (P4). */
export function RewardsHistoryPage() {
  const t = useT();
  const { locale } = useI18n();
  const navigate = useNavigate({ from: '/rewards/history' });
  const search = useSearch({ from: '/rewards/history' }) as RewardsHistoryPageSearch;
  const filters = rewardsHistoryFiltersFromSearch(search);
  const engine = useRewardsHistoryController(search);

  useEffect(() => {
    document.title = t('seo.rewards.history.title');
  }, [t]);

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updateSearch = (patch: Partial<RewardsHistoryPageSearch>, resetPage = false) => {
    void navigate({
      search: (prev) => {
        const next = { ...prev, ...patch };
        if (resetPage) {
          delete next.page;
        }
        if (next.currency === undefined) delete next.currency;
        if (next.period === undefined) delete next.period;
        if (next.page === undefined || next.page <= 1) delete next.page;
        return next;
      },
      replace: true,
    });
  };

  const clearFilters = () => {
    void navigate({ search: {}, replace: true });
  };

  if (engine.loading) {
    return <RewardsHistoryLoadingShell />;
  }

  if (engine.errorKey) {
    return (
      <div
        className="border-danger/30 bg-surface flex flex-col items-start gap-3 rounded-lg border p-4"
        data-testid="rewards-history-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(engine.errorKey)}</p>
        <Button type="button" variant="outline" size="sm" onClick={engine.refresh}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const showClearFilters = hasActiveRewardsHistoryFilters(filters);

  return (
    <div className="flex flex-col gap-ds-8 py-4 md:py-6" data-testid="rewards-history-page">
      <header className="space-y-3">
        <a
          href="/home"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          {t('rewards.history.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('rewards.history.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">{t('rewards.history.subtitle')}</p>
        </div>
        <a
          href="/ledger?filter=reward"
          data-testid="rewards-history-ledger-link"
          className="text-accent text-sm font-medium underline-offset-4 hover:underline"
        >
          {t('rewards.history.viewLedger')}
        </a>
      </header>

      <section aria-labelledby="rewards-history-filters-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="rewards-history-filters-heading"
            className="text-foreground m-0 text-sm font-medium"
          >
            {t('rewards.history.filters.label')}
          </h2>
          {showClearFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              {t('wallet.ledger.filters.clear')}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2" data-testid="rewards-history-filters">
          <label className="flex flex-col gap-1.5">
            <span className="text-foreground-muted text-xs font-medium">
              {t('wallet.ledger.filters.currency')}
            </span>
            <Select
              value={filters.currency}
              onValueChange={(value) =>
                updateSearch(
                  {
                    currency:
                      value === 'all' ? undefined : (value as RewardsHistoryPageSearch['currency']),
                  },
                  true,
                )
              }
            >
              <SelectTrigger aria-label={t('wallet.ledger.filters.currency')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEDGER_CURRENCY_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(ledgerCurrencyFilterLabelKey(option))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-foreground-muted text-xs font-medium">
              {t('wallet.ledger.filters.period')}
            </span>
            <Select
              value={filters.period}
              onValueChange={(value) =>
                updateSearch(
                  {
                    period:
                      value === 'all' ? undefined : (value as RewardsHistoryPageSearch['period']),
                  },
                  true,
                )
              }
            >
              <SelectTrigger aria-label={t('wallet.ledger.filters.period')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEDGER_PERIOD_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(ledgerPeriodFilterLabelKey(option))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </section>

      {engine.empty ? (
        <p className="text-foreground-muted m-0 text-sm" data-testid="rewards-history-empty">
          {t('rewards.history.empty')}
        </p>
      ) : engine.filterEmpty ? (
        <p className="text-foreground-muted m-0 text-sm" data-testid="rewards-history-filter-empty">
          {t('rewards.history.filterEmpty')}
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table
              className="w-full min-w-[560px] border-collapse text-sm"
              data-testid="rewards-history-table"
            >
              <thead>
                <tr className="border-line border-b text-left">
                  <th className="text-foreground-muted px-3 py-2 font-medium">
                    {t('wallet.ledger.col.date')}
                  </th>
                  <th className="text-foreground-muted px-3 py-2 font-medium">
                    {t('wallet.ledger.col.type')}
                  </th>
                  <th className="text-foreground-muted px-3 py-2 font-medium">
                    {t('ledger.col.currency')}
                  </th>
                  <th className="text-foreground-muted px-3 py-2 text-right font-medium">
                    {t('wallet.ledger.col.amount')}
                  </th>
                  <th className="text-foreground-muted px-3 py-2 font-medium">
                    {t('wallet.ledger.col.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {engine.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-line border-b last:border-b-0"
                    data-testid="rewards-history-row"
                  >
                    <td className="text-foreground px-3 py-3 tabular-nums">
                      {dateFormatter.format(new Date(row.createdAt))}
                    </td>
                    <td className="text-foreground px-3 py-3">
                      {t(ledgerReasonLabelKey(row.reasonCode))}
                    </td>
                    <td className="text-foreground px-3 py-3">{row.currency}</td>
                    <td className="px-3 py-3 text-right">
                      <MoneyDisplay
                        amount={row.amount}
                        currency={row.currency}
                        signed
                        showCurrency
                        className="text-sm font-medium"
                      />
                    </td>
                    <td className="text-foreground-muted px-3 py-3">
                      {t(ledgerDirectionLabelKey(row.direction))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul
            className="border-line divide-line m-0 list-none divide-y rounded-md border p-0 md:hidden"
            data-testid="rewards-history-list"
          >
            {engine.rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 px-4 py-3"
                data-testid="rewards-history-row"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-foreground m-0 truncate text-sm font-medium">
                      {t(ledgerReasonLabelKey(row.reasonCode))}
                    </p>
                    <p className="text-foreground-muted m-0 text-xs tabular-nums">
                      {dateFormatter.format(new Date(row.createdAt))}
                    </p>
                  </div>
                  <MoneyDisplay
                    amount={row.amount}
                    currency={row.currency}
                    signed
                    showCurrency
                    className={cn('shrink-0 text-sm font-medium')}
                  />
                </div>
                <div className="text-foreground-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span>{row.currency}</span>
                  <span>{t(ledgerDirectionLabelKey(row.direction))}</span>
                </div>
              </li>
            ))}
          </ul>

          {engine.totalPages > 1 ? (
            <nav
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              aria-label={t('wallet.ledger.pagination.label')}
              data-testid="rewards-history-pagination"
            >
              <p className="text-foreground-muted m-0 text-sm tabular-nums">
                {t('wallet.ledger.pagination.summary', {
                  page: engine.page,
                  total: engine.totalPages,
                  count: engine.filteredCount,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={engine.page <= 1}
                  onClick={() => updateSearch({ page: engine.page - 1 })}
                >
                  {t('wallet.ledger.pagination.previous')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={engine.page >= engine.totalPages}
                  onClick={() => updateSearch({ page: engine.page + 1 })}
                >
                  {t('wallet.ledger.pagination.next')}
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
