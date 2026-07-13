import type { MessageKey } from '@phonara/i18n';
import { useQuery } from '@tanstack/react-query';

import type { useSportsPageController } from '@/features/sports/use-sports-page-controller';
import type { SportsFixtureSummary } from '@/features/sports/use-sports-betting';
import type { SportsSlipSelection } from '@/features/sports/use-sports-bet-slip-state';
import { EmptyState } from '@/product/primitives/empty-state';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';
import { Skeleton } from '@/product/primitives/skeleton';

import {
  SPORTS_VIP_ENGINE_TODO,
  SPORTS_VIP_UI_UNLOCK_TODO,
} from '@/domain/dead-controls-display-contract';
import {
  canBrowseSportsVipMarkets,
  isSportsVipEligibleTier,
  SPORTS_VIP_BOARD_TITLE_KEY,
  SPORTS_VIP_ELIGIBILITY_BODY_KEY,
  SPORTS_VIP_ELIGIBILITY_TIER_KEY,
  SPORTS_VIP_ELIGIBILITY_TITLE_KEY,
  SPORTS_VIP_INELIGIBLE_BODY_KEY,
  SPORTS_VIP_INELIGIBLE_TITLE_KEY,
  SPORTS_VIP_MIN_TIER,
} from '@/domain/sports-rules-and-vip-display-contract';
import { USER_TIER_SUMMARY_RPC } from '@/domain/tier-option-b-display-contract';
import { normalizeEarnVipTier } from '@/domain/unified-tier-display-contract';
import { callRpc } from '@/lib/rpc';

import { SportsFixtureBoard } from './sports-fixture-board';

type SportsT = ReturnType<typeof useSportsPageController>['t'];

type SportsVipPanelProps = {
  t: SportsT;
  fixtures: SportsFixtureSummary[];
  fixturesLoading: boolean;
  fixturesErrorKey: MessageKey | null;
  selectedOutcomeIds: ReadonlySet<string>;
  sportsBlocked: boolean;
  onToggleSelection: (leg: SportsSlipSelection) => void;
  onRetryFixtures: () => void;
};

async function fetchVipTier(): Promise<string> {
  const data = await callRpc(USER_TIER_SUMMARY_RPC);
  const payload = (data ?? {}) as Record<string, unknown>;
  const tier = payload['tier'];
  return normalizeEarnVipTier(typeof tier === 'string' ? tier : null);
}

/**
 * `/sports/vip` — Platinum+ eligibility + shared fixture browse (E5).
 * No dedicated VIP markets RPC — stake caps are Option B server-side.
 */
export function SportsVipStubPanel({
  t,
  fixtures,
  fixturesLoading,
  fixturesErrorKey,
  selectedOutcomeIds,
  sportsBlocked,
  onToggleSelection,
  onRetryFixtures,
}: SportsVipPanelProps) {
  const marketsOpen = canBrowseSportsVipMarkets();
  const tierQuery = useQuery({
    queryKey: ['sports-vip-tier'],
    queryFn: fetchVipTier,
    enabled: marketsOpen,
  });
  const tier = tierQuery.data ?? null;
  const eligible = marketsOpen && isSportsVipEligibleTier(tier);
  const tierLoading = marketsOpen && tierQuery.isLoading;

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="sports-vip-stub"
      data-engine-todo={SPORTS_VIP_ENGINE_TODO}
      data-ui-unlock-todo={SPORTS_VIP_UI_UNLOCK_TODO}
      data-vip-min-tier={SPORTS_VIP_MIN_TIER}
      data-vip-markets-open={marketsOpen ? 'true' : 'false'}
      data-vip-eligible={eligible ? 'true' : 'false'}
    >
      <Card data-testid="sports-vip-eligibility-strip">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t(SPORTS_VIP_ELIGIBILITY_TITLE_KEY)}</CardTitle>
          <CardDescription>{t(SPORTS_VIP_ELIGIBILITY_TIER_KEY)}</CardDescription>
        </CardHeader>
        <CardBody className="text-foreground-muted pt-0 text-sm leading-relaxed">
          <p className="m-0">{t(SPORTS_VIP_ELIGIBILITY_BODY_KEY)}</p>
        </CardBody>
      </Card>

      {!marketsOpen ? (
        <div data-testid="sports-vip-defer">
          <EmptyState
            domain="sports"
            title={t('sports.vip.defer.title')}
            description={t('sports.vip.defer.body')}
            actionLabel={t('sports.subnav.home')}
            onAction={() => {
              globalThis.location.assign('/sports');
            }}
            testId="sports-vip-empty"
          />
        </div>
      ) : null}

      {marketsOpen && tierLoading ? (
        <div className="flex flex-col gap-2" data-testid="sports-vip-tier-loading">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {marketsOpen && !tierLoading && !eligible ? (
        <div data-testid="sports-vip-ineligible">
          <EmptyState
            domain="sports"
            title={t(SPORTS_VIP_INELIGIBLE_TITLE_KEY)}
            description={t(SPORTS_VIP_INELIGIBLE_BODY_KEY)}
            actionLabel={t('sports.subnav.home')}
            onAction={() => {
              globalThis.location.assign('/sports');
            }}
            testId="sports-vip-ineligible-empty"
          />
        </div>
      ) : null}

      {marketsOpen && !tierLoading && eligible ? (
        <div className="flex flex-col gap-3" data-testid="sports-vip-board">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-foreground m-0 text-base font-semibold">
              {t(SPORTS_VIP_BOARD_TITLE_KEY)}
            </h2>
            <span className="text-foreground-muted text-xs tabular-nums">
              {t('sports.board.count', { count: fixtures.length })}
            </span>
          </div>
          <SportsFixtureBoard
            fixtures={fixtures}
            loading={fixturesLoading}
            errorKey={fixturesErrorKey}
            selectedOutcomeIds={selectedOutcomeIds}
            sportsBlocked={sportsBlocked}
            onToggleSelection={onToggleSelection}
            onRetry={onRetryFixtures}
            t={t}
          />
        </div>
      ) : null}
    </div>
  );
}
