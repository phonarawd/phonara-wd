import { useEffect } from 'react';

import { useI18n } from '@/product/i18n';

import { MarketDataBridge } from '@/features/trading/market-store/market-data-bridge';

import { useSpotDeskWire } from '@/features/trading/use-spot-desk-wire';
import { useTradeOracleRealtimeDisconnected } from '@/features/trading/use-trade-oracle-realtime-disconnected';
import { useTradeDeskViewport } from '@/features/trading/use-trade-desk-viewport';

import { TradeHowItWorksPanel } from '@/features/trading/trade-beginner-help/trade-how-it-works-panel';

import { useTradePageController } from '@/features/trading/use-trade-page-controller';

import type { Currency } from '@phonara/shared-types';

import { MoneyDisplay } from '@/product/primitives/money-display';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';

import { useTradeFiatHint } from '@/features/trading/use-trade-fiat-hint';

import { Skeleton } from '@/product/primitives/skeleton';

import { cn } from '@/product/primitives/lib/cn';

import { formatSpotBaseQuantityDisplay } from '@/domain/spot-base-quantity-display-contract';

import {
  TRADE_DESK_BOTTOM_DOCK_SLOT_CLASS,
  TRADE_DESK_CHART_SLOT_CLASS,
  TRADE_DESK_MAIN_GRID_CLASS,
  TRADE_DESK_SIDE_RAIL_CLASS,
  TRADE_DESK_TICKET_SLOT_CLASS,
} from '@/domain/trade-ultra-layout-display-contract';

import { TradeChartPanel } from './chart/trade-chart-panel';

import { SpotMarketHeader } from './spot-market-header';
import { TradePhonBalanceBreakdown } from './trade-phon-balance-breakdown';

import { SpotOrderBookPanel } from './spot-order-book-panel';

import { SpotOrderTicket } from './spot-order-ticket';

import { TradeMarketStatusBanner } from './trade-market-status-banner';

import { TradeDeskFetchErrorBanner } from './trade-desk-fetch-error-banner';

import { TradeDeskBottomDock, TradeDeskMobileHistoryStack } from './trade-desk-bottom-dock';

import { TradeDeskMobileTabs, TradeDeskMobileTradeStack } from './trade-desk-mobile-tabs';

import { TradeDeskTabletLayout } from './trade-desk-tablet-layout';

import { SpotMobileStickyCta } from './trade-desk-mobile-sticky-cta';

import { TradeDeskPageShell } from './trade-desk-page-shell';

import { TradeRecentTradesRail } from './trade-recent-trades-rail';

function SpotDeskLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="spot-desk-loading">
      <Skeleton className="h-20 w-full" />

      <Skeleton className="h-[360px] w-full" />

      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function isWalletCurrency(asset: string): asset is Currency {
  return asset === 'PHON' || asset === 'USDT' || asset === 'KRW';
}

function SpotAssetBalance({
  amount,
  asset,
  quantityPrecision,
}: {
  amount: string;
  asset: string;
  quantityPrecision: number | null;
}) {
  if (isWalletCurrency(asset)) {
    return (
      <MoneyDisplay
        amount={amount}
        currency={asset}
        showCurrency
        className="text-foreground text-sm"
      />
    );
  }

  return (
    <span className="text-foreground text-sm tabular-nums" data-testid="spot-base-quantity">
      {formatSpotBaseQuantityDisplay(amount, quantityPrecision)}{' '}
      <span className="text-foreground-muted">{asset}</span>
    </span>
  );
}

