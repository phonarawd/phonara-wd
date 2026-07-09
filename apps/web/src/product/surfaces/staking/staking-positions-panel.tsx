import type { MessageKey } from '@phonara/i18n';

import type { StakingPositionRowView } from '@/domain/staking-display-contract';
import { resolveStakingPositionClaimBlockedReason } from '@/domain/trade-submit-display-contract';
import { Button } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { cn } from '@/product/primitives/lib/cn';

export type StakingPositionsPanelProps = {
  positions: StakingPositionRowView[];
  t: (key: MessageKey) => string;
  locale: string;
  className?: string;
  emptyKey?: MessageKey;
  showActions?: boolean;
  actionBusy?: boolean;
  tierError?: boolean;
  claimBlockedReason?: MessageKey | null;
  positionActionsDisabled?: boolean;
  isPositionClaimDisabled?: (row: StakingPositionRowView) => boolean;
  onClaimReward?: (positionId: string) => void;
  onUnstakePosition?: (positionId: string) => void;
};

function formatUnlockAt(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function StakingPositionsPanel({
  positions,
  t,
  locale,
  className,
  emptyKey = 'staking.noneActive',
  showActions = false,
  actionBusy = false,
  tierError = false,
  claimBlockedReason = null,
  positionActionsDisabled = false,
  isPositionClaimDisabled,
  onClaimReward,
  onUnstakePosition,
}: StakingPositionsPanelProps) {
  return (
    <section data-testid="staking-positions-panel" className={cn('flex flex-col gap-3', className)}>
      {positions.length === 0 ? (
        <Card data-testid="staking-positions-empty">
          <CardBody>
            <p className="text-foreground-muted m-0 text-sm">{t(emptyKey)}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {claimBlockedReason ? (
            <p className="text-warning m-0 text-sm" data-testid="staking-claim-blocked-reason">
              {t(claimBlockedReason)}
            </p>
          ) : null}
          {positions.map((row) => (
            <Card key={row.id} data-testid={`staking-position-${row.id}`}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground m-0 text-sm font-semibold">{row.poolLabel}</p>
                    <span className="bg-surface-raised text-foreground-muted rounded-full px-2 py-0.5 text-xs font-medium">
                      {t(row.termLabelKey)}
                    </span>
                    <span className="bg-surface-raised text-foreground-muted rounded-full px-2 py-0.5 text-xs font-medium">
                      {t(row.statusKey)}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-foreground-muted m-0 text-xs">{t('staking.principal')}</p>
                      <MoneyDisplay amount={row.principalDisplay} currency={row.stakeCurrency} />
                    </div>
                    <div>
                      <p className="text-foreground-muted m-0 text-xs">
                        {t('staking.rewardReceived')}
                      </p>
                      <MoneyDisplay
                        amount={row.rewardClaimedDisplay}
                        currency={row.stakeCurrency}
                      />
                    </div>
                    <div>
                      <p className="text-foreground-muted m-0 text-xs">{t('trade.staking.apr')}</p>
                      <p className="text-foreground m-0 tabular-nums">{row.aprSnapshotDisplay}</p>
                    </div>
                  </div>
                  {row.unlockAt ? (
                    <p className="text-foreground-muted m-0 text-xs">
                      {t('staking.unlockAt')}: {formatUnlockAt(row.unlockAt, locale)}
                    </p>
                  ) : null}
                </div>
                {showActions ? (
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const rowClaimBlockedReason = resolveStakingPositionClaimBlockedReason({
                        tierError,
                        pendingRewardDisplay: row.pendingRewardDisplay,
                      });
                      return rowClaimBlockedReason && !claimBlockedReason ? (
                        <p
                          className="text-warning m-0 w-full text-xs"
                          data-testid={`staking-claim-blocked-reason-${row.id}`}
                        >
                          {t(rowClaimBlockedReason)}
                        </p>
                      ) : null;
                    })()}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={actionBusy}
                      disabled={isPositionClaimDisabled?.(row) ?? false}
                      onClick={() => onClaimReward?.(row.id)}
                      data-testid={`staking-claim-${row.id}`}
                    >
                      {t('staking.claimReward')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={actionBusy}
                      disabled={row.locked || positionActionsDisabled}
                      onClick={() => onUnstakePosition?.(row.id)}
                      data-testid={`staking-unstake-${row.id}`}
                    >
                      {t('staking.unstake')}
                    </Button>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </>
      )}
    </section>
  );
}
