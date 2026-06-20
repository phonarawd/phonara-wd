import { Link } from "@/shims/react-router-dom";
import { t } from "@/i18n";
import { useScriptedCounter } from "@/hooks/useScriptedCounter";
import { useGoldenEarthTap } from "@/hooks/useGoldenEarthTap";
import { GoldenEarthGlobe } from "./GoldenEarthGlobe";
import { GoldenEarthCounter } from "./GoldenEarthCounter";
import { GoldenEarthUrgencyStrip } from "./GoldenEarthUrgencyStrip";
import { GoldenEarthTapTicker } from "./GoldenEarthTapTicker";
import { GoldenEarthJackpotModal } from "./GoldenEarthJackpotModal";

export type GoldenEarthHeroProps = {
  className?: string;
  /** import.meta.env.DEV override — production default 50 */
  mockEvery?: number;
};

export function GoldenEarthHero({ className, mockEvery = 50 }: GoldenEarthHeroProps) {
  const { globalCount, remainingToMilestone, isUrgent, bump, bumpTick } = useScriptedCounter();
  const { personalTaps, onTap, jackpotOpen, dismissJackpot, lastJackpotNth } = useGoldenEarthTap({
    bump,
    globalCount,
    jackpotEvery: mockEvery,
  });

  return (
    <section
      data-testid="golden-earth-hero"
      className={
        "relative isolate overflow-hidden rounded-xl border border-border p-4 md:p-5 " +
        (className ?? "")
      }
      style={{
        backgroundImage:
          "radial-gradient(60% 80% at 15% 0%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 60%), radial-gradient(50% 60% at 100% 20%, color-mix(in oklab, var(--violet) 22%, transparent), transparent 60%)",
      }}
    >
      <p className="mb-2 text-[10px] font-medium text-muted-foreground">{t("earn.goldenEarth.mockNotice")}</p>

      <div className="grid items-center gap-3 md:grid-cols-[minmax(140px,200px)_minmax(0,1fr)]">
        <button
          type="button"
          data-primary-cta="home-golden-earth-tap"
          aria-label={t("earn.goldenEarth.tap.aria")}
          onClick={onTap}
          className="group relative flex min-h-44 w-full min-w-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/40 p-3 transition active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)"
        >
          <GoldenEarthGlobe />
          <span className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow-cta)]">
            {t("earn.goldenEarth.tap.label")}
          </span>
        </button>

        <div className="flex min-w-0 flex-col gap-2">
          <GoldenEarthCounter
            globalCount={globalCount}
            personalTaps={personalTaps}
            bumpTick={bumpTick}
          />
          <GoldenEarthUrgencyStrip remaining={remainingToMilestone} visible={isUrgent} />
          <GoldenEarthTapTicker />
        </div>
      </div>

      <Link
        to="/earn/missions"
        className="mt-3 inline-block text-xs font-semibold text-(--color-primary) underline-offset-2 hover:underline"
      >
        {t("earn.goldenEarth.link.missions")}
      </Link>

      <GoldenEarthJackpotModal open={jackpotOpen} nth={lastJackpotNth} onClose={dismissJackpot} />
    </section>
  );
}

GoldenEarthHero.displayName = "GoldenEarthHero";
