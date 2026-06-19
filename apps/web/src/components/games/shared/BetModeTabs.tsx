/**
 * BetModeTabs — Manual / Auto Bet tab switch wrapper. P1.5-A LOCK.
 *
 * Settle truth: pass `bet` directly to AutoBetPanel — the hook keys settle on
 * `bet` reference inequality (handles WIN→WIN repeats correctly).
 *
 * A8 atomic lock: `autoActive` is driven by AutoBetPanel's `onActiveChange`
 * callback (synchronous with Start press), not derived from the first fire.
 */
import { useCallback, useState } from "react";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { AutoBetPanel, type AutoBetPanelProps } from "./AutoBetPanel";
import type { BetResult, Currency, RoundCommitment } from "./types";

export interface BetModeTabsProps {
  manual: React.ReactNode;
  baseStake: string;
  currency: Currency;
  commitment: RoundCommitment | null;
  busy: boolean;
  bet: BetResult | null;
  availableBalance?: string | null;
  onAutoFire: () => void | Promise<void>;
  autoChildren?: React.ReactNode;
  /** §0a typed per-game slot — forwarded to AutoBetPanel.slot. */
  autoSlot?: React.ReactNode;
  errorReason?: string | null;
  /** Pre-Start guard from caller (e.g. selection required). */
  startDisabledReason?: string | null;
  /** Optional per-caller auto-fire delay (ms) forwarded to AutoBetPanel. */
  autoFireDelayMs?: number;
  /** Optional countdown renderer forwarded to AutoBetPanel. */
  autoCountdownSlot?: AutoBetPanelProps["countdownSlot"];
}

export function BetModeTabs(p: BetModeTabsProps) {
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoActive, setAutoActive] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);

  const switchTo = useCallback(
    (next: "manual" | "auto") => {
      if (autoActive) return;
      setAutoError(null);
      setMode(next);
    },
    [autoActive],
  );

  const wrappedFire = useCallback(async () => {
    try {
      setAutoError(null);
      await p.onAutoFire();
    } catch (e) {
      const msg = e instanceof Error && e.message ? e.message : "auto-bet failed";
      setAutoError(msg);
      throw e;
    }
  }, [p]);

  return (
    <div className="grid gap-2">
      <div
        role="tablist"
        aria-label={t("casino.auto.tabAuto")}
        className="grid grid-cols-2 gap-1 rounded-lg bg-(--color-surface-elev) p-1"
        data-testid="casino-bet-mode-tabs"
      >
        <TabBtn
          active={mode === "manual"}
          locked={autoActive}
          onClick={() => switchTo("manual")}
          testid="casino-bet-mode-manual"
        >
          {t("casino.auto.tabManual")}
        </TabBtn>
        <TabBtn
          active={mode === "auto"}
          locked={autoActive}
          onClick={() => switchTo("auto")}
          testid="casino-bet-mode-auto"
        >
          {t("casino.auto.tabAuto")}
        </TabBtn>
      </div>

      {mode === "manual" ? (
        p.manual
      ) : (
        <AutoBetPanel
          baseStake={p.baseStake}
          currency={p.currency}
          bet={p.bet}
          busy={p.busy}
          availableBalance={p.availableBalance}
          onFire={wrappedFire}
          onActiveChange={setAutoActive}
          onStopped={() => setAutoActive(false)}
          errorReason={autoError || p.errorReason || null}
          startDisabledReason={p.startDisabledReason ?? null}
          fireDelayMs={p.autoFireDelayMs}
          countdownSlot={p.autoCountdownSlot}
          slot={p.autoSlot}
        >
          {p.autoChildren}
        </AutoBetPanel>
      )}
    </div>
  );
}

function TabBtn({
  active,
  locked,
  onClick,
  testid,
  children,
}: {
  active: boolean;
  locked: boolean;
  onClick: () => void;
  testid: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={locked && !active}
      data-testid={testid}
      className={cn(
        "min-h-9 rounded-md text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "bg-(--color-surface) text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
