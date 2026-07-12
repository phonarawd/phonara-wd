import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CRYPTO_DEPOSIT_REQUESTS_ROW,
  GIFTCARD_DEPOSIT_REQUESTS_ROW,
  KRW_DEPOSIT_REQUESTS_ROW,
} from '@phonara/shared-types';

import { useAuth } from '@/contexts/auth-context';
import { hasAvailableGiftcardMarket } from '@/domain/wallet-capability-rails-display-contract';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { supabase } from '@/lib/supabase';

import {
  mergeDepositHistoryRows,
  resolveDepositHubRails,
  type DepositHistoryRowView,
  type DepositHubRailView,
} from './deposit-hub-display';
import { useGiftcardFeeMarket } from './use-giftcard-fee-market';
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
  const { data: feeMarket = [], isLoading: marketLoading } = useGiftcardFeeMarket();

  const { data: historyRows = [], isLoading: historyLoading } = useQuery({
    queryKey: ['deposit-hub-history', userId],
    queryFn: () => fetchDepositHistory(userId!),
    enabled: !!userId && activeTab === 'history',
    staleTime: 30_000,
  });

  const giftcardMarketAvailable = hasAvailableGiftcardMarket(feeMarket.length);

  const rails = useMemo(
    () =>
      resolveDepositHubRails({
        cryptoRails: LAUNCH_GATES.cryptoRails,
        giftcardMarketAvailable,
      }),
    [giftcardMarketAvailable],
  );

  return {
    loading: authLoading || gatesLoading || marketLoading,
    depositBlocked,
    rails,
    historyRows,
    historyLoading: activeTab === 'history' && historyLoading,
  };
}
