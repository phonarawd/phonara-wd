import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';

import { isSportsLiveInPlayStatus } from '@/domain/sports-live-surface-display-contract';
import {
  SPORTS_LEAGUE_FILTER_OPTIONS,
  resolveSportsLeagueLabelKey,
  type SportsLeagueFilter,
  type SportsPageMode,
} from '@/domain/sports-page-display-contract';
import {
  canBrowseSportsVipMarkets,
  SPORTS_RULES_SEO_TITLE_KEY,
  SPORTS_VIP_SEO_TITLE_KEY,
} from '@/domain/sports-rules-and-vip-display-contract';
import { useSportsPageController } from '@/features/sports/use-sports-page-controller';
import { Button } from '@/product/primitives/button';
import { Skeleton } from '@/product/primitives/skeleton';
import { cn } from '@/product/primitives/lib/cn';

import { SportsBetSlipPanel } from './sports-bet-slip-panel';
import { SportsFixtureBoard } from './sports-fixture-board';
import { SportsFixtureMarketsPanel } from './sports-fixture-markets-panel';
import { SportsLiveInPlayBanner } from './sports-live-inplay-banner';
import { SportsMyBetsPanel } from './sports-my-bets-panel';
import { SportsRulesPanel } from './sports-rules-panel';
import { SportsVipStubPanel } from './sports-vip-stub-panel';

export type SportsPageProps = {
  mode?: SportsPageMode;
  fixtureId?: string;
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

/** Canonical `/sports/**` sportsbook — fixtures · slip · dual stake currency (P10). */
export function SportsPage({ mode = 'home', fixtureId }: SportsPageProps) {
  const engine = useSportsPageController(mode, fixtureId);
  const { t, loading, mode: pageMode } = engine;

  useEffect(() => {
    if (pageMode === 'rules') {
      document.title = t(SPORTS_RULES_SEO_TITLE_KEY);
      return;
    }
    if (pageMode === 'vip') {
      document.title = t(SPORTS_VIP_SEO_TITLE_KEY);
      return;
    }
    document.title = t('seo.sports.title');
  }, [pageMode, t]);

  if (loading) {
    return <SportsLoadingShell />;
  }

  const showMyBets = pageMode === 'my-bets';
  const showRules = pageMode === 'rules';
  const showVip = pageMode === 'vip';
  const showFixture = pageMode === 'fixture';
  const showLive = pageMode === 'live';
  const showListBoard = !showMyBets && !showRules && !showVip && !showFixture;
  const vipBrowseOpen = showVip && canBrowseSportsVipMarkets();
  const showSlip = showListBoard || showFixture || vipBrowseOpen;
  const showLeagueRail = showListBoard;

  const fixtureHome = engine.activeFixture?.home_name ?? t('sports.market.home');
  const fixtureAway = engine.activeFixture?.away_name ?? t('sports.market.away');

  return (
    <div
      className={cn(
        'ds-sports-hub flex flex-col gap-4 py-4 lg:grid lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,18rem)] lg:items-start lg:gap-4 lg:py-6',
      )}
      data-testid="sports-page"
      data-sports-mode={pageMode}
      data-fixture-id={engine.fixtureId ?? undefined}
    >
      <header className="lg:col-span-3 space-y-1">
        <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
          {t('sports.hero.eyebrow')}
        </p>
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {showFixture
            ? `${fixtureHome} ${t('sports.fixture.vs')} ${fixtureAway}`
            : showRules
              ? t('sports.subnav.rules')
              : showVip
                ? t('sports.subnav.vip')
                : t('sports.hero.title')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {showFixture
            ? engine.activeFixture
              ? t(resolveSportsLeagueLabelKey(engine.activeFixture.league_code))
              : t('sports.fixture.detailFallback')
            : t('sports.hero.body')}
        </p>
        {showFixture ? (
          <Link
            to="/sports/prematch"
            className="text-accent m-0 inline-flex text-sm font-medium no-underline"
            data-testid="sports-fixture-back-prematch"
          >
            {t('sports.subnav.prematch')}
          </Link>
        ) : null}
      </header>

      {showLeagueRail ? (
        <aside className="hidden lg:block" data-testid="sports-left-rail">
          <SportsLeagueRail value={engine.leagueFilter} onChange={engine.setLeagueFilter} t={t} />
        </aside>
      ) : null}

      <main className={cn('min-w-0 flex flex-col gap-4', !showLeagueRail && 'lg:col-start-2')}>
        {showLive ? (
          <SportsLiveInPlayBanner
            state={engine.activeLiveState}
            showDelayNotice
            realtimeConnected={engine.realtimeConnected}
            stale={engine.liveStatesStale && !engine.liveStatesLoading}
            t={t}
          />
        ) : null}

        {showFixture && engine.activeLiveState ? (
          <SportsLiveInPlayBanner
            state={engine.activeLiveState}
            showDelayNotice={isSportsLiveInPlayStatus(engine.activeLiveState.status)}
            realtimeConnected={engine.realtimeConnected}
            stale={engine.liveStatesStale && !engine.liveStatesLoading}
            t={t}
          />
        ) : null}

        {showListBoard ? (
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
                {showLive ? t('sports.live.boardTitle') : t('sports.board.title')}
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
              liveStatesByFixtureId={showLive ? engine.liveStatesByFixtureId : undefined}
              t={t}
            />
          </>
        ) : null}

        {showFixture && engine.fixtureId ? (
          <SportsFixtureMarketsPanel
            fixtureId={engine.fixtureId}
            homeName={fixtureHome}
            awayName={fixtureAway}
            markets={engine.fixtureMarkets}
            loading={engine.fixtureMarketsLoading}
            errorKey={engine.fixtureMarketsErrorKey}
            selectedOutcomeIds={engine.selectedOutcomeIds}
            sportsBlocked={engine.sportsBlocked}
            onToggleSelection={engine.toggleSelection}
            onRetry={engine.refreshFixtureMarkets}
            isLive={Boolean(
              engine.activeLiveState && isSportsLiveInPlayStatus(engine.activeLiveState.status),
            )}
            t={t}
          />
        ) : null}

        {showMyBets ? (
          <SportsMyBetsPanel bets={engine.myBets} loading={engine.myBetsLoading} t={t} />
        ) : null}
        {showRules ? <SportsRulesPanel t={t} /> : null}
        {showVip ? (
          <SportsVipStubPanel
            t={t}
            fixtures={engine.fixtures}
            fixturesLoading={engine.fixturesLoading}
            fixturesErrorKey={engine.fixturesErrorKey}
            selectedOutcomeIds={engine.selectedOutcomeIds}
            sportsBlocked={engine.sportsBlocked}
            onToggleSelection={engine.toggleSelection}
            onRetryFixtures={engine.refreshFixtures}
          />
        ) : null}
      </main>

      {showSlip ? (
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
