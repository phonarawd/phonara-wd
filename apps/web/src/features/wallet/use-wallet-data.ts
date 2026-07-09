import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@phonara/shared-types';
import {
  CRYPTO_DEPOSIT_REQUESTS_ROW,
  GIFTCARD_DEPOSIT_REQUESTS_ROW,
  KRW_DEPOSIT_REQUESTS_ROW,
  KYC_SUBMISSIONS_ROW,
  WITHDRAWAL_REQUESTS_ROW,
} from '@phonara/shared-types';
import { isPhonKrwRateStale, isPhonKrwRateUnavailable } from '../../lib/phon-krw-rate-stale';
import {
  fetchFiatReferenceRateQueryData,
  fiatReferenceRateQueryKey,
  type ExchangeRateSnapshot,
} from '../money/use-fiat-reference-rates';
import { supabase } from '../../lib/supabase';

export type DepositRequest = Tables<'krw_deposit_requests'>;
export type CryptoDepositRequest = Tables<'crypto_deposit_requests'>;
export type GiftcardDepositRequest = Tables<'giftcard_deposit_requests'>;
export type WithdrawalRequest = Tables<'withdrawal_requests'>;
export type KycSubmission = Tables<'kyc_submissions'>;
export type { ExchangeRateSnapshot };

export function useWalletData(userId: string | null) {
  const { data: deposits = [] } = useQuery({
    queryKey: ['krw-deposits', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('krw_deposit_requests')
        .select(KRW_DEPOSIT_REQUESTS_ROW)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as DepositRequest[];
    },
    enabled: !!userId,
  });

  const { data: cryptoDeposits = [] } = useQuery({
    queryKey: ['crypto-deposits', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crypto_deposit_requests')
        .select(CRYPTO_DEPOSIT_REQUESTS_ROW)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as CryptoDepositRequest[];
    },
    enabled: !!userId,
  });

  const { data: giftcardDeposits = [] } = useQuery({
    queryKey: ['giftcard-deposits', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('giftcard_deposit_requests')
        .select(GIFTCARD_DEPOSIT_REQUESTS_ROW)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as GiftcardDepositRequest[];
    },
    enabled: !!userId,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['withdrawals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(WITHDRAWAL_REQUESTS_ROW)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as WithdrawalRequest[];
    },
    enabled: !!userId,
  });

  const { data: kycSubmissions = [] } = useQuery({
    queryKey: ['kyc-submissions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select(KYC_SUBMISSIONS_ROW)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as KycSubmission[];
    },
    enabled: !!userId,
  });

  const {
    data: activePhonKrwRate = null,
    isError: depositRateError,
    refetch: refetchPhonKrwRate,
  } = useQuery({
    queryKey: fiatReferenceRateQueryKey('PHON', 'KRW'),
    queryFn: () => fetchFiatReferenceRateQueryData({ base: 'PHON', quote: 'KRW' }),
    select: (data) => data.snapshot,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const phonKrwRateStale = isPhonKrwRateStale(activePhonKrwRate?.captured_at);
  const phonKrwRateUnavailable = isPhonKrwRateUnavailable(
    activePhonKrwRate?.rate,
    depositRateError,
  );
  const phonKrwRateBlocked = phonKrwRateStale || phonKrwRateUnavailable;

  return {
    deposits,
    cryptoDeposits,
    giftcardDeposits,
    withdrawals,
    kycSubmissions,
    activePhonKrwRate,
    depositRateError,
    phonKrwRateStale,
    phonKrwRateUnavailable,
    phonKrwRateBlocked,
    refetchPhonKrwRate,
  };
}
