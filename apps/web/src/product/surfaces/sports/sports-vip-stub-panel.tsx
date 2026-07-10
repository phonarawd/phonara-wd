import type { useSportsPageController } from '@/features/sports/use-sports-page-controller';
import { EmptyState } from '@/product/primitives/empty-state';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/product/primitives/card';

import {
  SPORTS_VIP_DEFER_REASON_KEY,
  SPORTS_VIP_ENGINE_TODO,
  SPORTS_VIP_UI_UNLOCK_TODO,
} from '@/domain/dead-controls-display-contract';
import {
  canBrowseSportsVipMarkets,
  SPORTS_VIP_ELIGIBILITY_BODY_KEY,
  SPORTS_VIP_ELIGIBILITY_TIER_KEY,
  SPORTS_VIP_ELIGIBILITY_TITLE_KEY,
  SPORTS_VIP_MIN_TIER,
} from '@/domain/sports-rules-and-vip-display-contract';

type SportsT = ReturnType<typeof useSportsPageController>['t'];

/**
 * `/sports/vip` STUB — Platinum+ eligibility strip (display-only) + defer empty state.
 * Markets stay closed until E4 Option B + E5 gap wire.
 */
export function SportsVipStubPanel({ t }: { t: SportsT }) {
  const marketsOpen = canBrowseSportsVipMarkets();

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="sports-vip-stub"
      data-engine-todo={SPORTS_VIP_ENGINE_TODO}
      data-ui-unlock-todo={SPORTS_VIP_UI_UNLOCK_TODO}
      data-vip-min-tier={SPORTS_VIP_MIN_TIER}
      data-vip-markets-open={marketsOpen ? 'true' : 'false'}
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

      <div data-testid="sports-vip-defer">
        <EmptyState
          title={t('sports.vip.defer.title')}
          description={t(SPORTS_VIP_DEFER_REASON_KEY)}
          actionLabel={t('sports.subnav.home')}
          onAction={() => {
            window.location.assign('/sports');
          }}
        />
      </div>
    </div>
  );
}
