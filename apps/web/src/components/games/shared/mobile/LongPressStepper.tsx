import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

export interface LongPressStepperProps {
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  className?: string;
  label?: string;
}

/** +/- stepper with hold-to-repeat. Accelerates after 400ms. */
export function LongPressStepper({
  value,
  step = 1,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  onChange,
  className,
  label,
}: LongPressStepperProps) {
  const timerRef = useRef<number | null>(null);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  const start = useCallback(
    (dir: 1 | -1) => {
      let cur = clamp(value + dir * step);
      onChange(cur);
      let delay = 400;
      const tick = () => {
        cur = clamp(cur + dir * step);
        onChange(cur);
        delay = Math.max(40, delay - 40);
        timerRef.current = window.setTimeout(tick, delay);
      };
      timerRef.current = window.setTimeout(tick, delay);
    },
     
    [value, step, min, max, onChange],
  );

  const stop = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <div className={cn("inline-flex items-center gap-1", className)} aria-label={label}>
      <button
        type="button"
        onPointerDown={() => start(-1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        className="min-h-11 min-w-11 rounded-md border border-border bg-(--color-surface) text-base font-bold"
        aria-label="감소"
      >
        −
      </button>
      <span className="min-w-12 text-center font-mono tabular-nums">{value}</span>
      <button
        type="button"
        onPointerDown={() => start(1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        className="min-h-11 min-w-11 rounded-md border border-border bg-(--color-surface) text-base font-bold"
        aria-label="증가"
      >
        +
      </button>
    </div>
  );
}
