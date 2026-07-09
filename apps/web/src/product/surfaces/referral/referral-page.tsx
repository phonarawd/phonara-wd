import { useEffect } from 'react';
import { Copy, Share2, Users } from 'lucide-react';

import { useReferralPageController } from '@/features/earn/use-referral-page-controller';
import { useEarnFiatHint } from '@/features/earn/use-earn-fiat-hint';
import {
  REFERRAL_INVITE_ROUTE,
  resolveReferralTreeStateLabelKey,
} from '@/domain/referral-hub-display-contract';
import { formatPhonRewardDisplay } from '@/domain/viral-missions-display-contract';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';
import { MissionCard } from '@/product/primitives/mission-card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';
import { EarnMissionReward } from '@/product/surfaces/home/earn-mission-reward';

/** Canonical `/referral` hub — dashboard read · viral missions · invite handoff (P7). */
export function ReferralPage() {
  const engine = useReferralPageController();
  const {
    t,
    loading,
    error,
    referralCode,
    inviteUrl,
    hubReferral,
    totalPaidRewardsLabel,
    treeRows,
    missions,
    claimingMission,
    copyCode,
    copyInviteLink,
    claimMission,
    maskReferredLabel,
  } = engine;
  const earnFiat = useEarnFiatHint();

  useEffect(() => {
    document.title = t('seo.referral.title');
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4"
        data-testid="referral-page-loading"
      >
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4 md:py-6"
      data-testid="referral-page"
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('referral.title')}
          </h1>
          <span className="bg-accent/10 text-accent rounded-full px-2.5 py-0.5 text-xs font-semibold">
            {t('referral.honestBadge')}
          </span>
        </div>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t('referral.description')}
        </p>
      </header>

      <Card data-testid="referral-code-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('referral.card.title')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-foreground-muted m-0 text-xs font-medium">{t('referral.code')}</p>
            <p
              className="text-foreground m-0 font-mono text-lg font-semibold tracking-wide tabular-nums"
              data-testid="referral-code-value"
            >
              {referralCode || t('referral.codeUnavailable')}
            </p>
          </div>

          {hubReferral ? (
            <p className="text-foreground-muted m-0 text-sm tabular-nums">
              {t('earn.referral.qualifiedProgress', {
                invited: hubReferral.totalInvited,
                qualified: hubReferral.qualifiedTotal,
                pending: hubReferral.pendingReview,
              })}
            </p>
          ) : null}

          {hubReferral ? (
            <p className="text-foreground-muted m-0 text-sm tabular-nums">
              {t('earn.referral.shareUnlimited', {
                remaining: hubReferral.payoutTodayRemaining,
                max: hubReferral.payoutTodayMax,
                multiplier: hubReferral.perFriendBonusMultiplier,
              })}
            </p>
          ) : null}

          <p className="text-foreground-muted m-0 text-xs leading-relaxed">
            {t('earn.referral.disclosure')}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              disabled={!referralCode}
              data-testid="referral-copy-code"
              onClick={() => void copyCode()}
            >
              <Copy className="size-4" aria-hidden />
              {t('referral.share.card.copy')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              disabled={!inviteUrl}
              data-testid="referral-copy-link"
              onClick={() => void copyInviteLink()}
            >
              <Copy className="size-4" aria-hidden />
              {t('earn.referral.copy')}
            </Button>
          </div>

          <a
            href={REFERRAL_INVITE_ROUTE}
            className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full')}
            data-testid="referral-invite-cta"
          >
            <Share2 className="size-4" aria-hidden />
            {t('referral.btn.share')}
          </a>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="referral-rewards-card">
          <CardBody className="flex flex-col gap-2">
            <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
              {t('referral.rewards.title')}
            </p>
            <p className="text-foreground m-0 text-2xl font-semibold tabular-nums">
              {totalPaidRewardsLabel}
            </p>
            <p className="text-foreground-muted m-0 text-xs">{t('referral.honestBadge')}</p>
          </CardBody>
        </Card>

        <Card data-testid="referral-tier-bonus-card">
          <CardBody className="flex flex-col gap-2">
            <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
              {t('referral.tiers.title')}
            </p>
            <p className="text-foreground m-0 text-2xl font-semibold tabular-nums">
              ×{hubReferral?.perFriendBonusMultiplier ?? '1.00'}
            </p>
            <p className="text-foreground-muted m-0 text-xs">{t('earn.referral.disclosure')}</p>
          </CardBody>
        </Card>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="referral-missions-heading">
        <h2 id="referral-missions-heading" className="text-foreground m-0 text-lg font-semibold">
          {t('referral.missions.title')}
        </h2>
        <div className="flex flex-col gap-3">
          {missions.map((mission) => {
            const canClaim =
              mission.state === 'reward_pending' && !mission.claimBlocked && mission.viralRpc;
            const progressParts = mission.progressLabel.split('/').map((part) => part.trim());
            const progressValue =
              progressParts.length === 2 && progressParts[1]
                ? Math.round((Number(progressParts[0]) / Number(progressParts[1])) * 100)
                : mission.state === 'completed'
                  ? 100
                  : 0;

            return (
              <div key={mission.id} data-testid={`referral-mission-${mission.id}`}>
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
                  actionLabel={canClaim ? t('common.cta.claim') : undefined}
                  loading={claimingMission === mission.viralRpc}
                  onAction={
                    canClaim && mission.viralRpc
                      ? () => void claimMission(mission.viralRpc!)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="referral-tree-heading">
        <div className="flex items-center gap-2">
          <Users className="text-accent size-5" aria-hidden />
          <h2 id="referral-tree-heading" className="text-foreground m-0 text-lg font-semibold">
            {t('referral.tree.title')}
          </h2>
        </div>

        {treeRows.length === 0 ? (
          <Card data-testid="referral-tree-empty">
            <CardBody>
              <p className="text-foreground-muted m-0 text-sm">{t('referral.tree.empty')}</p>
            </CardBody>
          </Card>
        ) : (
          <ul
            className="border-line divide-line m-0 list-none divide-y rounded-(--ds-radius-md) border p-0"
            data-testid="referral-tree-list"
          >
            {treeRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
                data-testid="referral-tree-row"
              >
                <div className="min-w-0">
                  <p className="text-foreground m-0 truncate text-sm font-medium">
                    {maskReferredLabel(row.referredId)}
                  </p>
                  <p className="text-foreground-muted m-0 text-xs tabular-nums">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span className="text-foreground-muted text-xs font-medium">
                    {t(resolveReferralTreeStateLabelKey(row.state))}
                  </span>
                  {row.state === 'paid' ? (
                    <span className="text-accent text-sm font-medium tabular-nums">
                      {t('referral.paid')} · {formatPhonRewardDisplay(row.referrerPhon)}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {earnFiat.showDisclaimer ? <FiatHintDisclaimer /> : null}

      {error ? (
        <p className="text-destructive m-0 text-sm" role="alert" data-testid="referral-page-error">
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
