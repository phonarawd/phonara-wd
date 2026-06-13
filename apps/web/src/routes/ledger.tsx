import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState, type UIEvent } from 'react';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { useLedger } from '../hooks/use-wallet';
import { useI18n, useT } from '../lib/i18n';
import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Skeleton,
  type ColumnDef,
  formatMoney,
} from '@phonara/ui';
import type { Tables } from '@phonara/shared-types';
import { AppShell } from '../components/app-shell';
import { DirectionBadge } from '../features/wallet/direction-badge';
import { ledgerReasonLabelKey } from '../features/wallet/ledger-labels';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ledger',
  component: LedgerPage,
});

type LedgerEntry = Tables<'wallet_ledger'>;

function LedgerPage() {
  const t = useT();
  const { locale } = useI18n();
  const dateFmt = new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const { session, loading: authLoading } = useAuth();
  const { entries, loading, error, refetch } = useLedger(200);
  const navigate = useNavigate();
  const columns: ColumnDef<LedgerEntry>[] = [
    {
      key: 'datetime',
      header: t('ledger.col.datetime'),
      cell: (entry) => (
        <span className="text-muted tabular-nums">
          {dateFmt.format(new Date(entry.created_at))}
        </span>
      ),
    },
    {
      key: 'type',
      header: t('ledger.col.type'),
      cell: (entry) => <DirectionBadge direction={entry.direction} />,
    },
    {
      key: 'currency',
      header: t('ledger.col.currency'),
      cell: (entry) => <span className="font-bold tracking-wide">{entry.currency}</span>,
    },
    {
      key: 'amount',
      header: t('ledger.col.amount'),
      cell: (entry) => (
        <span className="font-semibold tabular-nums">
          {formatMoney(entry.amount, entry.currency)}
        </span>
      ),
    },
    {
      key: 'reason',
      header: t('ledger.col.reason'),
      cell: (entry) => <span className="text-muted">{t(ledgerReasonLabelKey(entry.reason_code))}</span>,
    },
    {
      key: 'balance',
      header: t('ledger.col.balanceAfter'),
      cell: (entry) => (
        <span className="text-muted tabular-nums">
          {formatMoney(entry.available_after, entry.currency)}
        </span>
      ),
    },
  ];

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  return (
    <AppShell active="wallet">
      <div className="app-page pn-anim-rise">
        <section className="app-section" aria-labelledby="ledger-page-title">
          <h2 id="ledger-page-title" className="section-title">
            {t('ledger.title')}
          </h2>

          {loading && <Skeleton className="h-[240px]" data-testid="ledger-loading" />}

          {!loading && error && (
            <ErrorState
              data-testid="ledger-error"
              title={t('wallet.loadError')}
              description={t(error)}
              actionLabel={t('common.retry')}
              onAction={() => void refetch()}
            />
          )}

          {!loading && !error && entries.length === 0 && (
            <EmptyState data-testid="ledger-empty" title={t('ledger.empty')} />
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="space-y-3">
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={entries}
                  keyExtractor={(entry) => entry.id}
                  emptyState={t('ledger.empty')}
                  size="sm"
                  data-testid="ledger-table"
                />
              </div>
              <VirtualLedgerCards entries={entries} dateFmt={dateFmt} />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

const LEDGER_CARD_HEIGHT = 116;
const LEDGER_VIEWPORT_HEIGHT = 440;
const LEDGER_OVERSCAN = 3;

function VirtualLedgerCards({
  entries,
  dateFmt,
}: {
  entries: LedgerEntry[];
  dateFmt: Intl.DateTimeFormat;
}) {
  const t = useT();
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = entries.length * LEDGER_CARD_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / LEDGER_CARD_HEIGHT) - LEDGER_OVERSCAN);
  const visibleCount = Math.ceil(LEDGER_VIEWPORT_HEIGHT / LEDGER_CARD_HEIGHT) + LEDGER_OVERSCAN * 2;
  const visibleEntries = useMemo(
    () => entries.slice(startIndex, startIndex + visibleCount),
    [entries, startIndex, visibleCount],
  );

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    setScrollTop(event.currentTarget.scrollTop);
  }

  return (
    <div
      className="md:hidden"
      data-testid="ledger-mobile-list"
      aria-label={t('ledger.title')}
      onScroll={handleScroll}
      style={{ maxHeight: LEDGER_VIEWPORT_HEIGHT, overflowY: 'auto' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          className="grid gap-3"
          style={{
            position: 'absolute',
            insetInline: 0,
            top: startIndex * LEDGER_CARD_HEIGHT,
          }}
        >
          {visibleEntries.map((entry) => (
            <Card key={entry.id} className="grid min-h-[104px] gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <DirectionBadge direction={entry.direction} />
                <span className="text-xs text-muted">
                  {dateFmt.format(new Date(entry.created_at))}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{t(ledgerReasonLabelKey(entry.reason_code))}</p>
                  <p className="mt-1 text-sm font-bold tracking-wide text-fg">{entry.currency}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-fg">
                    {formatMoney(entry.amount, entry.currency)}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-muted">
                    {t('ledger.col.balanceAfter')}:{' '}
                    {formatMoney(entry.available_after, entry.currency)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
