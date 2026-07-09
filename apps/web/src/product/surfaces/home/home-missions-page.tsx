import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { X } from 'lucide-react';

import {
  HOME_MISSIONS_HUB_TABS,
  HOME_MISSIONS_TAB_LABEL_KEYS,
} from '@/domain/home-missions-display-contract';
import { useHomeMissionsPageController } from '@/features/earn/use-home-missions-page-controller';
import { useEarnFiatHint } from '@/features/earn/use-earn-fiat-hint';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';
import { MissionCard } from '@/product/primitives/mission-card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';
import { EarnMissionReward } from '@/product/surfaces/home/earn-mission-reward';

type HomeMissionsPageProps = {
  search: Record<string, unknown>;
};

/** Canonical `/home/missions` hub — E12 lane tabs · viral default · onboarding handoff read-only. */
export function HomeMissionsPage({ search }: HomeMissionsPageProps) {
  const engine = useHomeMissionsPageController(search);
  const {
    t,
    loading,
    error,
    activeTab,
    missionId,
    missions,
    completedCount,
    totalVisibleCount,
    claimingMission,
    setActiveTab,
    closeMission,
    claimMission,
  } = engine;
  const earnFiat = useEarnFiatHint();

  const selectedMission = missionId ? missions.find((mission) => mission.id === missionId) : null;

  useEffect(() => {
    document.title = t('earn.missions.head.title');
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4"
        data-testid="home-missions-loading"
      >
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4 md:py-6"
      data-testid="home-missions-page"
    >
      <header className="flex flex-col gap-2">
        <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
          {t('earn.missions.eyebrow')}
        </p>
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t('earn.missions.hubTitle')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t('earn.missions.hero.body')}
        </p>
        {totalVisibleCount > 0 ? (
          <p className="text-foreground-muted m-0 text-xs tabular-nums">
            {t('earn.missions.progress.label')}: {completedCount} / {totalVisibleCount}
          </p>
        ) : null}
      </header>

      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t('earn.missions.category.title')}
        data-testid="home-missions-tabs"
      >
        {HOME_MISSIONS_HUB_TABS.map((tab) => {
          const selected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              data-testid={`home-missions-tab-${tab}`}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                selected
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-surface-elevated text-foreground-muted hover:text-foreground',
              )}
              onClick={() => setActiveTab(tab)}
            >
              {t(HOME_MISSIONS_TAB_LABEL_KEYS[tab])}
            </button>
          );
        })}
      </div>

      {selectedMission ? (
        <Card data-testid="home-missions-detail" className="border-accent/40">
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-foreground m-0 text-lg font-semibold">
                {t(selectedMission.titleKey)}
              </h2>
              <button
                type="button"
                className="text-foreground-muted hover:text-foreground rounded-(--ds-radius-sm) p-1"
                aria-label={t('common.close')}
                data-testid="home-missions-detail-close"
                onClick={closeMission}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <p className="text-accent m-0 text-base font-semibold tabular-nums">
              <EarnMissionReward
                rewardPhon={selectedMission.rewardPhon}
                rewardLabel={selectedMission.rewardLabel}
                earnFiat={earnFiat}
              />
            </p>
            <p className="text-foreground-muted m-0 text-sm tabular-nums">
              {selectedMission.progressLabel}
            </p>
            {selectedMission.unavailableReasonKey ? (
              <p className="text-foreground-muted m-0 text-sm leading-relaxed" role="status">
                {t(selectedMission.unavailableReasonKey)}
              </p>
            ) : null}
            {selectedMission.canClaim ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                loading={claimingMission === selectedMission.id}
                data-testid="home-missions-detail-claim"
                onClick={() => void claimMission(selectedMission.id)}
              >
                {t('common.cta.claim')}
              </Button>
            ) : null}
            {!selectedMission.canClaim && selectedMission.ctaRoute ? (
              <Link
                to={selectedMission.ctaRoute}
                className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'w-full')}
                data-testid="home-missions-detail-cta"
              >
                {t('common.cta.start')}
              </Link>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3" aria-live="polite">
        {missions.length === 0 ? (
          <Card data-testid="home-missions-empty">
            <CardBody>
              <p className="text-foreground-muted m-0 text-sm">
                {activeTab === 'special'
                  ? t('earn.missions.special.empty')
                  : t('earn.missions.empty')}
              </p>
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
              <div
                key={mission.id}
                data-testid={`home-mission-${mission.id}`}
                className={cn(
                  mission.highlighted && 'ring-accent/50 rounded-(--ds-radius-md) ring-2',
                )}
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
                  unavailableReason={
                    mission.unavailableReasonKey ? t(mission.unavailableReasonKey) : undefined
                  }
                  actionLabel={mission.canClaim ? t('common.cta.claim') : undefined}
                  loading={claimingMission === mission.id}
                  onAction={mission.canClaim ? () => void claimMission(mission.id) : undefined}
                />
                {mission.ctaRoute && mission.state === 'in_progress' ? (
                  <div className="mt-2 px-1">
                    <Link
                      to={mission.ctaRoute}
                      className="text-accent text-sm font-medium underline-offset-4 hover:underline"
                      data-testid={`home-mission-link-${mission.id}`}
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
        <p className="text-destructive m-0 text-sm" role="alert" data-testid="home-missions-error">
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
