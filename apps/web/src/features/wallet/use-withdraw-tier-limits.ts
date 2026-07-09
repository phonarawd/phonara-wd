import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import {
  buildWithdrawTierLimitsView,
  type WithdrawTierLimitsView,
} from '@/domain/wallet-money-policy-display';

import { fetchEarnHubTier } from './earn-hub-tier';

export type WithdrawTierLimitsControllerView = {
  loading: boolean;
  tierLimits: WithdrawTierLimitsView;
};

export function useWithdrawTierLimits(): WithdrawTierLimitsControllerView {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;

  const { data: earnHubTier = null, isLoading: tierLoading } = useQuery({
    queryKey: ['earn-hub-status', userId, 'withdraw-tier-limits'],
    queryFn: fetchEarnHubTier,
    enabled: !!userId,
    staleTime: 60_000,
  });

  const tierLimits = useMemo(() => buildWithdrawTierLimitsView(earnHubTier), [earnHubTier]);

  return {
    loading: authLoading || tierLoading,
    tierLimits,
  };
}
