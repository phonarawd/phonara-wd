import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';

import { useReferralInvitePageController } from '@/features/earn/use-referral-invite-page-controller';
import { REFERRAL_HUB_ROUTE } from '@/domain/referral-hub-display-contract';
import {
  REFERRAL_INVITE_SEO_DESCRIPTION_KEY,
  REFERRAL_INVITE_SEO_TITLE_KEY,
} from '@/domain/referral-invite-display-contract';
import { BRAND_ASSETS } from '@/domain/brand-display-contract';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

/** Canonical `/referral/invite` — Web Share 1-tap · deep link · share card preview (P7). */
export function ReferralInvitePage() {
  const engine = useReferralInvitePageController();
  const {
    t,
    loading,
    error,
    referralCode,
    hubReferral,
    shareRewardLabel,
    shareQuotaLabel,
    webShareAvailable,
    shareBusy,
    claimBusy,
    canClaimShareReward,
    copyCode,
    copyInviteLink,
    shareInvite,
    claimShareReward,
  } = engine;

  useEffect(() => {
    document.title = t(REFERRAL_INVITE_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4"
        data-testid="referral-invite-loading"
      >
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4 md:py-6"
      data-testid="referral-invite-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to={REFERRAL_HUB_ROUTE}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground-muted w-fit px-0',
          )}
          data-testid="referral-invite-back"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('referral.invite.backToHub')}
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t('referral.invite.pageTitle')}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(REFERRAL_INVITE_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      <Card
        className="border-accent/20 from-accent/5 overflow-hidden bg-linear-to-br to-transparent"
        data-testid="referral-invite-share-card"
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
                {t('referral.share.card.title')}
              </p>
              <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                {t('referral.share.card.subtitle')}
              </p>
            </div>
          </div>

          <div className="bg-surface/80 border-line flex flex-col gap-2 rounded-(--ds-radius-md) border p-4">
            <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
              {t('referral.share.card.codeLabel')}
            </p>
            <p
              className="text-foreground m-0 font-mono text-xl font-semibold tracking-wide tabular-nums"
              data-testid="referral-invite-code"
            >
              {referralCode || t('referral.codeUnavailable')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-foreground-muted m-0 text-xs font-medium uppercase tracking-wide">
                {t('referral.invite.rewardLabel')}
              </p>
              <p
                className="text-accent m-0 text-lg font-semibold tabular-nums"
                data-testid="referral-invite-reward"
              >
                {shareRewardLabel}
              </p>
            </div>
            {hubReferral ? (
              <p className="text-foreground-muted m-0 text-sm tabular-nums">
                {t('referral.share.card.invitedThisWeek', { count: hubReferral.totalInvited })}
              </p>
            ) : null}
          </div>

          <p className="text-foreground-muted m-0 text-xs tabular-nums">{shareQuotaLabel}</p>
          <p className="text-foreground-muted m-0 text-xs leading-relaxed">
            {t('earn.referral.disclosure')}
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
          data-testid="referral-invite-share"
          onClick={() => void shareInvite()}
        >
          <Share2 className="size-4" aria-hidden />
          {webShareAvailable ? t('referral.share.card.share') : t('referral.invite.copyLinkCta')}
        </Button>

        {canClaimShareReward ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            disabled={claimBusy}
            data-testid="referral-invite-claim"
            onClick={() => void claimShareReward()}
          >
            {t('referral.invite.claimShareReward')}
          </Button>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="flex-1"
            disabled={!referralCode}
            data-testid="referral-invite-copy-code"
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
            disabled={!referralCode}
            data-testid="referral-invite-copy-link"
            onClick={() => void copyInviteLink()}
          >
            <Copy className="size-4" aria-hidden />
            {t('earn.referral.copy')}
          </Button>
        </div>
      </div>

      {error ? (
        <p
          className="text-destructive m-0 text-sm"
          role="alert"
          data-testid="referral-invite-error"
        >
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
