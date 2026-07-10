/**
 * CasinoFiatRateSession — locks fiat reference rates at bet open (Fiat#11).
 * Re-lock while already locked is a no-op → spin-to-spin hint drift 0.
 */

import { create } from 'zustand';

import type { FiatReferencePairKey } from '@/domain/fiat-reference-display-contract';
import type { ResolvedFiatReferenceRate } from '@/features/money/fiat-reference-rates-lib';

export type CasinoFiatRateMap = Partial<Record<FiatReferencePairKey, ResolvedFiatReferenceRate>>;

export type CasinoFiatRateSessionSnapshot = {
  readonly locked: boolean;
  readonly lockedAt: string | null;
  readonly rates: CasinoFiatRateMap;
};

export function createEmptyCasinoFiatRateSession(): CasinoFiatRateSessionSnapshot {
  return { locked: false, lockedAt: null, rates: {} };
}

/**
 * Freeze live rates into the session. If already locked, return unchanged
 * so auto-bet spins cannot pick up a newer exchange rate mid-session.
 */
export function lockCasinoFiatRateSession(
  current: CasinoFiatRateSessionSnapshot,
  rates: CasinoFiatRateMap,
  lockedAt: string = new Date().toISOString(),
): CasinoFiatRateSessionSnapshot {
  if (current.locked) return current;
  return {
    locked: true,
    lockedAt,
    rates: { ...rates },
  };
}

export function unlockCasinoFiatRateSession(): CasinoFiatRateSessionSnapshot {
  return createEmptyCasinoFiatRateSession();
}

/** Prefer locked snapshot while session is open; otherwise live query rates. */
export function resolveCasinoFiatHintRates(
  session: CasinoFiatRateSessionSnapshot,
  liveRates: CasinoFiatRateMap,
): CasinoFiatRateMap {
  return session.locked ? session.rates : liveRates;
}

type CasinoFiatRateSessionStore = CasinoFiatRateSessionSnapshot & {
  lock: (rates: CasinoFiatRateMap, lockedAt?: string) => void;
  unlock: () => void;
};

/** Zustand SOT named in Plan §13.1.4.4 — `CasinoFiatRateSession`. */
export const useCasinoFiatRateSession = create<CasinoFiatRateSessionStore>((set, get) => ({
  ...createEmptyCasinoFiatRateSession(),
  lock: (rates, lockedAt) => {
    set(lockCasinoFiatRateSession(get(), rates, lockedAt));
  },
  unlock: () => {
    set(unlockCasinoFiatRateSession());
  },
}));
