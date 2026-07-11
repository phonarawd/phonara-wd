import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Trophy } from 'lucide-react';

import {
  REFERRAL_LEADERBOARD_DEFER_BODY_KEY,
  REFERRAL_LEADERBOARD_DEFER_TITLE_KEY,
  REFERRAL_LEADERBOARD_ENGINE_TODO,
  REFERRAL_LEADERBOARD_SEO_DESCRIPTION_KEY,
  REFERRAL_LEADERBOARD_SEO_TITLE_KEY,
  REFERRAL_LEADERBOARD_UI_UNLOCK_TODO,
  resolveReferralLeaderboardBackRoute,
  shouldDeferReferralLeaderboard,
} from '@/domain/referral-leaderboard-display-contract';
import { useT } from '@/product/i18n';
import { buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { cn } from '@/product/primitives/lib/cn';

/** Canonical `/referral/leaderboard` STUB — engine gap until E3/E5. */
export function ReferralLeaderboardPage() {
  const t = useT();
  const deferred = shouldDeferReferralLeaderboard();
  const backRoute = resolveReferralLeaderboardBackRoute();

  useEffect(() => {
    document.title = t(REFERRAL_LEADERBOARD_SEO_TITLE_KEY);
  }, [t]);

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4 md:py-6"
      data-testid="referral-leaderboard-page"
      data-engine-todo={REFERRAL_LEADERBOARD_ENGINE_TODO}
      data-ui-unlock-todo={REFERRAL_LEADERBOARD_UI_UNLOCK_TODO}
      data-deferred={deferred ? 'true' : 'false'}
    >
      <header className="flex flex-col gap-3">
        <Link
          to={backRoute}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground-muted w-fit px-0',
          )}
          data-testid="referral-leaderboard-back"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('referral.leaderboard.backToHub')}
        </Link>
        <div className="flex items-start gap-3">
          <div className="bg-accent/15 text-accent flex size-12 items-center justify-center rounded-full">
            <Trophy className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
              {t(REFERRAL_LEADERBOARD_SEO_TITLE_KEY)}
            </h1>
            <p className="text-foreground-muted m-0 text-sm leading-relaxed">
              {t(REFERRAL_LEADERBOARD_SEO_DESCRIPTION_KEY)}
            </p>
          </div>
        </div>
      </header>

      <Card data-testid="referral-leaderboard-eligibility">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('referral.leaderboard.strip.title')}</CardTitle>
          <CardDescription>{t('referral.leaderboard.strip.body')}</CardDescription>
        </CardHeader>
        <CardBody className="pt-0" />
      </Card>

      <div data-testid="referral-leaderboard-defer">
        <EmptyState
          title={t(REFERRAL_LEADERBOARD_DEFER_TITLE_KEY)}
          description={t(REFERRAL_LEADERBOARD_DEFER_BODY_KEY)}
          actionLabel={t('earn.subnav.referral')}
          onAction={() => {
            window.location.assign(backRoute);
          }}
          testId="referral-leaderboard-empty"
        />
      </div>
    </div>
  );
}
