import { cn } from "@/lib/utils";
import { ExchangeLiveChart } from "@/features/trading/display-chart/exchange-live-chart";

export type ChartPanelProps = {
  marketSymbol: string | null;
  oraclePrice: string;
  oraclePriceRaw?: string;
  pricePrecision?: number;
  compact?: boolean;
  className?: string;
};

export function ChartPanel({
  marketSymbol,
  oraclePrice,
  oraclePriceRaw,
  pricePrecision = 2,
  compact = false,
  className,
}: ChartPanelProps) {
  return (
    <div className={cn("trade-terminal__panel flex h-full min-h-0 flex-col", className)}>
      <ExchangeLiveChart
        marketSymbol={marketSymbol}
        oraclePrice={oraclePrice}
        oraclePriceRaw={oraclePriceRaw}
        pricePrecision={pricePrecision}
        compact={compact}
        heightClass={compact ? "min-h-[min(52vw,320px)]" : "min-h-[360px]"}
        className="flex-1"
      />
    </div>
  );
}
