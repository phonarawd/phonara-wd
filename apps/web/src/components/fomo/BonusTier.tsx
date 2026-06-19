import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export interface BonusTier {
  from: number;
  to: number;
  bonusP: number;
  label?: string;
}

export interface BonusTierTableProps {
  tiers: BonusTier[];
  /** 1-based current signup rank slot. -1 if unknown. */
  currentSlot?: number;
  className?: string;
}

export function BonusTierTable({
  tiers,
  currentSlot = -1,
  className,
}: BonusTierTableProps) {
  return (
    <ul
      className={cn("grid gap-2", className)}
      aria-label={t("fomo.tier.aria.list")}
    >
      {tiers.map((tier) => {
        const active =
          currentSlot >= tier.from && currentSlot <= tier.to;
        return (
          <li
            key={`${tier.from}-${tier.to}`}
            className={cn(
              "flex items-center justify-between rounded-lg border px-4 py-3 transition-colors",
              active
                ? "border-(--color-primary) bg-(--color-primary)/10"
                : "border-border bg-(--color-surface)",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  active
                    ? "bg-(--color-primary) text-(--color-primary-foreground)"
                    : "bg-(--color-surface-elev) text-muted-foreground",
                )}
              >
                {t("fomo.tier.rank", { from: tier.from.toLocaleString(), to: tier.to.toLocaleString() })}
              </span>
              {tier.label && (
                <span className="text-xs text-muted-foreground">
                  {tier.label}
                </span>
              )}
            </div>
            <span className="font-medium text-(--color-gold)">
              +{tier.bonusP.toLocaleString()}P
            </span>
          </li>
        );
      })}
    </ul>
  );
}
