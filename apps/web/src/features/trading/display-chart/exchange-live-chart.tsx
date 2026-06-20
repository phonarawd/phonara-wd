import { lazy, Suspense, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { formatOraclePriceDisplay } from "@/features/trading/format-oracle-price-display";
import {
  useExchangeLiveCandles,
  type DisplayKlineInterval,
} from "@/features/trading/display-chart";

const LazyTradingChart = lazy(() => import("@/components/trading-chart-loader"));

const INTERVALS: { id: DisplayKlineInterval; label: string }[] = [
  { id: "1m", label: "1m" },
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1h", label: "1h" },
  { id: "4h", label: "4h" },
  { id: "1d", label: "1D" },
];

function chartOraclePrice(display: string, raw?: string): string {
  if (raw && raw !== "0") return raw;
  return display.replace(/,/g, "").trim();
}

export type ExchangeLiveChartProps = {
  /** Platform oracle symbol (e.g. BTCUSDT-SIM, BTC_USDT). */
  marketSymbol: string | null;
  /** Formatted oracle mark for header labels. */
  oraclePrice: string;
  /** Raw oracle price for chart price line (no commas). */
  oraclePriceRaw?: string;
  pricePrecision?: number;
  heightClass?: string;
  compact?: boolean;
  className?: string;
};

export function ExchangeLiveChart({
  marketSymbol,
  oraclePrice,
  oraclePriceRaw,
  pricePrecision = 2,
  heightClass = "min-h-[320px]",
  compact = false,
  className,
}: ExchangeLiveChartProps) {
  const [interval, setInterval] = useState<DisplayKlineInterval>("1m");
  const { candles, connected, loading, error, refetch, lastPrice } = useExchangeLiveCandles(
    marketSymbol,
    interval,
  );

  const livePriceDisplay = useMemo(() => {
    if (lastPrice) return formatOraclePriceDisplay(lastPrice, "—");
    const tail = candles[candles.length - 1];
    return tail ? formatOraclePriceDisplay(tail.close, "—") : "—";
  }, [candles, lastPrice]);

  const labels = useMemo(
    () => ({
      loading: t("trade.chart.loading"),
      emptyTitle: t("trade.chart.emptyTitle"),
      emptyDescription: t("trade.chart.emptyDescription"),
      errorTitle: t("trade.chart.errorTitle"),
      errorDescription: t("trade.chart.errorDescription"),
      retry: t("common.retry"),
      oraclePrice: t("trade.markPrice"),
      liquidationPrice: t("trade.liquidationPrice"),
      policyTitle: t("trade.chart.policyTitle"),
      oracleLineDescription: t("trade.chart.oracleLineDescription"),
      disclosureTitle: t("trade.chart.disclosureTitle"),
      syncedTitle: connected ? t("trade.chart.syncedTitle") : t("trade.chart.loading"),
      volume: t("trade.chart.volume"),
    }),
    [connected],
  );

  const disclosure = `${t("trade.chart.displayFeedDisclosure")} ${t("trade.chart.oracleLineDescription")}`;

  return (
    <div
      className={cn("relative grid gap-0", className)}
      data-display-only="true"
      data-testid="exchange-live-chart"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 trade-terminal__chart-overlay">
        <div className="flex gap-1 text-[10px] text-muted-foreground">
          {INTERVALS.map((tf) => (
            <button
              key={tf.id}
              type="button"
              data-active={interval === tf.id}
              onClick={() => setInterval(tf.id)}
              className={cn(
                "rounded px-2 py-0.5 transition-colors hover:bg-(--color-surface-elev)",
                interval === tf.id && "bg-(--color-surface-elev) text-foreground",
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-end gap-0.5 text-[10px] tabular-nums text-muted-foreground">
          <span>
            {t("trade.chart.livePrice")}: {livePriceDisplay}
          </span>
          <span>
            {t("trade.oracleSettlementPrice")}: {oraclePrice}
          </span>
        </div>
      </div>

      <Suspense
        fallback={
          <div className={cn("flex items-center justify-center text-xs text-muted-foreground", heightClass)}>
            {t("trade.chart.loading")}
          </div>
        }
      >
        <LazyTradingChart
          title=" "
          subtitle={compact ? undefined : marketSymbol ?? undefined}
          labels={labels}
          candles={candles}
          oraclePrice={chartOraclePrice(oraclePrice, oraclePriceRaw)}
          loading={loading}
          error={error}
          onRetry={() => void refetch()}
          pricePrecision={pricePrecision}
          disclosure={disclosure}
          className={cn(
            "!min-h-0 border-0 bg-transparent p-0 shadow-none",
            compact ? "!gap-1" : "!gap-2",
            heightClass,
            "[&_[data-testid=trading-chart-success]]:min-h-[240px]",
            compact && "[&_[data-testid=trading-chart-success]]:min-h-[200px]",
            "[&>div:first-child]:hidden",
            "[&_.rounded-2xl.border-border.bg-surface-inset]:hidden",
          )}
        />
      </Suspense>
    </div>
  );
}
