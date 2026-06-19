import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";
import { useEffect, useState } from "react";

/**
 * Phase 12-A · Casino Hub v0.1 — JackpotMeter
 * Live-incrementing jackpot counter. Mock-only.
 */
const BASE = 12_487_320;
export function JackpotMeter() {
  const [v, setV] = useState(BASE);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      if (dt >= 120) {
        // deterministic-ish drift, client-only — SSR renders BASE
        setV((x) => x + Math.floor(dt * 4) + 7);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <Card
      data-hub-id="casino-jackpot"
      className="border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-transparent shadow-[0_0_40px_-12px_oklch(from_var(--primary)_l_c_h_/_0.35)]"
    >
      <CardContent className="grid gap-1 p-5 text-center">
        <span className="text-[10px] uppercase tracking-wider text-amber-500">
          {t("casino.hub.jackpot.label")}
        </span>
        <span className="font-mono text-2xl font-bold tabular-nums text-amber-500">
          ₩{v.toLocaleString("en-US")}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {t("casino.hub.jackpot.desc")}
        </span>
      </CardContent>
    </Card>
  );
}
