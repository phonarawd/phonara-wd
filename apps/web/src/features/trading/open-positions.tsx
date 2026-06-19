import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useFuturesActions, type FuturesPosition } from '../../hooks/use-trading';
import { useConfirmSnapshot } from '../../hooks/use-confirm-snapshot';
import { computePnl } from '@phonara/trading-engine';
import { toDecimal } from '@phonara/money';
import {
  formatMoney,
  ConfirmDialog,
  Button,
  Card,
  Stat,
  Badge,
  EmptyState,
  AnimatedNumber,
} from '@phonara/ui';
import { isNegativeAmount } from '../../lib/money-display';
import { useT } from '../../lib/i18n';

export function OpenPositions({
  positions,
  prices,
  isPriceStale,
  realtimeDisconnected,
  onClosed,
}: {
  positions: FuturesPosition[];
  prices: Record<string, string>;
  isPriceStale: (symbol: string | null | undefined) => boolean;
  realtimeDisconnected: boolean;
  onClosed: () => void;
}) {
  const t = useT();
  const { closePosition, busy } = useFuturesActions(onClosed);
  const [closing, setClosing] = useState<FuturesPosition | null>(null);
  const open = positions.filter((p) => p.status === 'open');
  const history = positions.filter((p) => p.status !== 'open').slice(0, 10);
  const staleReason = t('trade.dataStatus.staleDescription');
  const realtimeReason = t('trade.dataStatus.realtimeDisconnectedDescription');

  const closingCcy = (closing?.margin_currency ?? 'USDT') as 'PHON' | 'USDT';
  const closingMark = closing ? (prices[closing.market] ?? closing.entry_price) : '0';
  const closingPnl = closing
    ? computePnl(closing.side, closing.quantity, closing.entry_price, closingMark, closingCcy)
    : '0';
  const closingPriceStale = closing ? isPriceStale(closing.market) : false;
  const closingTradeBlocked = closingPriceStale || realtimeDisconnected;
  const confirmFingerprint = closing ? `${closing.market}:${closingMark}` : '';
  const handleConfirmDrift = useCallback(() => {
    toast.warning(t('trade.confirm.priceChanged'));
  }, [t]);
  const { canConfirm, isDrifted } = useConfirmSnapshot({
    open: closing !== null,
    fingerprint: confirmFingerprint,
    onDrift: handleConfirmDrift,
  });
  const confirmNotice =
    closingTradeBlocked && closing !== null
      ? t('trade.confirm.staleBlocked')
      : isDrifted
        ? t('trade.confirm.priceChanged')
        : undefined;

  async function submitClose() {
    if (!closing || closingTradeBlocked) return;
    const positionId = closing.id;
    setClosing(null);
    await closePosition(positionId);
  }

  function liquidationDistance(mark: string, liquidationPrice: string): string | null {
    try {
      const markDecimal = toDecimal(mark);
      if (!markDecimal.greaterThan(0)) return null;
      const distance = markDecimal
        .minus(toDecimal(liquidationPrice))
        .abs()
        .div(markDecimal)
        .mul(100);
      return `${distance.toFixed(2)}%`;
    } catch {
      return null;
    }
  }

  return (
    <section className="app-section px-5 pb-6">
      <h2 className="section-title">{t('trade.myPositions')}</h2>

      {open.length === 0 && (
        <EmptyState data-testid="futures-positions-empty" title={t('trade.noPositions')} />
      )}

      {open.map((pos) => {
        const mark = prices[pos.market] ?? pos.entry_price;
        const marginCcy = pos.margin_currency as 'PHON' | 'USDT';
        const uPnl = computePnl(pos.side, pos.quantity, pos.entry_price, mark, marginCcy);
        const pnlNegative = isNegativeAmount(uPnl);
        const positionPriceStale = isPriceStale(pos.market);
        const disabledReason = positionPriceStale
          ? staleReason
          : realtimeDisconnected
            ? realtimeReason
            : undefined;
        const liqDistance = liquidationDistance(mark, pos.liquidation_price);
        return (
          <Card key={pos.id} className="mb-3 flex flex-col gap-2.5 p-4">
            <div className="flex items-center gap-2">
              <Badge tone={pos.side === 'long' ? 'up' : 'down'}>
                {t(pos.side === 'long' ? 'trade.long' : 'trade.short')} {pos.leverage}x
              </Badge>
              <span className="text-sm text-muted">{pos.market}</span>
              {(positionPriceStale || realtimeDisconnected) && (
                <Badge tone="risk" size="sm">
                  {t('trade.dataStatus.stale')}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat
                layout="stack"
                label={t('trade.margin')}
                value={`${formatMoney(pos.margin_amount, marginCcy)} ${pos.margin_currency}`}
              />
              <Stat
                layout="stack"
                label={t('trade.entryPrice')}
                value={formatMoney(pos.entry_price, 'USDT')}
              />
              <Stat layout="stack" label={t('trade.markPrice')} value={formatMoney(mark, 'USDT')} />
              <Stat
                layout="stack"
                label={t('trade.liquidationPrice')}
                value={formatMoney(pos.liquidation_price, 'USDT')}
                tone="down"
              />
              {liqDistance && (
                <Stat
                  layout="stack"
                  label={t('trade.liquidationDistance')}
                  value={liqDistance}
                  tone="warning"
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/55 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t('trade.unrealizedPnl')}
              </span>
              <AnimatedNumber
                value={uPnl}
                format={(value) =>
                  `${formatMoney(value, marginCcy, { signed: true })} ${pos.margin_currency}`
                }
                tone={pnlNegative ? 'down' : 'up'}
                emphasis="label"
                aria-live="polite"
              />
            </div>
            <span className="block" title={disabledReason}>
              <Button
                variant="secondary"
                size="sm"
                data-testid="futures-close"
                disabled={busy || positionPriceStale || realtimeDisconnected}
                onClick={() => setClosing(pos)}
              >
                {t('trade.closePositionBtn')}
              </Button>
            </span>
          </Card>
        );
      })}

      {history.length > 0 && (
        <>
          <h3 className="mt-4 mb-2 text-sm font-medium text-muted">{t('trade.recentClosed')}</h3>
          <Card elevation="raised" className="divide-y divide-border p-0">
            {history.map((pos) => {
              const marginCcy = pos.margin_currency as 'PHON' | 'USDT';
              const pnlNegative = isNegativeAmount(pos.realized_pnl ?? '0');
              return (
                <div
                  key={pos.id}
                  className="grid grid-cols-2 items-center gap-2 px-4 py-3 text-sm sm:grid-cols-4"
                >
                  <Badge tone={pos.side === 'long' ? 'up' : 'down'} size="sm">
                    {t(pos.side === 'long' ? 'trade.long' : 'trade.short')}
                  </Badge>
                  <span className="text-muted">{pos.market}</span>
                  <Badge tone={pos.status === 'liquidated' ? 'risk' : 'neutral'} size="sm">
                    {pos.status === 'liquidated' ? t('trade.liquidated') : t('trade.closed')}
                  </Badge>
                  <span
                    className={`font-semibold tabular-nums ${pnlNegative ? 'text-down' : 'text-up'}`}
                  >
                    {formatMoney(pos.realized_pnl ?? '0', marginCcy, { signed: true })}
                  </span>
                </div>
              );
            })}
          </Card>
        </>
      )}

      <ConfirmDialog
        open={closing !== null}
        title={t('confirm.futuresClose.title')}
        description={t('trade.confirm.review')}
        notice={confirmNotice}
        noticeTone={closingTradeBlocked ? 'danger' : 'warning'}
        tone="danger"
        rows={
          closing
            ? [
                { label: t('confirm.row.market'), value: closing.market },
                {
                  label: t('confirm.row.side'),
                  value: t(closing.side === 'long' ? 'trade.long' : 'trade.short'),
                },
                { label: t('trade.entryPrice'), value: formatMoney(closing.entry_price, 'USDT') },
                { label: t('confirm.row.markPrice'), value: formatMoney(closingMark, 'USDT') },
                {
                  label: t('trade.unrealizedPnl'),
                  value: `${formatMoney(closingPnl, closingCcy, { signed: true })} ${closingCcy}`,
                  tone: isNegativeAmount(closingPnl) ? 'danger' : 'default',
                  emphasis: 'hero',
                },
              ]
            : []
        }
        confirmLabel={t('trade.closePositionBtn')}
        cancelLabel={t('common.cancel')}
        processingLabel={t('common.processing')}
        busy={busy}
        confirmDisabled={!canConfirm || closingTradeBlocked}
        testId="futures-close"
        onConfirm={() => void submitClose()}
        onCancel={() => setClosing(null)}
      />
    </section>
  );
}
