import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { VelocityBridgeSheet } from "@/components/earn/VelocityBridgeSheet";

// Wave 3R — WatchAdMock
// Presentation-only 5s countdown. No real ad SDK. Reward = sonner toast +
// localStorage flag `earn.micro.watch:v1`. Deterministic interval (no Math.random).
// SSR-safe: initial render is static; localStorage read happens inside useEffect.

const FLAG_KEY = "earn.micro.watch:v1";
const DURATION = 5;

export function WatchAdMock() {
  const [remaining, setRemaining] = useState<number>(DURATION);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(FLAG_KEY)) {
        setDone(true);
      }
    } catch {
      // ignore
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const start = () => {
    if (running || done) return;
    setRunning(true);
    setRemaining(DURATION);
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          setRunning(false);
          setDone(true);
          try {
            window.localStorage.setItem(FLAG_KEY, "1");
          } catch {
            // ignore
          }
          toast.success(t("earn.micro.watch.toast"));
          setBridgeOpen(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  return (
    <div
      data-testid="micro-watch-ad"
      className="mt-2 grid gap-2 rounded-md border border-border bg-(--color-surface) p-3 text-xs"
    >
      <div className="font-medium">{t("earn.micro.watch.title")}</div>
      <div className="tabular-nums text-muted-foreground">
        {done
          ? t("earn.micro.watch.done")
          : running
            ? t("earn.micro.watch.countdown", { n: String(remaining) })
            : t("earn.micro.watch.ready", { n: String(DURATION) })}
      </div>
      <button
        type="button"
        onClick={start}
        disabled={running || done}
        className="min-h-10 rounded-md bg-(--color-primary) px-3 text-xs font-semibold text-(--color-primary-foreground) disabled:opacity-60"
      >
        {done ? t("earn.micro.watch.done") : t("earn.micro.watch.cta")}
      </button>
      <p className="text-[10px] text-muted-foreground/80">
        {t("earn.micro.watch.disclosure")}
      </p>
      {bridgeOpen && (
        <VelocityBridgeSheet open={bridgeOpen} onOpenChange={setBridgeOpen} source="watch" />
      )}
    </div>
  );
}
