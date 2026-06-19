import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { formatMoney } from '@/hooks/use-money';
import type { MessageKey } from '@phonara/i18n';
import { toDecimal } from '@phonara/money';
import { useAuth } from '../../contexts/auth-context';
import { useWallet } from '../../hooks/use-wallet';
import {
  useStakingPools,
  useStakingPositions,
  useStakingActions,
  type StakingPool,
  type StakingPosition,
} from '../../hooks/use-trading';
import { ratePercent } from '../../lib/money-display';
import { useT } from '../../lib/i18n';

const DEFAULT_STAKE_AMOUNT = '1000';

const TERM_KEYS: Record<string, MessageKey> = {
  flexible: 'staking.term.flexible',
  days_7: 'staking.term.days_7',
  days_30: 'staking.term.days_30',
  days_90: 'staking.term.days_90',
};

export function stakingTermLabelKey(term: string): MessageKey {
  return TERM_KEYS[term] ?? 'staking.term.custom';
}

export function useStakingPageController() {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { wallet, loading: walletLoading } = useWallet();
  const pools = useStakingPools();
  const { positions, refresh, refetch: refetchPositions } = useStakingPositions();
  const { stake, unstake, claim, busy, error } = useStakingActions(async () => {
    await refetchPositions();
  });

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  const phonAvailable = wallet?.phon_available ?? '0';
  const primaryPool = pools[0] ?? null;

  const balanceDisplay = `${formatMoney(phonAvailable, 'PHON')} PHON`;
  const aprDisplay = primaryPool ? `${ratePercent(primaryPool.estimated_apr)}%` : '—';

  const totalRewardsClaimed = useMemo(() => {
    let sum = toDecimal('0');
    for (const position of positions.filter((p) => p.status === 'active')) {
      sum = sum.plus(toDecimal(position.reward_claimed));
    }
    return sum.toFixed();
  }, [positions]);

  const rewardsDisplay = `${formatMoney(totalRewardsClaimed, 'PHON')} PHON`;

  const [stakeConfirmOpen, setStakeConfirmOpen] = useState(false);
  const [actionConfirm, setActionConfirm] = useState<{ positionId: string; kind: 'claim' } | null>(
    null,
  );

  const activePositions = useMemo(
    () => positions.filter((p) => p.status === 'active'),
    [positions],
  );

  const unlockablePosition = useMemo(
    () =>
      positions.find(
        (p) =>
          p.status === 'active' &&
          (!p.unlock_at || new Date(p.unlock_at) <= new Date()),
      ) ?? null,
    [positions],
  );

  function requestStakePrimary() {
    if (!primaryPool || busy) return;
    setStakeConfirmOpen(true);
  }

  async function confirmStakePrimary() {
    if (!primaryPool || busy) return;
    const result = await stake(primaryPool.term, DEFAULT_STAKE_AMOUNT);
    setStakeConfirmOpen(false);
    if (result) await refetchPositions();
  }

  function requestClaim(positionId: string) {
    if (busy) return;
    setActionConfirm({ positionId, kind: 'claim' });
  }

  async function confirmStakingAction() {
    if (!actionConfirm || busy) return;
    const pending = actionConfirm;
    setActionConfirm(null);
    if (pending.kind === 'claim') {
      await claim(pending.positionId);
    }
  }

  async function handleUnstakePrimary() {
    if (!unlockablePosition || busy) return;
    await unstake(unlockablePosition.id);
  }

  return {
    t,
    authLoading,
    walletLoading,
    phonAvailable,
    balanceDisplay,
    aprDisplay,
    rewardsDisplay,
    pools,
    positions,
    activePositions,
    primaryPool,
    unlockablePosition,
    refresh,
    busy,
    errorKey: error,
    errorMessage: error ? t(error) : null,
    stakeConfirmOpen,
    setStakeConfirmOpen,
    actionConfirm,
    setActionConfirm,
    requestStakePrimary,
    confirmStakePrimary,
    requestClaim,
    confirmStakingAction,
    handleUnstakePrimary,
    canStake: primaryPool !== null,
    canUnstake: unlockablePosition !== null,
    stakeAmountDisplay: formatMoney(DEFAULT_STAKE_AMOUNT, 'PHON'),
    stakingTermLabelKey,
  };
}

export type { StakingPool, StakingPosition };
