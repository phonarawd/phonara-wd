import { Flame, ArrowDownCircle } from "lucide-react";
import { Link } from "@/shims/react-router-dom";
import { t } from "@/i18n";
import { useHomeWalletDisplay } from "@/features/home/use-home-wallet-display";

/**
 * L1-16c · Compact wallet strip — stake-style top bar.
 * Mobile: flex-wrap (withdraw stays visible). md+: single row.
 */
export function HomeCompactWalletStrip() {
  const { balanceDisplay, todayEarnDisplay, streakNow, streakGoal } = useHomeWalletDisplay();
  const streakPct = Math.min(100, Math.round((streakNow / streakGoal) * 100));

  return (
    <section
      data-hub-id="home-wallet-strip"
      data-testid="home-wallet-strip"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2.5 backdrop-blur md:flex-nowrap md:gap-3"
    >
      {/* Mobile row 1 · md: inline — full balance, no truncate */}
      <div className="flex w-full min-w-0 basis-full items-baseline gap-2 md:w-auto md:flex-1 md:basis-auto">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("home.compact.balanceLabel")}
        </span>
        <span
          className="font-mono text-lg font-bold tabular-nums whitespace-nowrap md:text-xl"
          data-testid="dashboard-hero-balance"
        >
          {balanceDisplay}
        </span>
      </div>

      {/* Mobile row 2 · md:contents → single-row with balance above */}
      <div className="flex w-full basis-full items-center gap-3 md:contents">
        <div className="flex shrink-0 items-baseline gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("home.compact.todayEarnLabel")}
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-(--color-primary)">
            {todayEarnDisplay}
          </span>
        </div>

        <div
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-(--color-warn)/30 bg-(--color-warn)/10 px-2 py-0.5 text-[11px] font-semibold text-(--color-warn)"
          role="meter"
          aria-valuenow={streakNow}
          aria-valuemax={streakGoal}
          aria-label={t("home.compact.streakAria", { n: streakNow, goal: streakGoal })}
        >
          <Flame className="size-3" aria-hidden />
          <span className="tabular-nums">{streakNow}/{streakGoal}</span>
          <span className="hidden text-(--color-warn)/70 sm:inline">· {streakPct}%</span>
        </div>

        <Link
          to="/wallet/withdraw"
          className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-(--color-surface-elev) px-3 text-xs font-semibold text-foreground hover:bg-(--color-surface-elev)/80"
        >
          <ArrowDownCircle className="size-4" aria-hidden />
          {t("home.compact.withdrawCta")}
        </Link>
      </div>
    </section>
  );
}
