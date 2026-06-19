import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export interface SlotMeterProps {
  /** Slots already filled. */
  filled: number;
  /** Total slots available. */
  total: number;
  label?: string;
  className?: string;
}

export function SlotMeter({ filled, total, label, className }: SlotMeterProps) {
  const left = Math.max(0, total - filled);
  const pct = Math.min(100, Math.max(0, (filled / total) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">
          {label ?? t("landing.hero.slotLabel")}
        </span>
        <span>
          <span className="font-medium text-(--color-primary)">
            {left.toLocaleString()}
          </span>
          <span className="text-muted-foreground"> / {total.toLocaleString()}</span>
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-(--color-surface-elev)">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-(--color-primary) to-(--color-gold)"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={filled}
        />
      </div>
    </div>
  );
}
