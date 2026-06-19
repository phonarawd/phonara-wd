/**
 * HiLo · HUD — presence ghost strip + recent bets strip.
 *
 * Phase 5 v1 LOCK: adds `useMockGhost(5, 3500)` + `casino-presence-ghost`
 * (Crash/Plinko/Limbo/Mines 패턴 동일). non-money / optional testid.
 */
import { BetHistoryStrip } from "../shared/BetHistoryStrip";
import { useMockGhost } from "../shared/presence";
import type { ImportedGameSurfaceProps } from "../shared/types";

type Props = Pick<ImportedGameSurfaceProps<"hilo">, "recentBets">;

export function HUD(p: Props) {
  const ghosts = useMockGhost(5, 3500);
  return (
    <div className="grid gap-2">
      <div
        data-testid="casino-presence-ghost"
        className="flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-(--color-surface)/40 px-3 py-1.5 text-[11px]"
      >
        <span className="shrink-0 text-muted-foreground">LIVE</span>
        {ghosts.map((g) => (
          <span
            key={g.id}
            className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono tabular-nums ${
              g.win
                ? "bg-(--color-up)/15 text-(--color-up)"
                : "bg-(--color-down)/15 text-(--color-down)"
            }`}
          >
            {g.alias} {g.multiplier}×
          </span>
        ))}
      </div>
      <BetHistoryStrip bets={p.recentBets} />
    </div>
  );
}
