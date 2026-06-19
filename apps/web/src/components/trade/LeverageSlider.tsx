import { useRef } from "react";
import { cn } from "@/lib/utils";

const SNAPS = [1, 5, 10, 25, 50, 75, 100, 125] as const;

export interface LeverageSliderProps {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  className?: string;
}

/** Tries the Vibration API only on the client and only when present. */
function tap() {
  if (typeof navigator === "undefined") return;
  try {
    (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean })
      .vibrate?.(10);
  } catch {
    // ignore unsupported / blocked
  }
}

export function LeverageSlider({ value, onChange, max = 125, className }: LeverageSliderProps) {
  const snaps = SNAPS.filter((s) => s <= max);
  const lastValRef = useRef(value);
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const trackStyle: React.CSSProperties = {
    background: `linear-gradient(90deg, var(--color-primary) 0%, var(--color-warn) ${pct}%, var(--color-surface-elev) ${pct}%)`,
  };
  const handleChange = (n: number) => {
    if (n !== lastValRef.current) {
      lastValRef.current = n;
      tap();
    }
    onChange(n);
  };
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">레버리지</span>
        <span className="rounded-md bg-(--color-surface-elev) px-2 py-1 text-xs font-medium tabular-nums">
          {value}x
        </span>
      </div>
      <div className="relative h-12 w-full">
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
          style={trackStyle}
          aria-hidden
        />
        <input
          type="range"
          min={1}
          max={max}
          step={1}
          value={value}
          onChange={(e) => handleChange(Number(e.target.value))}
          aria-label="레버리지"
          className="relative z-10 h-12 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-runnable-track]:h-1.5
            [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-webkit-slider-thumb]:relative
            [&::-webkit-slider-thumb]:-mt-3
            [&::-webkit-slider-thumb]:h-7
            [&::-webkit-slider-thumb]:w-7
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-(--color-warn)
            [&::-webkit-slider-thumb]:bg-background
            [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgb(245_166_35/0.18)]
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
        />
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {snaps.map((s) => {
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => handleChange(s)}
              aria-pressed={active}
              className={cn(
                "min-h-10 rounded-md border text-[11px] font-medium tabular-nums transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
                active
                  ? "border-(--color-warn)/60 bg-(--color-warn)/15 text-(--color-warn)"
                  : "border-border bg-(--color-surface) text-muted-foreground hover:text-foreground",
              )}
            >
              {s}x
            </button>
          );
        })}
      </div>
    </div>
  );
}
