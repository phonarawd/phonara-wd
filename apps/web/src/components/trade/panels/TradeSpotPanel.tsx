import { useState } from "react";
import { Link } from "@/shims/react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";

/**
 * L1-17 T17-2 — TradeSpotPanel
 * Display-only spot mock when readOnly. Engine path uses SpotPanel via TradeModeShell.
 */

type Side = "buy" | "sell";
type OrderType = "market" | "limit";

export function TradeSpotPanel({ readOnly = false }: { readOnly?: boolean }) {
  const [side, setSide] = useState<Side>("buy");
  const [type, setType] = useState<OrderType>("limit");
  const [price, setPrice] = useState("1.0000");
  const [amount, setAmount] = useState("");

  return (
    <div data-testid="trade-panel-spot" className="mx-auto grid w-full max-w-[1600px] gap-3 p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-(--color-surface) px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded bg-(--color-surface-elev) px-2 py-0.5 text-[11px] font-medium text-(--color-primary)">
            PHON
          </span>
          <span className="text-sm font-medium">PHON/USDT</span>
          <span className="text-[11px] text-muted-foreground">{t("trade.spot.pairLabel")}</span>
        </div>
        <Stat label={t("trade.change24")} value="+0.45%" tone="up" />
        <Stat label={t("trade.high24")} value="1.0420" />
        <Stat label={t("trade.low24")} value="0.9810" />
        <Stat label={t("trade.vol24")} value="3.4M PHON" />
        <span
          data-testid="trade-spot-display-only-label"
          className="ml-auto rounded-full bg-(--color-warn)/15 px-2 py-0.5 text-[10px] font-semibold text-(--color-warn)"
        >
          {t("trade.orderbook.displayOnly")}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-xs">{t("trade.spot.recentTrades")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-[11px]">
            <ul>
              {MOCK_TRADES.map((tr, i) => (
                <li
                  key={i}
                  className="grid grid-cols-3 gap-2 border-b border-border/40 px-3 py-1 tabular-nums last:border-b-0"
                >
                  <span className={tr.dir === "up" ? "text-(--color-up)" : "text-(--color-down)"}>
                    {tr.price}
                  </span>
                  <span className="text-right">{tr.size}</span>
                  <span className="text-right text-muted-foreground">{tr.time}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-xs">{t("trade.spot.orderTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-xs">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setSide("buy")}
                data-active={side === "buy"}
                className="min-h-11 rounded px-3 py-2 font-semibold data-[active=true]:bg-(--color-up) data-[active=true]:text-black"
              >
                {t("trade.spot.buy")}
              </button>
              <button
                type="button"
                onClick={() => setSide("sell")}
                data-active={side === "sell"}
                className="min-h-11 rounded px-3 py-2 font-semibold data-[active=true]:bg-(--color-down) data-[active=true]:text-white"
              >
                {t("trade.spot.sell")}
              </button>
            </div>

            <div className="flex gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setType("limit")}
                data-active={type === "limit"}
                className="rounded px-2 py-1 data-[active=true]:bg-(--color-surface-elev) data-[active=true]:text-foreground"
              >
                {t("trade.order.limit")}
              </button>
              <button
                type="button"
                onClick={() => setType("market")}
                data-active={type === "market"}
                className="rounded px-2 py-1 data-[active=true]:bg-(--color-surface-elev) data-[active=true]:text-foreground"
              >
                {t("trade.order.market")}
              </button>
            </div>

            {type === "limit" && (
              <label className="grid gap-1">
                <span className="text-[10px] text-muted-foreground">{t("trade.order.price")}</span>
                <input
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-10 rounded border border-border bg-(--color-surface) px-2 tabular-nums focus:outline-2 focus:outline-(--color-primary)"
                />
              </label>
            )}

            <label className="grid gap-1">
              <span className="text-[10px] text-muted-foreground">{t("trade.order.size")}</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 rounded border border-border bg-(--color-surface) px-2 tabular-nums focus:outline-2 focus:outline-(--color-primary)"
              />
            </label>

            <div className="grid gap-1 rounded border border-border bg-(--color-surface) p-2 text-[11px] text-muted-foreground">
              <Row k={t("trade.order.avail")} v="—" />
              <Row k={t("trade.order.estFee")} v="—" />
            </div>

            <button
              type="button"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
              }}
              data-testid="trade-spot-submit"
              className={`flex min-h-12 items-center justify-center rounded-md text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) disabled:cursor-not-allowed disabled:opacity-60 ${
                side === "buy"
                  ? "bg-(--color-up) text-black hover:opacity-90"
                  : "bg-(--color-down) text-white hover:opacity-90"
              }`}
            >
              {readOnly ? t("trade.loginRequired") : side === "buy" ? t("trade.spot.submitBuy") : t("trade.spot.submitSell")}
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}

const MOCK_TRADES = [
  { price: "1.0021", size: "812.4", time: "12:04:18", dir: "up" as const },
  { price: "1.0019", size: "204.0", time: "12:04:14", dir: "down" as const },
  { price: "1.0022", size: "1,140.2", time: "12:04:09", dir: "up" as const },
  { price: "1.0018", size: "350.0", time: "12:04:01", dir: "down" as const },
  { price: "1.0020", size: "97.5", time: "12:03:56", dir: "up" as const },
  { price: "1.0017", size: "640.0", time: "12:03:50", dir: "down" as const },
  { price: "1.0019", size: "228.9", time: "12:03:44", dir: "up" as const },
  { price: "1.0016", size: "1,005.3", time: "12:03:38", dir: "down" as const },
];
