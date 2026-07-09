import { useCallback, useEffect, useMemo, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  listActiveStakingPositions,
  listUnstakedStakingPositions,
  mapStakingPositionRow,
  type StakingPositionRowView,
} from '@/domain/staking-display-contract';
import {
  resolveStakingClaimBlockedReason,
  resolveStakingPositionActionsDisabled,
  resolveStakingPositionClaimDisabled,
} from '@/domain/trade-submit-display-contract';
import { useStakingActions, useStakingPositions } from '@/hooks/use-trading';
import { useT } from '@/product/i18n';
import {
  showTradeFeedback,
  showTradeRpcErrorFeedback,
} from '@/features/trading/trade-feedback-display';

import { fetchStakingTier, stakingPageKeys } from './use-staking-page-controller';

export type StakingPositionsTab = 'active' | 'unstaked';

export type StakingPositionsPageControllerView = {
  t: ReturnType<typeof useT>;
  authLoading: boolean;
  positionsLoading: boolean;
  positionsError: boolean;
  tierError: boolean;
  claimBlockedReason: MessageKey | null;
  positionActionsDisabled: boolean;
  activeTab: StakingPositionsTab;
  activePositions: StakingPositionRowView[];
  unstakedPositions: StakingPositionRowView[];
  activeCount: number;
  unstakedCount: number;
  actionBusy: boolean;
  isPositionClaimDisabled: (row: StakingPositionRowView) => boolean;
  setActiveTab: (tab: StakingPositionsTab) => void;
  unstakePosition: (positionId: string) => Promise<void>;
  claimReward: (positionId: string) => Promise<void>;
  refresh: () => void;
};

export function useStakingPositionsPageController(): StakingPositionsPageControllerView {
  const t = useT();
  const qc = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const {
    positions,
    loading: positionsLoading,
    refresh: refreshPositions,
    isError: positionsError,
  } = useStakingPositions();
  const { unstake, claim, busy: actionBusy, error } = useStakingActions(refreshPositions);

  const { isError: tierError } = useQuery({
    queryKey: stakingPageKeys.tier(userId),
    queryFn: fetchStakingTier,
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (error) showTradeRpcErrorFeedback(error);
  }, [error]);

  const [activeTab, setActiveTab] = useState<StakingPositionsTab>('active');

  const activePositions = useMemo(
    () => listActiveStakingPositions(positions).map(mapStakingPositionRow),
    [positions],
  );
  const unstakedPositions = useMemo(
    () => listUnstakedStakingPositions(positions).map(mapStakingPositionRow),
    [positions],
  );

  const claimBlockedReason = useMemo(
    () => resolveStakingClaimBlockedReason(tierError),
    [tierError],
  );

  const positionActionsDisabled = useMemo(
    () => resolveStakingPositionActionsDisabled(tierError),
    [tierError],
  );

  const isPositionClaimDisabled = useCallback(
    (row: StakingPositionRowView) =>
      resolveStakingPositionClaimDisabled({
        tierError,
        pendingRewardDisplay: row.pendingRewardDisplay,
      }),
    [tierError],
  );

  const refresh = useCallback(() => {
    refreshPositions();
    void qc.invalidateQueries({ queryKey: stakingPageKeys.tier(userId) });
  }, [qc, refreshPositions, userId]);

  const unstakePosition = useCallback(
    async (positionId: string) => {
      if (positionActionsDisabled) return;
      const result = await unstake(positionId);
      if (result) {
        showTradeFeedback({ eventId: 'staking.unstaked' });
      }
    },
    [positionActionsDisabled, unstake],
  );

  const claimReward = useCallback(
    async (positionId: string) => {
      const row = activePositions.find((position) => position.id === positionId);
      if (!row || isPositionClaimDisabled(row)) return;
      const result = await claim(positionId);
      if (result?.['claimed'] === true) {
        showTradeFeedback({ eventId: 'staking.claimed' });
      } else if (result?.['claimed'] === false) {
        showTradeFeedback({ eventId: 'staking.claimNothing' });
      }
    },
    [activePositions, claim, isPositionClaimDisabled],
  );

  return {
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
    activeCount: activePositions.length,
    unstakedCount: unstakedPositions.length,
    actionBusy,
    isPositionClaimDisabled,
    setActiveTab,
    unstakePosition,
    claimReward,
    refresh,
  };
}
