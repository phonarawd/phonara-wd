import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { CheckCircle2, Gift, Share2, UserRound } from 'lucide-react';

import { useOnboardingMissionsPageController } from '@/features/onboarding/use-onboarding-missions-page-controller';
import { BRAND_ASSETS } from '@/domain/brand-display-contract';
import { EARN_VIP_XP_NEXT_TIER } from '@/domain/unified-tier-display-contract';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { ProgressRing } from '@/product/primitives/progress-ring';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

const MISSION_ICONS = {
  'welcome-bonus': Gift,
  'growth-completeProfile': UserRound,
  'viral-shareLink': Share2,
} as const;

/** Canonical `/onboarding/missions` — Day 0 welcome bonus + mission intro (ENGINE:partial). */
export function OnboardingMissionsPage() {
  const engine = useOnboardingMissionsPageController();
  const {
    t,
    loading,
    claiming,
    error,
    missions,
    completedCount,
    missionCount,
    welcomeClaimed,
    claimWelcomeBonus,
    finish,
    skip,
  } = engine;

  const progressValue = Math.round((completedCount / missionCount) * 100);

  useEffect(() => {
    document.title = t('seo.onboarding.missions.title');
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-lg flex-col gap-ds-8 py-2"
        data-testid="onboarding-missions-loading"
      >
        <Skeleton className="mx-auto size-20 rounded-(--ds-radius-lg)" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-ds-8 py-2 md:py-4"
      data-testid="onboarding-missions-page"
    >
      <header className="flex flex-col items-center gap-4 text-center">
        <img
          src={BRAND_ASSETS.raster}
          alt=""
          className="size-20"
          width={80}
          height={80}
          aria-hidden
        />
        <div className="flex flex-col gap-2">
          <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
            {t('onboarding.missions.dayEyebrow')}
          </p>
          <h1 className="text-foreground m-0 text-2xl font-semibold">
            {t('onboarding.missions.pageTitle')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t('onboarding.missions.subtitle')}
          </p>
        </div>
      </header>

      <Card data-testid="onboarding-missions-tier-card">
        <CardBody className="flex items-center gap-4">
          <ProgressRing
            value={progressValue}
            size={56}
            tone="accent"
            aria-label={t('onboarding.tier.progressHint')}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
            <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
              {t('onboarding.tier.eyebrow')}
            </p>
            <p className="text-foreground m-0 text-base font-semibold">
              {t('onboarding.tier.starterLabel')}
            </p>
            <p className="text-foreground-muted m-0 text-sm leading-relaxed">
              {t('onboarding.tier.starterDesc')}
            </p>
            <p className="text-foreground-muted m-0 text-xs">
              <span className="text-foreground font-medium">
                {t('onboarding.tier.nextLabel')}:{' '}
              </span>
              <span className="tabular-nums">
                {t('onboarding.tier.bronzeGoal', {
                  xp: EARN_VIP_XP_NEXT_TIER.bronze.toLocaleString(),
                })}
              </span>
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-foreground-muted m-0 text-sm tabular-nums">
          {t('onboarding.missions.progress', { completed: completedCount, total: missionCount })}
        </p>

        {missions.map((mission) => {
          const MissionIcon = MISSION_ICONS[mission.id];
          const isCompleted = mission.state === 'completed';
          const canClaimWelcome =
            mission.id === 'welcome-bonus' && mission.state === 'reward_pending';

          return (
            <Card key={mission.id} data-testid={`onboarding-mission-${mission.id}`}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-(--ds-radius-md)',
                      isCompleted ? 'bg-market-up/10 text-market-up' : 'bg-accent/10 text-accent',
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-5" aria-hidden />
                    ) : (
                      <MissionIcon className="size-5" aria-hidden />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-foreground m-0 text-base font-semibold">
                        {t(mission.titleKey)}
                      </h2>
                      <span className="text-accent shrink-0 text-sm font-medium tabular-nums">
                        {mission.rewardLabel}
                      </span>
                    </div>
                    <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                      {t(mission.descKey)}
                    </p>
                  </div>
                </div>

                {canClaimWelcome ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full"
                    disabled={claiming}
                    data-testid="onboarding-missions-claim-welcome"
                    onClick={() => void claimWelcomeBonus()}
                  >
                    {claiming
                      ? t('onboarding.missions.claiming')
                      : t('onboarding.missions.claimWelcome')}
                  </Button>
                ) : null}

                {!canClaimWelcome && mission.continueRoute && !isCompleted ? (
                  <Link
                    to={mission.continueRoute}
                    className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'w-full')}
                    data-testid={`onboarding-mission-continue-${mission.id}`}
                  >
                    {t('onboarding.missions.continue')}
                  </Link>
                ) : null}

                {isCompleted ? (
                  <p
                    className="text-market-up m-0 text-sm font-medium"
                    data-testid={`onboarding-mission-done-${mission.id}`}
                  >
                    {t('onboarding.missions.completed')}
                  </p>
                ) : null}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {error ? (
        <p
          className="text-destructive m-0 text-sm"
          role="alert"
          data-testid="onboarding-missions-error"
        >
          {t(error)}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          data-testid="onboarding-missions-finish"
          onClick={finish}
        >
          {welcomeClaimed
            ? t('onboarding.missions.finish')
            : t('onboarding.missions.finishWithoutClaim')}
        </Button>
        <button
          type="button"
          className="text-foreground-muted hover:text-foreground text-center text-sm underline-offset-4 transition-colors hover:underline"
          data-testid="onboarding-missions-skip"
          onClick={skip}
        >
          {t('onboarding.missions.skip')}
        </button>
      </div>
    </div>
  );
}
