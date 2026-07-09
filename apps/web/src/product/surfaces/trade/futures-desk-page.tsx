import { useEffect, useMemo } from 'react';

import { MarketDataBridge } from '@/features/trading/market-store/market-data-bridge';

import { useFuturesDeskWire } from '@/features/trading/use-futures-desk-wire';
import { useTradeOracleRealtimeDisconnected } from '@/features/trading/use-trade-oracle-realtime-disconnected';
import { useTradeDeskViewport } from '@/features/trading/use-trade-desk-viewport';

import { TradeHowItWorksPanel } from '@/features/trading/trade-beginner-help/trade-how-it-works-panel';

import { useTradePageController } from '@/features/trading/use-trade-page-controller';

import { Skeleton } from '@/product/primitives/skeleton';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';

import { useTradeFiatHint } from '@/features/trading/use-trade-fiat-hint';

import { cn } from '@/product/primitives/lib/cn';

import {
  TRADE_DESK_BOTTOM_DOCK_SLOT_CLASS,
  TRADE_DESK_CHART_SLOT_CLASS,
  TRADE_DESK_MAIN_GRID_CLASS,
  TRADE_DESK_SIDE_RAIL_CLASS,
  TRADE_DESK_TICKET_SLOT_CLASS,
} from '@/domain/trade-ultra-layout-display-contract';

import { TradeChartPanel } from './chart/trade-chart-panel';

import { FuturesMarketHeader } from './futures-market-header';

import { FuturesOrderTicket } from './futures-order-ticket';

import { FuturesPositionsPanel } from './futures-positions-panel';

import { SpotOrderBookPanel } from './spot-order-book-panel';

import { TradeDeskBottomDock, TradeDeskMobileHistoryStack } from './trade-desk-bottom-dock';

import { TradeDeskMobileTabs, TradeDeskMobileTradeStack } from './trade-desk-mobile-tabs';

import { TradeDeskTabletLayout } from './trade-desk-tablet-layout';

import { FuturesMobileStickyCta } from './trade-desk-mobile-sticky-cta';

import { TradeDeskPageShell } from './trade-desk-page-shell';

import { TradeMarketStatusBanner } from './trade-market-status-banner';

import { TradeDeskFetchErrorBanner } from './trade-desk-fetch-error-banner';

import { TradeRecentTradesRail } from './trade-recent-trades-rail';

function FuturesDeskLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="futures-desk-loading">
      <Skeleton className="h-20 w-full" />

      <Skeleton className="h-[360px] w-full" />

      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Canonical `/trade/futures` desk — chart · order book · futures ticket (P9 · §25.4). */

