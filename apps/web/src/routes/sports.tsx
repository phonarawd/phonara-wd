import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { Badge, Button, Card, ErrorState, Skeleton } from '@phonara/ui';
import { useI18n, useT } from '../lib/i18n';
import { AppShell } from '../components/app-shell';
import {
  useGetFixtureMarkets,
  useListSportsFixtures,
  type SportsFixtureSummary,
  type SportsMarketSummary,
} from '../features/sports/use-sports-betting';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sports',
  component: SportsPage,
});

function formatKickoff(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function OddsCell({
  label,
  odds,
  flash,
}: {
  readonly label: string;
  readonly odds?: string | null;
  readonly flash?: 'up' | 'down' | null;
}) {
  const flashClass =
    flash === 'up' ? 'text-up animate-pulse' : flash === 'down' ? 'text-down animate-pulse' : 'text-fg';

  return (
    <div className="grid min-w-18 gap-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-center">
      <span className="text-[11px] text-muted">{label}</span>
      <span className={`font-mono text-sm font-medium tabular-nums ${flashClass}`}>
        {odds ?? '—'}
      </span>
    </div>
  );
}

function pickPrimaryMarket(markets: readonly SportsMarketSummary[] | undefined): SportsMarketSummary | undefined {
  if (!markets?.length) return undefined;
  return (
    markets.find((market) => market.market_type === 'match_1x2') ??
    markets.find((market) => market.market_type.startsWith('totals_')) ??
    markets[0]
  );
}

function outcomeOdds(
  market: SportsMarketSummary | undefined,
  selection: string,
): string | null | undefined {
  return market?.outcomes.find((outcome) => outcome.selection === selection)?.odds;
}

function FixtureRow({ fixture, locale }: { readonly fixture: SportsFixtureSummary; readonly locale: string }) {
  const t = useT();
  const { data: markets } = useGetFixtureMarkets(fixture.fixture_id);
  const prevOddsRef = useRef<Record<string, string>>({});
  const primaryMarket = pickPrimaryMarket(markets);

  const flashBySelection = useMemo(() => {
    const flashes: Record<string, 'up' | 'down' | null> = {};
    for (const outcome of primaryMarket?.outcomes ?? []) {
      const key = `${fixture.fixture_id}:${outcome.selection}`;
      const prev = prevOddsRef.current[key];
      const next = outcome.odds;
      if (prev && next && prev !== next) {
        flashes[outcome.selection] = Number(next) > Number(prev) ? 'up' : 'down';
      }
      if (next) prevOddsRef.current[key] = next;
    }
    return flashes;
  }, [fixture.fixture_id, primaryMarket]);

  const isMoneyline = primaryMarket?.market_type === 'match_1x2';
  const isTotals = primaryMarket?.market_type.startsWith('totals_') ?? false;
  const latestCapturedAt = primaryMarket?.outcomes.find((outcome) => outcome.captured_at)?.captured_at;

  return (
    <Card className="grid gap-3 p-4" data-testid="sports-fixture-row">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{fixture.league_code}</p>
          <p className="mt-1 text-base font-medium text-fg">
            {fixture.home_name} <span className="text-muted">vs</span> {fixture.away_name}
          </p>
          <p className="mt-1 text-xs text-muted">{formatKickoff(fixture.kickoff_at, locale)}</p>
        </div>
        <Badge tone="up">{fixture.status}</Badge>
      </div>

      {primaryMarket ? (
        <div className="flex flex-wrap gap-2">
          {isMoneyline ? (
            <>
              <OddsCell
                label={t('sports.market.home')}
                odds={outcomeOdds(primaryMarket, 'home')}
                flash={flashBySelection['home'] ?? null}
              />
              <OddsCell
                label={t('sports.market.draw')}
                odds={outcomeOdds(primaryMarket, 'draw')}
                flash={flashBySelection['draw'] ?? null}
              />
              <OddsCell
                label={t('sports.market.away')}
                odds={outcomeOdds(primaryMarket, 'away')}
                flash={flashBySelection['away'] ?? null}
              />
            </>
          ) : null}
          {isTotals ? (
            <>
              <OddsCell
                label={t('sports.market.over')}
                odds={outcomeOdds(primaryMarket, 'over')}
                flash={flashBySelection['over'] ?? null}
              />
              <OddsCell
                label={t('sports.market.under')}
                odds={outcomeOdds(primaryMarket, 'under')}
                flash={flashBySelection['under'] ?? null}
              />
            </>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">{t('sports.fixture.loadingOdds')}</p>
      )}

      {latestCapturedAt ? (
        <p className="text-[11px] text-muted">
          {t('sports.fixture.updatedAt', {
            time: formatKickoff(latestCapturedAt, locale),
          })}
        </p>
      ) : null}
    </Card>
  );
}

function SportsPage() {
  const t = useT();
  const { locale } = useI18n();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: fixtures, isLoading, isError, refetch, dataUpdatedAt } = useListSportsFixtures();

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  if (authLoading || !session) {
    return (
      <AppShell active="more">
        <div className="surface-earn app-page" aria-busy="true" />
      </AppShell>
    );
  }

  return (
    <AppShell active="more">
      <div className="surface-earn app-page pn-anim-rise" data-testid="sports-page">
        <section className="app-section" aria-labelledby="sports-page-title">
          <Card className="grid gap-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted">{t('sports.nav.eyebrow')}</p>
                <h1 id="sports-page-title" className="mt-1 text-xl font-medium text-fg">
                  {t('sports.nav.title')}
                </h1>
                <p className="mt-2 text-sm text-muted">{t('sports.nav.subtitle')}</p>
              </div>
              <Badge tone="up">{t('sports.live.badge')}</Badge>
            </div>
            <p className="text-xs text-muted">
              {t('sports.live.lastSync', {
                time: new Intl.DateTimeFormat(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }).format(dataUpdatedAt),
              })}
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
              {t('common.retry')}
            </Button>
          </Card>
        </section>

        <section className="app-section grid gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </>
          ) : null}

          {isError ? (
            <ErrorState
              title={t('sports.errors.loadFailed')}
              description={t('sports.errors.loadFailedHint')}
              actionLabel={t('common.retry')}
              onAction={() => void refetch()}
            />
          ) : null}

          {!isLoading && !isError && (fixtures?.length ?? 0) === 0 ? (
            <Card className="p-5 text-sm text-muted">{t('sports.fixture.empty')}</Card>
          ) : null}

          {fixtures?.map((fixture) => (
            <FixtureRow key={fixture.fixture_id} fixture={fixture} locale={locale} />
          ))}
        </section>

        <section className="app-section">
          <Card className="grid gap-2 p-5 text-sm text-muted">
            <p>{t('sports.disclaimer.freeFeed')}</p>
            <p>
              {t('sports.disclaimer.quota')}{' '}
              <Link to="/more" className="text-primary underline-offset-2 hover:underline">
                {t('nav.more')}
              </Link>
            </p>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
