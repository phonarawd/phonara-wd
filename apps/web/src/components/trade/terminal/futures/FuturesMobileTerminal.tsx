import { useState } from "react";
import { cn } from "@/lib/utils";
import { GateBanner } from "@/components/ui/gate-banner";
import { TradeRulesSheet, TradeRulesTrigger } from "@/components/trade/TradeRulesSheet";
import { MobileTradeCTA } from "@/components/trade/MobileTradeCTA";
import { t } from "@/i18n";
import { LovableFuturesPositionsCard } from "@/features/trading/lovable-wire/lovable-futures-positions-card";
import { MarketTickerBar } from "../shared/MarketTickerBar";
import { OrderBookPanel } from "../shared/OrderBookPanel";
import { ChartPanel } from "../shared/ChartPanel";
import { RecentTradesPanel } from "../shared/RecentTradesPanel";
import { OpenOrdersPanel } from "../shared/OpenOrdersPanel";
import { FuturesOrderSheet } from "./FuturesOrderSheet";
import type { FuturesTerminalWire } from "../useFuturesTerminalWire";

type MobileTab = "chart" | "book" | "trades" | "positions";
type PositionsSubTab = "positions" | "openOrders" | "history";

export function FuturesMobileTerminal({ wire }: { wire: FuturesTerminalWire }) {
  const [tab, setTab] = useState<MobileTab>("chart");
  const [positionsSubTab, setPositionsSubTab] = useState<PositionsSubTab>("positions");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSide, setSheetSide] = useState<"long" | "short">("long");

  const openSheet = (side: "long" | "short") => {
    wire.setSide(side);
    setSheetSide(side);
    setSheetOpen(true);
  };

  const tabs: { id: MobileTab; labelKey: string }[] = [
    { id: "chart", labelKey: "trade.tab.chart" },
    { id: "book", labelKey: "trade.tab.orderbook" },
    { id: "trades", labelKey: "trade.tab.trades" },
    { id: "positions", labelKey: "trade.tab.positions" },
  ];

  const openPositions = wire.futuresPositions.filter((p) => p.status === "open");

  return (
    <div
      className={cn(
        "trade-terminal trade-terminal__mobile-surface",
        sheetOpen && "trade-terminal--sheet-open",
      )}
      style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}
    >
      <div className="sticky top-0 z-20 -mx-0 bg-background/95 backdrop-blur">
        <MarketTickerBar
          baseLabel={wire.baseLabel}
          pairLabel={wire.pairLabel}
          markets={wire.futuresMarkets}
          selectedSymbol={wire.market?.symbol ?? ""}
          onMarketChange={wire.onMarketChange}
          marketsLoading={wire.futuresMarketsLoading}
          priceDisplay={wire.priceDisplay}
          priceToneClass={wire.tone}
          change24Display="+2.35%"
          high24Display="64,112.3"
          low24Display="61,203.5"
          vol24Display="12.3K"
          fundingDisplay="0.0125%"
          trailing={<TradeRulesTrigger onClick={() => wire.setRulesOpen(true)} />}
        />
      </div>
      <TradeRulesSheet open={wire.rulesOpen} onOpenChange={wire.setRulesOpen} />

      <div className="flex border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            data-testid="trade-terminal__mobile-tab"
            data-active={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "trade-terminal__mobile-tab flex-1 border-b-2 px-2 py-2 transition-colors",
              tab === item.id
                ? "border-(--color-primary) text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      <div className="p-2">
        {tab === "chart" ? (
          <ChartPanel
            marketSymbol={wire.market?.symbol ?? null}
            oraclePrice={wire.oracleMarkDisplay}
            oraclePriceRaw={wire.price !== "0" ? wire.price : undefined}
            pricePrecision={wire.market?.price_precision ?? 2}
            compact
          />
        ) : null}
        {tab === "book" ? (
          <OrderBookPanel
            asks={wire.asks}
            bids={wire.bids}
            midDisplay={wire.priceDisplay}
            midToneClass={wire.tone}
            baseLabel={wire.baseLabel}
            compact
            onRowClick={({ side }) => {
              wire.setSide(side);
              setSheetSide(side);
              setSheetOpen(true);
            }}
          />
        ) : null}
        {tab === "trades" ? <RecentTradesPanel className="trade-terminal__panel" /> : null}
        {tab === "positions" ? (
          <div className="grid gap-2">
            <div className="flex gap-1 rounded-lg bg-(--color-surface) p-1">
              {(
                [
                  { id: "positions" as const, labelKey: "trade.tab.positions" },
                  { id: "openOrders" as const, labelKey: "trade.tab.openOrders" },
                  { id: "history" as const, labelKey: "trade.panel.history" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`trade-positions-subtab-${item.id}`}
                  data-active={positionsSubTab === item.id}
                  onClick={() => setPositionsSubTab(item.id)}
                  className={cn(
                    "min-h-9 flex-1 rounded-md px-2 text-[11px] font-semibold transition-colors",
                    positionsSubTab === item.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
            {positionsSubTab === "positions" ? (
              openPositions.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  {t("trade.empty.positions")}
                </p>
              ) : (
                <LovableFuturesPositionsCard
                  positions={wire.futuresPositions}
                  prices={wire.prices}
                  isPriceStale={wire.isPriceStale}
                  realtimeDisconnected={wire.realtimeDisconnected}
                  onClosed={() => void wire.refreshFuturesPositions()}
                />
              )
            ) : null}
            {positionsSubTab === "openOrders" ? (
              <OpenOrdersPanel
                orders={wire.openOrders}
                loading={wire.openOrdersLoading}
                busy={wire.busy}
                onCancel={(orderId) => void wire.cancelOrder(orderId)}
              />
            ) : null}
            {positionsSubTab === "history" ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                {t("trade.empty.history")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <GateBanner kind="kyc" />

      <MobileTradeCTA
        onBuy={() => openSheet("long")}
        onSell={() => openSheet("short")}
        buyDisabled={wire.tradeBlocked}
        sellDisabled={wire.tradeBlocked}
      />

      <FuturesOrderSheet
        wire={wire}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        side={sheetSide}
        onSideChange={(s) => {
          wire.setSide(s);
          setSheetSide(s);
        }}
        onSubmit={() => wire.setConfirmOpen(true)}
      />
    </div>
  );
}
