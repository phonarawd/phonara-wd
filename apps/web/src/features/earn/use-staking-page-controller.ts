import { useCallback, useEffect, useMemo, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';

import {
  buildStakingPoolCardView,
  filterStakingPoolsByAssetAndCurrency,
  listActiveStakingPositions,
  listStakingReferenceAssets,
  mapStakingPositionRow,
  normalizeStakingTier,
  resolveNextStakingWizardStep,
  resolvePreviousStakingWizardStep,
  resolveStakingTierApyBonusKey,
  type StakingPoolCardView,
  type StakingPositionRowView,
  type StakingStakeCurrency,
  type StakingWizardStep,
} from '@/domain/staking-display-contract';

import {
  resolveStakingClaimBlockedReason,
  resolveStakingPositionActionsDisabled,
  resolveStakingPositionClaimDisabled,
  resolveStakingSubmitDisabled,
  resolveStakingSubmitDisabledReason,
} from '@/domain/trade-submit-display-contract';

import { parseEarnHubTierSnapshot } from '@/domain/tier-me-display-contract';

import type { EarnVipTier } from '@/domain/unified-tier-display-contract';

import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useClientGatePrechecks } from '@/hooks/use-client-gate-prechecks';

import {
  useStakingActions,
  useStakingPools,
  useStakingPositions,
  type StakingPool,
} from '@/hooks/use-trading';

import { useWallet } from '@/hooks/use-wallet';

import { isPositiveAmount } from '@/lib/money-display';

import { toDecimal } from '@phonara/money';

import { supabase } from '@/lib/supabase';

import { useT } from '@/product/i18n';

import {
  showTradeFeedback,
  showTradeRpcErrorFeedback,
} from '@/features/trading/trade-feedback-display';

export const stakingPageKeys = {
  tier: (userId: string | null) => ['staking-page-tier', userId] as const,
};

export async function fetchStakingTier(): Promise<EarnVipTier> {
  const { data, error } = await supabase.rpc('rpc_get_earn_hub_status');

  if (error) throw error;

  const snapshot = parseEarnHubTierSnapshot((data ?? {}) as Record<string, unknown>);

  return snapshot?.tier ?? 'bronze';
}

export type StakingPageControllerView = {
  t: ReturnType<typeof useT>;

  authLoading: boolean;

  loading: boolean;

  poolsError: boolean;

  positionsError: boolean;

  tierError: boolean;

  stakingBlocked: boolean;

  walletError: boolean;

  usdtAvailableDisplay: string | null;

  phonAvailableDisplay: string | null;

  availableDisplay: string | null;

  currentTier: EarnVipTier;

  tierApyBonusKey: MessageKey;

  referenceAssets: string[];

  selectedReferenceAsset: string | null;

  stakeCurrency: StakingStakeCurrency;

  poolCards: StakingPoolCardView[];

  selectedPool: StakingPool | null;

  selectedPoolId: string | null;

  stakeAmount: string;

  canStake: boolean;

  stakeBusy: boolean;

  actionBusy: boolean;

  activePositions: StakingPositionRowView[];

  confirmOpen: boolean;

  wizardStep: StakingWizardStep;

  submitDisabledReason: MessageKey | null;

  claimBlockedReason: MessageKey | null;

  positionActionsDisabled: boolean;

  insufficientAvail: boolean;

  selectReferenceAsset: (asset: string) => void;

  setStakeCurrency: (currency: StakingStakeCurrency) => void;

  selectPool: (poolId: string) => void;

  setStakeAmount: (value: string) => void;

  openStakeConfirm: () => void;

  closeStakeConfirm: () => void;

  goToWizardStep: (step: StakingWizardStep) => void;

  wizardNext: () => void;

  wizardBack: () => void;

  confirmStake: () => Promise<void>;

  unstakePosition: (positionId: string) => Promise<void>;

  claimReward: (positionId: string) => Promise<void>;

  isPositionClaimDisabled: (row: StakingPositionRowView) => boolean;

  refresh: () => void;
};

