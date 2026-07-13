import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WITHDRAWAL_REQUESTS_ROW } from '@phonara/shared-types';

import { useAuth } from '@/contexts/auth-context';
import { useComplianceStatus } from '@/hooks/use-compliance-status';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { supabase } from '@/lib/supabase';

import type { WithdrawalRequest } from './crypto-withdraw-status';
import {
  mergeWithdrawHistoryRows,
  resolveWithdrawHubRails,
  type WithdrawHistoryRowView,
  type WithdrawHubRailView,
} from './withdraw-hub-display';

const WITHDRAW_HISTORY_LIMIT = 20;

export type WithdrawHubTab = 'methods' | 'history';

export type WithdrawHubControllerView = {
  loading: boolean;
  withdrawalBlocked: boolean;
  withdrawalReady: boolean;
  railsDisabled: boolean;
  rails: readonly WithdrawHubRailView[];
  historyRows: WithdrawHistoryRowView[];
  historyLoading: boolean;
};

async function fetchWithdrawHistory(userId: string) {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select(WITHDRAWAL_REQUESTS_ROW)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(WITHDRAW_HISTORY_LIMIT);

  if (error) throw error;

  return mergeWithdrawHistoryRows((data ?? []) as WithdrawalRequest[]).slice(
    0,
    WITHDRAW_HISTORY_LIMIT,
  );
}

export function useWithdrawHubController(activeTab: WithdrawHubTab): WithdrawHubControllerView {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { withdrawalBlocked, loading: gatesLoading } = usePlatformGates();
  const { data: compliance, isLoading: complianceLoading } = useComplianceStatus();

  const withdrawalReady = Boolean(compliance?.withdrawal_ready);
  const railsDisabled = withdrawalBlocked || !withdrawalReady;

  const { data: historyRows = [], isLoading: historyLoading } = useQuery({
    queryKey: ['withdraw-hub-history', userId],
    queryFn: () => fetchWithdrawHistory(userId!),
    enabled: !!userId && activeTab === 'history',
    staleTime: 30_000,
  });

  const rails = useMemo(
    () => resolveWithdrawHubRails({ cryptoRails: LAUNCH_GATES.cryptoRails }),
    [],
  );

  return {
    loading: authLoading || gatesLoading || complianceLoading,
    withdrawalBlocked,
    withdrawalReady,
    railsDisabled,
    rails,
    historyRows,
    historyLoading: activeTab === 'history' && historyLoading,
  };
}
