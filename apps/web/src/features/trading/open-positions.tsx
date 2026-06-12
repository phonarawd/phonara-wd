import { useState } from 'react';
import { useFuturesActions, type FuturesPosition } from '../../hooks/use-trading';
import { computePnl } from '@phonara/trading-engine';
import { formatMoney, ConfirmDialog, Button, Card, Stat, Badge } from '@phonara/ui';
import { isNegativeAmount } from '../../lib/money-display';
import { useT } from '../../lib/i18n';

export function OpenPositions({
  positions, prices, isPriceStale, realtimeDisconnected, onClosed,
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
  const open = positions.filter(p => p.status === 'open');
  const history = positions.filter(p => p.status !== 'open').slice(0, 10);
  const staleReason = t('trade.dataStatus.staleDescription');
  const realtimeReason = t('trade.dataStatus.realtimeDisconnectedDescription');

  const closingCcy = (closing?.margin_currency ?? 'USDT') as 'PHON' | 'USDT';
  const closingMark = closing ? (prices[closing.market] ?? closing.entry_price) : '0';
  const closingPnl = closing
    ? computePnl(closing.side, closing.quantity, closing.entry_price, closingMark, closingCcy)
    : '0';

  async function submitClose() {
    if (!closing || isPriceStale(closing.market) || realtimeDisconnected) return;
    await closePosition(closing.id);
    setClosing(null);
  }

  return (
    <section className="positions-section">
      <h2 className="section-title">{t('trade.myPositions')}</h2>

      {open.length === 0 && <div className="empty-state"><span>📈</span>{t('trade.noPositions')}</div>}

      {open.map(pos => {
        const mark = prices[pos.market] ?? pos.entry_price;
        const marginCcy = pos.margin_currency as 'PHON' | 'USDT';
        const uPnl = computePnl(pos.side, pos.quantity, pos.entry_price, mark, marginCcy);
        const pnlNegative = isNegativeAmount(uPnl);
        const positionPriceStale = isPriceStale(pos.market);
        const disabledReason = positionPriceStale ? staleReason : realtimeDisconnected ? realtimeReason : undefined;
        return (
          <Card key={pos.id} className="mb-3 flex flex-col gap-2.5 p-4">
            <div className="flex items-center gap-2">
              <Badge tone={pos.side === 'long' ? 'up' : 'down'}>{t(pos.side === 'long' ? 'trade.long' : 'trade.short')} {pos.leverage}x</Badge>
              <span className="text-sm text-muted">{pos.market}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat layout="stack" label={t('trade.margin')} value={`${formatMoney(pos.margin_amount, marginCcy)} ${pos.margin_currency}`} />
              <Stat layout="stack" label={t('trade.entryPrice')} value={formatMoney(pos.entry_price, 'USDT')} />
              <Stat layout="stack" label={t('trade.markPrice')} value={formatMoney(mark, 'USDT')} />
              <Stat layout="stack" label={t('trade.liquidationPrice')} value={formatMoney(pos.liquidation_price, 'USDT')} tone="down" />
            </div>
            <div className={`text-[0.95rem] font-bold ${pnlNegative ? 'text-down' : 'text-up'}`}>
              {t('trade.unrealizedPnl')}: {formatMoney(uPnl, marginCcy, { signed: true })} {pos.margin_currency}
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
          <h3 className="history-title">{t('trade.recentClosed')}</h3>
          <div className="position-history">
            {history.map(pos => {
              const marginCcy = pos.margin_currency as 'PHON' | 'USDT';
              return (
                <div key={pos.id} className="history-row">
                  <span className={`pos-side ${pos.side}`}>{t(pos.side === 'long' ? 'trade.long' : 'trade.short')}</span>
                  <span>{pos.market}</span>
                  <span className={pos.status === 'liquidated' ? 'badge-liq' : ''}>
                    {pos.status === 'liquidated' ? t('trade.liquidated') : t('trade.closed')}
                  </span>
                  <span className={isNegativeAmount(pos.realized_pnl ?? '0') ? 'loss' : 'profit'}>
                    {formatMoney(pos.realized_pnl ?? '0', marginCcy, { signed: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={closing !== null}
        title={t('confirm.futuresClose.title')}
        description={t('confirm.serverPriceNote')}
        tone="danger"
        rows={closing ? [
          { label: t('confirm.row.market'), value: closing.market },
          { label: t('confirm.row.side'), value: t(closing.side === 'long' ? 'trade.long' : 'trade.short') },
          { label: t('trade.entryPrice'), value: formatMoney(closing.entry_price, 'USDT') },
          { label: t('trade.markPrice'), value: formatMoney(closingMark, 'USDT') },
          {
            label: t('trade.unrealizedPnl'),
            value: `${formatMoney(closingPnl, closingCcy, { signed: true })} ${closingCcy}`,
            tone: isNegativeAmount(closingPnl) ? 'danger' : 'default',
          },
        ] : []}
        confirmLabel={t('trade.closePositionBtn')}
        cancelLabel={t('common.cancel')}
        processingLabel={t('common.processing')}
        busy={busy}
        testId="futures-close"
        onConfirm={() => void submitClose()}
        onCancel={() => setClosing(null)}
      />
    </section>
  );
}
