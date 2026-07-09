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
  needs_derivation?: boolean;
  derivation_index?: number;
}

export interface CryptoDepositRequestResult {
  ok: boolean;
  deposit_id: string;
  address: string;
  asset: string;
  chain: string;
  amount: string;
  status?: string;
  confirmations_required?: number;
  sla_hours?: number;
}

export const cryptoDepositKeys = {
  address: (userId: string | null, asset: string, chain: string) =>
    ['crypto-deposit-address', userId, asset, chain] as const,
};

async function ensureCryptoAddressDerived(
  asset: string,
  chain: string,
): Promise<CryptoDepositAddress> {
  const { data: rpcData, error } = await supabase.rpc('rpc_get_crypto_deposit_address', {
    p_asset: asset,
    p_chain: chain,
  });
  if (error) throw error;
  let result = rpcData as unknown as CryptoDepositAddress;
  if (result.needs_derivation) {
    const { data: derived, error: fnError } = await supabase.functions.invoke(
      'derive-crypto-address',
      {
        body: { chain },
      },
    );
    if (fnError) throw fnError;
    if (derived?.address) {
      result = { ...result, address: derived.address, needs_derivation: false };
    }
  }
  return result;
}

export function useCryptoDepositAddress(asset = 'USDT', chain = 'TRC20', enabled = true) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const {
    data = null,
    isLoading: loading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: cryptoDepositKeys.address(userId, asset, chain),
    queryFn: () => ensureCryptoAddressDerived(asset, chain),
    enabled: enabled && !!userId,
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
        await ensureCryptoAddressDerived(params.asset ?? 'USDT', params.chain ?? 'TRC20');
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
          queryKey: cryptoDepositKeys.address(
            userId,
            params.asset ?? 'USDT',
            params.chain ?? 'TRC20',
          ),
        });
        return created;
      } catch (err) {
        const key = translateError(err, 'error.UNKNOWN');
        setError(key);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [qc, userId],
  );

  return { createCryptoDepositRequest, result, loading, error };
}
