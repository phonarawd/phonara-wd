import { useEffect, useState } from "react";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import type { PriceDir } from "@/features/trading/format-oracle-price-display";
import type { TradePageController } from "@/features/trading/use-trade-page-controller";
import { TradeSpotPanel } from "./panels/TradeSpotPanel";
import { TradeFuturesPanel } from "./panels/TradeFuturesPanel";
import { TradeStakingPanel } from "./panels/TradeStakingPanel";

/**
 * L1-17 T17-1 — TradeModeShell
 * Segment: Spot · Futures · Staking. Default = futures. Panel swap only.
 * localStorage persist (`phonara-trade-mode-v1`); state-only fallback if
 * the browser API is unavailable (SSR, no `?mode=` query sync).
 */

export type TradeMode = "spot" | "futures" | "staking";

const STORAGE_KEY = "phonara-trade-mode-v1";

const MODES: { id: TradeMode; labelKey: string }[] = [
  { id: "spot", labelKey: "trade.mode.spot" },
  { id: "futures", labelKey: "trade.mode.futures" },
  { id: "staking", labelKey: "trade.mode.staking" },
];

export interface TradeModeShellProps {
  defaultMode?: TradeMode;
  priceDisplay?: string;
  priceDir?: PriceDir;
  /** When set, active tab renders engine-backed panels (money RPC path). */
  engine?: TradePageController;
}

function isMode(v: unknown): v is TradeMode {
  return v === "spot" || v === "futures" || v === "staking";
}

export function TradeModeShell({
  defaultMode = "futures",
  priceDisplay,
  priceDir,
  engine,
}: TradeModeShellProps) {
  const [mode, setMode] = useState<TradeMode>(defaultMode);

  // Hydrate from localStorage post-mount (SSR-safe).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isMode(stored)) setMode(stored);
    } catch {
      /* state-only fallback */
    }
  }, []);

  const select = (next: TradeMode) => {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return (
    <div data-testid="trade-mode-shell" className="grid gap-3">
      <div
        role="tablist"
        aria-label={t("trade.mode.aria")}
        className="sticky top-0 z-10 flex gap-1 border-b border-border bg-background/80 px-3 py-2 backdrop-blur md:top-14"
      >
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-active={active}
              data-testid={`trade-mode-${m.id}`}
              onClick={() => select(m.id)}
              className={cn(
                "min-h-12 min-w-20 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
                active
                  ? "bg-(--color-surface-elev) text-foreground"
                  : "text-muted-foreground hover:bg-(--color-surface)",
              )}
            >
              {t(m.labelKey)}
            </button>
          );
        })}
      </div>

      {mode === "spot" && !engine && <TradeSpotPanel readOnly />}
      {mode === "futures" && !engine && (
        <TradeFuturesPanel priceDisplay={priceDisplay} priceDir={priceDir} readOnly />
      )}
      {mode === "staking" && <TradeStakingPanel readOnly={!engine} />}
    </div>
  );
}
