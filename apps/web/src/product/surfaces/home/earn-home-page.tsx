import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Crown } from 'lucide-react';

import { TIER_ME_ROUTE, resolveTierCssVar } from '@/domain/tier-me-display-contract';
import { useEarnHomePageController } from '@/features/earn/use-earn-home-page-controller';
import { useEarnFiatHint } from '@/features/earn/use-earn-fiat-hint';
import { LiveActivityTicker } from '@/product/surfaces/landing/live-activity-ticker';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';
import { MissionCard } from '@/product/primitives/mission-card';
import { ProgressRing } from '@/product/primitives/progress-ring';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';
import { EarnMissionReward } from '@/product/surfaces/home/earn-mission-reward';

/** Canonical `/home` Earn hub — status · next action · entry cards · §28.7 ambient (P8). */
export function EarnHomePage() {
  const engine = useEarnHomePageController();
  const {
    t,
    loading,
    error,
    tierProgress,
    catalogRewardsLabel,
    wallet,
    season,
    launchSlots,
    cooldown,
    missionsInProgress,
    attendanceRewardLabel,
    rouletteRemaining,
    rouletteMax,
    goldenEarthRemaining,
    nextAction,
    missionPreviews,
    entryCards,
    useAmbientTicker,
    rewardTicketsIssuanceNoteKey,
  } = engine;
  const earnFiat = useEarnFiatHint();

  useEffect(() => {
    document.title = t('earn.home.title');
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4"
        data-testid="earn-home-loading"
      >
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const tierColorVar = tierProgress ? resolveTierCssVar(tierProgress.tier) : null;

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-8 md:py-6"
      data-testid="earn-home-page"
    >
      <div className="flex flex-col gap-6 md:col-span-2">
        <header className="flex flex-col gap-2">
          <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
            {t('earn.home.eyebrow')}
          </p>
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('earn.home.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t('earn.home.subtitle')}
          </p>
        </header>

        {useAmbientTicker ? (
          <div data-testid="earn-home-activity-ticker">
            <LiveActivityTicker className="border-line bg-surface rounded-(--ds-radius-lg) border px-4 py-3" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 md:col-span-1">
        {tierProgress ? (
          <Card data-testid="earn-home-tier-card">
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProgressRing
                value={tierProgress.progressPercent}
                size={80}
                strokeWidth={6}
                tone="accent"
                aria-label={t('tier.me.xpProgressAria', { pct: tierProgress.progressPercent })}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                    style={
                      tierColorVar
                        ? {
                            background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
                            color: `var(${tierColorVar})`,
                          }
                        : undefined
                    }
                    data-testid="earn-home-tier-badge"
                  >
                    <Crown className="size-4" aria-hidden />
                    {t(`earn.tier.${tierProgress.tier}`)}
                  </span>
                  <Link
                    to={TIER_ME_ROUTE}
                    className="text-accent text-xs font-medium underline-offset-4 hover:underline"
                    data-testid="earn-home-tier-link"
                  >
                    {t('tier.me.head.title')}
                  </Link>
                </div>
                <p className="text-foreground m-0 text-xl font-semibold tabular-nums">
                  {tierProgress.xp.toLocaleString()} XP
                </p>
                {tierProgress.atMaxTier ? (
                  <p className="text-accent m-0 text-sm font-medium">{t('tier.me.maxTier')}</p>
                ) : tierProgress.nextTier ? (
                  <p className="text-foreground-muted m-0 text-sm tabular-nums">
                    {t('tier.me.nextTier', {
                      tier: t(`earn.tier.${tierProgress.nextTier}`),
                      xp: (tierProgress.nextTierXp ?? 0).toLocaleString(),
                    })}
                  </p>
                ) : null}
              </div>
            </CardBody>
          </Card>
        ) : null}

        <Card data-testid="earn-home-catalog-card">
          <CardBody className="flex flex-col gap-1">
            <p className="text-foreground-muted m-0 text-xs">{t('earn.home.claimableLabel')}</p>
            <p
              className="text-accent m-0 text-2xl font-semibold tabular-nums"
              data-testid="earn-home-catalog-sum"
            >
              {catalogRewardsLabel}
            </p>
            <p className="text-foreground-muted m-0 text-xs">{t('earn.home.claimableHint')}</p>
          </CardBody>
        </Card>

        <Card className="border-accent" data-testid="earn-home-next-action">
          <CardHeader className="pb-2">
            <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
              {t('earn.home.next.eyebrow')}
            </p>
            <CardTitle className="text-base">{t('earn.home.next.title')}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div>
              <p className="text-foreground m-0 text-sm font-semibold">{t(nextAction.titleKey)}</p>
              <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                {t(nextAction.bodyKey)}
              </p>
            </div>
            <Link
              to={nextAction.route}
              search={
                nextAction.missionId ? { tab: 'viral', missionId: nextAction.missionId } : undefined
              }
              className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full')}
              data-testid="earn-home-next-action-cta"
            >
              {nextAction.kind === 'attendance'
                ? t(nextAction.ctaKey, { reward: attendanceRewardLabel })
                : t(nextAction.ctaKey)}
            </Link>
            <Link
              to="/home/missions"
              search={{ tab: 'viral' }}
              className="text-accent inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
              data-testid="earn-home-next-all"
            >
              {t('earn.home.next.all')}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col gap-6 md:col-span-1">
        <Card data-testid="earn-home-today-opportunity">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('earn.home.todayOpportunity.title')}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3 text-sm">
            <p className="text-foreground-muted m-0">{t('earn.home.todayOpportunity.subtitle')}</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span>{t('earn.home.todayOpportunity.attendance')}</span>
                <span className="text-accent font-semibold tabular-nums">
                  {attendanceRewardLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{t('earn.home.todayOpportunity.missions')}</span>
                <span className="font-medium tabular-nums">
                  {t('earn.home.todayOpportunity.missionsCount', { count: missionsInProgress })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{t('earn.home.todayOpportunity.events')}</span>
                <span className="text-foreground-muted text-xs tabular-nums">
                  {t('earn.home.todayOpportunity.eventsQuota', {
                    roulette: rouletteRemaining,
                    rouletteMax,
                    goldenEarth: goldenEarthRemaining,
                  })}
                </span>
              </div>
              {wallet ? (
                <>
                  <div className="flex items-center justify-between gap-3 border-line border-t pt-2">
                    <span>{t('earn.home.entry.wallet.title')}</span>
                    <span
                      className="font-semibold tabular-nums"
                      data-testid="earn-home-wallet-balance"
                    >
                      {wallet.phonBalanceLabel}
                    </span>
                  </div>
                  <div
                    className="flex flex-col gap-1 border-line border-t pt-2 text-xs"
                    data-testid="earn-home-reward-tickets"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('earn.wallet.stat.discount')}</span>
                      <span
                        className="font-medium tabular-nums"
                        data-testid="earn-home-discount-tickets"
                      >
                        {wallet.discountTickets}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('earn.wallet.stat.freeTrade')}</span>
                      <span
                        className="font-medium tabular-nums"
                        data-testid="earn-home-free-trade-tickets"
                      >
                        {wallet.freeTradeTickets}
                      </span>
                    </div>
                    {rewardTicketsIssuanceNoteKey ? (
                      <p className="text-foreground-muted m-0 leading-relaxed" role="status">
                        {t(rewardTicketsIssuanceNoteKey)}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </CardBody>
        </Card>

        {season && season.daysLeft > 0 ? (
          <Card data-testid="earn-home-season-card">
            <CardBody className="flex flex-col gap-2">
              <p className="text-foreground-muted m-0 text-xs">{t('earn.home.season.label')}</p>
              <p className="text-foreground m-0 text-sm font-semibold">
                {t('earn.home.season.title')}
              </p>
              <p className="text-accent m-0 text-sm font-medium tabular-nums">
                {t('earn.home.season.daysLeft', { days: season.daysLeft })}
              </p>
              {launchSlots && launchSlots.total > 0 ? (
                <p className="text-foreground-muted m-0 text-xs tabular-nums">
                  {t('earn.home.season.drop.subtitle', { days: season.daysLeft })}
                </p>
              ) : null}
            </CardBody>
          </Card>
        ) : null}

        <Card data-testid="earn-home-trust-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('earn.home.trust.title')}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm">
            <p className="text-foreground-muted m-0">{t('earn.home.trust.ready')}</p>
            <p className="text-foreground-muted m-0">{t('earn.home.trust.limit')}</p>
            {cooldown.active ? (
              <p className="text-warning m-0">{t('earn.home.trust.cooldown')}</p>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <section
        className="flex flex-col gap-3 md:col-span-2"
        aria-label={t('earn.home.entry.missions.title')}
        data-testid="earn-home-mission-grid"
      >
        {missionPreviews.map((mission) => {
          const progressParts = mission.progressLabel.split('/').map((part) => part.trim());
          const progressValue =
            progressParts.length === 2 && progressParts[1]
              ? Math.round((Number(progressParts[0]) / Number(progressParts[1])) * 100)
              : mission.state === 'completed'
                ? 100
                : 0;

          const highlighted = nextAction.missionId === mission.id;

          return (
            <div
              key={mission.id}
              data-testid={`earn-home-mission-${mission.id}`}
              className={cn(highlighted && 'ring-accent/50 rounded-(--ds-radius-md) ring-2')}
            >
              <MissionCard
                title={t(mission.titleKey)}
                rewardSlot={
                  <EarnMissionReward
                    rewardPhon={mission.rewardPhon}
                    rewardLabel={mission.rewardLabel}
                    earnFiat={earnFiat}
                  />
                }
                state={mission.state}
                progress={Number.isFinite(progressValue) ? progressValue : 0}
                progressLabel={mission.progressLabel}
              />
            </div>
          );
        })}
      </section>

      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:col-span-2"
        aria-label={t('earn.home.next.title')}
        data-testid="earn-home-entry-grid"
      >
        {entryCards.map((entry) => (
          <Card key={entry.id} data-testid={`earn-home-entry-${entry.id}`}>
            <CardBody className="flex h-full flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-foreground m-0 text-base font-semibold">{t(entry.titleKey)}</h2>
                <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                  {t(entry.bodyKey)}
                </p>
              </div>
              <Link
                to={entry.route}
                className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'mt-auto w-full')}
                data-testid={`earn-home-entry-cta-${entry.id}`}
              >
                {t(entry.ctaKey)}
              </Link>
            </CardBody>
          </Card>
        ))}
      </section>

      {earnFiat.showDisclaimer ? <FiatHintDisclaimer className="md:col-span-2" /> : null}

      {error ? (
        <p
          className="text-destructive m-0 text-sm md:col-span-2"
          role="alert"
          data-testid="earn-home-error"
        >
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
