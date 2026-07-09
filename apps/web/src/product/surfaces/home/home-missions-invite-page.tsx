import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Share2 } from 'lucide-react';

import { HOME_MISSIONS_ROUTE } from '@/domain/home-missions-display-contract';
import {
  HOME_MISSIONS_INVITE_BACK_SEARCH,
  HOME_MISSIONS_INVITE_SEO_DESCRIPTION_KEY,
  HOME_MISSIONS_INVITE_SEO_TITLE_KEY,
} from '@/domain/home-missions-invite-display-contract';
import { useHomeMissionsInvitePageController } from '@/features/earn/use-home-missions-invite-page-controller';
import { useEarnFiatHint } from '@/features/earn/use-earn-fiat-hint';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';
import { MissionCard } from '@/product/primitives/mission-card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';
import { EarnMissionReward } from '@/product/surfaces/home/earn-mission-reward';

/** Canonical `/home/missions/invite` — curated viral invite missions · referral read (P7). */
export function HomeMissionsInvitePage() {
  const engine = useHomeMissionsInvitePageController();
  const {
    t,
    loading,
    error,
    hubReferral,
    inviteShareRoute,
    missions,
    completedCount,
    totalVisibleCount,
    claimingMission,
    claimMission,
  } = engine;
  const earnFiat = useEarnFiatHint();

  useEffect(() => {
    document.title = t(HOME_MISSIONS_INVITE_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4"
        data-testid="home-missions-invite-loading"
      >
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4 md:py-6"
      data-testid="home-missions-invite-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to={HOME_MISSIONS_ROUTE}
          search={HOME_MISSIONS_INVITE_BACK_SEARCH}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground-muted w-fit px-0',
          )}
          data-testid="home-missions-invite-back"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('earn.missions.invite.backToHub')}
        </Link>
        <div className="flex flex-col gap-2">
          <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
            {t('earn.missions.invite.eyebrow')}
          </p>
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('earn.missions.invite.title')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(HOME_MISSIONS_INVITE_SEO_DESCRIPTION_KEY)}
          </p>
          {totalVisibleCount > 0 ? (
            <p className="text-foreground-muted m-0 text-xs tabular-nums">
              {t('earn.missions.progress.label')}: {completedCount} / {totalVisibleCount}
            </p>
          ) : null}
        </div>
      </header>

      {hubReferral ? (
        <Card data-testid="home-missions-invite-stats">
          <CardBody className="flex flex-col gap-2">
            <p className="text-foreground-muted m-0 text-sm tabular-nums">
              {t('earn.referral.qualifiedProgress', {
                invited: hubReferral.totalInvited,
                qualified: hubReferral.qualifiedTotal,
                pending: hubReferral.pendingReview,
              })}
            </p>
            <p className="text-foreground-muted m-0 text-sm tabular-nums">
              {t('earn.referral.shareUnlimited', {
                remaining: hubReferral.payoutTodayRemaining,
                max: hubReferral.payoutTodayMax,
                multiplier: hubReferral.perFriendBonusMultiplier,
              })}
            </p>
          </CardBody>
        </Card>
      ) : null}

      <Link
        to={inviteShareRoute}
        className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full')}
        data-testid="home-missions-invite-share-cta"
      >
        <Share2 className="size-4" aria-hidden />
        {t('earn.missions.invite.shareCta')}
      </Link>

      <section className="flex flex-col gap-3" aria-labelledby="home-missions-invite-list-heading">
        <h2
          id="home-missions-invite-list-heading"
          className="text-foreground m-0 text-lg font-semibold"
        >
          {t('earn.missions.invite.listTitle')}
        </h2>

        {missions.length === 0 ? (
          <Card data-testid="home-missions-invite-empty">
            <CardBody>
              <p className="text-foreground-muted m-0 text-sm">{t('earn.missions.invite.empty')}</p>
            </CardBody>
          </Card>
        ) : (
          missions.map((mission) => {
            const progressParts = mission.progressLabel.split('/').map((part) => part.trim());
            const progressValue =
              progressParts.length === 2 && progressParts[1]
                ? Math.round((Number(progressParts[0]) / Number(progressParts[1])) * 100)
                : mission.state === 'completed'
                  ? 100
                  : 0;

            return (
              <div key={mission.id} data-testid={`home-missions-invite-mission-${mission.id}`}>
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
                  actionLabel={mission.canClaim ? t('common.cta.claim') : undefined}
                  loading={claimingMission === mission.id}
                  onAction={mission.canClaim ? () => void claimMission(mission.id) : undefined}
                />
                {mission.ctaRoute && mission.state === 'in_progress' ? (
                  <div className="mt-2 px-1">
                    <Link
                      to={mission.ctaRoute}
                      className="text-accent text-sm font-medium underline-offset-4 hover:underline"
                      data-testid={`home-missions-invite-link-${mission.id}`}
                    >
                      {t('common.cta.start')}
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      <p className="text-foreground-muted m-0 text-xs leading-relaxed">
        {t('earn.missions.eligibility')}
      </p>

      {earnFiat.showDisclaimer ? <FiatHintDisclaimer /> : null}

      {error ? (
        <p
          className="text-destructive m-0 text-sm"
          role="alert"
          data-testid="home-missions-invite-error"
        >
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
