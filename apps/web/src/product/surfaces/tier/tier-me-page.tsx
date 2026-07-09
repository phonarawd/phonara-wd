import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, ChevronRight, Crown, History } from 'lucide-react';

import {
  TIER_BENEFITS_ROUTE,
  TIER_ME_HISTORY_ROUTE,
  TIER_ME_SEO_DESCRIPTION_KEY,
  TIER_ME_SEO_TITLE_KEY,
  resolveTierCssVar,
  resolveTierDecayDepositRoute,
  resolveTierDecayReferralRoute,
  resolveTierKeepMissionHubRoute,
  buildTierMeBenefitsRows,
} from '@/domain/tier-me-display-contract';
import { useTierMePageController } from '@/features/earn/use-tier-me-page-controller';
import { useEarnFiatHint } from '@/features/earn/use-earn-fiat-hint';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { FiatHintDisclaimer } from '@/product/primitives/money-display-with-fiat-hint';
import { MissionCard } from '@/product/primitives/mission-card';
import { ProgressRing } from '@/product/primitives/progress-ring';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';
import { EarnMissionReward } from '@/product/surfaces/home/earn-mission-reward';

/** Canonical `/tier/me` — VIP tier hero · decay UX until E1 · `tier_keep_status` (P7). */
export function TierMePage() {
  const engine = useTierMePageController();
  const {
    t,
    loading,
    error,
    tierProgress,
    limitsToday,
    decayPanel,
    keepMission,
    qualifiedReferrals,
    totalInvited,
    claimingKeepMission,
    claimKeepMission,
  } = engine;
  const earnFiat = useEarnFiatHint();

  useEffect(() => {
    document.title = t(TIER_ME_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4"
        data-testid="tier-me-loading"
      >
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!tierProgress) {
    return (
      <div
        className="mx-auto flex w-full max-w-4xl flex-col gap-4 py-4"
        data-testid="tier-me-empty"
      >
        <p className="text-foreground-muted m-0 text-sm">{t('tier.me.empty')}</p>
      </div>
    );
  }

  const tierColorVar = resolveTierCssVar(tierProgress.tier);
  const benefitRows = buildTierMeBenefitsRows(tierProgress.tier);

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-8 md:py-6"
      data-testid="tier-me-page"
    >
      <div className="flex flex-col gap-6 md:col-span-1">
        <header className="flex flex-col gap-3">
          <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
            {t('tier.me.eyebrow')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
              {t(TIER_ME_SEO_TITLE_KEY)}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
              style={{
                background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
                color: `var(${tierColorVar})`,
              }}
              data-testid="tier-me-badge"
            >
              <Crown className="size-4" aria-hidden />
              {t(`earn.tier.${tierProgress.tier}`)}
            </span>
          </div>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(TIER_ME_SEO_DESCRIPTION_KEY)}
          </p>
        </header>

        <Card data-testid="tier-me-progress-card">
          <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ProgressRing
              value={tierProgress.progressPercent}
              size={88}
              strokeWidth={6}
              tone="accent"
              aria-label={t('tier.me.xpProgressAria', { pct: tierProgress.progressPercent })}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-foreground-muted m-0 text-xs">{t('tier.me.xpLabel')}</p>
              <p
                className="text-foreground m-0 text-2xl font-semibold tabular-nums"
                data-testid="tier-me-xp"
              >
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
              {totalInvited > 0 ? (
                <p className="text-foreground-muted m-0 text-xs tabular-nums">
                  {t('tier.me.referralProgress', {
                    qualified: qualifiedReferrals,
                    invited: totalInvited,
                  })}
                </p>
              ) : null}
            </div>
          </CardBody>
        </Card>

        {decayPanel.eligible ? (
          <Card className="border-warning/40" data-testid="tier-me-decay-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-warning flex items-center gap-2 text-base">
                <AlertTriangle className="size-4" aria-hidden />
                {t('tier.me.decay.title')}
              </CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <p className="text-foreground m-0 text-sm leading-relaxed">
                {t(decayPanel.maintenanceConditionKey)}
              </p>
              <p className="text-foreground-muted m-0 text-sm">
                {t('tier.me.decay.policyWindow', { days: decayPanel.maintenanceWindowDays })}
              </p>
              {decayPanel.lowerTier && decayPanel.lowerTierLabelKey ? (
                <p className="text-warning m-0 text-sm font-medium">
                  {t('tier.me.decay.banner', {
                    tier: t(`earn.tier.${tierProgress.tier}`),
                    lower: t(decayPanel.lowerTierLabelKey),
                    days: decayPanel.maintenanceWindowDays,
                  })}
                </p>
              ) : null}
              <p className="text-foreground-muted m-0 text-xs leading-relaxed">
                {t('tier.me.decay.disclaimer')}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  to={resolveTierDecayDepositRoute()}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    'w-full sm:w-auto',
                  )}
                  data-testid="tier-me-decay-deposit-cta"
                >
                  {t('tier.me.decay.ctaDeposit')}
                </Link>
                <Link
                  to={resolveTierDecayReferralRoute()}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    'w-full sm:w-auto',
                  )}
                  data-testid="tier-me-decay-referral-cta"
                >
                  {t('tier.me.decay.ctaReferral')}
                </Link>
                <Link
                  to={resolveTierKeepMissionHubRoute()}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'w-full sm:w-auto',
                  )}
                  data-testid="tier-me-decay-missions-cta"
                >
                  {t('tier.me.decay.ctaMissions')}
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 md:col-span-1">
        <section aria-labelledby="tier-me-limits-heading">
          <h2
            id="tier-me-limits-heading"
            className="text-foreground m-0 mb-3 text-lg font-semibold"
          >
            {t('tier.me.limitsTitle')}
          </h2>
          <Card data-testid="tier-me-limits">
            <CardBody className="flex flex-col gap-3">
              {limitsToday.length === 0 ? (
                <p className="text-foreground-muted m-0 text-sm">{t('tier.me.limitsEmpty')}</p>
              ) : (
                limitsToday.map((row) => (
                  <div
                    key={row.action}
                    className="flex items-center justify-between gap-3"
                    data-testid={`tier-me-limit-${row.action}`}
                  >
                    <span className="text-foreground text-sm">{t(row.labelKey)}</span>
                    <span className="text-foreground-muted text-sm tabular-nums">
                      {row.used} / {row.max}
                    </span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </section>

        <section aria-labelledby="tier-me-benefits-heading">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="tier-me-benefits-heading" className="text-foreground m-0 text-lg font-semibold">
              {t('tier.me.benefitsTitle')}
            </h2>
            <a
              href={TIER_BENEFITS_ROUTE}
              className="text-accent text-sm font-medium underline-offset-4 hover:underline"
              data-testid="tier-me-benefits-link"
            >
              {t('tier.me.benefitsLink')}
            </a>
          </div>
          <Card data-testid="tier-me-benefits">
            <CardBody className="overflow-x-auto">
              <table className="w-full min-w-[280px] border-collapse text-left text-sm">
                <thead>
                  <tr className="text-foreground-muted border-border border-b">
                    <th className="pb-2 pr-3 font-medium">{t('tier.guide.table.tier')}</th>
                    <th className="pb-2 pr-3 font-medium">{t('tier.guide.table.cashback')}</th>
                    <th className="pb-2 pr-3 font-medium">{t('tier.guide.table.withdraw')}</th>
                    <th className="pb-2 font-medium">{t('tier.guide.table.bonus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {benefitRows.map((row) => (
                    <tr
                      key={row.tier}
                      className={cn(
                        'border-border border-b last:border-0',
                        row.current && 'bg-accent/5',
                      )}
                      data-testid={`tier-me-benefit-row-${row.tier}`}
                    >
                      <td className="text-foreground py-2 pr-3 font-medium">
                        {t(row.tierLabelKey)}
                        {row.current ? (
                          <span className="text-accent ml-2 text-xs">
                            ({t('tier.guide.currentBadge')})
                          </span>
                        ) : null}
                      </td>
                      <td className="text-foreground-muted py-2 pr-3 tabular-nums">
                        {t(row.cashbackKey)}
                      </td>
                      <td className="text-foreground-muted py-2 pr-3 tabular-nums">
                        {t(row.withdrawKey)}
                      </td>
                      <td className="text-foreground-muted py-2 tabular-nums">{t(row.bonusKey)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </section>

        {keepMission ? (
          <section aria-labelledby="tier-me-keep-mission-heading">
            <h2
              id="tier-me-keep-mission-heading"
              className="text-foreground m-0 mb-3 text-lg font-semibold"
            >
              {t('tier.me.keepMissionTitle')}
            </h2>
            <div data-testid="tier-me-keep-mission">
              <MissionCard
                title={t('mission.tier.keepStatus')}
                rewardSlot={
                  <EarnMissionReward
                    rewardPhon={keepMission.rewardPhon}
                    rewardLabel={keepMission.rewardLabel}
                    earnFiat={earnFiat}
                  />
                }
                state={keepMission.state}
                progress={
                  keepMission.state === 'completed'
                    ? 100
                    : keepMission.progressLabel.startsWith('0')
                      ? 0
                      : 50
                }
                progressLabel={keepMission.progressLabel}
                unavailableReason={
                  keepMission.unavailableReasonKey ? t(keepMission.unavailableReasonKey) : undefined
                }
                actionLabel={keepMission.canClaim ? t('common.cta.claim') : undefined}
                loading={claimingKeepMission}
                onAction={keepMission.canClaim ? () => void claimKeepMission() : undefined}
              />
            </div>
          </section>
        ) : null}

        <a
          href={TIER_ME_HISTORY_ROUTE}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground-muted w-fit px-0',
          )}
          data-testid="tier-me-history-link"
        >
          <History className="size-4" aria-hidden />
          {t('tier.me.historyLink')}
          <ChevronRight className="size-4" aria-hidden />
        </a>
      </div>

      {earnFiat.showDisclaimer ? <FiatHintDisclaimer className="md:col-span-2" /> : null}

      {error ? (
        <p
          className="text-destructive m-0 text-sm md:col-span-2"
          role="alert"
          data-testid="tier-me-error"
        >
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