export function useStakingPageController(): StakingPageControllerView {
  const t = useT();

  const qc = useQueryClient();

  const { session, loading: authLoading } = useAuth();

  const userId = session?.user.id ?? null;

  const {
    wallet,
    loading: walletLoading,
    error: walletErrorKey,
    refetch: refetchWallet,
  } = useWallet();

  const {
    pools,
    loading: poolsLoading,
    isError: poolsFetchError,
    refetch: refetchPools,
  } = useStakingPools();

  const {
    positions,

    loading: positionsLoading,

    refresh: refreshPositions,

    isError: positionsError,
  } = useStakingPositions();

  const { stakingBlocked, loading: gatesLoading } = usePlatformGates();
  const { consentBlocked } = useClientGatePrechecks();

  const {
    data: tierData,

    isLoading: tierLoading,

    isError: tierError,
  } = useQuery({
    queryKey: stakingPageKeys.tier(userId),

    queryFn: fetchStakingTier,

    enabled: Boolean(userId),

    staleTime: 20_000,
  });

  const currentTier = normalizeStakingTier(tierData ?? 'bronze');

  const referenceAssets = useMemo(() => listStakingReferenceAssets(pools), [pools]);

  const [selectedReferenceAsset, setSelectedReferenceAsset] = useState<string | null>(null);

  const [stakeCurrency, setStakeCurrencyState] = useState<StakingStakeCurrency>('USDT');

  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  const [stakeAmount, setStakeAmount] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [wizardStep, setWizardStep] = useState<StakingWizardStep>('pool');

  useEffect(() => {
    if (selectedReferenceAsset !== null || referenceAssets.length === 0) return;

    setSelectedReferenceAsset(referenceAssets[0] ?? null);
  }, [referenceAssets, selectedReferenceAsset]);

  const filteredPools = useMemo(() => {
    if (!selectedReferenceAsset) return [];

    return filterStakingPoolsByAssetAndCurrency(pools, selectedReferenceAsset, stakeCurrency);
  }, [pools, selectedReferenceAsset, stakeCurrency]);

  useEffect(() => {
    if (!selectedReferenceAsset || filteredPools.length > 0) return;

    const phonPools = filterStakingPoolsByAssetAndCurrency(pools, selectedReferenceAsset, 'PHON');

    const usdtPools = filterStakingPoolsByAssetAndCurrency(pools, selectedReferenceAsset, 'USDT');

    if (stakeCurrency === 'USDT' && phonPools.length > 0 && usdtPools.length === 0) {
      setStakeCurrencyState('PHON');

      return;
    }

    if (stakeCurrency === 'PHON' && usdtPools.length > 0 && phonPools.length === 0) {
      setStakeCurrencyState('USDT');
    }
  }, [filteredPools.length, pools, selectedReferenceAsset, stakeCurrency]);

  const poolCards = useMemo(
    () => filteredPools.map((pool) => buildStakingPoolCardView(pool, currentTier)),

    [filteredPools, currentTier],
  );

  const selectedPool = useMemo(
    () => filteredPools.find((pool) => pool.id === selectedPoolId) ?? null,

    [filteredPools, selectedPoolId],
  );

  const refreshAll = useCallback(() => {
    refreshPositions();

    void refetchPools();

    void refetchWallet();

    void qc.invalidateQueries({ queryKey: stakingPageKeys.tier(userId) });
  }, [qc, refreshPositions, refetchPools, refetchWallet, userId]);

  useEffect(() => {
    if (selectedPoolId !== null || filteredPools.length === 0) return;

    setSelectedPoolId(filteredPools[0]!.id);
  }, [filteredPools, selectedPoolId]);

  useEffect(() => {
    if (!selectedPoolId) return;

    if (filteredPools.some((pool) => pool.id === selectedPoolId)) return;

    setSelectedPoolId(filteredPools[0]?.id ?? null);
  }, [filteredPools, selectedPoolId]);

  const { stakePool, unstake, claim, busy: stakeBusy, error } = useStakingActions(refreshAll);

  useEffect(() => {
    if (error) showTradeRpcErrorFeedback(error);
  }, [error]);

  const walletError = walletErrorKey !== null;

  const phonAvailableDisplay = walletError ? null : (wallet?.phon_available ?? '0');

  const usdtAvailableDisplay = walletError ? null : (wallet?.usdt_available ?? '0');

  const availableDisplay = stakeCurrency === 'PHON' ? phonAvailableDisplay : usdtAvailableDisplay;

  const insufficientAvail = useMemo(() => {
    if (walletError || availableDisplay === null) return false;

    if (!isPositiveAmount(stakeAmount)) return false;

    try {
      return toDecimal(stakeAmount).greaterThan(toDecimal(availableDisplay));
    } catch {
      return false;
    }
  }, [availableDisplay, stakeAmount, walletError]);

  const canStake = useMemo(
    () =>
      !walletError &&
      !resolveStakingSubmitDisabled({
        stakingBlocked,

        consentBlocked,

        stakeBusy,

        selectedPoolId,

        stakeAmount,

        insufficientAvail,
      }),

    [
      insufficientAvail,
      selectedPoolId,
      stakeAmount,
      stakeBusy,
      stakingBlocked,
      consentBlocked,
      walletError,
    ],
  );

  const submitDisabledReason = useMemo(
    () =>
      resolveStakingSubmitDisabledReason({
        stakingBlocked,

        consentBlocked,

        stakeBusy,

        selectedPoolId,

        stakeAmount,

        insufficientAvail,
      }),

    [insufficientAvail, selectedPoolId, stakeAmount, stakeBusy, stakingBlocked, consentBlocked],
  );

  const activePositions = useMemo(
    () => listActiveStakingPositions(positions).map(mapStakingPositionRow),

    [positions],
  );

  const selectReferenceAsset = useCallback((asset: string) => {
    setSelectedReferenceAsset(asset);

    setSelectedPoolId(null);

    setWizardStep('pool');
  }, []);

  const setStakeCurrency = useCallback((currency: StakingStakeCurrency) => {
    setStakeCurrencyState(currency);

    setSelectedPoolId(null);

    setWizardStep('pool');
  }, []);

  const selectPool = useCallback((poolId: string) => {
    setSelectedPoolId(poolId);
  }, []);

  const goToWizardStep = useCallback((step: StakingWizardStep) => {
    setWizardStep(step);
  }, []);

  const wizardNext = useCallback(() => {
    const next = resolveNextStakingWizardStep(wizardStep);

    if (!next) return;

    if (wizardStep === 'pool' && !selectedPoolId) return;

    if (wizardStep === 'amount' && !isPositiveAmount(stakeAmount)) return;

    setWizardStep(next);
  }, [selectedPoolId, stakeAmount, wizardStep]);

  const wizardBack = useCallback(() => {
    const previous = resolvePreviousStakingWizardStep(wizardStep);

    if (previous) setWizardStep(previous);
  }, [wizardStep]);

  const openStakeConfirm = useCallback(() => {
    if (wizardStep !== 'confirm' || !canStake || !selectedPool) return;

    setConfirmOpen(true);
  }, [canStake, selectedPool, wizardStep]);

  const closeStakeConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const confirmStake = useCallback(async () => {
    if (!selectedPool) return;

    const result = await stakePool(
      selectedPool.reference_asset,

      selectedPool.stake_currency as StakingStakeCurrency,

      selectedPool.term,

      stakeAmount,
    );

    if (result) {
      showTradeFeedback({ eventId: 'staking.staked' });

      setStakeAmount('');

      setConfirmOpen(false);

      setWizardStep('pool');
    }
  }, [selectedPool, stakePool, stakeAmount]);

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

  const refresh = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  const loading =
    authLoading || walletLoading || poolsLoading || positionsLoading || tierLoading || gatesLoading;

  const poolsError = poolsFetchError;

  return {
    t,

    authLoading,

    loading,

    poolsError,

    positionsError,

    tierError,

    walletError,

    stakingBlocked,

    usdtAvailableDisplay,

    phonAvailableDisplay,

    availableDisplay,

    currentTier,

    tierApyBonusKey: resolveStakingTierApyBonusKey(currentTier),

    referenceAssets,

    selectedReferenceAsset,

    stakeCurrency,

    poolCards,

    selectedPool,

    selectedPoolId,

    stakeAmount,

    canStake,

    stakeBusy,

    actionBusy: stakeBusy,

    activePositions,

    confirmOpen,

    wizardStep,

    submitDisabledReason,

    claimBlockedReason,

    positionActionsDisabled,

    insufficientAvail,

    selectReferenceAsset,

    setStakeCurrency,

    selectPool,

    setStakeAmount,

    openStakeConfirm,

    closeStakeConfirm,

    goToWizardStep,

    wizardNext,

    wizardBack,

    confirmStake,

    unstakePosition,

    claimReward,

    isPositionClaimDisabled,

    refresh,
  };
}
