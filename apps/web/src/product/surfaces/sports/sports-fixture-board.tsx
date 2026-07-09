import type { SportsFixtureSummary } from '@/features/sports/use-sports-betting';
import type { SportsSlipSelection } from '@/features/sports/use-sports-bet-slip-state';
import { resolveSportsLeagueLabelKey } from '@/domain/sports-page-display-contract';
import { Button } from '@/product/primitives/button';
import { Card } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';
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

export function SportsFixtureBoard({
  fixtures,
  loading,
  errorKey,
  selectedOutcomeIds,
  sportsBlocked,
  onToggleSelection,
  onRetry,
  t,
  className,
}: SportsFixtureBoardProps) {
  if (loading) {
    return (
      <div
        className={cn('text-foreground-muted p-4 text-sm', className)}
        data-testid="sports-fixture-loading"
      >
        {t('state.loading.title')}
      </div>
    );
  }

  if (errorKey) {
    return (
      <div
        className={cn(
          'border-danger/30 bg-surface flex flex-col gap-3 rounded-(--ds-radius-lg) border p-4',
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
      <div
        className={cn('text-foreground-muted p-4 text-sm', className)}
        data-testid="sports-fixture-empty"
      >
        {t('sports.empty.league')}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} data-testid="sports-fixture-board">
      {fixtures.map((fixture) => {
        const odds = fixture.match_1x2;
        const kickoff = formatKickoff(fixture.kickoff_at, 'ko');
        return (
          <Card
            key={fixture.fixture_id}
            variant="sports-odds"
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2"
            data-testid={`sports-fixture-row-${fixture.fixture_id}`}
          >
            <div className="min-w-0">
              <p className="text-foreground-muted m-0 text-xs">
                {t(resolveSportsLeagueLabelKey(fixture.league_code))} · {kickoff}
              </p>
              <p className="text-foreground m-0 truncate text-sm font-medium">
                {fixture.home_name} {t('sports.fixture.vs')} {fixture.away_name}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1" data-testid="sports-fixture-odds">
              {(['home', 'draw', 'away'] as const).map((selection) => {
                const cell = odds?.[selection];
                if (!cell?.outcome_id || !cell.odds) {
                  return (
                    <span
                      key={selection}
                      className="text-foreground-muted inline-flex min-w-14 items-center justify-center px-2 py-1 text-xs"
                    >
                      —
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
                    aria-pressed={active}
                    disabled={sportsBlocked}
                    onClick={() =>
                      onToggleSelection(
                        buildSelectionLeg(fixture, selection, cell.outcome_id, cell.odds),
                      )
                    }
                  >
                    <span className="sr-only">{t(labelKey)}</span>
                    {cell.odds}
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
