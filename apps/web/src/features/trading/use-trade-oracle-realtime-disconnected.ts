import { useEffect, useMemo, useState } from 'react';

import { useRealtime, type RealtimeConnectionStatus } from '@/hooks/use-realtime';

import { tradingKeys } from '@/hooks/use-trading';

const DISCONNECTED_STATUSES: ReadonlySet<RealtimeConnectionStatus> = new Set([
  'channel_error',
  'timed_out',
  'closed',
]);

export type TradeOracleRealtimeDisconnectInput = {
  hadSubscription: boolean;
  status: RealtimeConnectionStatus;
  connected: boolean;
  browserOffline?: boolean;
};

/** Pure gate — block submit only after oracle_prices realtime had subscribed once (P0-4). */
export function resolveTradeOracleRealtimeDisconnected(
  input: TradeOracleRealtimeDisconnectInput,
): boolean {
  if (input.browserOffline && input.hadSubscription) return true;

  if (!input.hadSubscription) return false;

  if (input.status === 'disabled') return false;

  if (input.connected) return false;

  if (input.status === 'connecting') return false;

  return DISCONNECTED_STATUSES.has(input.status);
}

/** True when oracle_prices realtime channel lost subscription after a successful connect. */
export function useTradeOracleRealtimeDisconnected(): boolean {
  const { status, connected } = useRealtime({
    table: 'oracle_prices',
    invalidate: [tradingKeys.prices()],
  });

  const [hadSubscription, setHadSubscription] = useState(false);
  const [browserOffline, setBrowserOffline] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine,
  );

  useEffect(() => {
    if (connected) {
      setHadSubscription(true);
    }
  }, [connected]);

  useEffect(() => {
    const syncOffline = () => {
      setBrowserOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    };
    syncOffline();
    window.addEventListener('offline', syncOffline);
    window.addEventListener('online', syncOffline);
    return () => {
      window.removeEventListener('offline', syncOffline);
      window.removeEventListener('online', syncOffline);
    };
  }, []);

  return useMemo(
    () =>
      resolveTradeOracleRealtimeDisconnected({
        hadSubscription,
        status,
        connected,
        browserOffline,
      }),
    [browserOffline, connected, hadSubscription, status],
  );
}
