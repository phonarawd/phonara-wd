import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';

import { STAKING_HUB_ROUTE } from '@/domain/staking-display-contract';
import { useStakingPositionsPageController } from '@/features/earn/use-staking-positions-page-controller';
import { Button } from '@/product/primitives/button';
import { Skeleton } from '@/product/primitives/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { cn } from '@/product/primitives/lib/cn';

import { StakingPositionsPanel } from './staking-positions-panel';

function StakingPositionsLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="staking-positions-loading">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-11 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Canonical `/staking/positions` — staking positions read (P9 · ENGINE:exists). */
export function StakingPositionsPage() {
  const engine = useStakingPositionsPageController();
  const {
    t,
    authLoading,
    positionsLoading,
    positionsError,
    tierError,
    claimBlockedReason,
    positionActionsDisabled,
    activeTab,
    activePositions,
    unstakedPositions,
    activeCount,
    unstakedCount,
    actionBusy,
    isPositionClaimDisabled,
    setActiveTab,
    unstakePosition,
    claimReward,
    refresh,
  } = engine;

  const locale = typeof document !== 'undefined' ? document.documentElement.lang || 'ko' : 'ko';

  useEffect(() => {
    document.title = t('seo.staking.positions.title');
  }, [t]);

  if (authLoading || positionsLoading) {
    return <StakingPositionsLoadingShell />;
  }

  return (
    <div
      data-testid="staking-positions-page"
      className={cn(
        '@container mx-auto flex w-full max-w-4xl flex-col gap-4 py-4',
        'md:gap-5 md:py-5',
      )}
    >
      <header className="flex flex-col gap-2">
        <p className="text-accent m-0 text-xs font-semibold tracking-wide uppercase">
          {t('staking.hero.label')}
        </p>
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t('staking.myStaking')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t('seo.staking.positions.description')}
        </p>
        <Link
          to={STAKING_HUB_ROUTE}
          className="text-accent w-fit text-xs font-medium underline-offset-4 hover:underline"
          data-testid="staking-positions-hub-link"
        >
          {t('staking.stakeBtn')}
        </Link>
      </header>

      {positionsError ? (
        <div
          className="border-line bg-surface rounded-lg flex flex-col gap-3 border p-4"
          data-testid="staking-positions-error"
          role="alert"
          aria-live="polite"
        >
          <p className="text-foreground m-0 text-sm">{t('staking.positions.loadError')}</p>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active" data-testid="staking-positions-tab-active">
            {t('staking.positions.tabActive')}
            {activeCount > 0 ? (
              <span className="text-foreground-muted tabular-nums">({activeCount})</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="unstaked" data-testid="staking-positions-tab-unstaked">
            {t('staking.positions.tabUnstaked')}
            {unstakedCount > 0 ? (
              <span className="text-foreground-muted tabular-nums">({unstakedCount})</span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <StakingPositionsPanel
            positions={activePositions}
            t={t}
            locale={locale}
            emptyKey="staking.noneActive"
            showActions
            actionBusy={actionBusy}
            tierError={tierError}
            claimBlockedReason={claimBlockedReason}
            positionActionsDisabled={positionActionsDisabled}
            isPositionClaimDisabled={isPositionClaimDisabled}
            onClaimReward={(positionId) => void claimReward(positionId)}
            onUnstakePosition={(positionId) => void unstakePosition(positionId)}
          />
        </TabsContent>
        <TabsContent value="unstaked">
          <StakingPositionsPanel
            positions={unstakedPositions}
            t={t}
            locale={locale}
            emptyKey="staking.positions.emptyUnstaked"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
