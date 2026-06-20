import type { TradePageController } from "@/features/trading/use-trade-page-controller";
import type { PriceDir } from "@/features/trading/format-oracle-price-display";
import { FuturesTerminal } from "@/components/trade/terminal/futures/FuturesTerminal";
import { TradeFuturesDisplayFallback } from "@/components/trade/terminal/TradeFuturesDisplayFallback";

export type TradeFuturesPanelProps = {
  priceDisplay?: string;
  priceDir?: PriceDir;
  readOnly?: boolean;
  baseLabel?: string;
  pairLabel?: string;
  engine?: TradePageController;
};

export function TradeFuturesPanel({
  priceDisplay,
  priceDir,
  readOnly = false,
  engine,
}: TradeFuturesPanelProps = {}) {
  if (engine) return <FuturesTerminal engine={engine} />;
  return (
    <TradeFuturesDisplayFallback
      priceDisplay={priceDisplay}
      priceDir={priceDir}
      readOnly={readOnly}
    />
  );
}
