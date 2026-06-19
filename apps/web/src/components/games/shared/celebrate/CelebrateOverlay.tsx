import { type CelebrationTier } from "./tier";
import { cn } from "@/lib/utils";

export interface CelebrateOverlayProps {
  tier: CelebrationTier;
  multiplier: string;
  reduced?: boolean;
}

const RING: Record<CelebrationTier, string> = {
  none: "",
  small: "ring-1 ring-(--color-up)/40",
  nice: "ring-2 ring-(--color-up)/60",
  big: "ring-2 ring-(--color-primary)/70",
  huge: "ring-4 ring-(--color-primary)",
  mega: "ring-4 ring-(--color-primary) shadow-[0_0_60px] shadow-(--color-primary)/60",
  ultra: "ring-4 ring-(--color-primary) shadow-[0_0_120px] shadow-(--color-primary)/80",
};

export function CelebrateOverlay({ tier, multiplier, reduced }: CelebrateOverlayProps) {
  if (tier === "none") return null;
  return (
    <div
      data-testid="casino-celebrate-overlay"
      data-tier={tier}
      className={cn(
        "pointer-events-none absolute inset-0 grid place-items-center rounded-2xl",
        RING[tier],
        !reduced && "animate-in fade-in zoom-in-95 duration-300",
      )}
    >
      <span className="rounded-md bg-(--color-surface)/80 px-3 py-1 font-mono text-xl font-bold tabular-nums">
        {multiplier}×
      </span>
    </div>
  );
}
