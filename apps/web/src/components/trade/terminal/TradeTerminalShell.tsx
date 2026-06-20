import type { TradeMode } from "@/components/trade/TradeModeShell";
import type { TradePageController } from "@/features/trading/use-trade-page-controller";
import type { PriceDir } from "@/features/trading/format-oracle-price-display";
import { FuturesTerminal } from "./futures/FuturesTerminal";
import { SpotTerminal } from "./spot/SpotTerminal";
import { StakingDiscoverGrid } from "./staking/StakingDiscoverGrid";
import { TradeFuturesDisplayFallback } from "./TradeFuturesDisplayFallback";
import { TradeSpotDisplayFallback } from "./TradeSpotDisplayFallback";

export type TradeTerminalShellProps = {
  mode: TradeMode;
  engine?: TradePageController;
  priceDisplay?: string;
  priceDir?: PriceDir;
  readOnly?: boolean;
};

export function TradeTerminalShell({
  mode,
  engine,
  priceDisplay,
  priceDir,
  readOnly = false,
}: TradeTerminalShellProps) {
  if (mode === "futures") {
    if (engine) return <FuturesTerminal engine={engine} />;
    return (
      <TradeFuturesDisplayFallback priceDisplay={priceDisplay} priceDir={priceDir} readOnly={readOnly} />
    );
  }
  if (mode === "spot") {
    if (engine) return <SpotTerminal engine={engine} />;
    return <TradeSpotDisplayFallback readOnly={readOnly} />;
  }
  return <StakingDiscoverGrid readOnly={readOnly || !engine} />;
}
