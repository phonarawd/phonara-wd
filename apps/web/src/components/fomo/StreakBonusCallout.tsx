import { useEffect, useState } from "react";
import { Link } from "@/shims/react-router-dom";
import { Flame, Zap, Timer, ChevronRight } from "lucide-react";
import { t } from "@/i18n";

/**
 * 12-C v0.3 ??StreakBonusCallout
 * TikTok Lite-grade streak surface: streak count + bonus multiplier +
 * countdown to reset + next-reward urgency. Display-only mock.
 */

const STREAK_DAYS = 7;
const MULTIPLIER = 1.4;
const NEXT_REWARD_DAY = 10;

function msUntilMidnight() {
  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return tomorrow.getTime() - now.getTime();
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function StreakBonusCallout() {
  const [remaining, setRemaining] = useState<number>(() => msUntilMidnight());

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(msUntilMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const urgent = remaining < 2 * 3_600_000;

  return (
    <section
      data-testid="fomo-streak-bonus"
      aria-label={t("fomo.streak.title")}
      className="grid gap-3 rounded-2xl border border-(--color-warn)/30 bg-gradient-to-br from-(--color-warn)/15 via-rose-500/5 to-transparent p-4 backdrop-blur md:grid-cols-[auto_1fr_auto] md:items-center md:gap-5"
    >
      <div className="flex items-center gap-3">
        <span className="relative grid size-12 place-items-center rounded-2xl bg-(--color-warn)/20">
          <Flame
            className="size-6 text-(--color-warn) animate-pulse motion-reduce:animate-none"
            aria-hidden
          />
        </span>
        <div className="grid gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t("fomo.streak.title")}
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums leading-none">
            {t("fomo.streak.dayN", { n: STREAK_DAYS })}
          </span>
        </div>
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300 tabular-nums">
            <Zap className="size-3" aria-hidden />×{MULTIPLIER.toFixed(1)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t("fomo.streak.bonusLabel")}
          </span>
        </div>
        <span className="text-xs font-medium text-foreground/90">
          {t("fomo.streak.nextReward", { n: NEXT_REWARD_DAY })}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center md:gap-2">
        <div className="grid gap-0.5 text-right">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground inline-flex items-center justify-end gap-1">
            <Timer className="size-3" aria-hidden />
            {t("fomo.streak.resetIn")}
          </span>
          <span
            className={`font-mono text-sm font-semibold tabular-nums ${urgent ? "text-rose-400" : ""}`}
          >
            {pad(hours)}:{pad(minutes)}:{pad(seconds)}
          </span>
        </div>
        <Link
          to="/earn"
          className="inline-flex h-10 items-center gap-1 rounded-xl bg-(--color-warn) px-3 text-xs font-bold text-background transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
        >
          {t("fomo.streak.cta")}
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
