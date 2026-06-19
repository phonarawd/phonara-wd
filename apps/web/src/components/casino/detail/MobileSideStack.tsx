/**
 * MobileSideStack — Stake-style vertical accordion below the game card.
 *
 * Each section is a native <details>, default collapsed, lazy-mounted with
 * IntersectionMount. No Sheet, no Tabs — content lives inline so the page
 * scrolls naturally (like Stake.com mobile).
 *
 * P1.7 · mobile-crush skin · zero framer-motion · zero new deps.
 */
import { lazy, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { IntersectionMount } from "./IntersectionMount";
import { type CasinoGameId } from "@/data/casino-game-meta";
import { t } from "@/i18n";

const LiveWinTheater = lazy(() =>
  import("./GameSidePanels").then((m) => ({ default: m.LiveWinTheater })),
);
const HotMultiplierStrip = lazy(() =>
  import("./GameSidePanels").then((m) => ({ default: m.HotMultiplierStrip })),
);
const TopWin24hCard = lazy(() =>
  import("./GameSidePanels").then((m) => ({ default: m.TopWin24hCard })),
);
const HowToPlayCard = lazy(() =>
  import("./GameSidePanels").then((m) => ({ default: m.HowToPlayCard })),
);
const FairnessCard = lazy(() =>
  import("./GameSidePanels").then((m) => ({ default: m.FairnessCard })),
);
const PairedRail = lazy(() =>
  import("./GameSidePanels").then((m) => ({ default: m.PairedGamesRail })),
);

type Props = { gameId: CasinoGameId };

export function MobileSideStack({ gameId }: Props) {
  return (
    <div className="grid gap-2">
      <Section title={t("casino.mobile.tab.live")}>
        <IntersectionMount minHeight={280} fallback={<Sk h={280} />}>
          <div className="grid gap-3">
            <LiveWinTheater gameId={gameId} />
            <HotMultiplierStrip gameId={gameId} />
          </div>
        </IntersectionMount>
      </Section>

      <Section title={t("casino.mobile.tab.top")}>
        <IntersectionMount minHeight={220} fallback={<Sk h={220} />}>
          <div className="grid gap-3">
            <TopWin24hCard gameId={gameId} />
            <PairedRail gameId={gameId} />
          </div>
        </IntersectionMount>
      </Section>

      <Section title={t("casino.mobile.tab.howto")}>
        <IntersectionMount minHeight={200} fallback={<Sk h={200} />}>
          <HowToPlayCard gameId={gameId} />
        </IntersectionMount>
      </Section>

      <Section title={t("casino.mobile.tab.fair")}>
        <IntersectionMount minHeight={160} fallback={<Sk h={160} />}>
          <FairnessCard />
        </IntersectionMount>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-skin-border bg-skin-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3 text-sm font-semibold text-skin-fg [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown
          aria-hidden
          className="size-4 text-skin-fg-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-skin-border p-3">{children}</div>
    </details>
  );
}

function Sk({ h }: { h: number }) {
  return (
    <div
      aria-hidden
      className="animate-pulse rounded-xl bg-skin-surface-2"
      style={{ height: h }}
    />
  );
}
