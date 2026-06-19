import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

const styles: Record<Tier, string> = {
  bronze: "bg-amber-900/30 text-amber-300 border-amber-700/40",
  silver: "bg-zinc-500/20 text-zinc-200 border-zinc-400/30",
  gold: "bg-(--color-gold)/15 text-(--color-gold) border-(--color-gold)/40",
  platinum: "bg-cyan-500/15 text-cyan-200 border-cyan-400/40",
  diamond: "bg-(--color-primary)/15 text-(--color-primary) border-(--color-primary)/40",
};

const TIER_KEY: Record<Tier, `tier.${Tier}`> = {
  bronze: "tier.bronze",
  silver: "tier.silver",
  gold: "tier.gold",
  platinum: "tier.platinum",
  diamond: "tier.diamond",
};

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wider",
        styles[tier],
        className,
      )}
    >
      {t(TIER_KEY[tier])}
    </span>
  );
}