export function FuturesDeskPage() {
  const engine = useTradePageController();

  const wire = useFuturesDeskWire(engine);

  const realtimeDisconnected = useTradeOracleRealtimeDisconnected();

  const { layoutTier } = useTradeDeskViewport();

  const {
    t,
    authLoading,
    walletLoading,
    isPriceStale,
    isPriceFrozen,
    pricesError,
    marketsError,
    spotMarketsError,
    refreshMarkets,
  } = engine;

  const marketSymbol = wire.market?.symbol ?? null;

  const { showDisclaimer } = useTradeFiatHint();

  const priceOracleStale = marketSymbol ? isPriceStale(marketSymbol) : false;

  const oraclePriceAmount = wire.price !== '0' ? wire.price : undefined;

  const chartOracleMark = wire.price !== '0' ? wire.price : null;

  const chartLiquidationPrice = useMemo(() => {
    if (!marketSymbol) return null;

    const position = wire.futuresPositions.find((row) => row.market === marketSymbol);

    return position?.liquidation_price ?? null;
  }, [marketSymbol, wire.futuresPositions]);

  const tradeChartPanel = (
    <TradeChartPanel
      marketSymbol={marketSymbol}
      oracleMarkPrice={chartOracleMark}
      liquidationPrice={chartLiquidationPrice}
      className={layoutTier !== 'mobile' ? TRADE_DESK_CHART_SLOT_CLASS : undefined}
    />
  );

  useEffect(() => {
    document.title = t('seo.trade.title');
  }, [t]);

  if (authLoading || walletLoading || wire.futuresMarketsLoading) {
    return <FuturesDeskLoadingShell />;
  }

  const marketSymbols = wire.futuresMarkets.map((market) => market.symbol);

  return (
    <TradeDeskPageShell testId="futures-desk-page">
      <MarketDataBridge activeSymbol={marketSymbol} marketSymbols={marketSymbols} />

      <TradeHowItWorksPanel slotId="futures-desk" />

      <FuturesMarketHeader
        markets={wire.futuresMarkets}
        marketsLoading={wire.futuresMarketsLoading}
        selectedSymbol={marketSymbol ?? ''}
        pairLabel={wire.pairLabel}
        priceDisplay={wire.priceDisplay}
        markPriceDisplay={wire.oraclePriceDisplay}
        lastPriceAmount={oraclePriceAmount}
        markPriceAmount={oraclePriceAmount}
        priceOracleStale={priceOracleStale}
        fundingDisplay={wire.fundingDisplay}
        fundingTone={wire.fundingTone}
        onMarketChange={wire.onMarketChange}
        t={t}
      />

      <TradeMarketStatusBanner
        desk="futures"
        marketSymbol={marketSymbol}
        symbolStale={marketSymbol ? isPriceStale(marketSymbol) : false}
        symbolFrozen={marketSymbol ? isPriceFrozen(marketSymbol) : false}
        realtimeDisconnected={realtimeDisconnected}
      />

      <TradeDeskFetchErrorBanner
        pricesError={pricesError}
        marketsError={marketsError}
        spotMarketsError={spotMarketsError}
        onRetry={refreshMarkets}
      />

      {layoutTier === 'desktop' ? (
        <>
          <div
            className={cn(TRADE_DESK_MAIN_GRID_CLASS, 'min-h-0 grid')}
            data-testid="trade-desk-main-grid"
          >
            <div className={`${TRADE_DESK_SIDE_RAIL_CLASS} flex flex-col gap-4`}>
              <SpotOrderBookPanel
                asks={wire.asks}
                bids={wire.bids}
                pricePrecision={wire.pricePrecision}
                midDisplay={wire.priceDisplay}
                baseLabel={wire.baseLabel}
                t={t}
                onPriceClick={wire.onBookPriceClick}
                bookFeedStale={wire.bookFeedStale}
                className="min-h-[280px] flex-1"
              />
              <TradeRecentTradesRail
                symbol={marketSymbol}
                t={t}
                locale={wire.locale}
                className="max-h-[180px]"
              />
            </div>
            {tradeChartPanel}
            <FuturesOrderTicket wire={wire} className={TRADE_DESK_TICKET_SLOT_CLASS} />
          </div>

          <div className={TRADE_DESK_BOTTOM_DOCK_SLOT_CLASS}>
            <TradeDeskBottomDock
              positions={wire.futuresPositions}
              orders={wire.openOrders}
              fills={wire.fills}
              fundingPayments={wire.fundingPayments}
              t={t}
              locale={wire.locale}
              onClosePosition={wire.closePosition}
              onPartialClosePosition={wire.partialClosePosition}
              onAdjustIsolatedMargin={wire.adjustIsolatedMargin}
              onUpdatePositionSltp={wire.updatePositionSltp}
              onSetTrailingStop={wire.setTrailingStop}
              onClearTrailingStop={wire.clearTrailingStop}
              trailingStopPositionId={wire.trailingStopPositionId}
              onCancelOrder={wire.cancelOrder}
              closingPositionId={wire.closingPositionId}
              partialClosingPositionId={wire.partialClosingPositionId}
              adjustingMarginPositionId={wire.adjustingMarginPositionId}
              updatingSltpPositionId={wire.updatingSltpPositionId}
              cancellingOrderId={wire.cancellingOrderId}
              actionBusy={wire.actionBusy}
              markPrices={engine.prices}
              isMarkUnavailable={(market) =>
                !engine.prices[market] ||
                engine.prices[market] === '0' ||
                engine.isPriceStale(market)
              }
              ordersLoading={wire.openOrdersLoading}
              fillsLoading={wire.fillsLoading}
              positionsLoading={wire.positionsLoading}
              fundingPaymentsLoading={wire.fundingPaymentsLoading}
            />
          </div>
        </>
      ) : layoutTier === 'tablet' ? (
        <TradeDeskTabletLayout
          testId="futures-desk-tablet-layout"
          t={t}
          chart={tradeChartPanel}
          ticket={<FuturesOrderTicket wire={wire} className={TRADE_DESK_TICKET_SLOT_CLASS} />}
          trade={
            <TradeDeskMobileTradeStack
              t={t}
              ticketExternal
              book={
                <div className="flex flex-col gap-4">
                  <SpotOrderBookPanel
                    asks={wire.asks}
                    bids={wire.bids}
                    pricePrecision={wire.pricePrecision}
                    midDisplay={wire.priceDisplay}
                    baseLabel={wire.baseLabel}
                    t={t}
                    onPriceClick={wire.onBookPriceClick}
                    bookFeedStale={wire.bookFeedStale}
                    className="min-h-[280px]"
                  />
                  <TradeRecentTradesRail symbol={marketSymbol} t={t} locale={wire.locale} />
                </div>
              }
              stickyCta={<FuturesMobileStickyCta wire={wire} />}
            />
          }
          positions={
            <FuturesPositionsPanel
              positions={wire.futuresPositions}
              t={t}
              variant="full"
              showHeading={false}
              emptyKey="trade.empty.positions"
              onClosePosition={wire.closePosition}
              onPartialClosePosition={wire.partialClosePosition}
              onAdjustIsolatedMargin={wire.adjustIsolatedMargin}
              onUpdatePositionSltp={wire.updatePositionSltp}
              onSetTrailingStop={wire.setTrailingStop}
              onClearTrailingStop={wire.clearTrailingStop}
              trailingStopPositionId={wire.trailingStopPositionId}
              closingPositionId={wire.closingPositionId}
              partialClosingPositionId={wire.partialClosingPositionId}
              adjustingMarginPositionId={wire.adjustingMarginPositionId}
              updatingSltpPositionId={wire.updatingSltpPositionId}
              closeBusy={wire.actionBusy}
              partialCloseBusy={wire.actionBusy}
              marginAdjustBusy={wire.actionBusy}
              sltpEditBusy={wire.actionBusy}
              markPrices={engine.prices}
              isMarkUnavailable={(market) =>
                !engine.prices[market] ||
                engine.prices[market] === '0' ||
                engine.isPriceStale(market)
              }
              loading={wire.positionsLoading}
            />
          }
          history={
            <TradeDeskMobileHistoryStack
              orders={wire.openOrders}
              fills={wire.fills}
              fundingPayments={wire.fundingPayments}
              t={t}
              locale={wire.locale}
              onCancelOrder={wire.cancelOrder}
              cancellingOrderId={wire.cancellingOrderId}
              cancelBusy={wire.actionBusy}
              ordersLoading={wire.openOrdersLoading}
              fillsLoading={wire.fillsLoading}
              fundingPaymentsLoading={wire.fundingPaymentsLoading}
            />
          }
        />
      ) : (
        <TradeDeskMobileTabs
          testId="futures-desk-mobile-tabs"
          t={t}
          chart={tradeChartPanel}
          trade={
            <TradeDeskMobileTradeStack
              t={t}
              orderTicket={<FuturesOrderTicket wire={wire} primarySubmit="external" />}
              book={
                <div className="flex flex-col gap-4">
                  <SpotOrderBookPanel
                    asks={wire.asks}
                    bids={wire.bids}
                    pricePrecision={wire.pricePrecision}
                    midDisplay={wire.priceDisplay}
                    baseLabel={wire.baseLabel}
                    t={t}
                    onPriceClick={wire.onBookPriceClick}
                    bookFeedStale={wire.bookFeedStale}
                    className="min-h-[280px]"
                  />
                  <TradeRecentTradesRail symbol={marketSymbol} t={t} locale={wire.locale} />
                </div>
              }
              stickyCta={<FuturesMobileStickyCta wire={wire} />}
            />
          }
          positions={
            <FuturesPositionsPanel
              positions={wire.futuresPositions}
              t={t}
              variant="full"
              showHeading={false}
              emptyKey="trade.empty.positions"
              onClosePosition={wire.closePosition}
              onPartialClosePosition={wire.partialClosePosition}
              onAdjustIsolatedMargin={wire.adjustIsolatedMargin}
              onUpdatePositionSltp={wire.updatePositionSltp}
              onSetTrailingStop={wire.setTrailingStop}
              onClearTrailingStop={wire.clearTrailingStop}
              trailingStopPositionId={wire.trailingStopPositionId}
              closingPositionId={wire.closingPositionId}
              partialClosingPositionId={wire.partialClosingPositionId}
              adjustingMarginPositionId={wire.adjustingMarginPositionId}
              updatingSltpPositionId={wire.updatingSltpPositionId}
              closeBusy={wire.actionBusy}
              partialCloseBusy={wire.actionBusy}
              marginAdjustBusy={wire.actionBusy}
              sltpEditBusy={wire.actionBusy}
              markPrices={engine.prices}
              isMarkUnavailable={(market) =>
                !engine.prices[market] ||
                engine.prices[market] === '0' ||
                engine.isPriceStale(market)
              }
              loading={wire.positionsLoading}
            />
          }
          history={
            <TradeDeskMobileHistoryStack
              orders={wire.openOrders}
              fills={wire.fills}
              fundingPayments={wire.fundingPayments}
              t={t}
              locale={wire.locale}
              onCancelOrder={wire.cancelOrder}
              cancellingOrderId={wire.cancellingOrderId}
              cancelBusy={wire.actionBusy}
              ordersLoading={wire.openOrdersLoading}
              fillsLoading={wire.fillsLoading}
              fundingPaymentsLoading={wire.fundingPaymentsLoading}
            />
          }
        />
      )}

      {showDisclaimer ? <FiatHintDisclaimer /> : null}
    </TradeDeskPageShell>
  );
}
