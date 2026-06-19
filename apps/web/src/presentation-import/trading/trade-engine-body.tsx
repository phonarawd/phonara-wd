import { SpotPanel } from '../../features/trading/spot-panel';
import { FuturesPanel } from '../../features/trading/futures-panel';
import { OpenPositions } from '../../features/trading/open-positions';
import { TradeNotificationCenter } from '../../features/trading/trade-notification-center';
import { MarketDataStatus } from '../../features/trading/market-data-status';
import type { TradePageController } from '../../features/trading/use-trade-page-controller';

export type TradeEngineBodyProps = {
  controller: TradePageController;
};

/**
 * L2 Wave B — engine-backed trade panels (spot · futures · positions).
 * Mounted together so money-flow E2E can reach spot-submit and futures-open
 * on a single /trade visit without tab switching.
 */
export function TradeEngineBody({ controller }: TradeEngineBodyProps) {
  const {
    phonAvail,
    usdtAvail,
    walletLoading,
    prices,
    futuresMarkets,
    futuresMarketsLoading,
    selectedSpotMarket,
    isPriceStale,
    realtimeDisconnected,
    futuresPositions,
    refreshFuturesPositions,
    tradeNotifications,
    pricesError,
    positionsError,
    marketsError,
    pricesFetching,
    positionsFetching,
    pricesUpdatedAt,
    positionsUpdatedAt,
    oracleStale,
    refreshMarkets,
  } = controller;

  const spotPrice = selectedSpotMarket ? (prices[selectedSpotMarket.symbol] ?? '0') : '0';
  const spotPriceStale = selectedSpotMarket ? isPriceStale(selectedSpotMarket.symbol) : false;

  return (
    <div className="mx-auto grid w-full max-w-[1600px] gap-4 p-3 md:p-4" data-testid="trade-engine-body">
      <div className="flex justify-end">
        <TradeNotificationCenter
          markets={futuresMarkets}
          prices={prices}
          notifications={tradeNotifications.notifications}
          permission={tradeNotifications.permission}
          permissionBusy={tradeNotifications.permissionBusy}
          permissionError={tradeNotifications.permissionError}
          pushConsent={tradeNotifications.pushConsent}
          priceAlert={tradeNotifications.priceAlert}
          onRequestPermission={tradeNotifications.requestBrowserNotifications}
          onSetPriceAlert={tradeNotifications.setPriceAlert}
          onClearPriceAlert={tradeNotifications.clearPriceAlert}
          onClearNotifications={tradeNotifications.clearNotifications}
        />
      </div>

      <MarketDataStatus
        pricesError={pricesError}
        positionsError={positionsError}
        marketsError={marketsError}
        pricesFetching={pricesFetching}
        positionsFetching={positionsFetching}
        pricesUpdatedAt={pricesUpdatedAt}
        positionsUpdatedAt={positionsUpdatedAt}
        oracleStale={oracleStale}
        onRetry={refreshMarkets}
      />

      <SpotPanel
        market={selectedSpotMarket}
        price={spotPrice}
        usdtAvail={usdtAvail}
        phonAvail={phonAvail}
        priceStale={spotPriceStale}
        realtimeDisconnected={realtimeDisconnected}
      />

      <FuturesPanel
        markets={futuresMarkets}
        marketsLoading={futuresMarketsLoading}
        prices={prices}
        phonAvail={phonAvail}
        usdtAvail={usdtAvail}
        walletLoading={walletLoading}
        isPriceStale={isPriceStale}
        realtimeDisconnected={realtimeDisconnected}
        onTraded={refreshFuturesPositions}
      />

      <OpenPositions
        positions={futuresPositions}
        prices={prices}
        isPriceStale={isPriceStale}
        realtimeDisconnected={realtimeDisconnected}
        onClosed={refreshFuturesPositions}
      />
    </div>
  );
}
