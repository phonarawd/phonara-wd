import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Crown, Download, Share2 } from 'lucide-react';

import { EARN_HOME_CANONICAL_ROUTE } from '@/domain/earn-home-display-contract';
import { resolveTierCssVar } from '@/domain/tier-me-display-contract';
import {
  SHARE_EARNINGS_SEO_DESCRIPTION_KEY,
  SHARE_EARNINGS_SEO_TITLE_KEY,
} from '@/domain/share-earnings-display-contract';
import { useShareEarningsPageController } from '@/features/earn/use-share-earnings-page-controller';
import { BRAND_ASSETS } from '@/domain/brand-display-contract';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

/** Canonical `/share/earnings` — canvas earnings card · Web Share · RPC display only (P7). */
export function ShareEarningsPage() {
  const engine = useShareEarningsPageController();
  const {
    t,
    loading,
    error,
    card,
    referralCode,
    shareRewardLabel,
    streakRewardLabel,
    streakProgressLabel,
    webShareAvailable,
    shareBusy,
    claimBusy,
    canClaimShareReward,
    canClaimStreakReward,
    previewUrl,
    shareEarnings,
    downloadPng,
    claimShareReward,
    claimStreakReward,
    copyInviteLink,
  } = engine;

  useEffect(() => {
    document.title = t(SHARE_EARNINGS_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4"
        data-testid="share-earnings-loading"
      >
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const tierColorVar = card ? resolveTierCssVar(card.tier.tier) : '--ds-tier-bronze';

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4 md:py-6"
      data-testid="share-earnings-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to={EARN_HOME_CANONICAL_ROUTE}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground-muted w-fit px-0',
          )}
          data-testid="share-earnings-back"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('share.earnings.backToHome')}
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('share.earnings.pageTitle')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(SHARE_EARNINGS_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          className="border-border w-full rounded-(--ds-radius-md) border"
          data-testid="share-earnings-canvas-preview"
        />
      ) : null}

      <Card
        className="border-accent/20 from-accent/5 overflow-hidden bg-linear-to-br to-transparent"
        data-testid="share-earnings-card"
      >
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <img
              src={BRAND_ASSETS.raster}
              alt=""
              className="size-12 shrink-0"
              width={48}
              height={48}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-foreground m-0 text-base font-semibold">
                {t('share.earnings.card.headline')}
              </p>
              <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                {t('share.earnings.card.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-surface/80 border-line flex flex-col gap-1 rounded-(--ds-radius-md) border p-4">
              <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
                {t('share.earnings.card.todayLabel')}
              </p>
              <p
                className="text-accent m-0 text-2xl font-semibold tabular-nums"
                data-testid="share-earnings-today"
              >
                {card?.earningsLabel ?? '—'}
              </p>
              <p className="text-foreground-muted m-0 text-xs leading-relaxed">
                {t('share.earnings.partialNote')}
              </p>
            </div>

            <div className="bg-surface/80 border-line flex flex-col gap-2 rounded-(--ds-radius-md) border p-4">
              <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
                {t('share.earnings.card.tierLabel')}
              </p>
              {card ? (
                <span
                  className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                  style={{
                    background: `color-mix(in oklch, var(${tierColorVar}) 18%, transparent)`,
                    color: `var(${tierColorVar})`,
                  }}
                  data-testid="share-earnings-tier-badge"
                >
                  <Crown className="size-4" aria-hidden />
                  {t(card.tierLabelKey)}
                </span>
              ) : null}
              {card && card.today.loginStreak > 0 ? (
                <p
                  className="text-foreground-muted m-0 text-xs tabular-nums"
                  data-testid="share-earnings-streak"
                >
                  {t('share.earnings.card.streakLine', { days: card.today.loginStreak })}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
                {t('share.earnings.shareMissionLabel')}
              </p>
              <p
                className="text-accent m-0 text-lg font-semibold tabular-nums"
                data-testid="share-earnings-reward"
              >
                {shareRewardLabel}
              </p>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
                {t('share.earnings.streakMissionLabel')}
              </p>
              <p className="text-foreground m-0 text-sm tabular-nums">{streakProgressLabel}</p>
              <p className="text-accent m-0 text-sm font-semibold tabular-nums">
                {streakRewardLabel}
              </p>
            </div>
          </div>

          <p className="text-foreground-muted m-0 text-xs leading-relaxed">
            {t('share.earnings.card.disclosure')}
          </p>
          <p className="text-foreground-muted m-0 text-xs tabular-nums">
            {t('share.earnings.referralCodeLabel')}:{' '}
            <span
              className="text-foreground font-mono font-semibold"
              data-testid="share-earnings-code"
            >
              {referralCode || t('referral.codeUnavailable')}
            </span>
          </p>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!referralCode || shareBusy}
          data-testid="share-earnings-share"
          onClick={() => void shareEarnings()}
        >
          <Share2 className="size-4" aria-hidden />
          {webShareAvailable ? t('share.earnings.shareCta') : t('share.earnings.copyLinkCta')}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="md"
          className="w-full"
          disabled={shareBusy}
          data-testid="share-earnings-download"
          onClick={() => void downloadPng()}
        >
          <Download className="size-4" aria-hidden />
          {t('share.earnings.downloadPng')}
        </Button>

        {canClaimShareReward ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            disabled={claimBusy}
            data-testid="share-earnings-claim-share"
            onClick={() => void claimShareReward()}
          >
            {t('share.earnings.claimShareReward')}
          </Button>
        ) : null}

        {canClaimStreakReward ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            disabled={claimBusy}
            data-testid="share-earnings-claim-streak"
            onClick={() => void claimStreakReward()}
          >
            {t('share.earnings.claimStreakReward')}
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="md"
          className="w-full"
          disabled={!referralCode}
          data-testid="share-earnings-copy-link"
          onClick={() => void copyInviteLink()}
        >
          {t('earn.referral.copy')}
        </Button>
      </div>

      {error ? (
        <p className="text-destructive m-0 text-sm" role="alert" data-testid="share-earnings-error">
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
