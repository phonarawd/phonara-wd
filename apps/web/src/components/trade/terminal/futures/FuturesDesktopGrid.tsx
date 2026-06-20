import { GateBanner } from "@/components/ui/gate-banner";
import { TradeRulesSheet, TradeRulesTrigger } from "@/components/trade/TradeRulesSheet";
import { t } from "@/i18n";
import { MarketTickerBar } from "../shared/MarketTickerBar";
import { OrderBookPanel } from "../shared/OrderBookPanel";
import { ChartPanel } from "../shared/ChartPanel";
import { TradeBottomDock } from "../shared/TradeBottomDock";
import { FuturesOrderTicket } from "./FuturesOrderTicket";
import type { FuturesTerminalWire } from "../useFuturesTerminalWire";

export function FuturesDesktopGrid({ wire }: { wire: FuturesTerminalWire }) {
  return (
    <div className="trade-terminal__desktop-surface grid-rows-[auto_1fr_auto] gap-0">
      <MarketTickerBar
        baseLabel={wire.baseLabel}
        pairLabel={wire.pairLabel}
        markets={wire.futuresMarkets}
        selectedSymbol={wire.market?.symbol ?? ""}
        onMarketChange={wire.onMarketChange}
        marketsLoading={wire.futuresMarketsLoading}
        lastPriceDisplay={wire.lastPriceDisplay}
        lastPriceToneClass={wire.tone}
        markPriceDisplay={wire.markPriceDisplay}
        markPriceUnavailable={wire.oracleMarkUnavailable}
        change24Display="+2.35%"
        change24Tone="up"
        high24Display="64,112.3"
        low24Display="61,203.5"
        vol24Display="12.3K"
        fundingDisplay={wire.fundingDisplay}
        fundingToneClass={wire.fundingToneClass}
        openInterestDisplay="2.41B"
        trailing={
          <>
            <span className="rounded-full bg-(--color-warn)/15 px-2 py-0.5 text-[10px] font-semibold text-(--color-warn)">
              {t("trade.orderbook.displayOnly")}
            </span>
            <TradeRulesTrigger onClick={() => wire.setRulesOpen(true)} />
          </>
        }
      />
      <TradeRulesSheet open={wire.rulesOpen} onOpenChange={wire.setRulesOpen} />

      <div className="trade-terminal__grid-futures border-x border-border">
        <OrderBookPanel
          asks={wire.asks}
          bids={wire.bids}
          midDisplay={wire.priceDisplay}
          midToneClass={wire.tone}
          baseLabel={wire.baseLabel}
          onRowClick={({ side }) => wire.setSide(side)}
        />
        <ChartPanel
          marketSymbol={wire.market?.symbol ?? null}
          oraclePrice={wire.oracleMarkDisplay}
          oraclePriceRaw={wire.price !== "0" ? wire.price : undefined}
          pricePrecision={wire.market?.price_precision ?? 2}
        />
        <FuturesOrderTicket wire={wire} />
      </div>

      <GateBanner kind="kyc" />
      <TradeBottomDock
        positions={wire.futuresPositions}
        prices={wire.prices}
        isPriceStale={wire.isPriceStale}
        realtimeDisconnected={wire.realtimeDisconnected}
        onClosed={wire.refreshFuturesPositions}
        openOrders={wire.openOrders}
        openOrdersLoading={wire.openOrdersLoading}
        onCancelOrder={(orderId) => void wire.cancelOrder(orderId)}
        cancelBusy={wire.busy}
      />
    </div>
  );
}
