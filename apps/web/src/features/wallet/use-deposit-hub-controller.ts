import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CRYPTO_DEPOSIT_REQUESTS_ROW,
  GIFTCARD_DEPOSIT_REQUESTS_ROW,
  KRW_DEPOSIT_REQUESTS_ROW,
} from '@phonara/shared-types';

import { useAuth } from '@/contexts/auth-context';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { supabase } from '@/lib/supabase';

import {
  DEPOSIT_HUB_RAILS,
  mergeDepositHistoryRows,
  type DepositHistoryRowView,
  type DepositHubRailView,
} from './deposit-hub-display';
import type {
  CryptoDepositRequest,
  DepositRequest,
  GiftcardDepositRequest,
} from './use-wallet-data';

const DEPOSIT_HISTORY_LIMIT = 20;

export type DepositHubTab = 'methods' | 'history';

export type DepositHubControllerView = {
  loading: boolean;
  depositBlocked: boolean;
  rails: readonly DepositHubRailView[];
  historyRows: DepositHistoryRowView[];
  historyLoading: boolean;
};

async function fetchDepositHistory(userId: string) {
  const [krwResult, cryptoResult, giftcardResult] = await Promise.all([
    supabase
      .from('krw_deposit_requests')
      .select(KRW_DEPOSIT_REQUESTS_ROW)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(DEPOSIT_HISTORY_LIMIT),
    supabase
      .from('crypto_deposit_requests')
      .select(CRYPTO_DEPOSIT_REQUESTS_ROW)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(DEPOSIT_HISTORY_LIMIT),
    supabase
      .from('giftcard_deposit_requests')
      .select(GIFTCARD_DEPOSIT_REQUESTS_ROW)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(DEPOSIT_HISTORY_LIMIT),
  ]);

  if (krwResult.error) throw krwResult.error;
  if (cryptoResult.error) throw cryptoResult.error;
  if (giftcardResult.error) throw giftcardResult.error;

  return mergeDepositHistoryRows(
    (krwResult.data ?? []) as DepositRequest[],
    (cryptoResult.data ?? []) as CryptoDepositRequest[],
    (giftcardResult.data ?? []) as GiftcardDepositRequest[],
  ).slice(0, DEPOSIT_HISTORY_LIMIT);
}

export function useDepositHubController(activeTab: DepositHubTab): DepositHubControllerView {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { depositBlocked, loading: gatesLoading } = usePlatformGates();

  const { data: historyRows = [], isLoading: historyLoading } = useQuery({
    queryKey: ['deposit-hub-history', userId],
    queryFn: () => fetchDepositHistory(userId!),
    enabled: !!userId && activeTab === 'history',
    staleTime: 30_000,
  });

  const rails = useMemo(() => DEPOSIT_HUB_RAILS, []);

  return {
    loading: authLoading || gatesLoading,
    depositBlocked,
    rails,
    historyRows,
    historyLoading: activeTab === 'history' && historyLoading,
  };
}
