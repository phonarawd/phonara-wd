import { useCallback, useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { MessageKey } from '@phonara/i18n';

import { callRpc } from '../../lib/rpc';
import { supabase } from '../../lib/supabase';

import { useAuth } from '../../contexts/auth-context';

import { translateError } from '../../lib/translate-error';

export interface WithdrawalWhitelistEntry {
  id: string;

  user_id: string;

  chain: string;

  address: string;

  label: string | null;

  cooldown_until: string | null;

  created_at: string;
}

export const cryptoWithdrawKeys = {
  whitelist: (userId: string | null) => ['withdrawal-whitelist', userId] as const,

  whitelistEnabled: ['app-config', 'withdrawal_whitelist_enabled'] as const,
};

async function listWithdrawalAddresses(): Promise<WithdrawalWhitelistEntry[]> {
  return (await callRpc('rpc_list_withdrawal_addresses')) as WithdrawalWhitelistEntry[];
}

async function addWithdrawalAddress(params: {
  chain: string;

  address: string;

  label?: string;
}): Promise<void> {
  await callRpc('rpc_add_withdrawal_address', {
    p_chain: params.chain,
    p_address: params.address,
    p_label: params.label,
  });
}

async function removeWithdrawalAddress(id: string): Promise<void> {
  await callRpc('rpc_remove_withdrawal_address', { p_id: id });
}

export function useWithdrawalWhitelist() {
  const { session } = useAuth();

  const userId = session?.user.id ?? null;

  const { data: whitelistEnabled = false } = useQuery({
    queryKey: cryptoWithdrawKeys.whitelistEnabled,

    queryFn: async () => {
      const { data, error } = await supabase

        .from('app_config')

        .select('value')

        .eq('key', 'withdrawal_whitelist_enabled')

        .maybeSingle();

      if (error) throw error;

      return data?.value === 'true';
    },

    staleTime: 60_000,
  });

  const {
    data: addresses = [],

    isLoading: loading,

    refetch,
  } = useQuery({
    queryKey: cryptoWithdrawKeys.whitelist(userId),

    queryFn: listWithdrawalAddresses,

    enabled: !!userId,

    staleTime: 30_000,
  });

  return { addresses, whitelistEnabled, loading, refetch };
}

export function useAddWithdrawalAddress() {
  const { session } = useAuth();

  const userId = session?.user.id ?? null;

  const qc = useQueryClient();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<MessageKey | null>(null);

  const registerAddress = useCallback(
    async (params: { chain: string; address: string; label?: string }) => {
      setLoading(true);

      setError(null);

      try {
        await addWithdrawalAddress(params);

        void qc.invalidateQueries({ queryKey: cryptoWithdrawKeys.whitelist(userId) });
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

  return { registerAddress, loading, error };
}

export function useRemoveWithdrawalAddress() {
  const { session } = useAuth();

  const userId = session?.user.id ?? null;

  const qc = useQueryClient();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<MessageKey | null>(null);

  const removeAddress = useCallback(
    async (id: string) => {
      setLoading(true);

      setError(null);

      try {
        await removeWithdrawalAddress(id);

        void qc.invalidateQueries({ queryKey: cryptoWithdrawKeys.whitelist(userId) });
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

  return { removeAddress, loading, error };
}
