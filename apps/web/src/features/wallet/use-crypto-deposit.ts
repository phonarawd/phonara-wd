import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { MessageKey } from '@phonara/i18n';
import { useAuth } from '../../contexts/auth-context';
import { translateError } from '../../lib/translate-error';

export interface CryptoDepositAddress {
  ok: boolean;
  address: string;
  asset: string;
  chain: string;
  address_id: string;
}

export interface CryptoDepositRequestResult {
  ok: boolean;
  request_id: string;
  address: string;
  asset: string;
  chain: string;
  amount: string;
  status: string;
}

export const cryptoDepositKeys = {
  address: (userId: string | null, asset: string, chain: string) =>
    ['crypto-deposit-address', userId, asset, chain] as const,
};

export function useCryptoDepositAddress(asset = 'USDT', chain = 'TRC20') {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const { data = null, isLoading: loading, error: rawError, refetch } = useQuery({
    queryKey: cryptoDepositKeys.address(userId, asset, chain),
    queryFn: async () => {
      const { data: rpcData, error } = await supabase.rpc('rpc_get_crypto_deposit_address', {
        p_asset: asset,
        p_chain: chain,
      });
      if (error) throw error;
      return rpcData as unknown as CryptoDepositAddress;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const error: MessageKey | null = rawError ? translateError(rawError) : null;
  return { address: data, loading, error, refetch };
}

export function useCryptoDepositRequest() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CryptoDepositRequestResult | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  const createCryptoDepositRequest = useCallback(
    async (params: {
      amount: string;
      asset?: string;
      chain?: string;
      clientRequestId?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc('rpc_create_crypto_deposit_request', {
          p_amount: params.amount,
          p_asset: params.asset ?? 'USDT',
          p_chain: params.chain ?? 'TRC20',
          p_client_request_id: params.clientRequestId,
        });
        if (rpcError) throw rpcError;
        const created = data as unknown as CryptoDepositRequestResult;
        setResult(created);
        void qc.invalidateQueries({
          queryKey: cryptoDepositKeys.address(userId, params.asset ?? 'USDT', params.chain ?? 'TRC20'),
        });
        return created;
      } catch (err) {
        setError(translateError(err, 'error.UNKNOWN'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [qc, userId],
  );

  return { createCryptoDepositRequest, result, loading, error };
}
