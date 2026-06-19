import { Link } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpFromLine, Gamepad2, LineChart } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/fomo/TierBadge";
import { ReferralQuickCard } from "@/components/earn/ReferralQuickCard";
import { t } from "@/i18n";
import type { DashboardPageViewProps } from "../../features/dashboard/use-dashboard-page-controller";

const ACTIONS = [
  { to: "/wallet" as const, icon: ArrowDownToLine, key: "deposit" },
  { to: "/wallet" as const, icon: ArrowUpFromLine, key: "withdraw" },
  { to: "/games" as const, icon: Gamepad2, key: "play" },
  { to: "/trade" as const, icon: LineChart, key: "trade" },
] as const;

const STATIC_DEFAULTS = {
  balanceDisplay: "5,000P",
  fiatDisplay: "₩50,000",
  pointsDisplay: "5,000P",
  tier: "bronze" as const,
  missionProgressPct: 40,
};

export type ImportedDashboardPageProps = Partial<DashboardPageViewProps> & {
  onClaimDaily?: () => void;
  onSpinRoulette?: () => void;
  dailyClaimBusy?: boolean;
  rouletteSpinBusy?: boolean;
};

export function ImportedDashboardPage(props: ImportedDashboardPageProps = {}) {
  const balanceDisplay = props.balanceDisplay ?? STATIC_DEFAULTS.balanceDisplay;
  const fiatDisplay = props.fiatDisplay ?? STATIC_DEFAULTS.fiatDisplay;
  const pointsDisplay = props.pointsDisplay ?? STATIC_DEFAULTS.pointsDisplay;
  const tier = props.tier ?? STATIC_DEFAULTS.tier;
  const missionProgressPct = props.missionProgressPct ?? STATIC_DEFAULTS.missionProgressPct;
  const missionProgressLabel = props.missionProgressLabel ?? t("dashboard.mission.progress");
  const streakDaysDisplay = props.streakDaysDisplay ?? t("dashboard.streak.days");
  const { onClaimDaily, onSpinRoulette, dailyClaimBusy = false, rouletteSpinBusy = false } = props;
  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-3xl gap-4 p-4 pb-24 md:p-6" data-testid="dashboard-page">
        <header>
          <div className="text-sm text-muted-foreground">
            {t("dashboard.subtitle")}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("dashboard.title")}
          </h1>
        </header>

        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">
                {t("dashboard.balance.label")}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className="text-4xl font-semibold tabular-nums text-(--color-primary)"
                  data-testid="dashboard-hero-balance"
                >
                  {balanceDisplay}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("dashboard.balance.fiat")} · {fiatDisplay}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <TierBadge tier={tier} />
              <div className="text-xs text-muted-foreground">
                {t("dashboard.balance.points")}: {pointsDisplay}
              </div>
            </div>
          </CardContent>
        </Card>

        <ReferralQuickCard
          code="PHON-INVITE"
          inviteUrl="https://phonara.app/r/invite"
          progressLabel={t("earn.referral.progress", { done: 0, total: 5 })}
          rewardLabel={t("earn.referral.reward")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("dashboard.mission.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--color-surface-elev)">
                  <div
                    className="h-full rounded-full bg-(--color-primary)"
                    style={{ width: `${missionProgressPct}%` }}
                  />
                </div>
                <span className="text-sm tabular-nums">
                  {missionProgressLabel}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("dashboard.streak.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums text-(--color-primary)">
                {streakDaysDisplay}
              </div>
            </CardContent>
          </Card>
        </div>

        {(onClaimDaily || onSpinRoulette) ? (
          <Card data-testid="dashboard-reward-center">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.rewardCenter")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {onClaimDaily ? (
                <Button
                  data-testid="daily-claim-submit"
                  disabled={dailyClaimBusy}
                  onClick={onClaimDaily}
                >
                  {dailyClaimBusy ? t("common.processing") : t("daily.claimReward", { amount: "50" })}
                </Button>
              ) : null}
              {onSpinRoulette ? (
                <Button
                  data-testid="roulette-spin-submit"
                  disabled={rouletteSpinBusy}
                  onClick={onSpinRoulette}
                >
                  {rouletteSpinBusy ? t("roulette.spinning") : t("roulette.spin")}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("dashboard.action.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ACTIONS.map((a) => (
              <Link
                key={a.key}
                to={a.to}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-(--color-surface) p-4 hover:border-(--color-primary)/40"
              >
                <a.icon className="size-5 text-(--color-primary)" />
                <span className="text-xs">
                  {t(`dashboard.action.${a.key}`)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("dashboard.recent.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.recent.empty")}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
