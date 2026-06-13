import { Link } from '@tanstack/react-router';
import type { Tables } from '@phonara/shared-types';
import {
  Badge,
  CardDivider,
  EmptyState,
  Money,
  Skeleton,
  buttonVariants,
  formatMoney,
} from '@phonara/ui';
import { useLedger } from '../../hooks/use-wallet';
import { useI18n, useT } from '../../lib/i18n';
import { DirectionBadge } from './direction-badge';
import { ledgerReasonLabelKey } from './ledger-labels';

type LedgerEntry = Tables<'wallet_ledger'>;

const ACTIVITY_LIMIT = 8;

export function WalletActivityList() {
  const t = useT();
  const { locale } = useI18n();
  const { entries, loading, error } = useLedger(ACTIVITY_LIMIT);
  const dateFmt = new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section
      className="app-section"
      aria-labelledby="wallet-activity-title"
      data-testid="wallet-activity"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="wallet-activity-title" className="section-title mb-0">
          {t('wallet.activity.title')}
        </h2>
        <Link
          to="/ledger"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          data-testid="wallet-activity-view-all"
        >
          {t('wallet.activity.viewAll')}
        </Link>
      </div>

      {loading && (
        <div className="grid gap-2" aria-busy="true">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-down" role="alert">
          {t('wallet.loadError')}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <EmptyState data-testid="wallet-activity-empty" title={t('wallet.activity.empty')} />
      )}

      {!loading && !error && entries.length > 0 && (
        <div
          className="overflow-hidden rounded-2xl border border-border bg-surface"
          data-testid="wallet-activity-list"
        >
          {entries.map((entry, index) => (
            <ActivityRow key={entry.id} entry={entry} dateFmt={dateFmt} showDivider={index > 0} />
          ))}
        </div>
      )}
    </section>
  );
}

function ActivityRow({
  entry,
  dateFmt,
  showDivider,
}: {
  entry: LedgerEntry;
  dateFmt: Intl.DateTimeFormat;
  showDivider: boolean;
}) {
  const t = useT();
  const amountTone =
    entry.direction === 'credit' || entry.direction === 'unlock'
      ? 'positive'
      : entry.direction === 'debit'
        ? 'negative'
        : 'neutral';

  return (
    <>
      {showDivider && <CardDivider className="mx-0 my-0" />}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <DirectionBadge direction={entry.direction} />
            <span className="text-xs tabular-nums text-muted">
              {dateFmt.format(new Date(entry.created_at))}
            </span>
            {entry.rate_snapshot_id && (
              <Badge tone="primary" size="sm">
                {t('wallet.activity.rateSnapshot')}
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-muted">
            {t(ledgerReasonLabelKey(entry.reason_code))}
            {entry.related_entity_id ? ` · ${t('wallet.activity.reference')}` : ''}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <Money
            amount={entry.amount}
            currency={entry.currency}
            tone={amountTone}
            emphasis="default"
            className="text-sm font-semibold"
          />
          <p className="mt-0.5 text-[0.68rem] tabular-nums text-muted">
            {formatMoney(entry.available_after, entry.currency)} {entry.currency}
          </p>
          <p className="mt-0.5 text-[0.62rem] tabular-nums text-muted">
            {t('wallet.activity.sequence', { seq: String(entry.seq) })}
          </p>
        </div>
      </div>
    </>
  );
}
