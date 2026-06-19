/**
 * Plinko · Controls (shared impl) — P2.5 v0.4 REFACTOR (Crash/Dice/Limbo/Mines parity).
 *
 * Named exports compose into Controls.mobile / Controls.desktop.
 * Legacy `PlinkoControlsShared` retained (now composes the new parts).
 *
 * INVARIANTS:
 *  - Instant-settle game → no fireDelayMs override (default 320ms).
 *  - BetPanel/BetModeTabs FROZEN → markers ride wrapper containers.
 *  - i18n keys for primary/secondary labels + rows/risk selectors.
 *  - selection schema unchanged: { rows, risk }.
 */
import type { ReactNode } from "react";
import { Triangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { BetPanel } from "../shared/BetPanel";
import { BetModeTabs } from "../shared/BetModeTabs";
import { useRGGate } from "../shared/RGGateProvider";
import type { ImportedGameSurfaceProps, PlinkoSelection } from "../shared/types";

export type PlinkoControlsProps = ImportedGameSurfaceProps<"plinko">;

const ROWS_OPTIONS: PlinkoSelection["rows"][] = [8, 12, 16];
const RISKS: PlinkoSelection["risk"][] = ["low", "medium", "high"];

/** Primary/auto handlers + ready flag — single source of truth. */
export function usePlinkoOnPrimary(p: PlinkoControlsProps) {
  const ready = Boolean(p.commitment);
  const rg = useRGGate();

  const onPrimary = ready
    ? async () => {
        const ok = await rg.gate("place_bet");
        if (!ok) return;
        p.onOpenBetConfirm();
      }
    : p.onPrepareRound;

  const onAutoFire = async () => {
    if (!p.commitment) await p.onPrepareRound();
    if (!p.commitment) return;
    p.onOpenBetConfirm();
    await p.onSubmitBet();
  };

  return { onPrimary, onAutoFire, ready };
}

/** Rows + risk selectors — owns plinko-rows-selector + plinko-risk-selector markers. */
export function PlinkoSelectionUI({ p }: { p: PlinkoControlsProps }) {
  const sel = p.selection;
  return (
    <div className="grid gap-2">
      <div data-game-id="plinko-rows-selector">
        <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          {t("games.plinko.rows")}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {ROWS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => p.onSelectionChange({ ...sel, rows: r })}
              className={cn(
                "min-h-9 rounded-md border text-xs font-semibold tabular-nums",
                sel.rows === r
                  ? "border-(--color-primary) bg-(--color-primary)/15 text-(--color-primary)"
                  : "border-border bg-(--color-surface) text-muted-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div data-game-id="plinko-risk-selector">
        <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Triangle className="size-3" /> {t("games.plinko.risk")}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {RISKS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => p.onSelectionChange({ ...sel, risk: r })}
              className={cn(
                "min-h-9 rounded-md border text-xs font-semibold capitalize",
                sel.risk === r
                  ? "border-(--color-primary) bg-(--color-primary)/15 text-(--color-primary)"
                  : "border-border bg-(--color-surface) text-muted-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** BetPanel wrapper — owns plinko-cta + plinko-chip-row + plinko-hash-btn markers. */
export function PlinkoBetPanelInner({
  p,
  primarySize = "xl",
  children,
}: {
  p: PlinkoControlsProps;
  primarySize?: "default" | "xl";
  children?: ReactNode;
}) {
  const { onPrimary, ready } = usePlinkoOnPrimary(p);
  return (
    <div data-game-id="plinko-cta">
      <span hidden data-game-id="plinko-hash-btn" />
      <div data-game-id="plinko-chip-row">
        <BetPanel
          stake={p.stake}
          currency={p.currency}
          availableBalance={p.availableBalance}
          busy={p.busy}
          ready={ready}
          primarySize={primarySize}
          primaryLabel={ready ? t("games.plinko.drop") : t("games.plinko.prepare")}
          secondaryLabel={t("games.plinko.hashCommit")}
          onStakeChange={p.onStakeChange}
          onCurrencyChange={p.onCurrencyChange}
          onPrimary={onPrimary}
          onSecondary={p.onPrepareRound}
        >
          {children}
        </BetPanel>
      </div>
    </div>
  );
}

/** Legacy composed wrapper — kept for existing test/import paths. */
export function PlinkoControlsShared(p: PlinkoControlsProps) {
  const { onAutoFire } = usePlinkoOnPrimary(p);
  const manual = (
    <PlinkoBetPanelInner p={p} primarySize="default">
      <PlinkoSelectionUI p={p} />
    </PlinkoBetPanelInner>
  );
  return (
    <BetModeTabs
      manual={manual}
      baseStake={p.stake}
      currency={p.currency}
      commitment={p.commitment}
      busy={p.busy}
      bet={p.bet}
      onAutoFire={onAutoFire}
    />
  );
}
