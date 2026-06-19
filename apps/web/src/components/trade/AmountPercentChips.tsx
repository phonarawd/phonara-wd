import { cn } from "@/lib/utils";

const PCTS = [25, 50, 75, 100] as const;

export interface AmountPercentChipsProps {
  /** Callback receives the percent as a string label ("25%"). UI state only. */
  onPick: (label: string) => void;
  active?: string;
  className?: string;
}

export function AmountPercentChips({ onPick, active, className }: AmountPercentChipsProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {PCTS.map((p) => {
        const label = `${p}%`;
        const isActive = active === label;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPick(label)}
            aria-pressed={isActive}
            className={cn(
              "min-h-12 rounded-lg border text-xs font-semibold tabular-nums transition-all",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
              isActive
                ? "border-transparent bg-(--color-primary) text-(--color-primary-foreground) shadow-[var(--shadow-glow-cta)]"
                : "border-border bg-(--color-surface) text-muted-foreground hover:border-(--color-primary)/40 hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
