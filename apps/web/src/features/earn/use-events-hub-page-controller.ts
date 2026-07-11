import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  EVENTS_HUB_STATUS_RPC,
  EVENTS_HUB_TAP_RPC,
  listEventsSeasonCards,
  parseGoldenEarthStatusSnapshot,
  parseGoldenEarthTapResult,
  resolveEventsTapBlocked,
  type EventsSeasonCardDefinition,
  type GoldenEarthStatusSnapshot,
} from '@/domain/events-hub-display-contract';
import { formatPhonRewardDisplay } from '@/domain/viral-missions-display-contract';
import { walletKeys } from '@/hooks/use-wallet';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';
import { productToast } from '@/product/primitives/toast-zone';
import { useT } from '@/product/i18n';

export const eventsHubPageKeys = {
  snapshot: (userId: string | null) => ['events-hub-snapshot', userId] as const,
};

async function fetchEventsHubSnapshot(): Promise<GoldenEarthStatusSnapshot> {
  const { data, error } = await supabase.rpc(EVENTS_HUB_STATUS_RPC);
  if (error) throw error;
  const snapshot = parseGoldenEarthStatusSnapshot((data ?? {}) as Record<string, unknown>);
  if (!snapshot) throw new Error('GOLDEN_EARTH_STATUS_MISSING');
  return snapshot;
}

function phonAmountParam(phon: string): string {
  return formatPhonRewardDisplay(phon).replace(/^\+/, '').replace(/P$/, '');
}

export type EventsHubPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  status: GoldenEarthStatusSnapshot | null;
  seasonCards: readonly EventsSeasonCardDefinition[];
  tapBlocked: boolean;
  tapping: boolean;
  remainingLabel: string;
  earnedTodayLabel: string;
  globalTotalLabel: string;
  tapGoldenEarth: () => Promise<void>;
};

export function useEventsHubPageController(): EventsHubPageControllerView {
  const t = useT();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const [tapping, setTapping] = useState(false);
  const [actionError, setActionError] = useState<MessageKey | null>(null);

  const {
    data: status = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: eventsHubPageKeys.snapshot(userId),
    queryFn: () => fetchEventsHubSnapshot(),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

  const seasonCards = useMemo(() => listEventsSeasonCards(), []);

  const tapBlocked = resolveEventsTapBlocked({
    authenticated: Boolean(userId),
    systemHalted: status?.systemHalted ?? false,
    remaining: status?.remaining ?? 0,
  });

  const tapGoldenEarth = useCallback(async () => {
    if (!userId || tapBlocked || tapping) return;
    setTapping(true);
    setActionError(null);
    try {
      const clientRequestId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `ge-${Date.now()}`;
      const { data, error } = await supabase.rpc(EVENTS_HUB_TAP_RPC, {
        p_client_request_id: clientRequestId,
      });
      if (error) throw error;
      const result = parseGoldenEarthTapResult((data ?? {}) as Record<string, unknown>);
      if (!result) throw new Error('GOLDEN_EARTH_TAP_MISSING');

      const amount = phonAmountParam(result.phonAwarded);
      if (result.isGlobalJackpot) {
        productToast.show({
          zone: 'warm',
          key: 'earn.goldenEarth.toast.globalJackpot',
          values: { amount },
        });
      } else if (result.isJackpot) {
        productToast.show({
          zone: 'warm',
          key: 'earn.goldenEarth.toast.jackpot',
          values: { amount },
        });
      } else if (result.goldenHourActive) {
        productToast.show({
          zone: 'warm',
          key: 'earn.goldenEarth.toast.goldenHour',
          values: { amount, remaining: result.remaining, dailyCap: result.dailyCap },
        });
      } else {
        productToast.show({
          zone: 'warm',
          key: 'earn.goldenEarth.toast.bump',
          values: { amount, remaining: result.remaining, dailyCap: result.dailyCap },
        });
      }

      if (result.tierUpgraded && status?.tier) {
        productToast.show({
          zone: 'warm',
          key: 'earn.goldenEarth.toast.tierUpgrade',
          values: { tier: status.tier },
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventsHubPageKeys.snapshot(userId) }),
        queryClient.invalidateQueries({ queryKey: walletKeys.all(userId) }),
      ]);
    } catch (err) {
      setActionError(translateError(err, 'error.UNKNOWN'));
    } finally {
      setTapping(false);
    }
  }, [queryClient, status?.tier, tapBlocked, tapping, userId]);

  const loading = authLoading || (Boolean(userId) && snapshotLoading);
  const error = actionError ?? (snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null);

  return {
    t,
    loading,
    error,
    status,
    seasonCards,
    tapBlocked: tapBlocked || tapping,
    tapping,
    remainingLabel:
      status != null
        ? t('earn.goldenEarth.counter.personalWithCap', {
            count: status.tapCount,
            cap: status.dailyCap,
          })
        : '',
    earnedTodayLabel: status ? formatPhonRewardDisplay(status.earnedPhonToday) : '—',
    globalTotalLabel: status ? String(status.globalTotal) : '—',
    tapGoldenEarth,
  };
}
