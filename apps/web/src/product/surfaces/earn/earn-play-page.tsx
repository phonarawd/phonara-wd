import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Dices } from 'lucide-react';

import { EARN_HOME_CANONICAL_ROUTE } from '@/domain/earn-home-display-contract';
import {
  EARN_PLAY_SEO_DESCRIPTION_KEY,
  EARN_PLAY_SEO_TITLE_KEY,
} from '@/domain/earn-play-display-contract';
import { formatPhonRewardDisplay } from '@/domain/viral-missions-display-contract';
import { useEarnPlayPageController } from '@/features/earn/use-earn-play-page-controller';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

/** Canonical `/earn/play` — apptech free roulette (≠ casino `/games/roulette`). */
export function EarnPlayPage() {
  const engine = useEarnPlayPageController();
  const {
    t,
    loading,
    error,
    quota,
    lastSpin,
    spinBlocked,
    spinning,
    quotaLabel,
    spinRoulette,
  } = engine;

  useEffect(() => {
    document.title = t(EARN_PLAY_SEO_TITLE_KEY);
  }, [t]);

  if (loading) {
    return (
      <div
        className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4"
        data-testid="earn-play-loading"
      >
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4 md:py-6"
      data-testid="earn-play-page"
    >
      <header className="flex flex-col gap-3">
        <Link
          to={EARN_HOME_CANONICAL_ROUTE}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground-muted w-fit px-0',
          )}
          data-testid="earn-play-back"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('earn.play.backToHome')}
        </Link>
        <div className="flex flex-col gap-2">
          <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
            {t('events.roulette.eyebrow')}
          </p>
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t(EARN_PLAY_SEO_TITLE_KEY)}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(EARN_PLAY_SEO_DESCRIPTION_KEY)}
          </p>
        </div>
      </header>

      {error ? (
        <p className="text-danger m-0 text-sm" role="alert" data-testid="earn-play-error">
          {t(error)}
        </p>
      ) : null}

      <Card data-testid="earn-play-roulette">
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-accent/15 text-accent flex size-12 items-center justify-center rounded-full">
              <Dices className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-foreground m-0 text-lg font-semibold">
                {t('events.roulette.title')}
              </h2>
              <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                {t('events.roulette.subtitle')}
              </p>
            </div>
          </div>

          <p className="text-foreground m-0 text-sm font-medium tabular-nums" data-testid="earn-play-quota">
            {quotaLabel}
          </p>

          {quota != null && quota.remaining <= 0 ? (
            <p className="text-foreground-muted m-0 text-sm">{t('events.roulette.gate.used')}</p>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="min-h-12 w-full"
            disabled={spinBlocked}
            onClick={() => {
              void spinRoulette();
            }}
            data-testid="earn-play-spin"
          >
            {spinning ? t('earn.play.spinning') : t('earn.play.spinCta')}
          </Button>

          {lastSpin ? (
            <p
              className="text-foreground m-0 text-sm font-medium tabular-nums"
              data-testid="earn-play-last-spin"
            >
              {formatPhonRewardDisplay(lastSpin.phonAwarded)}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <p className="text-foreground-muted m-0 text-xs leading-relaxed">{t('earn.play.casinoNotice')}</p>
    </div>
  );
}
