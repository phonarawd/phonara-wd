import type {
  SportsMarketSummary,
  SportsMarketOutcome,
} from '@/features/sports/use-sports-betting';
import type { SportsSlipSelection } from '@/features/sports/use-sports-bet-slip-state';
import { SPORTS_HUB_FIXTURE_PRIMARY_MARKET } from '@/domain/sports-hub-pages-display-contract';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { cn } from '@/product/primitives/lib/cn';
import type { MessageKey } from '@phonara/i18n';

type SportsFixtureMarketsPanelProps = {
  fixtureId: string;
  homeName: string;
  awayName: string;
  markets: readonly SportsMarketSummary[];
  loading: boolean;
  errorKey: MessageKey | null;
  selectedOutcomeIds: ReadonlySet<string>;
  sportsBlocked: boolean;
  onToggleSelection: (leg: SportsSlipSelection) => void;
  onRetry: () => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  className?: string;
};

function selectionLabelKey(selection: string): MessageKey {
  if (selection === 'home') return 'sports.market.home';
  if (selection === 'draw') return 'sports.market.draw';
  if (selection === 'away') return 'sports.market.away';
  return 'sports.market.line';
}

function marketTitleKey(marketType: string): MessageKey {
  if (marketType === 'match_1x2') return 'sports.market.match_1x2';
  if (marketType === 'totals') return 'sports.market.totals';
  if (marketType === 'spread' || marketType === 'handicap' || marketType === 'asian_handicap') {
    return 'sports.market.spread';
  }
  if (marketType === 'btts') return 'sports.market.btts';
  return 'sports.market.props';
}

function buildLeg(
  fixtureId: string,
  homeName: string,
  awayName: string,
  marketType: string,
  outcome: SportsMarketOutcome,
): SportsSlipSelection | null {
  if (!outcome.outcome_id || !outcome.odds) return null;
  return {
    outcomeId: outcome.outcome_id,
    oddsAtBet: outcome.odds,
    fixtureId,
    homeName,
    awayName,
    selection: outcome.selection,
    marketType,
  };
}

/** Sports#0 fixture detail — match_1x2 primary; other markets listed read-only until Sports#1. */
export function SportsFixtureMarketsPanel({
  fixtureId,
  homeName,
  awayName,
  markets,
  loading,
  errorKey,
  selectedOutcomeIds,
  sportsBlocked,
  onToggleSelection,
  onRetry,
  t,
  className,
}: SportsFixtureMarketsPanelProps) {
  if (loading) {
    return (
      <div
        className={cn('text-foreground-muted p-4 text-sm', className)}
        data-testid="sports-fixture-markets-loading"
      >
        {t('sports.fixture.loadingOdds')}
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
        data-testid="sports-fixture-markets-error"
        role="alert"
      >
        <p className="text-foreground m-0 text-sm">{t(errorKey)}</p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          {t('state.empty.action.retry')}
        </Button>
      </div>
    );
  }

  const primary = markets.filter((m) => m.market_type === SPORTS_HUB_FIXTURE_PRIMARY_MARKET);
  const deferred = markets.filter((m) => m.market_type !== SPORTS_HUB_FIXTURE_PRIMARY_MARKET);

  if (markets.length === 0) {
    return (
      <p className="text-foreground-muted m-0 text-sm" data-testid="sports-fixture-markets-empty">
        {t('sports.fixture.noQuickOdds')}
      </p>
    );
  }

  return (
    <div
      className={cn('flex flex-col gap-3', className)}
      data-testid="sports-fixture-markets-panel"
    >
      {primary.map((market) => (
        <Card
          key={market.market_id}
          variant="sports-odds"
          data-testid={`sports-market-${market.market_id}`}
        >
          <CardHeader>
            <CardTitle className="text-base">{t(marketTitleKey(market.market_type))}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            {market.outcomes.map((outcome) => {
              const leg = buildLeg(fixtureId, homeName, awayName, market.market_type, outcome);
              if (!leg) {
                return (
                  <span
                    key={outcome.outcome_id ?? outcome.selection}
                    className="text-foreground-muted inline-flex min-w-14 items-center justify-center px-2 py-1 text-xs"
                  >
                    —
                  </span>
                );
              }
              const active = selectedOutcomeIds.has(leg.outcomeId);
              return (
                <Button
                  key={leg.outcomeId}
                  type="button"
                  size="sm"
                  variant={active ? 'primary' : 'outline'}
                  className="min-w-16 tabular-nums"
                  data-testid={`sports-fixture-odds-${leg.outcomeId}`}
                  aria-pressed={active}
                  disabled={sportsBlocked || market.status !== 'open'}
                  onClick={() => onToggleSelection(leg)}
                >
                  <span className="sr-only">{t(selectionLabelKey(outcome.selection))}</span>
                  {outcome.odds}
                </Button>
              );
            })}
          </CardBody>
        </Card>
      ))}

      {deferred.length > 0 ? (
        <div
          className="border-line bg-surface/50 rounded-(--ds-radius-md) border px-3 py-2"
          data-testid="sports-fixture-markets-deferred"
        >
          <p className="text-foreground-muted m-0 text-xs">{t('sports.fixture.marketsDeferred')}</p>
          <ul className="text-foreground-muted m-0 mt-1 list-inside list-disc text-xs">
            {deferred.map((market) => (
              <li key={market.market_id}>{t(marketTitleKey(market.market_type))}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
