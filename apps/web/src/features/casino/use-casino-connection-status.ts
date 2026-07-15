import { useEffect, useMemo, useState } from 'react';

import { useRealtime, type RealtimeConnectionStatus } from '@/hooks/use-realtime';

export type { RealtimeConnectionStatus };

const CASINO_REALTIME_DISCONNECTED_STATUSES: ReadonlySet<RealtimeConnectionStatus> = new Set([
  'channel_error',
  'timed_out',
  'closed',
]);

export type CasinoConnectionDisconnectInput = {
  hadSubscription: boolean;
  status: RealtimeConnectionStatus;
  connected: boolean;
  browserOffline?: boolean;
};

/**
 * Pure gate — reuses the same vocabulary already consumed by Trade
 * (`resolveTradeOracleRealtimeDisconnected`) and Sports (`useSportsRealtime`):
 * only alarm once a channel that had subscribed before drops, never on the
 * very first connect (which always starts at `connecting`).
 */
export function resolveCasinoConnectionDisconnected(
  input: CasinoConnectionDisconnectInput,
): boolean {
  if (input.browserOffline && input.hadSubscription) return true;
  if (!input.hadSubscription) return false;
  if (input.status === 'disabled') return false;
  if (input.connected) return false;
  if (input.status === 'connecting') return false;
  return CASINO_REALTIME_DISCONNECTED_STATUSES.has(input.status);
}

export type UseCasinoConnectionStatusResult = {
  status: RealtimeConnectionStatus;
  connected: boolean;
  disconnected: boolean;
};

/**
 * Casino trust-layer network indicator (CASINO_UX_CANON §Trust layer — "Network
 * Status | disconnect/reconnect | connection indicator"). Subscribes to the same
 * `wallets` row already driving live balance updates (`use-wallet.ts`) — `use-realtime.ts`
 * pools channels by table+filter+event, so this adds no second socket subscription
 * when `useWallet` is mounted alongside `CasinoGameShell` (it always is).
 */
export function useCasinoConnectionStatus(userId: string | null): UseCasinoConnectionStatusResult {
  const { status, connected } = useRealtime({
    table: 'wallets',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
  });

  const [hadSubscription, setHadSubscription] = useState(false);
  const [browserOffline, setBrowserOffline] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine,
  );

  useEffect(() => {
    if (connected) setHadSubscription(true);
  }, [connected]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncOffline = () => setBrowserOffline(!navigator.onLine);
    syncOffline();
    window.addEventListener('offline', syncOffline);
    window.addEventListener('online', syncOffline);
    return () => {
      window.removeEventListener('offline', syncOffline);
      window.removeEventListener('online', syncOffline);
    };
  }, []);

  const disconnected = useMemo(
    () =>
      resolveCasinoConnectionDisconnected({ hadSubscription, status, connected, browserOffline }),
    [browserOffline, connected, hadSubscription, status],
  );

  return { status, connected, disconnected };
}
