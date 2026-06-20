import type { TradePageController } from "@/features/trading/use-trade-page-controller";
import { SpotTerminal } from "@/components/trade/terminal/spot/SpotTerminal";
import { TradeSpotDisplayFallback } from "@/components/trade/terminal/TradeSpotDisplayFallback";

export function TradeSpotPanel({
  readOnly = false,
  engine,
}: {
  readOnly?: boolean;
  engine?: TradePageController;
}) {
  if (engine) return <SpotTerminal engine={engine} />;
  return <TradeSpotDisplayFallback readOnly={readOnly} />;
}
