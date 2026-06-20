import { t } from "@/i18n";

const MOCK_TRADES = [
  { price: "63,549.2", size: "0.042", time: "12:01:04", dir: "up" as const },
  { price: "63,548.8", size: "0.118", time: "12:01:02", dir: "down" as const },
  { price: "63,549.5", size: "0.205", time: "12:00:58", dir: "up" as const },
  { price: "63,547.1", size: "0.087", time: "12:00:55", dir: "down" as const },
  { price: "63,550.0", size: "0.312", time: "12:00:51", dir: "up" as const },
  { price: "63,546.4", size: "0.156", time: "12:00:48", dir: "down" as const },
];

export function RecentTradesPanel({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="trade-terminal__panel-header">{t("trade.tab.trades")}</div>
      <div className="grid grid-cols-3 gap-2 border-b border-border px-3 py-1 text-[10px] text-muted-foreground">
        <span>{t("trade.orderbook.price")}</span>
        <span className="text-right">{t("trade.orderbook.size")}</span>
        <span className="text-right">{t("trade.time")}</span>
      </div>
      <ul className="max-h-[280px] overflow-y-auto">
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
    </div>
  );
}
