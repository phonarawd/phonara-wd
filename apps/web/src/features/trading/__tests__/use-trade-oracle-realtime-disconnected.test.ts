import { describe, expect, it } from 'vitest';

import { resolveTradeOracleRealtimeDisconnected } from '@/features/trading/use-trade-oracle-realtime-disconnected';

describe('use-trade-oracle-realtime-disconnected', () => {
  it('does not block before the first successful subscription', () => {
    expect(
      resolveTradeOracleRealtimeDisconnected({
        hadSubscription: false,
        status: 'timed_out',
        connected: false,
      }),
    ).toBe(false);
    expect(
      resolveTradeOracleRealtimeDisconnected({
        hadSubscription: false,
        status: 'channel_error',
        connected: false,
      }),
    ).toBe(false);
  });

  it('blocks only after subscription was established and then lost', () => {
    expect(
      resolveTradeOracleRealtimeDisconnected({
        hadSubscription: true,
        status: 'closed',
        connected: false,
      }),
    ).toBe(true);
    expect(
      resolveTradeOracleRealtimeDisconnected({
        hadSubscription: true,
        status: 'subscribed',
        connected: true,
      }),
    ).toBe(false);
    expect(
      resolveTradeOracleRealtimeDisconnected({
        hadSubscription: true,
        status: 'connecting',
        connected: false,
      }),
    ).toBe(false);
  });

  it('blocks when browser goes offline after the first successful subscription', () => {
    expect(
      resolveTradeOracleRealtimeDisconnected({
        hadSubscription: true,
        status: 'subscribed',
        connected: true,
        browserOffline: true,
      }),
    ).toBe(true);
    expect(
      resolveTradeOracleRealtimeDisconnected({
        hadSubscription: false,
        status: 'subscribed',
        connected: true,
        browserOffline: true,
      }),
    ).toBe(false);
  });
});
