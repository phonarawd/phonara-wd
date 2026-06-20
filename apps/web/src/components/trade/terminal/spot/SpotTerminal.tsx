import { useState } from "react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerOverlay, DrawerPortal } from "@/components/ui/drawer";
import { Drawer as DrawerPrimitive } from "vaul";
import { t } from "@/i18n";
import type { TradePageController } from "@/features/trading/use-trade-page-controller";
import { MarketTickerBar } from "../shared/MarketTickerBar";
import { OrderBookPanel } from "../shared/OrderBookPanel";
import { ChartPanel } from "../shared/ChartPanel";
import { RecentTradesPanel } from "../shared/RecentTradesPanel";
import { useSpotTerminalWire, type SpotTerminalWire } from "./useSpotTerminalWire";
import { SpotOrderTicket, SpotConfirmDialog } from "./SpotOrderTicket";

export function SpotTerminal({ engine }: { engine: TradePageController }) {
  const wire = useSpotTerminalWire(engine);
  return (
    <div data-testid="trade-panel-spot" className="trade-terminal mx-auto w-full max-w-[1600px]">
      <SpotMobileTerminal wire={wire} />
      <SpotDesktopGrid wire={wire} />
      <SpotConfirmDialog wire={wire} />
    </div>
  );
}

function SpotDesktopGrid({ wire }: { wire: SpotTerminalWire }) {
  return (
    <div className="trade-terminal__desktop-surface grid-rows-[auto_1fr] gap-0">
      <MarketTickerBar
        baseLabel={wire.baseLabel}
        pairLabel={wire.pairLabel}
        markets={wire.spotMarkets.map((m) => ({
          symbol: m.symbol,
          display_name: m.display_name,
        }))}
        selectedSymbol={wire.market?.symbol ?? ""}
        onMarketChange={wire.onMarketChange}
        priceDisplay={wire.priceDisplay}
        priceToneClass="text-(--color-primary)"
        showPerp={false}
      />
      <div className="trade-terminal__grid-spot border-x border-border">
        <OrderBookPanel
          asks={wire.asks}
          bids={wire.bids}
          midDisplay={wire.priceDisplay}
          midToneClass="text-(--color-primary)"
          baseLabel={wire.baseLabel}
          className="trade-terminal__panel"
        />
        <ChartPanel
          marketSymbol={wire.market?.symbol ?? null}
          oraclePrice={wire.oraclePriceDisplay}
          oraclePriceRaw={wire.price !== "0" ? wire.price : undefined}
          pricePrecision={wire.market?.price_precision ?? 4}
        />
        <SpotOrderTicket wire={wire} />
      </div>
    </div>
  );
}

function SpotMobileTerminal({ wire }: { wire: SpotTerminalWire }) {
  const [tab, setTab] = useState<"chart" | "trades">("chart");
  const [sheetOpen, setSheetOpen] = useState(false);

  const tabs = [
    { id: "chart" as const, labelKey: "trade.tab.chart" },
    { id: "trades" as const, labelKey: "trade.tab.trades" },
  ];

  return (
    <div
      className="trade-terminal trade-terminal__mobile-surface"
      style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}
    >
      <MarketTickerBar
        baseLabel={wire.baseLabel}
        pairLabel={wire.pairLabel}
        markets={wire.spotMarkets.map((m) => ({
          symbol: m.symbol,
          display_name: m.display_name,
        }))}
        selectedSymbol={wire.market?.symbol ?? ""}
        onMarketChange={wire.onMarketChange}
        priceDisplay={wire.priceDisplay}
        priceToneClass="text-(--color-primary)"
        showPerp={false}
      />
      <div className="flex border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "flex-1 py-2 text-sm font-semibold",
              tab === item.id ? "border-b-2 border-(--color-primary)" : "text-muted-foreground",
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
            oraclePrice={wire.oraclePriceDisplay}
            oraclePriceRaw={wire.price !== "0" ? wire.price : undefined}
            pricePrecision={wire.market?.price_precision ?? 4}
            compact
          />
        ) : (
          <RecentTradesPanel className="trade-terminal__panel" />
        )}
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="pointer-events-auto border-t border-border bg-background px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                wire.setSide("buy");
                setSheetOpen(true);
              }}
              className="min-h-14 rounded-xl bg-(--color-up) text-base font-bold text-black"
            >
              {t("trade.spot.buy")}
            </button>
            <button
              type="button"
              onClick={() => {
                wire.setSide("sell");
                setSheetOpen(true);
              }}
              className="min-h-14 rounded-xl bg-(--color-down) text-base font-bold text-white"
            >
              {t("trade.spot.sell")}
            </button>
          </div>
        </div>
      </div>
      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerPortal>
          <DrawerOverlay />
          <DrawerPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85svh] rounded-t-2xl border border-border bg-background">
            <SpotOrderTicket wire={wire} />
          </DrawerPrimitive.Content>
        </DrawerPortal>
      </Drawer>
    </div>
  );
}
