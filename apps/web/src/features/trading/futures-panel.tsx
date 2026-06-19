import { lazy, Suspense, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useCandles,
  useSyntheticBook,
  useFuturesOrderTicket,
  useFuturesActions,
  useTradingRiskAcknowledgement,
  type FuturesMarket,
} from '../../hooks/use-trading';
import { useConfirmSnapshot } from '../../hooks/use-confirm-snapshot';
import { type PositionSide } from '@phonara/trading-engine';
import { formatMoney, ConfirmDialog, Button, Card, Stat, Input, SegmentedControl, Slider, OrderBook, Badge } from '@phonara/ui';
import { toDecimal } from '@phonara/money';
import { normalizeDecimalInput } from '../../lib/money-input';
import { useT } from '../../lib/i18n';

const LazyTradingChart = lazy(() => import('../../components/trading-chart-loader'));

export function FuturesPanel({
  markets, marketsLoading, prices, phonAvail, usdtAvail, walletLoading, isPriceStale, onTraded,
  realtimeDisconnected,
}: {
  markets: FuturesMarket[];
  marketsLoading: boolean;
  prices: Record<string, string>;
  phonAvail: string;
  usdtAvail: string;
  walletLoading: boolean;
  isPriceStale: (symbol: string | null | undefined) => boolean;
  onTraded: () => void;
  realtimeDisconnected: boolean;
}) {
  const t = useT();
  const ticket = useFuturesOrderTicket({
    markets,
    prices,
    isPriceStale,
    realtimeDisconnected,
  });
  const { openPosition, busy, error } = useFuturesActions(onTraded);
  const riskAck = useTradingRiskAcknowledgement();
  const {
    market,
    price,
    priceStale,
    maxLeverage,
    isHighLeverage,
    preview,
    side,
    setSide,
    marginCurrency,
    setMarginCurrency,
    margin,
    setMargin,
    leverage,
    setLeverage,
    confirmOpen,
    setConfirmOpen,
  } = ticket;
  const { candles, loading: candlesLoading, isError: candlesError, refetch: refetchCandles } = useCandles(market?.symbol ?? null, '1m');
  const syntheticBook = useSyntheticBook(market?.symbol ?? null);
  const staleReason = t('trade.dataStatus.staleDescription');
  const realtimeReason = t('trade.dataStatus.realtimeDisconnectedDescription');
  const disabledReason = priceStale ? staleReason : realtimeDisconnected ? realtimeReason : undefined;
  const tradeBlocked = priceStale || realtimeDisconnected;
  const confirmFingerprint = `${price}:${side}:${margin}:${leverage}:${marginCurrency}:${market?.symbol ?? ''}`;
  const handleConfirmDrift = useCallback(() => {
    toast.warning(t('trade.confirm.priceChanged'));
  }, [t]);
  const { canConfirm, isDrifted } = useConfirmSnapshot({
    open: confirmOpen,
    fingerprint: confirmFingerprint,
    onDrift: handleConfirmDrift,
  });
  const confirmNotice = tradeBlocked && confirmOpen
    ? t('trade.confirm.staleBlocked')
    : isDrifted
      ? t('trade.confirm.priceChanged')
      : undefined;

  async function submitOpen() {
    if (!market || tradeBlocked) return;
    setConfirmOpen(false);
    await openPosition({ market: market.symbol, side, marginCurrency, marginAmount: margin, leverage });
  }

  const avail = marginCurrency === 'USDT' ? usdtAvail : phonAvail;
  const chartLabels = useMemo(() => ({
    loading: t('trade.chart.loading'),
    emptyTitle: t('trade.chart.emptyTitle'),
    emptyDescription: t('trade.chart.emptyDescription'),
    errorTitle: t('trade.chart.errorTitle'),
    errorDescription: t('trade.chart.errorDescription'),
    retry: t('common.retry'),
    oraclePrice: t('trade.markPrice'),
    liquidationPrice: t('trade.liquidationPrice'),
    policyTitle: t('trade.chart.policyTitle'),
    oracleLineDescription: t('trade.chart.oracleLineDescription'),
    liquidationLineDescription: t('trade.chart.liquidationLineDescription'),
    liquidationApproachingTitle: t('trade.chart.liquidationApproachingTitle'),
    liquidationApproachingDescription: t('trade.chart.liquidationApproachingDescription'),
    disclosureTitle: t('trade.chart.disclosureTitle'),
    syncedTitle: t('trade.chart.syncedTitle'),
    volume: t('trade.chart.volume'),
  }), [t]);
  const chartDisclosure = market?.symbol === 'PHON_USDT' || market?.base_label === 'PHON'
    ? t('trade.chart.internalReferenceDisclosure')
    : undefined;
  const orderBookLabels = useMemo(() => ({
    loading: t('trade.orderBook.loading'),
    emptyTitle: t('trade.orderBook.emptyTitle'),
    errorTitle: t('trade.orderBook.errorTitle'),
    retry: t('common.retry'),
    asks: t('trade.orderBook.asks'),
    bids: t('trade.orderBook.bids'),
    price: t('trade.price'),
    size: t('trade.quantity'),
    spread: t('trade.orderBook.spread'),
    midpoint: t('trade.orderBook.midpoint'),
    liveDepth: t('trade.orderBook.liveDepth'),
  }), [t]);

  return (
    <Card className="flex flex-col gap-3 p-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[1.05rem] font-bold text-fg">{t('trade.futuresTitle')}</h3>
        {(priceStale || realtimeDisconnected) && (
          <Badge tone="risk">{t('trade.dataStatus.stale')}</Badge>
        )}
      </div>

      {(marketsLoading || !market) && (
        <div className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-muted">
          {t(marketsLoading ? 'trade.markets.loading' : 'trade.markets.empty')}
        </div>
      )}

      {market && (
        <SegmentedControl<string>
          tone="primary"
          value={market.symbol}
          onChange={(sym) => ticket.setMarketIdx(Math.max(0, markets.findIndex(m => m.symbol === sym)))}
          options={markets.map(m => ({
            value: m.symbol,
            label: (
              <>
                <span>{m.base_label}</span>
                <span className="text-[0.7rem] font-normal opacity-80">{formatMoney(prices[m.symbol] ?? '0', 'USDT')}</span>
              </>
            ),
          }))}
        />
      )}

      <SegmentedControl<PositionSide>
        value={side}
        onChange={setSide}
        options={[
          { value: 'long', label: t('trade.longUp'), tone: 'up' },
          { value: 'short', label: t('trade.shortDown'), tone: 'down' },
        ]}
      />

      <Suspense
        fallback={(
          <Card className="flex min-h-[320px] flex-col gap-3 p-4" data-testid="trading-chart-loading">
            <h3 className="text-[1.05rem] font-bold text-fg">{t('trade.chartTitle')}</h3>
            <div className="h-[240px] animate-pulse rounded-2xl bg-surface-2/70" />
            <p className="text-xs text-muted">{t('trade.chart.loading')}</p>
          </Card>
        )}
      >
        <LazyTradingChart
          title={t('trade.chartTitle')}
          subtitle={market?.display_name ?? market?.symbol ?? ''}
          labels={chartLabels}
          candles={candles}
          oraclePrice={price}
          liquidationPrice={preview?.liquidationPrice ?? null}
          loading={candlesLoading}
          error={candlesError}
          onRetry={() => void refetchCandles()}
          pricePrecision={market?.price_precision ?? 6}
          disclosure={chartDisclosure}
        />
      </Suspense>

      <OrderBook
        title={t('trade.orderBook.title')}
        referenceLabel={t('trade.orderBook.referenceBadge')}
        disclosure={t('trade.orderBook.disclosure')}
        labels={orderBookLabels}
        asks={syntheticBook.book?.asks ?? []}
        bids={syntheticBook.book?.bids ?? []}
        loading={syntheticBook.loading}
        error={Boolean(syntheticBook.error)}
        onRetry={() => void syntheticBook.refetch()}
      />

      <div className="field-row">
        <label>{t('trade.marginCurrency')}</label>
        <SegmentedControl<'USDT' | 'PHON'>
          tone="accent"
          size="sm"
          value={marginCurrency}
          onChange={setMarginCurrency}
          options={[
            { value: 'USDT', label: 'USDT' },
            { value: 'PHON', label: 'PHON' },
          ]}
        />
      </div>

      <div className="field-row">
        <label>{t('trade.marginWith', { currency: marginCurrency })}</label>
        <Input
          inputMode="decimal"
          value={margin}
          onChange={e => setMargin(normalizeDecimalInput(e.target.value))}
          className="flex-1 min-w-0 text-right"
        />
      </div>
      <div className="field-hint">{t('wallet.available')}: {formatMoney(avail, marginCurrency)}</div>

      <div className="field-row">
        <label>{t('trade.leverageWith', { value: leverage })}</label>
        <Slider
          value={toDecimal(leverage).toNumber()}
          min={1}
          max={toDecimal(maxLeverage).toNumber()}
          step={1}
          showLabel
          formatLabel={(value) => `${value}x`}
          onChange={(value) => setLeverage(String(value))}
          className="flex-1"
        />
      </div>

      {preview && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-surface-2/60 px-3 py-2.5">
          <Stat label={t('trade.positionSize')} value={`${formatMoney(preview.notional, marginCurrency)} ${marginCurrency}`} />
          <Stat label={t('trade.quantity')} value={formatMoney(preview.quantity, 'PHON')} />
          <Stat label={t('trade.liquidationPrice')} value={formatMoney(preview.liquidationPrice, 'USDT')} tone="down" />
          <Stat label={t('trade.openFee')} value={`${formatMoney(preview.openFee, marginCurrency)} ${marginCurrency}`} />
        </div>
      )}

      <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-5 text-warning">
        {t('trade.simWarning')}
      </div>

      {isHighLeverage && (
        <div className="flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs leading-5 text-warning">
          <p>{t('trade.highLeverageWarning')}</p>
          {!riskAck.acknowledged && (
            <Button
              size="sm"
              variant="secondary"
              data-testid="trading-risk-ack"
              disabled={riskAck.busy || riskAck.loading}
              onClick={() => void riskAck.acknowledge()}
            >
              {riskAck.busy ? t('common.processing') : t('trade.riskAckCta')}
            </Button>
          )}
        </div>
      )}

      {error && <p className="card-error">{t(error)}</p>}
      {riskAck.error && <p className="card-error">{t(riskAck.error)}</p>}

      <span className="block" title={disabledReason}>
        <Button
          variant={side === 'long' ? 'success' : 'danger'}
          full
          data-testid="futures-open"
          disabled={busy || walletLoading || !preview || tradeBlocked || (isHighLeverage && !riskAck.acknowledged)}
          onClick={() => setConfirmOpen(true)}
        >
          {busy ? t('common.processing') : t(side === 'long' ? 'trade.openLongPosition' : 'trade.openShortPosition')}
        </Button>
      </span>

      <ConfirmDialog
        open={confirmOpen}
        title={t('confirm.futuresOpen.title')}
        description={t('trade.confirm.review')}
        notice={confirmNotice}
        noticeTone={tradeBlocked ? 'danger' : 'warning'}
        tone={side === 'long' ? 'primary' : 'danger'}
        rows={preview ? [
          { label: t('confirm.row.market'), value: market?.display_name ?? market?.symbol ?? '' },
          { label: t('confirm.row.side'), value: t(side === 'long' ? 'trade.long' : 'trade.short') },
          { label: t('confirm.row.leverage'), value: `${leverage}x` },
          { label: t('confirm.row.markPrice'), value: formatMoney(price, 'USDT') },
          { label: t('trade.margin'), value: `${formatMoney(margin, marginCurrency)} ${marginCurrency}` },
          {
            label: t('trade.positionSize'),
            value: `${formatMoney(preview.notional, marginCurrency)} ${marginCurrency}`,
            emphasis: 'hero',
          },
          { label: t('trade.liquidationPrice'), value: formatMoney(preview.liquidationPrice, 'USDT'), tone: 'danger' },
          { label: t('trade.openFee'), value: `${formatMoney(preview.openFee, marginCurrency)} ${marginCurrency}` },
        ] : []}
        confirmLabel={t(side === 'long' ? 'trade.openLongPosition' : 'trade.openShortPosition')}
        cancelLabel={t('common.cancel')}
        processingLabel={t('common.processing')}
        busy={busy}
        confirmDisabled={!canConfirm || tradeBlocked}
        testId="futures-open"
        onConfirm={() => void submitOpen()}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
