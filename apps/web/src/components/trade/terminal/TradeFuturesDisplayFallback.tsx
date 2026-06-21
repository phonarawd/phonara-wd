import { useState } from "react";
import { Link } from "@/shims/react-router-dom";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import type { PriceDir } from "@/features/trading/format-oracle-price-display";
import {
  SYNTHETIC_FUTURES_ASK_ROWS,
  SYNTHETIC_FUTURES_BID_ROWS,
} from "@/features/trading/synthetic-futures-book";
import { MarketTickerBar } from "./shared/MarketTickerBar";
import { OrderBookPanel } from "./shared/OrderBookPanel";
import { ChartPanel } from "./shared/ChartPanel";
import { RecentTradesPanel } from "./shared/RecentTradesPanel";

type MobileTab = "chart" | "book" | "trades";

export function TradeFuturesDisplayFallback({
  priceDisplay = "63,548.7",
  priceDir = "flat",
}: {
  priceDisplay?: string;
  priceDir?: PriceDir;
  readOnly?: boolean;
}) {
  const [tab, setTab] = useState<MobileTab>("chart");

  const tone =
    priceDir === "up"
      ? "text-(--color-up)"
      : priceDir === "down"
        ? "text-(--color-down)"
        : "text-(--color-primary)";

  const tabs: { id: MobileTab; labelKey: string }[] = [
    { id: "chart", labelKey: "trade.tab.chart" },
    { id: "book", labelKey: "trade.tab.orderbook" },
    { id: "trades", labelKey: "trade.tab.trades" },
  ];

  return (
    <div data-testid="trade-panel-futures" className="trade-terminal mx-auto w-full max-w-[1600px]">
      <div
        className="trade-terminal trade-terminal__mobile-surface"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <MarketTickerBar
          baseLabel="BTC"
          pairLabel="BTCUSDT"
          markets={[{ symbol: "BTCUSDT-SIM", display_name: "BTCUSDT Perp" }]}
          selectedSymbol="BTCUSDT-SIM"
          onMarketChange={() => {}}
          lastPriceDisplay={priceDisplay}
          lastPriceToneClass={tone}
          markPriceDisplay="—"
          markPriceUnavailable
          change24Display="+2.35%"
          change24Tone="up"
          high24Display="64,112.3"
          low24Display="61,203.5"
          vol24Display="12.3K"
          fundingDisplay="0.00%"
        />

        <div className="flex border-b border-border">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
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
              marketSymbol="BTCUSDT-SIM"
              oraclePrice={priceDisplay}
              pricePrecision={2}
              compact
            />
          ) : null}
          {tab === "book" ? (
            <OrderBookPanel
              asks={SYNTHETIC_FUTURES_ASK_ROWS}
              bids={SYNTHETIC_FUTURES_BID_ROWS}
              midDisplay={priceDisplay}
              midToneClass={tone}
              baseLabel="BTC"
              compact
            />
          ) : null}
          {tab === "trades" ? <RecentTradesPanel className="trade-terminal__panel" /> : null}
        </div>

        <p className="px-3 pb-2 text-center text-xs text-muted-foreground">
          <Link to="/login" className="text-(--color-primary) underline-offset-2 hover:underline">
            {t("trade.loginRequired")}
          </Link>
        </p>
      </div>

      <div className="trade-terminal__desktop-surface grid-rows-[auto_1fr] gap-0">
        <MarketTickerBar
          baseLabel="BTC"
          pairLabel="BTCUSDT"
          markets={[{ symbol: "BTCUSDT-SIM", display_name: "BTCUSDT Perp" }]}
          selectedSymbol="BTCUSDT-SIM"
          onMarketChange={() => {}}
          lastPriceDisplay={priceDisplay}
          lastPriceToneClass={tone}
          markPriceDisplay="—"
          markPriceUnavailable
          change24Display="+2.35%"
          change24Tone="up"
          high24Display="64,112.3"
          low24Display="61,203.5"
          vol24Display="12.3K"
          fundingDisplay="0.00%"
          trailing={
            <span
              data-testid="trade-futures-display-only-label"
              className="rounded-full bg-(--color-warn)/15 px-2 py-0.5 text-[10px] font-semibold text-(--color-warn)"
            >
              {t("trade.orderbook.displayOnly")}
            </span>
          }
        />

        <div className="trade-terminal__grid-futures border-x border-border">
          <OrderBookPanel
            asks={SYNTHETIC_FUTURES_ASK_ROWS}
            bids={SYNTHETIC_FUTURES_BID_ROWS}
            midDisplay={priceDisplay}
            midToneClass={tone}
            baseLabel="BTC"
          />
          <ChartPanel
            marketSymbol="BTCUSDT-SIM"
            oraclePrice={priceDisplay}
            pricePrecision={2}
          />
          <div className="trade-terminal__panel flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-xs text-muted-foreground">{t("trade.loginRequired")}</p>
            <Link
              to="/login"
              className="min-h-11 rounded-md bg-(--color-primary) px-6 py-2 text-sm font-bold text-(--color-primary-foreground) hover:opacity-90"
            >
              {t("auth.signIn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
