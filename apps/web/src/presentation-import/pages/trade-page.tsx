import { AppShell } from "@/components/shell/AppShell";
import type { PriceDir } from "../../features/trading/format-oracle-price-display";
import type { TradePageController } from "../../features/trading/use-trade-page-controller";
import { TradeModeShell } from "@/components/trade/TradeModeShell";
import { TradeEngineBody } from "../trading/trade-engine-body";

export type ImportedTradePageProps = {
  priceDisplay?: string;
  priceDir?: PriceDir;
  engine?: TradePageController;
};

/**
 * L1-17 — /trade host page.
 * Authenticated: engine panels (money path) + tab chrome. Guest: Lovable display-only.
 */
export function ImportedTradePage({
  priceDisplay,
  priceDir,
  engine,
}: ImportedTradePageProps = {}) {
  return (
    <AppShell density="trade" hideMobileNav>
      <TradeModeShell
        defaultMode="futures"
        priceDisplay={priceDisplay}
        priceDir={priceDir}
        engine={engine}
      />
      {engine ? <TradeEngineBody controller={engine} /> : null}
    </AppShell>
  );
}
