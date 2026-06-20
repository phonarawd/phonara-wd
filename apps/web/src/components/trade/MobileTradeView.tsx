import { useState } from "react";
import { Link } from "@/shims/react-router-dom";
import { MobileMarketHeader } from "./MobileMarketHeader";
import { TradeRulesSheet, TradeRulesTrigger } from "./TradeRulesSheet";
import { MobileOrderBook, type OrderBookRow } from "./MobileOrderBook";
import { MobileTradeCTA } from "./MobileTradeCTA";
import { BuyOrderSheet, type Side } from "./BuyOrderSheet";
import type { PriceDir } from "@/features/trading/format-oracle-price-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GateBanner } from "@/components/ui/gate-banner";
import { t } from "@/i18n";
import { ExchangeLiveChart } from "@/features/trading/display-chart/exchange-live-chart";

const BASE_PRICE_DISPLAY = "63,548.7";

// Static mock order book rows. Display strings only — no calculations.
const MOCK_ASKS: OrderBookRow[] = [
  { priceDisplay: "63,556.2", sizeDisplay: "0.142", depthRatio: 0.25 },
  { priceDisplay: "63,555.7", sizeDisplay: "0.318", depthRatio: 0.55 },
  { priceDisplay: "63,554.9", sizeDisplay: "0.087", depthRatio: 0.16 },
  { priceDisplay: "63,553.4", sizeDisplay: "0.512", depthRatio: 0.82 },
  { priceDisplay: "63,552.1", sizeDisplay: "0.221", depthRatio: 0.38 },
  { priceDisplay: "63,550.8", sizeDisplay: "0.412", depthRatio: 0.66 },
  { priceDisplay: "63,550.0", sizeDisplay: "0.176", depthRatio: 0.3 },
];

const MOCK_BIDS: OrderBookRow[] = [
  { priceDisplay: "63,548.2", sizeDisplay: "0.205", depthRatio: 0.35 },
  { priceDisplay: "63,547.5", sizeDisplay: "0.418", depthRatio: 0.68 },
  { priceDisplay: "63,546.8", sizeDisplay: "0.132", depthRatio: 0.22 },
  { priceDisplay: "63,545.4", sizeDisplay: "0.521", depthRatio: 0.85 },
  { priceDisplay: "63,544.1", sizeDisplay: "0.298", depthRatio: 0.48 },
  { priceDisplay: "63,542.7", sizeDisplay: "0.187", depthRatio: 0.31 },
  { priceDisplay: "63,541.0", sizeDisplay: "0.354", depthRatio: 0.58 },
];

export interface MobileTradeViewProps {
  /** Engine-backed last price label; falls back to static import default. */
  priceDisplay?: string;
  priceDir?: PriceDir;
  readOnly?: boolean;
  baseLabel?: string;
  pairLabel?: string;
  /** Platform oracle symbol for live exchange chart (display-only). */
  marketSymbol?: string | null;
  /** Formatted oracle settlement price for chart mark line. */
  oraclePriceDisplay?: string;
  /** Raw oracle price for chart settlement line. */
  oraclePriceRaw?: string;
}

