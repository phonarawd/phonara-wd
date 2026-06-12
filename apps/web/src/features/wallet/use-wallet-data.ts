import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@phonara/shared-types';
import { supabase } from '../../lib/supabase';

export type DepositRequest = Tables<'krw_deposit_requests'>;
export type WithdrawalRequest = Tables<'withdrawal_requests'>;
export type KycSubmission = Tables<'kyc_submissions'>;
export type ExchangeRateSnapshot = Tables<'exchange_rate_snapshots'>;

export function useWalletData(userId: string | null) {
  const { data: deposits = [] } = useQuery({
    queryKey: ['krw-deposits', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('krw_deposit_requests')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as DepositRequest[];
    },
    enabled: !!userId,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['withdrawals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
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
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as KycSubmission[];
    },
    enabled: !!userId,
  });

  const { data: withdrawalEnabled } = useQuery({
    queryKey: ['app-config', 'feature_withdrawal_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'feature_withdrawal_enabled')
        .maybeSingle();
      if (error) throw error;
      return data?.value !== 'false';
    },
  });

  const { data: activePhonKrwRate = null, isError: depositRateError } = useQuery({
    queryKey: ['exchange-rate', 'PHON', 'KRW', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rate_snapshots')
        .select('id,base_currency,quote_currency,rate,captured_at,source,is_active,created_by')
        .eq('base_currency', 'PHON')
        .eq('quote_currency', 'KRW')
        .eq('is_active', true)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ExchangeRateSnapshot | null;
    },
    staleTime: 30_000,
  });

  return {
    deposits,
    withdrawals,
    kycSubmissions,
    withdrawalEnabled,
    activePhonKrwRate,
    depositRateError,
  };
}
