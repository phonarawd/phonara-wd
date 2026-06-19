import { cn } from "@/lib/utils";
import { CountdownTimer } from "./CountdownTimer";
import { SlotMeter } from "./SlotMeter";
import { t } from "@/i18n";

export interface LimitedDropCardProps {
  title: string;
  subtitle?: string;
  endsAt: number;
  filled: number;
  total: number;
  className?: string;
  action?: React.ReactNode;
}

export function LimitedDropCard({
  title,
  subtitle,
  endsAt,
  filled,
  total,
  action,
  className,
}: LimitedDropCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-(--color-gold)/30 bg-gradient-to-br from-(--color-surface-elev) to-(--color-surface) p-4",
        className,
      )}
    >
      <div className="absolute right-3 top-3 text-[10px] font-medium tracking-wider text-(--color-gold)">
        LIMITED
      </div>
      <div className="mb-3">
        <div className="text-base font-medium">{title}</div>
        {subtitle && (
          <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
      <SlotMeter filled={filled} total={total} className="mb-3" />
      <div className="flex items-end justify-between gap-3">
        <CountdownTimer endsAt={endsAt} label={t("fomo.limited.endsLabel")} />
        {action}
      </div>
    </div>
  );
}
