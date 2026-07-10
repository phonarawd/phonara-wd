import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables } from '@phonara/shared-types';
import { WALLET_LEDGER_ROW, WALLETS_ROW } from '@phonara/shared-types';
import type { MessageKey } from '@phonara/i18n';
import { walletLedgerQueryKeyPrefix } from '../domain/wallet-ledger-realtime-display-contract';
import { useAuth } from '../contexts/auth-context';
import { useRealtime } from './use-realtime';
import { translateError } from '../lib/translate-error';

type Wallet = Tables<'wallets'>;
type LedgerEntry = Tables<'wallet_ledger'>;

// ─── Query keys ────────────────────────────────────────────────

export const walletKeys = {
  all: (userId: string | null) => ['wallet', userId] as const,
  ledger: (userId: string | null, limit: number) => ['ledger', userId, limit] as const,
};

// ─── Wallet ────────────────────────────────────────────────────

export function useWallet() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const {
    data: wallet = null,
    isLoading: loading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: walletKeys.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select(WALLETS_ROW)
        .eq('user_id', userId!)
        .single();
      if (error) throw error;
      return data as Wallet;
    },
    enabled: !!userId,
  });

  // PIR E2: wallet_ledger dropped from publication — wallets UPDATE also refreshes ledger.
  useRealtime({
    table: 'wallets',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    invalidate: [walletKeys.all(userId), walletLedgerQueryKeyPrefix(userId)],
    enabled: !!userId,
  });

  const error: MessageKey | null = rawError ? translateError(rawError) : null;
  return { wallet, loading, error, refetch };
}

// ─── Ledger ────────────────────────────────────────────────────

export function useLedger(limit = 30) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const {
    data: entries = [],
    isLoading: loading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: walletKeys.ledger(userId, limit),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_ledger')
        .select(WALLET_LEDGER_ROW)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as LedgerEntry[];
    },
    enabled: !!userId,
  });

  // PIR E2 dual belt: ledger page alone still refreshes on wallets (not wallet_ledger).
  useRealtime({
    table: 'wallets',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    invalidate: [walletKeys.ledger(userId, limit)],
    enabled: !!userId,
  });

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: walletKeys.ledger(userId, limit) });
  }, [qc, userId, limit]);

  const error: MessageKey | null = rawError ? translateError(rawError) : null;
  return { entries, loading, error, refetch, refresh };
}
