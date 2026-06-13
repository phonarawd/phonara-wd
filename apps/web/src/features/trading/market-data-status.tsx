import { Badge, Button, Card } from '@phonara/ui';
import { useT } from '../../lib/i18n';

export function MarketDataStatus({
  pricesError,
  positionsError,
  marketsError,
  pricesFetching,
  positionsFetching,
  pricesUpdatedAt,
  positionsUpdatedAt,
  oracleStale,
  onRetry,
}: {
  pricesError: boolean;
  positionsError: boolean;
  marketsError: boolean;
  pricesFetching: boolean;
  positionsFetching: boolean;
  pricesUpdatedAt: number;
  positionsUpdatedAt: number;
  oracleStale: boolean;
  onRetry: () => void;
}) {
  const t = useT();
  const hasError = pricesError || positionsError || marketsError;
  const oldestUpdate = Math.min(
    pricesUpdatedAt || Number.POSITIVE_INFINITY,
    positionsUpdatedAt || Number.POSITIVE_INFINITY,
  );
  const stale = oracleStale || (oldestUpdate !== Number.POSITIVE_INFINITY && Date.now() - oldestUpdate > 30_000);
  if (!hasError && !stale && !pricesFetching && !positionsFetching) return null;

  return (
    <Card
      className="flex flex-wrap items-center justify-between gap-3 border-warning/40 bg-warning/10 px-4 py-3 text-sm"
      data-testid="market-data-status"
    >
      <div className="flex flex-wrap items-center gap-2">
        {hasError && <Badge tone="down">{t('trade.dataStatus.error')}</Badge>}
        {!hasError && stale && <Badge tone="risk">{t('trade.dataStatus.stale')}</Badge>}
        {!hasError && !stale && (pricesFetching || positionsFetching) && (
          <Badge tone="primary">{t('trade.dataStatus.syncing')}</Badge>
        )}
        <span className="text-muted">
          {hasError
            ? t('trade.dataStatus.errorDescription')
            : stale
              ? t('trade.dataStatus.staleDescription')
              : t('trade.dataStatus.syncingDescription')}
        </span>
      </div>
      {hasError && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </Card>
  );
}
