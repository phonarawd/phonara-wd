import { useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import {
  hasActiveLedgerFilters,
  ledgerCurrencyFilterLabelKey,
  ledgerDirectionLabelKey,
  ledgerPageFiltersFromSearch,
  ledgerPeriodFilterLabelKey,
  ledgerTypeFilterLabelKey,
  LEDGER_CURRENCY_FILTER_OPTIONS,
  LEDGER_PERIOD_FILTER_OPTIONS,
  LEDGER_TYPE_FILTER_OPTIONS,
  type LedgerPageSearch,
} from '@/features/wallet/ledger-page-display';
import { ledgerReasonLabelKey } from '@/features/wallet/ledger-labels';
import { useLedgerPageController } from '@/features/wallet/use-ledger-page-controller';
import { useWalletFiatHint } from '@/features/wallet/use-wallet-fiat-hint';
import { useI18n, useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { EmptyState } from '@/product/primitives/empty-state';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';
import { MoneyDisplay } from '@/product/primitives/money-display';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/product/primitives/select';
import { QuadStreamLoading } from '@/product/primitives/quad-stream-loading';
import { cn } from '@/product/primitives/lib/cn';

import { WalletMoneyWithFiatHint } from './wallet-money-with-fiat-hint';

function LedgerLoadingShell() {
  return <QuadStreamLoading testId="ledger-loading" />;
}

/** Canonical `/ledger` — wallet_ledger read · filters · tabular nums (P4·W3). */
export function LedgerPage() {
  const t = useT();
  const { locale } = useI18n();
  const navigate = useNavigate({ from: '/ledger' });
  const search = useSearch({ from: '/ledger' }) as LedgerPageSearch;
  const filters = ledgerPageFiltersFromSearch(search);
  const engine = useLedgerPageController(search);
  const { hintFor, showDisclaimer } = useWalletFiatHint();

  useEffect(() => {
    document.title = t('seo.ledger.title');
  }, [t]);

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updateSearch = (patch: Partial<LedgerPageSearch>, resetPage = false) => {
    void navigate({
      search: (prev) => {
        const next = { ...prev, ...patch };
        if (resetPage) {
          delete next.page;
        }
        if (next.filter === undefined) delete next.filter;
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
    return <LedgerLoadingShell />;
  }

  if (engine.errorKey) {
    return (
      <div
        className="border-danger/30 bg-surface flex flex-col items-start gap-3 rounded-lg border p-4"
        data-testid="ledger-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(engine.errorKey)}</p>
        <Button type="button" variant="outline" size="sm" onClick={engine.refresh}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const showClearFilters = hasActiveLedgerFilters(filters);

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6" data-testid="ledger-page">
      <header className="space-y-3">
        <a
          href="/wallet"
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          {t('wallet.deposit.hub.back')}
        </a>
        <div className="space-y-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('wallet.ledger.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm">{t('wallet.ledger.subtitle')}</p>
        </div>
        <a
          href="/rewards/history"
          className="text-accent inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="ledger-rewards-history-link"
        >
          {t('wallet.ledger.rewardsHistoryLink')}
        </a>
      </header>

      <section aria-labelledby="ledger-filters-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="ledger-filters-heading" className="text-foreground m-0 text-sm font-medium">
            {t('wallet.ledger.filters.label')}
          </h2>
          {showClearFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              {t('wallet.ledger.filters.clear')}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3" data-testid="ledger-filters">
          <label className="flex flex-col gap-1.5">
            <span className="text-foreground-muted text-xs font-medium">
              {t('wallet.ledger.filters.type')}
            </span>
            <Select
              value={filters.type}
              onValueChange={(value) =>
                updateSearch(
                  { filter: value === 'all' ? undefined : (value as LedgerPageSearch['filter']) },
                  true,
                )
              }
            >
              <SelectTrigger aria-label={t('wallet.ledger.filters.type')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEDGER_TYPE_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(ledgerTypeFilterLabelKey(option))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-foreground-muted text-xs font-medium">
              {t('wallet.ledger.filters.currency')}
            </span>
            <Select
              value={filters.currency}
              onValueChange={(value) =>
                updateSearch(
                  {
                    currency: value === 'all' ? undefined : (value as LedgerPageSearch['currency']),
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
                  { period: value === 'all' ? undefined : (value as LedgerPageSearch['period']) },
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
        <EmptyState
          domain="wallet"
          title={t('state.empty.title')}
          description={t('wallet.ledger.empty')}
          actionLabel={t('wallet.cta.depositKrw')}
          onAction={() => {
            void navigate({ to: '/wallet/deposit' });
          }}
          testId="ledger-empty"
        />
      ) : engine.filterEmpty ? (
        <EmptyState
          domain="wallet"
          title={t('state.empty.title')}
          description={t('wallet.ledger.filterEmpty')}
          actionLabel={t('state.empty.action.retry')}
          onAction={() => {
            updateSearch({ filter: undefined, currency: undefined, period: undefined }, true);
          }}
          testId="ledger-filter-empty"
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table
              className="w-full min-w-[640px] border-collapse text-sm"
              data-testid="ledger-table"
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
                  <th className="text-foreground-muted px-3 py-2 text-right font-medium">
                    {t('ledger.col.balanceAfter')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {engine.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-line border-b last:border-b-0"
                    data-testid="ledger-row"
                  >
                    <td className="text-foreground px-3 py-3 tabular-nums">
                      {dateFormatter.format(new Date(row.createdAt))}
                    </td>
                    <td className="text-foreground px-3 py-3">
                      {t(ledgerReasonLabelKey(row.reasonCode))}
                    </td>
                    <td className="text-foreground px-3 py-3">{row.currency}</td>
                    <td className="px-3 py-3 text-right">
                      <WalletMoneyWithFiatHint
                        amount={row.amount}
                        currency={row.currency}
                        signed
                        showCurrency
                        fiatHint={hintFor(row.amount, row.currency)}
                        className="items-end text-sm font-medium"
                      />
                    </td>
                    <td className="text-foreground-muted px-3 py-3">
                      {t(ledgerDirectionLabelKey(row.direction))}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <MoneyDisplay
                        amount={row.availableAfter}
                        currency={row.currency}
                        showCurrency
                        className="text-sm font-medium"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul
            className="border-line divide-line m-0 list-none divide-y rounded-md border p-0 md:hidden"
            data-testid="ledger-list"
          >
            {engine.rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 px-4 py-3" data-testid="ledger-row">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-foreground m-0 truncate text-sm font-medium">
                      {t(ledgerReasonLabelKey(row.reasonCode))}
                    </p>
                    <p className="text-foreground-muted m-0 text-xs tabular-nums">
                      {dateFormatter.format(new Date(row.createdAt))}
                    </p>
                  </div>
                  <WalletMoneyWithFiatHint
                    amount={row.amount}
                    currency={row.currency}
                    signed
                    showCurrency
                    fiatHint={hintFor(row.amount, row.currency)}
                    className={cn('shrink-0 items-end text-sm font-medium')}
                  />
                </div>
                <div className="text-foreground-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span>{row.currency}</span>
                  <span>{t(ledgerDirectionLabelKey(row.direction))}</span>
                  <span className="tabular-nums">
                    {t('ledger.col.balanceAfter')}:{' '}
                    <MoneyDisplay
                      amount={row.availableAfter}
                      currency={row.currency}
                      showCurrency
                      className="inline text-xs font-medium"
                    />
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {engine.totalPages > 1 ? (
            <nav
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              aria-label={t('wallet.ledger.pagination.label')}
              data-testid="ledger-pagination"
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

      {showDisclaimer ? <FiatHintDisclaimer /> : null}
    </div>
  );
}
