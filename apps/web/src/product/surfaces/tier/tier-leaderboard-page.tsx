import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Trophy } from 'lucide-react';

import {
  TIER_LEADERBOARD_EMPTY_LIVE_BODY_KEY,
  TIER_LEADERBOARD_EMPTY_LIVE_TITLE_KEY,
  TIER_LEADERBOARD_ENGINE_TODO,
  TIER_LEADERBOARD_SELF_TITLE_KEY,
  TIER_LEADERBOARD_SEO_DESCRIPTION_KEY,
  TIER_LEADERBOARD_SEO_TITLE_KEY,
  TIER_LEADERBOARD_UI_UNLOCK_TODO,
  resolveTierLabelKey,
  resolveTierLeaderboardBackRoute,
  type TierLeaderboardEntryView,
} from '@/domain/tier-leaderboard-display-contract';
import { useTierLeaderboardController } from '@/features/earn/use-tier-leaderboard-controller';
import type { TranslateFn } from '@/product/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

function LeaderboardRow({ entry, t }: { entry: TierLeaderboardEntryView; t: TranslateFn }) {
  return (
    <li
      className={cn(
        'border-border flex items-center justify-between gap-3 border-b px-1 py-3 last:border-b-0',
        entry.isSelf && 'bg-accent/5 rounded-md',
      )}
      data-testid={`tier-leaderboard-row-${entry.rank}`}
      data-self={entry.isSelf ? 'true' : 'false'}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-foreground w-8 shrink-0 text-sm font-semibold tabular-nums">
          {entry.rank}
        </span>
        <div className="min-w-0">
          <span className="text-foreground block truncate text-sm font-medium">
            {entry.displayName}
          </span>
          <span className="text-foreground-muted text-xs">
            {t(resolveTierLabelKey(entry.tier))}
          </span>
        </div>
      </div>
      <span
        className="text-foreground-muted shrink-0 text-sm tabular-nums"
        data-testid={`tier-leaderboard-xp-${entry.rank}`}
      >
        {entry.xp.toLocaleString()}
      </span>
    </li>
  );
}

/** Canonical `/tier/leaderboard` — E10 live VIP XP rank list. */
export function TierLeaderboardPage() {
  const engine = useTierLeaderboardController();
  const { t, loading, errorKey, snapshot } = engine;
  const backRoute = resolveTierLeaderboardBackRoute();
  const entries = snapshot?.entries ?? [];
  const self = snapshot?.self ?? null;

  useEffect(() => {
    document.title = t(TIER_LEADERBOARD_SEO_TITLE_KEY);
  }, [t]);

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4 md:py-6"
      data-testid="tier-leaderboard-page"
      data-engine-todo={TIER_LEADERBOARD_ENGINE_TODO}
      data-ui-unlock-todo={TIER_LEADERBOARD_UI_UNLOCK_TODO}
    >
      <header className="flex flex-col gap-3">
        <Link
          to={backRoute}
          className="text-foreground-muted hover:text-foreground inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          data-testid="tier-leaderboard-back"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('tier.leaderboard.backToMe')}
        </Link>
        <div className="flex items-start gap-3">
          <div className="bg-accent/15 text-accent flex size-10 items-center justify-center rounded-full">
            <Trophy className="size-5" aria-hidden />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
              {t(TIER_LEADERBOARD_SEO_TITLE_KEY)}
            </h1>
            <p className="text-foreground-muted m-0 text-sm leading-relaxed">
              {t(TIER_LEADERBOARD_SEO_DESCRIPTION_KEY)}
            </p>
          </div>
        </div>
      </header>

      <Card data-testid="tier-leaderboard-eligibility">
        <CardHeader>
          <CardTitle className="text-base">{t('tier.leaderboard.strip.title')}</CardTitle>
          <CardDescription>{t('tier.leaderboard.strip.body')}</CardDescription>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-2" data-testid="tier-leaderboard-loading">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : null}

      {errorKey ? (
        <p className="text-danger m-0 text-sm" role="alert" data-testid="tier-leaderboard-error">
          {t(errorKey)}
        </p>
      ) : null}

      {!loading && !errorKey && entries.length === 0 ? (
        <EmptyState
          title={t(TIER_LEADERBOARD_EMPTY_LIVE_TITLE_KEY)}
          description={t(TIER_LEADERBOARD_EMPTY_LIVE_BODY_KEY)}
          actionLabel={t('tier.leaderboard.backToMe')}
          onAction={() => {
            window.location.assign(backRoute);
          }}
          testId="tier-leaderboard-empty-live"
        />
      ) : null}

      {self ? (
        <Card data-testid="tier-leaderboard-self">
          <CardHeader>
            <CardTitle className="text-base">{t(TIER_LEADERBOARD_SELF_TITLE_KEY)}</CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <LeaderboardRow entry={self} t={t} />
          </CardBody>
        </Card>
      ) : null}

      {!loading && entries.length > 0 ? (
        <Card data-testid="tier-leaderboard-list">
          <CardHeader className="pb-2">
            <div className="text-foreground-muted grid grid-cols-[2rem_1fr_auto] gap-3 text-xs font-medium uppercase tracking-wide">
              <span>{t('tier.leaderboard.col.rank')}</span>
              <span>{t('tier.leaderboard.col.player')}</span>
              <span>{t('tier.leaderboard.col.xp')}</span>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <ul className="m-0 list-none p-0">
              {entries.map((entry) => (
                <LeaderboardRow key={`${entry.rank}-${entry.displayName}`} entry={entry} t={t} />
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
