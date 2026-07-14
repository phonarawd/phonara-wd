import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useRealtimeMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-realtime', () => ({
  useRealtime: (...args: unknown[]) => useRealtimeMock(...args),
}));

import {
  resolveCasinoConnectionDisconnected,
  useCasinoConnectionStatus,
} from '../use-casino-connection-status';

describe('resolveCasinoConnectionDisconnected (phase1a-trust-layer)', () => {
  it('never alarms before the channel has subscribed once', () => {
    expect(
      resolveCasinoConnectionDisconnected({
        hadSubscription: false,
        status: 'channel_error',
        connected: false,
      }),
    ).toBe(false);
  });

  it('does not alarm on disabled or first-connect connecting', () => {
    expect(
      resolveCasinoConnectionDisconnected({
        hadSubscription: true,
        status: 'disabled',
        connected: false,
      }),
    ).toBe(false);
    expect(
      resolveCasinoConnectionDisconnected({
        hadSubscription: true,
        status: 'connecting',
        connected: false,
      }),
    ).toBe(false);
  });

  it('does not alarm while connected', () => {
    expect(
      resolveCasinoConnectionDisconnected({
        hadSubscription: true,
        status: 'subscribed',
        connected: true,
      }),
    ).toBe(false);
  });

  it('alarms once a subscribed channel drops (channel_error / timed_out / closed)', () => {
    for (const status of ['channel_error', 'timed_out', 'closed'] as const) {
      expect(
        resolveCasinoConnectionDisconnected({ hadSubscription: true, status, connected: false }),
      ).toBe(true);
    }
  });

  it('alarms immediately when the browser goes offline after a prior subscription', () => {
    expect(
      resolveCasinoConnectionDisconnected({
        hadSubscription: true,
        status: 'connecting',
        connected: false,
        browserOffline: true,
      }),
    ).toBe(true);
  });
});

describe('useCasinoConnectionStatus (phase1a-trust-layer)', () => {
  beforeEach(() => {
    useRealtimeMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes to the wallets row scoped to the current user', () => {
    useRealtimeMock.mockReturnValue({ status: 'subscribed', connected: true });
    const { result } = renderHook(() => useCasinoConnectionStatus('user-1'));

    expect(useRealtimeMock).toHaveBeenCalledWith({
      table: 'wallets',
      filter: 'user_id=eq.user-1',
      enabled: true,
    });
    expect(result.current).toMatchObject({
      status: 'subscribed',
      connected: true,
      disconnected: false,
    });
  });

  it('disables the subscription when userId is null', () => {
    useRealtimeMock.mockReturnValue({ status: 'disabled', connected: false });
    renderHook(() => useCasinoConnectionStatus(null));

    expect(useRealtimeMock).toHaveBeenCalledWith({
      table: 'wallets',
      filter: undefined,
      enabled: false,
    });
  });

  it('flags disconnected only after a subscribed channel later errors', () => {
    useRealtimeMock.mockReturnValue({ status: 'subscribed', connected: true });
    const { result, rerender } = renderHook(() => useCasinoConnectionStatus('user-1'));
    expect(result.current.disconnected).toBe(false);

    useRealtimeMock.mockReturnValue({ status: 'channel_error', connected: false });
    rerender();
    expect(result.current.disconnected).toBe(true);
  });
});
