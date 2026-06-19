import { Info } from "lucide-react";
import { t } from "@/i18n";

/**
 * 12-D v0.2 — OrderBookDepthPanel
 * Binance/Bybit-grade display-only synthetic order book.
 * Mock arrays · no live matching · no engine call · display label required (F3).
 */

const PAIR = "BTC/USDT";
const MID = 68_412.5;

type Row = { price: number; size: number };

function buildSide(side: "ask" | "bid"): Row[] {
  const dir = side === "ask" ? 1 : -1;
  const rows: Row[] = [];
  for (let i = 1; i <= 10; i++) {
    const price = MID + dir * (i * 1.5 + (i * i) * 0.1);
    const size = 0.18 + ((i * 37) % 23) / 30 + (side === "ask" ? 0.05 : 0);
    rows.push({ price, size: Math.round(size * 10_000) / 10_000 });
  }
  return rows;
}

const ASKS = buildSide("ask").reverse(); // high → low (top)
const BIDS = buildSide("bid"); // high → low (bottom)
const MAX_SIZE = Math.max(...ASKS.concat(BIDS).map((r) => r.size));
const BEST_ASK = ASKS[ASKS.length - 1]?.price ?? MID;
const BEST_BID = BIDS[0]?.price ?? MID;
const SPREAD = BEST_ASK - BEST_BID;
const SPREAD_BPS = (SPREAD / MID) * 10_000;

function fmtPrice(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function fmtSize(n: number) {
  return n.toFixed(4);
}

function DepthRow({
  row,
  side,
  cumulative,
}: {
  row: Row;
  side: "ask" | "bid";
  cumulative: number;
}) {
  const pct = Math.min(100, (row.size / MAX_SIZE) * 100);
  const barTone = side === "ask" ? "bg-rose-500/15" : "bg-emerald-500/15";
  const priceTone = side === "ask" ? "text-rose-400" : "text-emerald-400";
  return (
    <tr
      data-testid="trade-orderbook-row"
      className="relative h-6 border-b border-border/20 last:border-b-0"
    >
      <td className="relative px-2 text-left">
        <span
          aria-hidden
          className={`absolute inset-y-0 right-0 ${barTone}`}
          style={{ width: `${pct}%` }}
        />
        <span
          className={`relative z-10 font-mono text-xs font-semibold tabular-nums ${priceTone}`}
        >
          {fmtPrice(row.price)}
        </span>
      </td>
      <td className="relative z-10 px-2 text-right font-mono text-xs tabular-nums">
        {fmtSize(row.size)}
      </td>
      <td className="relative z-10 px-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {fmtSize(cumulative)}
      </td>
    </tr>
  );
}

export function OrderBookDepthPanel() {
  const askCum: number[] = [];
  let askAcc = 0;
  for (let i = ASKS.length - 1; i >= 0; i--) {
    askAcc += ASKS[i]?.size ?? 0;
    askCum[i] = askAcc;
  }
  const bidCum: number[] = [];
  let bidAcc = 0;
  BIDS.forEach((b, i) => {
    bidAcc += b.size;
    bidCum[i] = bidAcc;
  });

  return (
    <section
      data-testid="trade-orderbook-depth"
      aria-label={t("trade.orderbook.title")}
      className="grid gap-2 rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur"
    >
      <div
        data-testid="trade-orderbook-display-only-label"
        className="inline-flex items-center gap-1.5 self-start rounded-full bg-(--color-warn)/15 px-2.5 py-1 text-[11px] font-semibold text-(--color-warn)"
      >
        <Info className="size-3.5" aria-hidden />
        {t("trade.orderbook.displayOnly")}
      </div>

      <header className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">{t("trade.orderbook.title")}</h2>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {PAIR}
          </span>
        </div>
        <div className="grid justify-items-end gap-0.5">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {t("trade.orderbook.spread")}
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums">
            {fmtPrice(SPREAD)}{" "}
            <span className="text-[10px] text-muted-foreground">
              ({SPREAD_BPS.toFixed(1)} bps)
            </span>
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="grid gap-1">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-rose-400">
            {t("trade.orderbook.asks")}
          </div>
          <table className="w-full border-collapse">
            <thead className="sticky top-0">
              <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-1 text-left font-medium">
                  {t("trade.orderbook.price")}
                </th>
                <th className="px-2 py-1 text-right font-medium">
                  {t("trade.orderbook.size")}
                </th>
                <th className="px-2 py-1 text-right font-medium">
                  {t("trade.orderbook.total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {ASKS.map((row, i) => (
                <DepthRow
                  key={`a-${i}`}
                  row={row}
                  side="ask"
                  cumulative={askCum[i] ?? 0}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-1">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
            {t("trade.orderbook.bids")}
          </div>
          <table className="w-full border-collapse">
            <thead className="sticky top-0">
              <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-1 text-left font-medium">
                  {t("trade.orderbook.price")}
                </th>
                <th className="px-2 py-1 text-right font-medium">
                  {t("trade.orderbook.size")}
                </th>
                <th className="px-2 py-1 text-right font-medium">
                  {t("trade.orderbook.total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {BIDS.map((row, i) => (
                <DepthRow
                  key={`b-${i}`}
                  row={row}
                  side="bid"
                  cumulative={bidCum[i] ?? 0}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>
          {t("trade.orderbook.spread")}{" "}
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {fmtPrice(SPREAD)}
          </span>
        </span>
        <span aria-hidden>·</span>
        <span className="font-mono tabular-nums">
          mid {fmtPrice(MID)}
        </span>
      </div>
    </section>
  );
}
