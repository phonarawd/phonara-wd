import type {
  SportsMarketSummary,
  SportsMarketOutcome,
} from '@/features/sports/use-sports-betting';
import type { SportsSlipSelection } from '@/features/sports/use-sports-bet-slip-state';
import {
  isSportsBoardSelectableMarketType,
  SPORTS_BOARD_SELECTABLE_MARKET_TYPES,
} from '@/domain/sports-exchange-parity-display-contract';
import { resolveSportsOddsCellDisplay } from '@/domain/sports-odds-freshness-display-contract';
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
  /** True when fixture is in-play — live odds TTL. */
  isLive?: boolean;
  /** Injected clock for H-05 freshness tests. */
  nowMs?: number;
  className?: string;
};

function selectionLabelKey(selection: string): MessageKey {
  if (selection === 'home') return 'sports.market.home';
  if (selection === 'draw') return 'sports.market.draw';
  if (selection === 'away') return 'sports.market.away';
  if (selection === 'over') return 'sports.market.over';
  if (selection === 'under') return 'sports.market.under';
  if (selection === 'yes') return 'sports.market.yes';
  if (selection === 'no') return 'sports.market.no';
  if (selection === 'score') return 'sports.market.score';
  return 'sports.market.line';
}

function marketTitleKey(marketType: string): MessageKey {
  if (marketType === 'match_1x2') return 'sports.market.match_1x2';
  if (marketType === 'totals' || marketType === 'totals_2_5') return 'sports.market.totals';
  if (marketType === 'asian_handicap') return 'sports.market.asian_handicap';
  if (marketType === 'spread' || marketType === 'handicap') return 'sports.market.spread';
  if (marketType === 'btts' || marketType === 'both_teams_score') return 'sports.market.btts';
  if (marketType === 'correct_score') return 'sports.market.correct_score';
  if (marketType === 'prop_over_under' || marketType === 'prop_yes_no') {
    return 'sports.market.props';
  }
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

function outcomeButtonLabel(
  t: SportsFixtureMarketsPanelProps['t'],
  outcome: SportsMarketOutcome,
): string {
  const selection = t(selectionLabelKey(outcome.selection));
  const line = outcome.line?.trim();
  if (line) return `${selection} ${line}`;
  return selection;
}

function sortBoardMarkets(markets: readonly SportsMarketSummary[]): SportsMarketSummary[] {
  const order = new Map(SPORTS_BOARD_SELECTABLE_MARKET_TYPES.map((type, index) => [type, index]));
  return [...markets].sort((a, b) => {
    const ai = order.get(a.market_type as (typeof SPORTS_BOARD_SELECTABLE_MARKET_TYPES)[number]);
    const bi = order.get(b.market_type as (typeof SPORTS_BOARD_SELECTABLE_MARKET_TYPES)[number]);
    if (ai === undefined && bi === undefined) return 0;
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  });
}

/** Sports#1 fixture detail — multi-market board via rpc_get_fixture_markets (display-only odds). */
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
  isLive = false,
  nowMs,
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

  const selectable = sortBoardMarkets(
    markets.filter((m) => isSportsBoardSelectableMarketType(m.market_type)),
  );
  const unknown = markets.filter((m) => !isSportsBoardSelectableMarketType(m.market_type));

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
      {selectable.map((market) => (
        <Card
          key={market.market_id}
          variant="sports-odds"
          data-testid={`sports-market-${market.market_id}`}
          data-market-type={market.market_type}
        >
          <CardHeader>
            <CardTitle className="text-base">{t(marketTitleKey(market.market_type))}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            {market.outcomes.length === 0 ? (
              <p className="text-foreground-muted m-0 text-xs">{t('sports.fixture.noQuickOdds')}</p>
            ) : (
              market.outcomes.map((outcome) => {
                const cellDisplay = resolveSportsOddsCellDisplay({
                  odds: outcome.odds,
                  capturedAt: outcome.captured_at,
                  isLive,
                  nowMs,
                });
                const leg =
                  cellDisplay.selectable && outcome.outcome_id
                    ? buildLeg(fixtureId, homeName, awayName, market.market_type, {
                        ...outcome,
                        odds: cellDisplay.display,
                      })
                    : null;
                if (!leg) {
                  return (
                    <span
                      key={outcome.outcome_id ?? outcome.selection}
                      className="text-foreground-muted inline-flex min-w-14 items-center justify-center px-2 py-1 text-xs"
                      data-testid={`sports-fixture-odds-${outcome.outcome_id ?? outcome.selection}`}
                      data-odds-freshness={cellDisplay.kind}
                    >
                      {cellDisplay.display}
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
                    data-odds-freshness={cellDisplay.kind}
                    aria-pressed={active}
                    disabled={sportsBlocked || market.status !== 'open'}
                    onClick={() => onToggleSelection(leg)}
                  >
                    <span className="sr-only">{outcomeButtonLabel(t, outcome)}</span>
                    <span aria-hidden="true" className="flex flex-col items-center gap-0.5">
                      <span className="text-[0.65rem] leading-none font-normal">
                        {outcomeButtonLabel(t, outcome)}
                      </span>
                      <span>{cellDisplay.display}</span>
                    </span>
                  </Button>
                );
              })
            )}
          </CardBody>
        </Card>
      ))}

      {unknown.length > 0 ? (
        <div
          className="border-line bg-surface/50 rounded-(--ds-radius-md) border px-3 py-2"
          data-testid="sports-fixture-markets-unknown"
        >
          <p className="text-foreground-muted m-0 text-xs">{t('sports.fixture.marketsUnknown')}</p>
          <ul className="text-foreground-muted m-0 mt-1 list-inside list-disc text-xs">
            {unknown.map((market) => (
              <li key={market.market_id}>{market.market_type}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
