import { Link } from '@tanstack/react-router';

import type { SportsFixtureSummary } from '@/features/sports/use-sports-betting';
import type { SportsSlipSelection } from '@/features/sports/use-sports-bet-slip-state';
import {
  formatSportsLiveScore,
  isSportsLiveInPlayStatus,
  resolveSportsLiveSuspendKind,
  resolveSportsLiveSuspendMessageKey,
  SPORTS_LIVE_BADGE_KEY,
  type SportsLiveFixtureState,
} from '@/domain/sports-live-surface-display-contract';
import { resolveSportsOddsCellDisplay } from '@/domain/sports-odds-freshness-display-contract';
import { resolveSportsLeagueLabelKey } from '@/domain/sports-page-display-contract';
import { Button } from '@/product/primitives/button';
import { Card } from '@/product/primitives/card';
import { EmptyState } from '@/product/primitives/empty-state';
import { QuadStreamLoading } from '@/product/primitives/quad-stream-loading';
import { cn } from '@/product/primitives/lib/cn';
import { SportsKickoffCountdown } from '@/product/surfaces/sports/sports-kickoff-countdown';
import type { MessageKey } from '@phonara/i18n';

type SportsFixtureBoardProps = {
  fixtures: SportsFixtureSummary[];
  loading: boolean;
  errorKey: MessageKey | null;
  selectedOutcomeIds: ReadonlySet<string>;
  sportsBlocked: boolean;
  onToggleSelection: (leg: SportsSlipSelection) => void;
  onRetry: () => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  /** Sports#2 — optional live-state overlay for /sports/live rows. */
  liveStatesByFixtureId?: ReadonlyMap<string, SportsLiveFixtureState>;
  /** Injected clock for H-05 freshness tests; production omits (Date.now). */
  nowMs?: number;
  className?: string;
};

