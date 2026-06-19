import { AppShell } from "@/components/shell/AppShell";
import { TradeMarketsMirrorCard } from "./TradeMarketsMirrorCard";
import { OrderBookDepthPanel } from "./OrderBookDepthPanel";
import { TradeOrderTeaserCard } from "./TradeOrderTeaserCard";
import { TradePositionsTeaserCard } from "./TradePositionsTeaserCard";
import { TradeHistoryTeaserCard } from "./TradeHistoryTeaserCard";
import { TradeReferralTeaserCard } from "./TradeReferralTeaserCard";
import { TradeGamesTeaserCard } from "./TradeGamesTeaserCard";
import { TradeHubFooter } from "./TradeHubFooter";

/**
 * Phase 12-D v0.2 — Trade Hub sections (no AppShell — parent route owns shell).
 */
export function TradeHubContent() {
  return (
    <div className="grid gap-4 px-3 md:px-4" data-testid="trade-hub-content">
      <TradeMarketsMirrorCard />
      <OrderBookDepthPanel />
      <TradeOrderTeaserCard />
      <TradePositionsTeaserCard />
      <TradeHistoryTeaserCard />
      <TradeReferralTeaserCard />
      <TradeGamesTeaserCard />
      <TradeHubFooter />
    </div>
  );
}

/**
 * Phase 12-D v0.2 — Trade Hub standalone (tests / paste reference).
 */
export function TradeHub() {
  return (
    <AppShell density="trade">
      <TradeHubContent />
    </AppShell>
  );
}

