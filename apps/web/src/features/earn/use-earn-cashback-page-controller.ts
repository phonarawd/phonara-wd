import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  buildEarnCashbackRows,
  resolveCurrentCashbackKey,
  type EarnCashbackRow,
} from '@/domain/earn-cashback-display-contract';
import { parseEarnHubTierSnapshot } from '@/domain/tier-me-display-contract';
import {
  EARN_HUB_STATUS_RPC,
  normalizeEarnVipTier,
  type EarnVipTier,
} from '@/domain/unified-tier-display-contract';
import { callRpc } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';
import { useT } from '@/product/i18n';

export const earnCashbackPageKeys = {
  snapshot: (userId: string | null) => ['earn-cashback-snapshot', userId] as const,
};

async function fetchEarnCashbackTier(): Promise<EarnVipTier> {
  const data = await callRpc(EARN_HUB_STATUS_RPC);
  const snapshot = parseEarnHubTierSnapshot((data ?? {}) as Record<string, unknown>);
  return normalizeEarnVipTier(snapshot?.tier ?? 'bronze');
}

export type EarnCashbackPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  currentTier: EarnVipTier;
  currentCashbackKey: MessageKey;
  rows: EarnCashbackRow[];
};

export function useEarnCashbackPageController(): EarnCashbackPageControllerView {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;

  const {
    data: currentTier = 'bronze',
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: earnCashbackPageKeys.snapshot(userId),
    queryFn: () => fetchEarnCashbackTier(),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const rows = useMemo(() => buildEarnCashbackRows(currentTier), [currentTier]);
  const currentCashbackKey = resolveCurrentCashbackKey(currentTier);

  const loading = authLoading || (Boolean(userId) && snapshotLoading);
  const error = snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null;

  return {
    t,
    loading,
    error,
    currentTier,
    currentCashbackKey,
    rows,
  };
}
