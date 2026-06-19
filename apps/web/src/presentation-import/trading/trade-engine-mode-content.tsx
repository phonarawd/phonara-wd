import { SpotPanel } from '../../features/trading/spot-panel';
import { FuturesPanel } from '../../features/trading/futures-panel';
import { OpenPositions } from '../../features/trading/open-positions';
import type { TradePageController } from '../../features/trading/use-trade-page-controller';

export type TradeEngineModeContentProps = {
  controller: TradePageController;
};

/**
 * Engine-backed trade panels for the active TradeModeShell tab.
 * Spot and futures are split so Lovable tab chrome stays; E2E still finds
 * spot-submit / futures-open when TradeEngineBody mounts both (trade-page).
 */
export function TradeEngineSpotContent({ controller }: TradeEngineModeContentProps) {
  const {
    phonAvail,
    usdtAvail,
    prices,
    selectedSpotMarket,
    isPriceStale,
    realtimeDisconnected,
  } = controller;

  const spotPrice = selectedSpotMarket ? (prices[selectedSpotMarket.symbol] ?? '0') : '0';
  const spotPriceStale = selectedSpotMarket ? isPriceStale(selectedSpotMarket.symbol) : false;

  return (
    <SpotPanel
      market={selectedSpotMarket}
      price={spotPrice}
      usdtAvail={usdtAvail}
      phonAvail={phonAvail}
      priceStale={spotPriceStale}
      realtimeDisconnected={realtimeDisconnected}
    />
  );
}

export function TradeEngineFuturesContent({ controller }: TradeEngineModeContentProps) {
  const {
    phonAvail,
    usdtAvail,
    walletLoading,
    prices,
    futuresMarkets,
    futuresMarketsLoading,
    isPriceStale,
    realtimeDisconnected,
    futuresPositions,
    refreshFuturesPositions,
  } = controller;

  return (
    <div className="grid gap-4">
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
