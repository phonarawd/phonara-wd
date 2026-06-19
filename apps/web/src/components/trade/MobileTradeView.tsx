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
}

export function MobileTradeView({
  priceDisplay: priceDisplayProp,
  priceDir: priceDirProp,
  readOnly = false,
}: MobileTradeViewProps = {}) {
  const priceDisplay = priceDisplayProp ?? BASE_PRICE_DISPLAY;
  const dir = priceDirProp ?? "flat";

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
              symbol="BTC/USDT"
              lastPriceDisplay={priceDisplay}
              changeDir={dir === "flat" ? "up" : dir}
              changePctDisplay="+2.35%"
              high24Display="64,112.3"
              low24Display="61,203.5"
              vol24Display="12.3K BTC"
              fundingDisplay="0.0125%"
            />
            <TradeRulesTrigger
              onClick={() => setRulesOpen(true)}
              className="absolute right-2 top-2"
            />
          </div>
        </div>
        <TradeRulesSheet open={rulesOpen} onOpenChange={setRulesOpen} />

        {/* Mini chart (decorative SVG placeholder, no random data on render) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-xs">차트</CardTitle>
            <div className="flex gap-1 text-[10px] text-muted-foreground">
              {["1m", "5m", "15m", "1h", "4h", "1D"].map((tf) => (
                <button
                  key={tf}
                  className="min-h-8 rounded px-2 hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
                >
                  {tf}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MockMiniChart />
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

/** Static (non-random) decorative chart so SSR === CSR. */
function MockMiniChart() {
  // Deterministic candle pattern — no Math.random.
  const candles = [
    [50, 56, 48, 54], [54, 58, 52, 53], [53, 55, 49, 50], [50, 52, 46, 47],
    [47, 51, 45, 50], [50, 54, 49, 53], [53, 57, 52, 56], [56, 60, 54, 58],
    [58, 62, 55, 56], [56, 59, 52, 53], [53, 55, 48, 49], [49, 53, 47, 52],
    [52, 56, 51, 55], [55, 59, 53, 57], [57, 61, 55, 60], [60, 64, 58, 62],
    [62, 65, 59, 60], [60, 62, 55, 56], [56, 58, 52, 53], [53, 57, 51, 55],
    [55, 59, 53, 58], [58, 62, 56, 60], [60, 63, 57, 58], [58, 60, 54, 55],
    [55, 58, 52, 56], [56, 60, 54, 59], [59, 63, 57, 61], [61, 64, 58, 59],
    [59, 61, 55, 56], [56, 60, 54, 58],
  ];
  const W = 360, H = 220;
  const cw = W / candles.length;
  const all = candles.flat();
  const max = Math.max(...all), min = Math.min(...all);
  const y = (v: number) => ((max - v) / (max - min)) * (H - 20) + 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[220px] w-full" preserveAspectRatio="none">
      {candles.map((raw, i) => {
        const o = raw[0] ?? 0;
        const h = raw[1] ?? 0;
        const l = raw[2] ?? 0;
        const c = raw[3] ?? 0;
        const up = c >= o;
        const x = i * cw + cw / 2;
        const color = up ? "var(--color-up)" : "var(--color-down)";
        return (
          <g key={i} stroke={color} fill={color}>
            <line x1={x} x2={x} y1={y(h)} y2={y(l)} strokeWidth="1" />
            <rect
              x={i * cw + 1}
              y={y(Math.max(o, c))}
              width={cw - 2}
              height={Math.max(1, Math.abs(y(o) - y(c)))}
            />
          </g>
        );
      })}
    </svg>
  );
}
