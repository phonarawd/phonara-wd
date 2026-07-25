import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Trophy } from 'lucide-react';

import {
  REFERRAL_LEADERBOARD_DEFER_BODY_KEY,
  REFERRAL_LEADERBOARD_DEFER_TITLE_KEY,
  REFERRAL_LEADERBOARD_EMPTY_LIVE_BODY_KEY,
  REFERRAL_LEADERBOARD_EMPTY_LIVE_TITLE_KEY,
  REFERRAL_LEADERBOARD_ENGINE_TODO,
  REFERRAL_LEADERBOARD_SELF_TITLE_KEY,
  REFERRAL_LEADERBOARD_SEO_DESCRIPTION_KEY,
  REFERRAL_LEADERBOARD_SEO_TITLE_KEY,
  REFERRAL_LEADERBOARD_UI_UNLOCK_TODO,
  resolveReferralLeaderboardBackRoute,
  resolveReferralLeaderboardWindowKey,
  type ReferralLeaderboardEntryView,
} from '@/domain/referral-leaderboard-display-contract';
import { useReferralLeaderboardController } from '@/features/earn/use-referral-leaderboard-controller';
import { Button, buttonVariants } from '@/product/primitives/button';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function LeaderboardRow({ entry }: { entry: ReferralLeaderboardEntryView }) {
  return (
    <li
      className={cn(
        'border-border flex items-center justify-between gap-3 border-b px-1 py-3 last:border-b-0',
        entry.isSelf && 'bg-accent/5 rounded-md',
      )}
      data-testid={`referral-leaderboard-row-${entry.rank}`}
      data-self={entry.isSelf ? 'true' : 'false'}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-foreground w-8 shrink-0 text-sm font-semibold tabular-nums">
          {entry.rank}
        </span>
        <span className="text-foreground truncate text-sm font-medium">{entry.displayName}</span>
      </div>
      <span
        className="text-foreground-muted shrink-0 text-sm tabular-nums"
        data-testid={`referral-leaderboard-count-${entry.rank}`}
      >
        {entry.qualifiedCount}
      </span>
    </li>
  );
}

/** Canonical `/referral/leaderboard` — E5 live rank list (qualified invites only). */
export function ReferralLeaderboardPage() {
  const engine = useReferralLeaderboardController();
  const {
    t,
    deferred,
    live,
    window: rankWindow,
    windows,
    setWindow,
    loading,
    errorKey,
    snapshot,
  } = engine;
  const backRoute = resolveReferralLeaderboardBackRoute();
  const entries = snapshot?.entries ?? [];
  const self = snapshot?.self ?? null;

  useEffect(() => {
    document.title = t(REFERRAL_LEADERBOARD_SEO_TITLE_KEY);
  }, [t]);

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-ds-8 py-4 md:py-6"
      data-testid="referral-leaderboard-page"
      data-engine-todo={REFERRAL_LEADERBOARD_ENGINE_TODO}
      data-ui-unlock-todo={REFERRAL_LEADERBOARD_UI_UNLOCK_TODO}
      data-deferred={deferred ? 'true' : 'false'}
      data-live={live ? 'true' : 'false'}
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

      {deferred ? (
        <div data-testid="referral-leaderboard-defer">
          <EmptyState
            title={t(REFERRAL_LEADERBOARD_DEFER_TITLE_KEY)}
            description={t(REFERRAL_LEADERBOARD_DEFER_BODY_KEY)}
            actionLabel={t('earn.subnav.referral')}
            onAction={() => {
              globalThis.location.assign(backRoute);
            }}
            testId="referral-leaderboard-empty"
          />
        </div>
      ) : null}

      {live && !deferred ? (
        <>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label={t('referral.leaderboard.window.rail')}
            data-testid="referral-leaderboard-windows"
          >
            {windows.map((w) => (
              <Button
                key={w}
                type="button"
                size="sm"
                variant={rankWindow === w ? 'primary' : 'ghost'}
                aria-pressed={rankWindow === w}
                data-testid={`referral-leaderboard-window-${w}`}
                onClick={() => setWindow(w)}
              >
                {t(resolveReferralLeaderboardWindowKey(w))}
              </Button>
            ))}
          </div>

          {self ? (
            <Card data-testid="referral-leaderboard-self">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {t(REFERRAL_LEADERBOARD_SELF_TITLE_KEY)}
                </CardTitle>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="tabular-nums font-semibold">#{self.rank}</span>
                  <span className="text-foreground truncate">{self.displayName}</span>
                  <span className="text-foreground-muted tabular-nums">
                    {t('referral.leaderboard.col.count')}: {self.qualifiedCount}
                  </span>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {loading ? (
            <div className="flex flex-col gap-2" data-testid="referral-leaderboard-loading">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : null}

          {errorKey ? (
            <p
              className="text-danger m-0 text-sm"
              role="alert"
              data-testid="referral-leaderboard-error"
            >
              {t(errorKey)}
            </p>
          ) : null}

          {!loading && !errorKey && entries.length === 0 ? (
            <EmptyState
              title={t(REFERRAL_LEADERBOARD_EMPTY_LIVE_TITLE_KEY)}
              description={t(REFERRAL_LEADERBOARD_EMPTY_LIVE_BODY_KEY)}
              actionLabel={t('earn.subnav.referral')}
              onAction={() => {
                globalThis.location.assign(backRoute);
              }}
              testId="referral-leaderboard-empty-live"
            />
          ) : null}

          {!loading && entries.length > 0 ? (
            <Card data-testid="referral-leaderboard-list">
              <CardHeader className="pb-2">
                <div className="text-foreground-muted flex items-center justify-between gap-2 text-xs font-medium tracking-wide uppercase">
                  <span>{t('referral.leaderboard.col.rank')}</span>
                  <span>{t('referral.leaderboard.col.name')}</span>
                  <span>{t('referral.leaderboard.col.count')}</span>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <ol className="m-0 list-none p-0">
                  {entries.map((entry) => (
                    <LeaderboardRow key={`${entry.rank}-${entry.displayName}`} entry={entry} />
                  ))}
                </ol>
              </CardBody>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
