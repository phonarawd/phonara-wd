import { useState } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { LovableFuturesPositionsCard } from "@/features/trading/lovable-wire/lovable-futures-positions-card";
import { RecentTradesPanel } from "./RecentTradesPanel";
import type { FuturesPosition } from "@/hooks/use-trading";

import { OpenOrdersPanel } from "./OpenOrdersPanel";
import type { TradingOpenOrder } from "@/hooks/use-trading";

type DockTab = "positions" | "openOrders" | "history" | "trades";

export type TradeBottomDockProps = {
  positions: FuturesPosition[];
  prices: Record<string, string>;
  isPriceStale: (symbol: string | null | undefined) => boolean;
  realtimeDisconnected: boolean;
  onClosed: () => void;
  openOrders?: TradingOpenOrder[];
  openOrdersLoading?: boolean;
  onCancelOrder?: (orderId: string) => void;
  cancelBusy?: boolean;
};

export function TradeBottomDock({
  positions,
  prices,
  isPriceStale,
  realtimeDisconnected,
  onClosed,
  openOrders = [],
  openOrdersLoading = false,
  onCancelOrder,
  cancelBusy = false,
}: TradeBottomDockProps) {
  const [tab, setTab] = useState<DockTab>("positions");
  const tabs: { id: DockTab; labelKey: string }[] = [
    { id: "positions", labelKey: "trade.panel.positions" },
    { id: "openOrders", labelKey: "trade.panel.openOrders" },
    { id: "history", labelKey: "trade.panel.history" },
    { id: "trades", labelKey: "trade.tab.trades" },
  ];

  return (
    <div className="trade-terminal__dock trade-terminal__panel flex flex-col overflow-hidden">
      <div className="flex border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            data-active={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "min-h-10 flex-1 px-3 text-[11px] font-semibold transition-colors",
              tab === item.id
                ? "border-b-2 border-(--color-primary) text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tab === "positions" ? (
          <DockPositions
            positions={positions}
            prices={prices}
            isPriceStale={isPriceStale}
            realtimeDisconnected={realtimeDisconnected}
            onClosed={onClosed}
          />
        ) : null}
        {tab === "openOrders" ? (
          <OpenOrdersPanel
            orders={openOrders}
            loading={openOrdersLoading}
            busy={cancelBusy}
            onCancel={(orderId) => onCancelOrder?.(orderId)}
          />
        ) : null}
        {tab === "history" ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {t("trade.empty.history")}
          </p>
        ) : null}
        {tab === "trades" ? <RecentTradesPanel /> : null}
      </div>
    </div>
  );
}

function DockPositions({
  positions,
  prices,
  isPriceStale,
  realtimeDisconnected,
  onClosed,
}: TradeBottomDockProps) {
  const open = positions.filter((p) => p.status === "open");
  if (open.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        {t("trade.empty.positions")}
      </p>
    );
  }
  return (
    <LovableFuturesPositionsCard
      positions={positions}
      prices={prices}
      isPriceStale={isPriceStale}
      realtimeDisconnected={realtimeDisconnected}
      onClosed={onClosed}
    />
  );
}