export function MobileTradeView({
  priceDisplay: priceDisplayProp,
  priceDir: priceDirProp,
  readOnly = false,
  baseLabel = "BTC",
  pairLabel = "BTC/USDT",
  marketSymbol: marketSymbolProp,
  oraclePriceDisplay: oraclePriceDisplayProp,
  oraclePriceRaw,
}: MobileTradeViewProps = {}) {
  const priceDisplay = priceDisplayProp ?? BASE_PRICE_DISPLAY;
  const dir = priceDirProp ?? "flat";
  const chartSymbol = marketSymbolProp ?? `${baseLabel}USDT-SIM`;
  const chartOracleDisplay = oraclePriceDisplayProp ?? priceDisplay;

  // Sheet UI state (display strings only — no calculations performed anywhere).
  const [sheet, setSheet] = useState<{
    open: boolean;
    side: Side;
    prefillPriceDisplay?: string;
  }>({ open: false, side: "long" });

  const [priceInput, setPriceInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [orderType, setOrderType] = useState<"limit" | "market" | "stop">("limit");
  const [tp, setTp] = useState(false);
  const [sl, setSl] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const openSheet = (side: Side, prefillPriceDisplay?: string) =>
    setSheet({ open: true, side, prefillPriceDisplay });

  // Bonus deadline: fixed 48h from a stable epoch (no Date.now on render).
  const bonusEndsAt = 1782588000000 + 48 * 60 * 60 * 1000;

  return (
    <div className="lg:hidden">
      <div
        className="grid gap-3 p-3"
        style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}
      >
        <div className="sticky top-0 z-20 -mx-3 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:top-14">
          <div className="relative">
            <MobileMarketHeader
              symbol={pairLabel}
              baseLabel={baseLabel}
              lastPriceDisplay={priceDisplay}
              changeDir={dir === "flat" ? "up" : dir}
              changePctDisplay="+2.35%"
              high24Display="64,112.3"
              low24Display="61,203.5"
              vol24Display="12.3K BTC"
              fundingDisplay="0.00%"
            />
            <TradeRulesTrigger
              onClick={() => setRulesOpen(true)}
              className="absolute right-2 top-2"
            />
          </div>
        </div>
        <TradeRulesSheet open={rulesOpen} onOpenChange={setRulesOpen} />

        <Card>
          <CardContent className="p-0">
            <ExchangeLiveChart
              marketSymbol={chartSymbol}
              oraclePrice={chartOracleDisplay}
              oraclePriceRaw={oraclePriceRaw}
              compact
              heightClass="min-h-[220px]"
            />
          </CardContent>
        </Card>

        <MobileOrderBook
          asks={MOCK_ASKS}
          bids={MOCK_BIDS}
          midPriceDisplay={priceDisplay}
          midDir={dir === "flat" ? "up" : dir}
          onRowTap={({ side, priceDisplay }) => {
            setPriceInput(priceDisplay);
            openSheet(side, priceDisplay);
          }}
        />

        <GateBanner kind="kyc" />

        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-xs">포지션</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-center text-xs text-muted-foreground">
            활성 포지션이 없습니다
          </CardContent>
        </Card>
      </div>

      <MobileTradeCTA
        onBuy={() => (readOnly ? undefined : openSheet("long"))}
        onSell={() => (readOnly ? undefined : openSheet("short"))}
        buyDisabled={readOnly}
        sellDisabled={readOnly}
      />

      {readOnly ? (
        <p className="px-3 pb-2 text-center text-[11px] text-muted-foreground">
          <Link to="/login" className="text-(--color-primary) underline-offset-2 hover:underline">
            {t("trade.loginRequired")}
          </Link>
        </p>
      ) : null}

      <BuyOrderSheet
        open={sheet.open}
        onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}
        side={sheet.side}
        onSideChange={(side) => setSheet((s) => ({ ...s, side }))}
        symbol="BTCUSDT"
        lastPriceDisplay={priceDisplay}
        prefillPriceDisplay={sheet.prefillPriceDisplay}
        priceInput={priceInput}
        onPriceInput={setPriceInput}
        amountInput={amountInput}
        onAmountInput={setAmountInput}
        availableBalanceDisplay="—"
        estFeeDisplay="—"
        estLiqPriceDisplay="—"
        marginDisplay="—"
        leverage={leverage}
        onLeverageChange={setLeverage}
        orderType={orderType}
        onOrderTypeChange={setOrderType}
        tpEnabled={tp}
        onTpToggle={setTp}
        slEnabled={sl}
        onSlToggle={setSl}
        fomo={{
          countdownEndsAt: bonusEndsAt,
          streakDays: 3,
          streakGoal: 7,
          missionCurrent: 1200,
          missionGoal: 5000,
          missionRewardLabel: "+5,000P",
          tier: "silver",
        }}
      />
    </div>
  );
}
