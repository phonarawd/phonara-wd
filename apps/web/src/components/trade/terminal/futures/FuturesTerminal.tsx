import type { TradePageController } from "@/features/trading/use-trade-page-controller";
import { useFuturesTerminalWire } from "../useFuturesTerminalWire";
import { FuturesDesktopGrid } from "./FuturesDesktopGrid";
import { FuturesMobileTerminal } from "./FuturesMobileTerminal";
import { FuturesConfirmDialog } from "./FuturesOrderTicket";

export function FuturesTerminal({ engine }: { engine: TradePageController }) {
  const wire = useFuturesTerminalWire(engine);

  return (
    <div data-testid="trade-panel-futures" className="trade-terminal mx-auto w-full max-w-[1600px]">
      <FuturesMobileTerminal wire={wire} />
      <FuturesDesktopGrid wire={wire} />
      <FuturesConfirmDialog wire={wire} />
    </div>
  );
}
