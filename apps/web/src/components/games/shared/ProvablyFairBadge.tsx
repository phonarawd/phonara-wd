/**
 * ProvablyFairBadge — compact status pill that shows the round
 * commitment prefix and opens the FairnessSheet on click.
 *
 * Phase 2 ship as a thin trigger; games may keep their existing
 * FairnessSheet mount (e.g. Crash Stage corner) and use this badge
 * alternatively in HUDs.
 */
import { ShieldCheck } from "lucide-react";
import type { RoundCommitment } from "./types";

export interface ProvablyFairBadgeProps {
  commitment: RoundCommitment | null;
  onClick?: () => void;
  className?: string;
}

export function ProvablyFairBadge({
  commitment,
  onClick,
  className,
}: ProvablyFairBadgeProps) {
  const prefix = commitment?.server_seed_hash?.slice(0, 8) ?? "—";
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="casino-provably-fair-badge"
      aria-label="결과 검증"
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-(--color-surface)/60 px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
      }
    >
      <ShieldCheck className="size-3 text-(--color-primary)" />
      <span className="tabular-nums">{prefix}</span>
    </button>
  );
}