function SpotAssetsPanel({
  usdtAvail,

  baseLabel,

  baseAvail,

  baseQuantityPrecision,

  phonBonusAvailableDisplay,

  phonRealAvailableDisplay,

  phonAvail,

  t,
}: {
  usdtAvail: string;

  baseLabel: string;

  baseAvail: string;

  baseQuantityPrecision: number | null;

  phonBonusAvailableDisplay: string | null;

  phonRealAvailableDisplay: string | null;

  phonAvail: string;

  t: ReturnType<typeof useTradePageController>['t'];
}) {
  return (
    <section
      data-testid="spot-assets-panel"
      className="border-line bg-surface rounded-(--ds-radius-lg) border p-4"
    >
      <h2 className="text-foreground m-0 text-sm font-semibold">{t('trade.panel.assets')}</h2>

      <dl className="mt-4 grid gap-3">
        {baseLabel === 'PHON' ? (
          <div className="flex flex-col gap-2">
            <dt className="text-foreground-muted text-sm">{baseLabel}</dt>
            <dd className="m-0">
              <TradePhonBalanceBreakdown
                phonBonusAvailableDisplay={phonBonusAvailableDisplay}
                phonRealAvailableDisplay={phonRealAvailableDisplay}
                phonAvail={phonAvail}
                t={t}
              />
            </dd>
          </div>
        ) : (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-foreground-muted text-sm">{baseLabel}</dt>
            <dd className="m-0">
              <SpotAssetBalance
                amount={baseAvail}
                asset={baseLabel}
                quantityPrecision={baseQuantityPrecision}
              />
            </dd>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-foreground-muted text-sm">USDT</dt>

          <dd className="m-0">
            <MoneyDisplay
              amount={usdtAvail}
              currency="USDT"
              showCurrency
              className="text-foreground text-sm"
            />
          </dd>
        </div>
      </dl>
    </section>
  );
}

/** Canonical `/trade` spot desk — chart · order book · spot ticket (P9 · §25.4). */

export function SpotDeskPage() {
  const engine = useTradePageController();

  const wire = useSpotDeskWire(engine);

  const realtimeDisconnected = useTradeOracleRealtimeDisconnected();

  const { layoutTier } = useTradeDeskViewport();

  const { locale } = useI18n();

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

  const { showDisclaimer } = useTradeFiatHint();

  useEffect(() => {
    document.title = t('seo.trade.title');
  }, [t]);

  if (authLoading || walletLoading) {
    return <SpotDeskLoadingShell />;
  }

  const marketSymbol = wire.market?.symbol ?? null;

  const marketSymbols = wire.spotMarkets.map((market) => market.symbol);

  const chartOracleMark = wire.price !== '0' ? wire.price : null;

  const priceOracleStale = marketSymbol ? isPriceStale(marketSymbol) : false;

  const oraclePriceAmount = wire.price !== '0' ? wire.price : undefined;

  const tradeChartPanel = (
    <TradeChartPanel
      marketSymbol={marketSymbol}
      oracleMarkPrice={chartOracleMark}
      className={layoutTier !== 'mobile' ? TRADE_DESK_CHART_SLOT_CLASS : undefined}
    />
  );

  return (
    <TradeDeskPageShell testId="spot-desk-page">
      <MarketDataBridge activeSymbol={marketSymbol} marketSymbols={marketSymbols} />

      <TradeHowItWorksPanel slotId="spot-desk" />

      <SpotMarketHeader
        markets={wire.spotMarkets}
        selectedSymbol={marketSymbol ?? ''}
        pairLabel={wire.pairLabel}
        priceDisplay={wire.priceDisplay}
        markPriceDisplay={wire.oraclePriceDisplay}
        lastPriceAmount={oraclePriceAmount}
        markPriceAmount={oraclePriceAmount}
        priceOracleStale={priceOracleStale}
        lastPriceRaw={wire.lastPriceRaw}
        onMarketChange={wire.onMarketChange}
        t={t}
      />

      <TradeMarketStatusBanner
        desk="spot"
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
                bookDisplaySource={wire.bookDisplaySource}
                className="min-h-[280px] flex-1"
              />
              <TradeRecentTradesRail
                symbol={marketSymbol}
                t={t}
                locale={locale}
                className="max-h-[180px]"
              />
            </div>
            {tradeChartPanel}
            <SpotOrderTicket wire={wire} className={TRADE_DESK_TICKET_SLOT_CLASS} />
          </div>

          {wire.spotCapabilities.openOrdersDock ? (
            <div className={TRADE_DESK_BOTTOM_DOCK_SLOT_CLASS}>
              <TradeDeskBottomDock
                deskVariant="spot"
                positions={[]}
                orders={wire.spotOpenOrders}
                fills={wire.fills}
                fundingPayments={[]}
                t={t}
                locale={wire.locale}
                onCancelOrder={wire.cancelOrder}
                cancellingOrderId={wire.cancellingOrderId}
                actionBusy={wire.actionBusy}
                initialTab="openOrders"
                ordersLoading={wire.openOrdersLoading}
                fillsLoading={wire.fillsLoading}
              />
            </div>
          ) : null}
        </>
      ) : layoutTier === 'tablet' ? (
        <TradeDeskTabletLayout
          testId="spot-desk-tablet-layout"
          t={t}
          chart={tradeChartPanel}
          ticket={
            <SpotOrderTicket
              wire={wire}
              primarySubmit="external"
              className={TRADE_DESK_TICKET_SLOT_CLASS}
            />
          }
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
                    bookDisplaySource={wire.bookDisplaySource}
                    className="min-h-[280px]"
                  />
                  <TradeRecentTradesRail
                    symbol={marketSymbol}
                    t={t}
                    locale={locale}
                    className="max-h-[200px]"
                  />
                </div>
              }
              stickyCta={<SpotMobileStickyCta wire={wire} />}
            />
          }
          positions={
            <SpotAssetsPanel
              usdtAvail={wire.usdtAvail}
              baseLabel={wire.baseLabel}
              baseAvail={wire.baseLabel === 'PHON' ? wire.phonAvail : wire.baseHoldingQty}
              baseQuantityPrecision={wire.quantityPrecision}
              phonBonusAvailableDisplay={wire.phonBonusAvailableDisplay}
              phonRealAvailableDisplay={wire.phonRealAvailableDisplay}
              phonAvail={wire.phonAvail}
              t={t}
            />
          }
          history={
            <TradeDeskMobileHistoryStack
              orders={wire.spotOpenOrders}
              fills={wire.fills}
              t={t}
              locale={wire.locale}
              showFunding={false}
              onCancelOrder={wire.cancelOrder}
              cancellingOrderId={wire.cancellingOrderId}
              cancelBusy={wire.actionBusy}
              ordersLoading={wire.openOrdersLoading}
              fillsLoading={wire.fillsLoading}
            />
          }
        />
      ) : (
        <TradeDeskMobileTabs
          testId="spot-desk-mobile-tabs"
          t={t}
          chart={tradeChartPanel}
          trade={
            <TradeDeskMobileTradeStack
              t={t}
              orderTicket={<SpotOrderTicket wire={wire} primarySubmit="external" />}
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
                    bookDisplaySource={wire.bookDisplaySource}
                    className="min-h-[280px]"
                  />
                  <TradeRecentTradesRail
                    symbol={marketSymbol}
                    t={t}
                    locale={locale}
                    className="max-h-[200px]"
                  />
                </div>
              }
              stickyCta={<SpotMobileStickyCta wire={wire} />}
            />
          }
          positions={
            <SpotAssetsPanel
              usdtAvail={wire.usdtAvail}
              baseLabel={wire.baseLabel}
              baseAvail={wire.baseLabel === 'PHON' ? wire.phonAvail : wire.baseHoldingQty}
              baseQuantityPrecision={wire.quantityPrecision}
              phonBonusAvailableDisplay={wire.phonBonusAvailableDisplay}
              phonRealAvailableDisplay={wire.phonRealAvailableDisplay}
              phonAvail={wire.phonAvail}
              t={t}
            />
          }
          history={
            <TradeDeskMobileHistoryStack
              orders={wire.spotOpenOrders}
              fills={wire.fills}
              t={t}
              locale={wire.locale}
              showFunding={false}
              onCancelOrder={wire.cancelOrder}
              cancellingOrderId={wire.cancellingOrderId}
              cancelBusy={wire.actionBusy}
              ordersLoading={wire.openOrdersLoading}
              fillsLoading={wire.fillsLoading}
            />
          }
        />
      )}

      {showDisclaimer ? <FiatHintDisclaimer /> : null}
    </TradeDeskPageShell>
  );
}
