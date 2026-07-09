import { useEffect } from 'react';

import {
  SPORTS_VIP_DEFER_REASON_KEY,
  SPORTS_VIP_ENGINE_TODO,
  SPORTS_VIP_UI_UNLOCK_TODO,
} from '@/domain/dead-controls-display-contract';
import {
  SPORTS_LEAGUE_FILTER_OPTIONS,
  type SportsLeagueFilter,
  type SportsPageMode,
} from '@/domain/sports-page-display-contract';
import { useSportsPageController } from '@/features/sports/use-sports-page-controller';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import { SportsBetSlipPanel } from './sports-bet-slip-panel';
import { SportsFixtureBoard } from './sports-fixture-board';
import { SportsMyBetsPanel } from './sports-my-bets-panel';
import { EmptyState } from '@/product/primitives/empty-state';

export type SportsPageProps = {
  mode?: SportsPageMode;
};

function SportsLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="sports-page-loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

function SportsLeagueRail({
  value,
  onChange,
  t,
}: {
  value: SportsLeagueFilter;
  onChange: (value: SportsLeagueFilter) => void;
  t: ReturnType<typeof useSportsPageController>['t'];
}) {
  return (
    <nav
      aria-label={t('sports.league.rail')}
      className="flex flex-col gap-1"
      data-testid="sports-league-rail"
    >
      {SPORTS_LEAGUE_FILTER_OPTIONS.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={value === option ? 'primary' : 'ghost'}
          className="justify-start"
          data-testid={`sports-league-${option}`}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {t(option === 'all' ? 'sports.league.all' : (`sports.league.${option}` as const))}
        </Button>
      ))}
    </nav>
  );
}

function SportsRulesPanel({ t }: { t: ReturnType<typeof useSportsPageController>['t'] }) {
  return (
    <Card data-testid="sports-rules-panel">
      <CardHeader>
        <CardTitle>{t('sports.subnav.rules')}</CardTitle>
      </CardHeader>
      <CardBody className="text-foreground-muted space-y-2 text-sm leading-relaxed">
        <p className="m-0">{t('sports.fixture.settlementNotice.finished')}</p>
        <p className="m-0">{t('sports.filter.display_only')}</p>
      </CardBody>
    </Card>
  );
}

function SportsVipDeferPanel({ t }: { t: ReturnType<typeof useSportsPageController>['t'] }) {
  return (
    <div
      data-testid="sports-vip-defer"
      data-engine-todo={SPORTS_VIP_ENGINE_TODO}
      data-ui-unlock-todo={SPORTS_VIP_UI_UNLOCK_TODO}
    >
      <EmptyState
        title={t('sports.vip.defer.title')}
        description={t(SPORTS_VIP_DEFER_REASON_KEY)}
        actionLabel={t('sports.subnav.home')}
        onAction={() => {
          window.location.assign('/sports');
        }}
      />
    </div>
  );
}

/** Canonical `/sports/**` sportsbook — fixtures · slip · dual stake currency (P10). */
export function SportsPage({ mode = 'home' }: SportsPageProps) {
  const engine = useSportsPageController(mode);
  const { t, loading, mode: pageMode } = engine;

  useEffect(() => {
    document.title = t('seo.sports.title');
  }, [t]);

  if (loading) {
    return <SportsLoadingShell />;
  }

  const showMyBets = pageMode === 'my-bets';
  const showRules = pageMode === 'rules';
  const showVip = pageMode === 'vip';
  const showBoard = !showMyBets && !showRules && !showVip;

  return (
    <div
      className={cn(
        'ds-sports-hub flex flex-col gap-4 py-4 lg:grid lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,18rem)] lg:items-start lg:gap-4 lg:py-6',
      )}
      data-testid="sports-page"
      data-sports-mode={pageMode}
    >
      <header className="lg:col-span-3 space-y-1">
        <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
          {t('sports.hero.eyebrow')}
        </p>
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t('sports.hero.title')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">{t('sports.hero.body')}</p>
      </header>

      {showBoard ? (
        <aside className="hidden lg:block" data-testid="sports-left-rail">
          <SportsLeagueRail value={engine.leagueFilter} onChange={engine.setLeagueFilter} t={t} />
        </aside>
      ) : null}

      <main className="min-w-0 flex flex-col gap-4">
        {showBoard ? (
          <>
            <div className="lg:hidden">
              <SportsLeagueRail
                value={engine.leagueFilter}
                onChange={engine.setLeagueFilter}
                t={t}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-foreground m-0 text-base font-semibold">
                {t('sports.board.title')}
              </h2>
              <span className="text-foreground-muted text-xs tabular-nums">
                {t('sports.board.count', { count: engine.fixtures.length })}
              </span>
            </div>
            <SportsFixtureBoard
              fixtures={engine.fixtures}
              loading={engine.fixturesLoading}
              errorKey={engine.fixturesErrorKey}
              selectedOutcomeIds={engine.selectedOutcomeIds}
              sportsBlocked={engine.sportsBlocked}
              onToggleSelection={engine.toggleSelection}
              onRetry={engine.refreshFixtures}
              t={t}
            />
          </>
        ) : null}

        {showMyBets ? (
          <SportsMyBetsPanel bets={engine.myBets} loading={engine.myBetsLoading} t={t} />
        ) : null}
        {showRules ? <SportsRulesPanel t={t} /> : null}
        {showVip ? <SportsVipDeferPanel t={t} /> : null}
      </main>

      {showBoard ? (
        <aside className="min-w-0" data-testid="sports-slip-rail">
          <SportsBetSlipPanel
            slip={engine.slip}
            phonAvail={engine.phonAvail}
            usdtAvail={engine.usdtAvail}
            sportsBlocked={engine.sportsBlocked}
            sportsBlockedKey={engine.sportsBlockedKey}
            canPlaceBet={engine.canPlaceBet}
            placeBetBusy={engine.placeBetBusy}
            confirmOpen={engine.confirmOpen}
            onConfirmOpenChange={engine.setConfirmOpen}
            onRequestPlaceBet={engine.requestPlaceBet}
            onConfirmPlaceBet={engine.confirmPlaceBet}
            t={t}
          />
        </aside>
      ) : null}
    </div>
  );
}
