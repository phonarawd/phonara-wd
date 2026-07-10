import { beforeEach, describe, expect, it } from 'vitest';

import {
  createEmptyCasinoFiatRateSession,
  lockCasinoFiatRateSession,
  resolveCasinoFiatHintRates,
  unlockCasinoFiatRateSession,
  useCasinoFiatRateSession,
  type CasinoFiatRateMap,
} from '../casino-fiat-rate-session';

const RATE_A = {
  displayOnly: true as const,
  rate: '1400',
  capturedAt: '2026-07-11T01:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
  tier: 'primary' as const,
  unavailable: false,
  blocked: false,
};

const RATE_B = {
  ...RATE_A,
  rate: '1500',
  capturedAt: '2026-07-11T01:05:00.000Z',
};

const MAP_A: CasinoFiatRateMap = { 'USDT/KRW': RATE_A };
const MAP_B: CasinoFiatRateMap = { 'USDT/KRW': RATE_B };

describe('CasinoFiatRateSession Fiat#11', () => {
  beforeEach(() => {
    useCasinoFiatRateSession.getState().unlock();
  });

  it('locks rates at bet open and ignores later live rate changes (spin drift 0)', () => {
    const empty = createEmptyCasinoFiatRateSession();
    const locked = lockCasinoFiatRateSession(empty, MAP_A, '2026-07-11T01:00:00.000Z');
    expect(locked.locked).toBe(true);
    expect(locked.rates['USDT/KRW']?.rate).toBe('1400');

    const relock = lockCasinoFiatRateSession(locked, MAP_B, '2026-07-11T01:05:00.000Z');
    expect(relock).toBe(locked);
    expect(relock.rates['USDT/KRW']?.rate).toBe('1400');

    const effective = resolveCasinoFiatHintRates(relock, MAP_B);
    expect(effective['USDT/KRW']?.rate).toBe('1400');
  });

  it('uses live rates when unlocked', () => {
    const unlocked = unlockCasinoFiatRateSession();
    expect(unlocked.locked).toBe(false);
    expect(resolveCasinoFiatHintRates(unlocked, MAP_B)['USDT/KRW']?.rate).toBe('1500');
  });

  it('zustand store lock is idempotent across spins', () => {
    const store = useCasinoFiatRateSession.getState();
    store.lock(MAP_A, '2026-07-11T01:00:00.000Z');
    expect(useCasinoFiatRateSession.getState().locked).toBe(true);
    store.lock(MAP_B, '2026-07-11T01:05:00.000Z');
    expect(useCasinoFiatRateSession.getState().rates['USDT/KRW']?.rate).toBe('1400');
    store.unlock();
    expect(useCasinoFiatRateSession.getState().locked).toBe(false);
  });
});
