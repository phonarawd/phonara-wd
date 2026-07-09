import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  evaluateTradeDeskLoadRealtimeSoak,
  hasLoadRealtimeDisconnectFalsePositive,
  hasLoadRealtimeSubmitGateFalsePositive,
  TRADE_DESK_LOAD_REALTIME_CHANNEL_TIERS,
  TRADE_DESK_LOAD_REALTIME_DOC,
  TRADE_DESK_LOAD_REALTIME_SOAK_MS,
  TRADE_DESK_LOAD_REALTIME_SOAK_SCRIPT,
  TRADE_DESK_LOAD_REALTIME_SPOTCHECK_SCRIPT,
  TRADE_DESK_LOAD_REALTIME_TODO,
  TRADE_DESK_LOAD_TICK_BURST_MAX_PER_WINDOW,
  TRADE_DESK_LOAD_TICK_BURST_WINDOW_SEC,
  TRADE_DESK_LOAD_TICK_MIN_BTC_PER_WINDOW,
} from '../trade-desk-load-realtime-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('trade-desk-load-realtime-display-contract · P3-C', () => {
  it('registers P3-C todo and Plan channel tiers', () => {
    expect(TRADE_DESK_LOAD_REALTIME_TODO).toBe('p3-load-realtime');
    expect(TRADE_DESK_LOAD_REALTIME_CHANNEL_TIERS).toEqual([10, 50, 100]);
    expect(TRADE_DESK_LOAD_REALTIME_SOAK_MS).toBe(30_000);
    expect(TRADE_DESK_LOAD_TICK_BURST_WINDOW_SEC).toBe(60);
    expect(TRADE_DESK_LOAD_TICK_BURST_MAX_PER_WINDOW).toBe(12_000);
    expect(TRADE_DESK_LOAD_TICK_MIN_BTC_PER_WINDOW).toBe(1);
  });

  it('does not false-positive disconnect banner or submit gate under healthy load states', () => {
    expect(
      hasLoadRealtimeDisconnectFalsePositive({
        hadSubscription: true,
        status: 'subscribed',
        connected: true,
      }),
    ).toBe(false);
    expect(
      hasLoadRealtimeDisconnectFalsePositive({
        hadSubscription: true,
        status: 'connecting',
        connected: false,
      }),
    ).toBe(false);
    expect(
      hasLoadRealtimeSubmitGateFalsePositive({
        deskBlocked: false,
        priceStale: false,
        realtimeInput: {
          hadSubscription: true,
          status: 'subscribed',
          connected: true,
        },
      }),
    ).toBe(false);
  });

  it('flags true disconnect and submit block after subscription loss', () => {
    expect(
      hasLoadRealtimeDisconnectFalsePositive({
        hadSubscription: true,
        status: 'closed',
        connected: false,
      }),
    ).toBe(true);
    expect(
      hasLoadRealtimeSubmitGateFalsePositive({
        deskBlocked: false,
        priceStale: false,
        realtimeInput: {
          hadSubscription: true,
          status: 'timed_out',
          connected: false,
        },
      }),
    ).toBe(false);
  });

  it('evaluates soak metrics — full subscribe ratio passes DoD invariants', () => {
    const pass = evaluateTradeDeskLoadRealtimeSoak({
      tier: 10,
      channelCount: 10,
      subscribedCount: 10,
      channelErrors: 0,
      oracleEvents: 42,
      soakMs: TRADE_DESK_LOAD_REALTIME_SOAK_MS,
    });
    expect(pass.pass).toBe(true);
    expect(pass.disconnectFalsePositive).toBe(false);
    expect(pass.submitGateFalsePositive).toBe(false);
  });

  it('fails soak when subscribe ratio drops or channel errors occur', () => {
    const fail = evaluateTradeDeskLoadRealtimeSoak({
      tier: 50,
      channelCount: 50,
      subscribedCount: 40,
      channelErrors: 2,
      oracleEvents: 0,
      soakMs: TRADE_DESK_LOAD_REALTIME_SOAK_MS,
    });
    expect(fail.pass).toBe(false);
    expect(fail.reasons.some((reason) => reason.includes('subscribe ratio'))).toBe(true);
    expect(fail.reasons.some((reason) => reason.includes('channel errors'))).toBe(true);
  });

  it('wires soak script, spotcheck SQL extension, and operator doc', () => {
    const soakScript = readRepo(TRADE_DESK_LOAD_REALTIME_SOAK_SCRIPT);
    const spotcheck = readRepo(TRADE_DESK_LOAD_REALTIME_SPOTCHECK_SCRIPT);
    const doc = readRepo(TRADE_DESK_LOAD_REALTIME_DOC);

    expect(soakScript).toContain('p3-load-realtime');
    expect(soakScript).toContain('evaluateTradeDeskLoadRealtimeSoak');
    for (const tier of TRADE_DESK_LOAD_REALTIME_CHANNEL_TIERS) {
      expect(soakScript).toContain(String(tier));
    }

    expect(spotcheck).toContain('P3-C');
    expect(spotcheck).toContain(String(TRADE_DESK_LOAD_TICK_BURST_WINDOW_SEC));
    expect(spotcheck).toContain(String(TRADE_DESK_LOAD_TICK_BURST_MAX_PER_WINDOW));
    expect(spotcheck).toContain(String(TRADE_DESK_LOAD_TICK_MIN_BTC_PER_WINDOW));

    expect(doc).toContain('P3-C');
    expect(doc).toContain(TRADE_DESK_LOAD_REALTIME_SOAK_SCRIPT);
    expect(doc).toContain(TRADE_DESK_LOAD_REALTIME_SPOTCHECK_SCRIPT);
  });
});