function formatKickoff(iso: string, locale: 'ko' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function buildSelectionLeg(
  fixture: SportsFixtureSummary,
  selection: 'home' | 'draw' | 'away',
  outcomeId: string,
  odds: string,
): SportsSlipSelection {
  return {
    outcomeId,
    oddsAtBet: odds,
    fixtureId: fixture.fixture_id,
    homeName: fixture.home_name,
    awayName: fixture.away_name,
    selection,
    marketType: 'match_1x2',
  };
}

function resolveRowLiveState(
  fixture: SportsFixtureSummary,
  liveStatesByFixtureId?: ReadonlyMap<string, SportsLiveFixtureState>,
): SportsLiveFixtureState | null {
  return liveStatesByFixtureId?.get(fixture.fixture_id) ?? null;
}

export function SportsFixtureBoard({
  fixtures,
  loading,
  errorKey,
  selectedOutcomeIds,
  sportsBlocked,
  onToggleSelection,
  onRetry,
  t,
  liveStatesByFixtureId,
  nowMs,
  className,
}: SportsFixtureBoardProps) {
  if (loading) {
    return (
      <QuadStreamLoading
        className={cn('py-6', className)}
        compact
        testId="sports-fixture-loading"
      />
    );
  }

  if (errorKey) {
    return (
      <div
        className={cn(
          'border-danger/30 bg-surface flex flex-col gap-3 rounded-lg border p-4',
          className,
        )}
        data-testid="sports-fixture-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(errorKey)}</p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          {t('state.empty.action.retry')}
        </Button>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <EmptyState
        className={className}
        domain="sports"
        title={t('state.empty.title')}
        description={t('sports.empty.league')}
        actionLabel={t('state.empty.action.retry')}
        onAction={onRetry}
        testId="sports-fixture-empty"
      />
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} data-testid="sports-fixture-board">
      {fixtures.map((fixture) => {
        const odds = fixture.match_1x2;
        const kickoff = formatKickoff(fixture.kickoff_at, 'ko');
        const liveState = resolveRowLiveState(fixture, liveStatesByFixtureId);
        const score = formatSportsLiveScore(
          liveState?.result_home_goals ?? fixture.result_home_goals,
          liveState?.result_away_goals ?? fixture.result_away_goals,
        );
        const suspendSource: SportsLiveFixtureState | null =
          liveState ??
          (fixture.suspended_until
            ? {
                fixture_id: fixture.fixture_id,
                league_code: fixture.league_code,
                home_name: fixture.home_name,
                away_name: fixture.away_name,
                kickoff_at: fixture.kickoff_at,
                status: fixture.status,
                suspended_until: fixture.suspended_until ?? null,
                suspend_reason: fixture.suspend_reason ?? null,
                result_home_goals: fixture.result_home_goals ?? null,
                result_away_goals: fixture.result_away_goals ?? null,
                markets: [],
              }
            : null);
        const suspendKind = resolveSportsLiveSuspendKind(suspendSource);
        const suspendKey = resolveSportsLiveSuspendMessageKey(suspendKind);
        const showLiveBadge = isSportsLiveInPlayStatus(liveState?.status ?? fixture.status);
        const marketsSuspended = suspendKind !== null;

        return (
          <Card
            key={fixture.fixture_id}
            variant="sports-odds"
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2"
            data-testid={`sports-fixture-row-${fixture.fixture_id}`}
            data-live={showLiveBadge ? 'true' : 'false'}
            data-suspend-kind={suspendKind ?? 'none'}
          >
            <div className="min-w-0">
              <p className="text-foreground-muted m-0 flex flex-wrap items-center gap-1.5 text-xs">
                {showLiveBadge ? (
                  <span
                    className="bg-danger/15 text-danger inline-flex rounded-sm px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wide uppercase"
                    data-testid={`sports-live-row-badge-${fixture.fixture_id}`}
                  >
                    {t(SPORTS_LIVE_BADGE_KEY)}
                  </span>
                ) : null}
                <span className="inline-flex flex-wrap items-center gap-1">
                  <span>{t(resolveSportsLeagueLabelKey(fixture.league_code))} ·</span>
                  {showLiveBadge ? (
                    <span className="tabular-nums">{kickoff}</span>
                  ) : (
                    <SportsKickoffCountdown
                      kickoffAt={fixture.kickoff_at}
                      staticLabel={kickoff}
                      t={t}
                      data-testid={`sports-kickoff-countdown-${fixture.fixture_id}`}
                    />
                  )}
                </span>
                {score ? (
                  <span
                    className="text-foreground font-semibold tabular-nums"
                    data-testid={`sports-live-row-score-${fixture.fixture_id}`}
                  >
                    {score}
                  </span>
                ) : null}
              </p>
              <Link
                to="/sports/fixture/$fixtureId"
                params={{ fixtureId: fixture.fixture_id }}
                className="text-foreground hover:text-accent m-0 block truncate text-sm font-medium no-underline"
                data-testid={`sports-fixture-link-${fixture.fixture_id}`}
              >
                {fixture.home_name} {t('sports.fixture.vs')} {fixture.away_name}
              </Link>
              {suspendKey ? (
                <p
                  className="text-warning m-0 mt-0.5 text-xs"
                  data-testid={`sports-live-row-suspend-${fixture.fixture_id}`}
                >
                  {t(suspendKey)}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1" data-testid="sports-fixture-odds">
              {(['home', 'draw', 'away'] as const).map((selection) => {
                const cell = odds?.[selection];
                const cellDisplay = resolveSportsOddsCellDisplay({
                  odds: cell?.odds,
                  capturedAt: cell?.captured_at,
                  isLive: showLiveBadge,
                  nowMs,
                });
                if (!cell?.outcome_id || !cellDisplay.selectable) {
                  return (
                    <span
                      key={selection}
                      className="text-foreground-muted inline-flex min-w-14 items-center justify-center px-2 py-1 text-xs"
                      data-testid={`sports-odds-${fixture.fixture_id}-${selection}`}
                      data-odds-freshness={cellDisplay.kind}
                    >
                      {cellDisplay.display}
                    </span>
                  );
                }
                const active = selectedOutcomeIds.has(cell.outcome_id);
                const labelKey =
                  selection === 'home'
                    ? 'sports.market.home'
                    : selection === 'draw'
                      ? 'sports.market.draw'
                      : 'sports.market.away';
                return (
                  <Button
                    key={selection}
                    type="button"
                    size="sm"
                    variant={active ? 'primary' : 'outline'}
                    className="min-w-14 tabular-nums"
                    data-testid={`sports-odds-${fixture.fixture_id}-${selection}`}
                    data-odds-freshness={cellDisplay.kind}
                    aria-pressed={active}
                    disabled={sportsBlocked || marketsSuspended}
                    onClick={() =>
                      onToggleSelection(
                        buildSelectionLeg(fixture, selection, cell.outcome_id, cellDisplay.display),
                      )
                    }
                  >
                    <span className="sr-only">{t(labelKey)}</span>
                    {cellDisplay.display}
                  </Button>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
