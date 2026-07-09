import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Crown } from 'lucide-react';

import { TIER_ME_ROUTE, resolveTierCssVar } from '@/domain/tier-me-display-contract';
import { useEarnHomePageController } from '@/features/earn/use-earn-home-page-controller';
import { useEarnFiatHint } from '@/features/earn/use-earn-fiat-hint';
import { LiveActivityTicker } from '@/product/surfaces/landing/live-activity-ticker';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { CollapsibleSection } from '@/product/primitives/collapsible-section';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';
import { MissionCard } from '@/product/primitives/mission-card';
import { ProgressRing } from '@/product/primitives/progress-ring';
import { Skeleton } from '@/product/primitives/skeleton';
import { Text } from '@/product/primitives/text';
import { cn } from '@/product/primitives/lib/cn';
import { formatCountUpGrouped, useCountUp } from '@/product/primitives/lib/use-count-up';
import { EarnMissionReward } from '@/product/surfaces/home/earn-mission-reward';

/** Canonical `/home` Earn hub — progressive Fold1–5 (§34.12 · P8). */
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
  const xpTarget = tierProgress ? String(tierProgress.xp) : '0';
  const xpDisplay = useCountUp(xpTarget, { enabled: Boolean(tierProgress), tier: 'L1' });
  const xpLabel = formatCountUpGrouped(xpDisplay);

  useEffect(() => {
    document.title = t('earn.home.title');
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-4xl flex-col gap-ds-8 py-4"
        data-testid="earn-home-loading"
      >
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const tierColorVar = tierProgress ? resolveTierCssVar(tierProgress.tier) : null;
  const fold3Summary = t('earn.home.fold3.summary', { count: missionsInProgress });

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-ds-8 py-4 md:py-6"
      data-testid="earn-home-page"
    >
      {/* Fold1 — always: status + next action (above-fold) */}
      <section
        className="flex flex-col gap-ds-6"
        data-testid="earn-home-fold1"
        aria-label={t('earn.home.fold1.label')}
      >
        <header className="flex flex-col gap-2">
          <Text variant="tiny" className="text-accent m-0 font-semibold tracking-wide uppercase">
            {t('earn.home.eyebrow')}
          </Text>
          <Text variant="title" as="h1" className="m-0 md:text-3xl">
            {t('earn.home.title')}
          </Text>
          <Text variant="caption" className="m-0 leading-relaxed">
            {t('earn.home.subtitle')}
          </Text>
        </header>

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
                <p
                  className="text-foreground m-0 text-xl font-semibold tabular-nums"
                  data-testid="earn-home-tier-xp"
                  data-count-up="true"
                >
                  {xpLabel} XP
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
      </section>

      {/* Fold2 — open: money snapshot */}
      <section data-testid="earn-home-fold2" aria-label={t('earn.home.fold2.label')}>
        <CollapsibleSection
          title={t('earn.home.fold2.label')}
          defaultOpen
          summary={catalogRewardsLabel}
          testId="earn-home-money-fold"
        >
          <div className="flex flex-col gap-1" data-testid="earn-home-catalog-card">
            <p className="text-foreground-muted m-0 text-xs">{t('earn.home.claimableLabel')}</p>
            <p
              className="text-accent m-0 text-2xl font-semibold tabular-nums"
              data-testid="earn-home-catalog-sum"
            >
              {catalogRewardsLabel}
            </p>
            <p className="text-foreground-muted m-0 text-xs">{t('earn.home.claimableHint')}</p>
            {wallet ? (
              <div className="border-line mt-3 flex items-center justify-between gap-3 border-t pt-3">
                <span className="text-sm">{t('earn.home.entry.wallet.title')}</span>
                <span className="font-semibold tabular-nums" data-testid="earn-home-wallet-balance">
                  {wallet.phonBalanceLabel}
                </span>
              </div>
            ) : null}
          </div>
        </CollapsibleSection>
      </section>

      {/* Fold3 — collapsed: Today · Season · Trust (+ ambient) */}
      <section data-testid="earn-home-fold3">
        <CollapsibleSection
          title={t('earn.home.fold3.label')}
          defaultOpen={false}
          summary={fold3Summary}
          expandLabel={t('earn.home.fold3.expand')}
          collapseLabel={t('earn.home.fold3.collapse')}
          testId="earn-home-insights-fold"
        >
          <div className="flex flex-col gap-ds-6">
            {useAmbientTicker ? (
              <div data-testid="earn-home-activity-ticker">
                <LiveActivityTicker className="border-line bg-surface rounded-(--ds-radius-lg) border px-4 py-3" />
              </div>
            ) : null}

            <Card data-testid="earn-home-today-opportunity">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('earn.home.todayOpportunity.title')}</CardTitle>
              </CardHeader>
              <CardBody className="flex flex-col gap-3 text-sm">
                <p className="text-foreground-muted m-0">
                  {t('earn.home.todayOpportunity.subtitle')}
                </p>
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
        </CollapsibleSection>
      </section>

      {/* Fold4 — missions max 3 → view all */}
      <section
        className="flex flex-col gap-3"
        aria-label={t('earn.home.entry.missions.title')}
        data-testid="earn-home-fold4"
      >
        <div className="flex items-center justify-between gap-3">
          <Text variant="section" as="h2" className="m-0">
            {t('earn.home.fold4.label')}
          </Text>
          <Link
            to="/home/missions"
            search={{ tab: 'viral' }}
            className="text-accent inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
            data-testid="earn-home-missions-view-all"
          >
            {t('earn.home.fold4.viewAll')}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="flex flex-col gap-3" data-testid="earn-home-mission-grid">
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
        </div>
      </section>

      {/* Fold5 — entry cards navigate-only */}
      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        aria-label={t('earn.home.fold5.label')}
        data-testid="earn-home-fold5"
      >
        <div className="sm:col-span-2" data-testid="earn-home-entry-grid">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {entryCards.map((entry) => (
              <Card key={entry.id} data-testid={`earn-home-entry-${entry.id}`}>
                <CardBody className="flex h-full flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-foreground m-0 text-base font-semibold">
                      {t(entry.titleKey)}
                    </h2>
                    <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                      {t(entry.bodyKey)}
                    </p>
                  </div>
                  <Link
                    to={entry.route}
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'md' }),
                      'mt-auto w-full',
                    )}
                    data-testid={`earn-home-entry-cta-${entry.id}`}
                  >
                    {t(entry.ctaKey)}
                  </Link>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {earnFiat.showDisclaimer ? <FiatHintDisclaimer /> : null}

      {error ? (
        <p className="text-destructive m-0 text-sm" role="alert" data-testid="earn-home-error">
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
