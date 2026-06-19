import { useEffect, useState } from "react";
import { createActivityEngine, type Payout } from "@/lib/social-proof/activityEngine";
import { useSocialProofPref } from "@/lib/social-proof/preferences";
import { fmtKRW } from "@/lib/format";
import { t } from "@/i18n";

/**
 * EarnPayoutTicker — Earn page footer.
 * - SSR-safe: first paint uses seed=0; live seed swap after mount.
 * - OFF fallback: static "오늘의 미션" copy (no empty footer).
 */
export function EarnPayoutTicker() {
  const [pref] = useSocialProofPref();
  const [payouts, setPayouts] = useState<Payout[]>(() =>
    createActivityEngine({ seed: 0 }).getRecentPayouts(5),
  );

  useEffect(() => {
    if (pref === "off") return;
    setPayouts(createActivityEngine().getRecentPayouts(5));
    const id = window.setInterval(() => {
      setPayouts(createActivityEngine().getRecentPayouts(5));
    }, 3000);
    return () => window.clearInterval(id);
  }, [pref]);

  if (pref === "off") {
    return (
      <div
        data-testid="earn-ticker-off"
        className="mt-4 rounded-lg border border-border bg-(--color-surface) p-3 text-center text-xs text-muted-foreground"
      >
        {t("social.proof.ticker.offFallback")}
      </div>
    );
  }

  return (
    <div
      data-synthetic="true"
      data-testid="earn-ticker"
      aria-label={t("social.proof.ticker.aria")}
      className="mt-4 rounded-lg border border-border bg-(--color-surface) p-3"
    >
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {t("social.proof.ticker.title")}
      </div>
      <ul className="space-y-1.5 text-xs">
        {payouts.map((p) => (
          <li
            key={p.id}
            data-synthetic="true"
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">
              <span className="text-foreground">{p.nickname}</span>
              <span className="text-muted-foreground"> · {p.source}</span>
            </span>
            <span className="tabular-nums font-medium text-(--color-up)">
              {fmtKRW(p.amountKRW)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
