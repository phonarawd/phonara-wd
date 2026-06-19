import { useState } from "react";
import { Link } from "@/shims/react-router-dom";
import { ChevronDown, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GateBanner } from "@/components/ui/gate-banner";
import { t } from "@/i18n";
import { MobileTradeView } from "@/components/trade/MobileTradeView";
import type { PriceDir } from "@/features/trading/format-oracle-price-display";
import {
  SYNTHETIC_FUTURES_ASK_ROWS,
  SYNTHETIC_FUTURES_BID_ROWS,
} from "@/features/trading/synthetic-futures-book";
import {
  TradeRulesSheet,
  TradeRulesTrigger,
} from "@/components/trade/TradeRulesSheet";

/**
 * L1-17 T17-3 — TradeFuturesPanel
 * Relocates the 12-D futures terminal (mobile view + desktop terminal) into
 * a swappable panel for TradeModeShell. No engine/RPC touches. Synthetic /
 * display-only label preserved via the existing terminal copy.
 */

const BASE_PRICE_DISPLAY = "63,548.7";

export type TradeFuturesPanelProps = {
  priceDisplay?: string;
  priceDir?: PriceDir;
  readOnly?: boolean;
};

export function TradeFuturesPanel({
  priceDisplay,
  priceDir,
  readOnly = false,
}: TradeFuturesPanelProps = {}) {
  return (
    <div data-testid="trade-panel-futures">
      <MobileTradeView priceDisplay={priceDisplay} priceDir={priceDir} readOnly={readOnly} />
      <DesktopFuturesTerminal priceDisplay={priceDisplay} priceDir={priceDir} readOnly={readOnly} />
    </div>
  );
}

