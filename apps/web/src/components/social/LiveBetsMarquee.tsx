import { useEffect, useState } from "react";
import { createActivityEngine, type Bet } from "@/lib/social-proof/activityEngine";
import { useSocialProofPref } from "@/lib/social-proof/preferences";
import { fmtKRW } from "@/lib/format";
import { t } from "@/i18n";

/**
 * LiveBetsMarquee — global topbar marquee.
 * - SSR-safe: first paint uses deterministic seed=0, swapped to live seed
 *   on client mount via useEffect (hydration mismatch fix).
 * - Hidden when preference OFF (DOM removed).
 * - prefers-reduced-motion: pauses animation.
 * - Mobile (390): hidden — OnlinePulse owns topbar at 390.
 */
export function LiveBetsMarquee() {
  const [pref] = useSocialProofPref();
  const [bets, setBets] = useState<Bet[]>(() =>
    createActivityEngine({ seed: 0 }).getLiveBets(12),
  );

  useEffect(() => {
    if (pref === "off") return;
    // swap to live seed on mount, then tick every 3s
    setBets(createActivityEngine().getLiveBets(12));
    const id = window.setInterval(() => {
      setBets(createActivityEngine().getLiveBets(12));
    }, 3000);
    return () => window.clearInterval(id);
  }, [pref]);

  if (pref === "off") return null;

  return (
    <div
      data-synthetic="true"
      data-testid="social-marquee"
      aria-label={t("social.proof.marquee.aria")}
      className="hidden md:flex h-8 items-center overflow-hidden border-b border-border bg-(--color-surface)/80 text-xs text-muted-foreground"
    >
      <div className="flex animate-[marquee_45s_linear_infinite] gap-8 whitespace-nowrap pl-6 motion-reduce:animate-none">
        {bets.concat(bets).map((b, i) => (
          <span
            key={`${b.id}-${i}`}
            data-synthetic="true"
            className="inline-flex items-center gap-1.5"
          >
            <span className="text-foreground">{b.nickname}</span>
            <span>{t("social.proof.marquee.connector")}</span>
            <span className="text-(--color-primary)">{b.game}</span>
            <span>{t("social.proof.marquee.won")}</span>
            <span className="font-medium text-(--color-up) tabular-nums">
              {fmtKRW(b.payoutKRW)}
            </span>
            <span className="text-muted-foreground">×{b.multiplier.toFixed(2)}</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
