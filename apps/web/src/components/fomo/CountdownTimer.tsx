import { useEffect, useState } from "react";
import { fmtCountdown, pad2 } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CountdownTimerProps {
  /** Absolute end time (ms since epoch). */
  endsAt: number;
  label?: string;
  compact?: boolean;
  onEnd?: () => void;
  className?: string;
}

/**
 * SSR-safe countdown. Renders a stable placeholder until mount, then
 * begins ticking client-side. Prevents hydration mismatch.
 */
export function CountdownTimer({
  endsAt,
  label,
  compact,
  onEnd,
  className,
}: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const left = mounted ? endsAt - now : 0;

  useEffect(() => {
    if (mounted && left <= 0 && onEnd) onEnd();
  }, [mounted, left, onEnd]);

  const { d, h, m, s } = fmtCountdown(left);

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 font-medium tabular-nums", className)}
        aria-label={label}
      >
        {mounted ? (
          <>
            {d > 0 && <span>{d}d</span>}
            <span>
              {pad2(h)}:{pad2(m)}:{pad2(s)}
            </span>
          </>
        ) : (
          <span>--:--:--</span>
        )}
      </span>
    );
  }

  const Cell = ({ v, l }: { v: number | string; l: string }) => (
    <div className="flex flex-col items-center">
      <div className="rounded-md bg-(--color-surface-elev) px-2 py-1 text-lg font-medium tabular-nums">
        {typeof v === "number" ? pad2(v) : v}
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">{l}</div>
    </div>
  );

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <div className="flex items-end gap-1.5">
        <Cell v={mounted ? d : "--"} l="D" />
        <Cell v={mounted ? h : "--"} l="H" />
        <Cell v={mounted ? m : "--"} l="M" />
        <span key={mounted ? s : "--"} className="animate-fomo-tick">
          <Cell v={mounted ? s : "--"} l="S" />
        </span>
      </div>
    </div>
  );
}