function DesktopFuturesTerminal({
  priceDisplay: priceDisplayProp,
  priceDir: priceDirProp,
  readOnly = false,
}: TradeFuturesPanelProps) {
  const priceDisplay = priceDisplayProp ?? BASE_PRICE_DISPLAY;
  const dir = priceDirProp ?? "flat";
  const [rulesOpen, setRulesOpen] = useState(false);

  const asks = SYNTHETIC_FUTURES_ASK_ROWS;
  const bids = SYNTHETIC_FUTURES_BID_ROWS;

  const tone = dir === "down" ? "text-(--color-down)" : "text-(--color-up)";

  return (
    <div className="mx-auto hidden max-w-[1600px] gap-3 p-3 md:p-4 lg:grid">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-(--color-surface) px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded bg-(--color-surface-elev) px-2 py-0.5 text-[11px] font-medium text-[#F7931A]">
            BTC
          </span>
          <span className="text-sm font-medium">BTC/USDT</span>
          <span className="text-[11px] text-muted-foreground">{t("trade.perp")}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
          <Star className="size-3.5 text-muted-foreground" />
        </div>
        <div className={tone}>
          <div
            key={priceDisplay}
            className="animate-fomo-tick text-base font-medium tabular-nums"
          >
            {priceDisplay}
          </div>
        </div>
        <Stat label={t("trade.change24")} value="+2.35%" tone="up" />
        <Stat label={t("trade.high24")} value="64,112.3" />
        <Stat label={t("trade.low24")} value="61,203.5" />
        <Stat label={t("trade.vol24")} value="12.3K BTC" />
        <Stat label={t("trade.funding")} value="0.0125%" tone="up" />
        <Stat label={t("trade.openInterest")} value="2.41B" />
        <div className="ml-auto flex items-center gap-2">
          <span
            data-testid="trade-futures-display-only-label"
            className="rounded-full bg-(--color-warn)/15 px-2 py-0.5 text-[10px] font-semibold text-(--color-warn)"
          >
            {t("trade.orderbook.displayOnly")}
          </span>
          <TradeRulesTrigger onClick={() => setRulesOpen(true)} />
        </div>
      </div>
      <TradeRulesSheet open={rulesOpen} onOpenChange={setRulesOpen} />

      <div className="grid gap-3 lg:grid-cols-[260px_1fr_320px]">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-xs">{t("trade.tab.orderbook")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-[11px]">
            <div className="grid grid-cols-2 gap-1 border-b border-border px-3 py-1 text-[10px] text-muted-foreground">
              <span>{t("trade.orderbook.price")}</span>
              <span className="text-right">{t("trade.orderbook.size")}</span>
            </div>
            <ul>
              {asks
                .slice()
                .reverse()
                .map((a, i) => (
                  <li
                    key={`a-${a.priceDisplay}`}
                    className="relative grid cursor-pointer grid-cols-2 gap-1 px-3 py-0.5 tabular-nums transition-colors hover:bg-(--color-down)/10"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 right-0 bg-(--color-down)/15"
                      style={{ width: `${Math.min(100, 18 + (asks.length - i) * 6)}%` }}
                    />
                    <span className="relative text-(--color-down)">{a.priceDisplay}</span>
                    <span className="relative text-right">{a.sizeDisplay}</span>
                  </li>
                ))}
            </ul>
            <div
              className={`border-y border-border px-3 py-2 text-center text-sm font-medium tabular-nums ${tone}`}
            >
              {priceDisplay}
            </div>
            <ul>
              {bids.map((b, i) => (
                <li
                  key={`b-${b.priceDisplay}`}
                  className="relative grid cursor-pointer grid-cols-2 gap-1 px-3 py-0.5 tabular-nums transition-colors hover:bg-(--color-up)/10"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 right-0 bg-(--color-up)/15"
                    style={{ width: `${Math.min(100, 18 + (bids.length - i) * 6)}%` }}
                  />
                  <span className="relative text-(--color-up)">{b.priceDisplay}</span>
                  <span className="relative text-right">{b.sizeDisplay}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-xs">{t("trade.tab.chart")}</CardTitle>
            <div className="flex gap-1 text-[10px] text-muted-foreground">
              {["1m", "5m", "15m", "1h", "4h", "1D"].map((tf) => (
                <button
                  key={tf}
                  type="button"
                  className="rounded px-2 py-0.5 hover:bg-(--color-surface-elev)"
                >
                  {tf}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <StaticCandleChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-xs">{t("trade.order.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-xs">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                className="rounded bg-(--color-up) px-3 py-2 font-semibold text-black"
              >
                {t("trade.order.long")}
              </button>
              <button
                type="button"
                className="rounded bg-(--color-down) px-3 py-2 font-semibold text-white"
              >
                {t("trade.order.short")}
              </button>
            </div>
            <div className="flex gap-1 text-[10px]">
              <button
                type="button"
                className="rounded bg-(--color-surface-elev) px-2 py-1"
              >
                {t("trade.order.market")}
              </button>
              <button
                type="button"
                className="rounded px-2 py-1 text-muted-foreground"
              >
                {t("trade.order.limit")}
              </button>
              <button
                type="button"
                className="rounded px-2 py-1 text-muted-foreground"
              >
                {t("trade.order.stop")}
              </button>
            </div>
            <Field label={t("trade.order.price")} value={priceDisplay} />
            <Field label={t("trade.order.size")} value="0.001 BTC" />
            <Field label={t("trade.order.leverage")} value="10x" />
            <div className="grid gap-1 rounded border border-border bg-(--color-surface) p-2 text-[11px] text-muted-foreground">
              <Row k={t("trade.order.avail")} v="—" />
              <Row k={t("trade.order.estFee")} v="—" />
              <Row k={t("trade.order.estLiq")} v="—" />
            </div>
            <button
              type="button"
              disabled={readOnly}
              className="flex min-h-12 items-center justify-center rounded-md bg-(--color-up) text-sm font-bold text-black hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {readOnly ? t("trade.loginRequired") : t("trade.order.submitLong")}
            </button>
            <button
              type="button"
              disabled={readOnly}
              className="flex min-h-12 items-center justify-center rounded-md bg-(--color-down) text-sm font-bold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {readOnly ? t("trade.loginRequired") : t("trade.order.submitShort")}
            </button>
            {readOnly ? (
              <p className="text-center text-[11px] text-muted-foreground">
                <Link to="/login" className="text-(--color-primary) underline-offset-2 hover:underline">
                  {t("shell.topbar.login")}
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <GateBanner kind="kyc" />

      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-xs">{t("trade.panel.positions")}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          {t("trade.empty.positions")}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className={`tabular-nums ${
          tone === "up" ? "text-(--color-up)" : tone === "down" ? "text-(--color-down)" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-(--color-surface) px-2 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="tabular-nums">{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}

function StaticCandleChart() {
  const candles = [
    [50, 56, 48, 54], [54, 58, 52, 53], [53, 55, 49, 50], [50, 52, 46, 47],
    [47, 51, 45, 50], [50, 54, 49, 53], [53, 57, 52, 56], [56, 60, 54, 58],
    [58, 62, 55, 56], [56, 59, 52, 53], [53, 55, 48, 49], [49, 53, 47, 52],
    [52, 56, 51, 55], [55, 59, 53, 57], [57, 61, 55, 60], [60, 64, 58, 62],
    [62, 65, 59, 60], [60, 62, 55, 56], [56, 58, 52, 53], [53, 57, 51, 55],
    [55, 59, 53, 58], [58, 62, 56, 60], [60, 63, 57, 58], [58, 60, 54, 55],
    [55, 58, 52, 56], [56, 60, 54, 59], [59, 63, 57, 61], [61, 64, 58, 59],
    [59, 61, 55, 56], [56, 60, 54, 58], [58, 62, 56, 61], [61, 65, 59, 63],
    [63, 67, 61, 65], [65, 68, 62, 63], [63, 66, 60, 64], [64, 68, 62, 66],
    [66, 70, 64, 68], [68, 71, 65, 66], [66, 68, 62, 63], [63, 67, 61, 65],
    [65, 69, 63, 67], [67, 71, 65, 70], [70, 74, 68, 72], [72, 75, 69, 70],
    [70, 72, 66, 67], [67, 71, 65, 69], [69, 73, 67, 71], [71, 75, 69, 73],
    [73, 76, 70, 71], [71, 73, 67, 68], [68, 72, 66, 70], [70, 74, 68, 72],
    [72, 76, 70, 74], [74, 77, 71, 72], [72, 74, 68, 69], [69, 73, 67, 71],
    [71, 75, 69, 73], [73, 77, 71, 75], [75, 78, 72, 73], [73, 75, 69, 70],
  ];
  const W = 800;
  const H = 320;
  const cw = W / candles.length;
  const all = candles.flat();
  const max = Math.max(...all);
  const min = Math.min(...all);
  const y = (v: number) => ((max - v) / (max - min)) * (H - 20) + 10;
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-2 select-none text-[10px] font-medium tracking-widest text-muted-foreground/40"
      >
        PHONARA
      </span>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[320px] w-full" preserveAspectRatio="none">
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
    </div>
  );
}
