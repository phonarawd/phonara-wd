import { useEffect, useState } from "react";
import { createActivityEngine } from "@/lib/social-proof/activityEngine";
import { useSocialProofPref } from "@/lib/social-proof/preferences";
import { t } from "@/i18n";

/**
 * OnlinePulse — compact "N online" chip.
 * - SSR-safe: first paint uses seed=0; live seed swap after mount.
 * - Hidden when preference OFF.
 * - 3s tick.
 */
export function OnlinePulse() {
  const [pref] = useSocialProofPref();
  const [count, setCount] = useState<number>(() =>
    createActivityEngine({ seed: 0 }).getOnlineCount(),
  );

  useEffect(() => {
    if (pref === "off") return;
    // swap to live count on mount, then tick every 3s
    setCount(createActivityEngine().getOnlineCount());
    const id = window.setInterval(() => {
      setCount(createActivityEngine().getOnlineCount());
    }, 3000);
    return () => window.clearInterval(id);
  }, [pref]);

  if (pref === "off") return null;

  return (
    <span
      data-synthetic="true"
      data-testid="social-pulse"
      aria-label={t("social.proof.pulse.aria")}
      className="inline-flex items-center gap-1.5 rounded-md bg-(--color-up)/10 px-2 py-1 text-xs text-(--color-up)"
    >
      <span className="relative grid size-2 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-(--color-up)/60 motion-reduce:animate-none" />
        <span className="size-1.5 rounded-full bg-(--color-up)" />
      </span>
      <span className="tabular-nums font-medium">{count.toLocaleString("ko-KR")}</span>
      <span className="text-muted-foreground">{t("social.proof.pulse.label")}</span>
    </span>
  );
}
