import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  EARN_PLAY_HUB_STATUS_RPC,
  parseEarnPlayRouletteQuota,
  parseEarnPlaySpinResult,
  resolveEarnPlaySpinBlocked,
  SPIN_ROULETTE_RPC,
  type EarnPlayRouletteQuota,
  type EarnPlaySpinResult,
} from '@/domain/earn-play-display-contract';
import { formatPhonRewardDisplay } from '@/domain/viral-missions-display-contract';
import { walletKeys } from '@/hooks/use-wallet';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const earnPlayPageKeys = {
  snapshot: (userId: string | null) => ['earn-play-snapshot', userId] as const,
};

type EarnPlaySnapshot = {
  quota: EarnPlayRouletteQuota;
};

async function fetchEarnPlaySnapshot(): Promise<EarnPlaySnapshot> {
  const { data, error } = await supabase.rpc(EARN_PLAY_HUB_STATUS_RPC);
  if (error) throw error;
  const quota = parseEarnPlayRouletteQuota((data ?? {}) as Record<string, unknown>);
  if (!quota) throw new Error('EARN_PLAY_ROULETTE_QUOTA_MISSING');
  return { quota };
}

export type EarnPlayPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  quota: EarnPlayRouletteQuota | null;
  lastSpin: EarnPlaySpinResult | null;
  spinBlocked: boolean;
  spinning: boolean;
  quotaLabel: string;
  spinRoulette: () => Promise<void>;
};

export function useEarnPlayPageController(): EarnPlayPageControllerView {
  const t = useT();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const [spinning, setSpinning] = useState(false);
  const [lastSpin, setLastSpin] = useState<EarnPlaySpinResult | null>(null);
  const [actionError, setActionError] = useState<MessageKey | null>(null);

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: earnPlayPageKeys.snapshot(userId),
    queryFn: () => fetchEarnPlaySnapshot(),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

  const quota = snapshot?.quota ?? null;

  const spinBlocked = resolveEarnPlaySpinBlocked({
    authenticated: Boolean(userId),
    remaining: quota?.remaining ?? 0,
    spinning,
  });

  const spinRoulette = useCallback(async () => {
    if (!userId || spinBlocked) return;
    setSpinning(true);
    setActionError(null);
    try {
      const { data, error } = await supabase.rpc(SPIN_ROULETTE_RPC);
      if (error) throw error;
      const result = parseEarnPlaySpinResult((data ?? {}) as Record<string, unknown>);
      if (!result) throw new Error('EARN_PLAY_SPIN_MISSING');
      setLastSpin(result);

      if (result.phonAwarded === '0' || result.phonAwarded === '0.000000') {
        productToast.show({ zone: 'warm', key: 'events.roulette.result.miss' });
      } else {
        productToast.show({
          zone: 'warm',
          key: 'events.roulette.result.win',
          values: {
            amount: formatPhonRewardDisplay(result.phonAwarded).replace(/^\+/, '').replace(/P$/, ''),
          },
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: earnPlayPageKeys.snapshot(userId) }),
        queryClient.invalidateQueries({ queryKey: walletKeys.all(userId) }),
      ]);
    } catch (err) {
      setActionError(translateError(err, 'error.UNKNOWN'));
    } finally {
      setSpinning(false);
    }
  }, [queryClient, spinBlocked, userId]);

  const quotaLabel = useMemo(() => {
    if (!quota) return '';
    return t('events.roulette.quota', { remaining: quota.remaining, max: quota.max });
  }, [quota, t]);

  const loading = authLoading || (Boolean(userId) && snapshotLoading);
  const error = actionError ?? (snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null);

  return {
    t,
    loading,
    error,
    quota,
    lastSpin,
    spinBlocked,
    spinning,
    quotaLabel,
    spinRoulette,
  };
}
