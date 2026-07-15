/**
 * P10 Casino FiatHint session-lock — stake·win secondary · spin drift 0 (§13.1.4.4 Fiat#11).
 * Authority: `p10-casino-fiat-hint-session-lock` · ComplaintRisk `fiat-hint-casino-drift`.
 */

import {
  FIAT_REFERENCE_SETTLEMENT_CURRENCIES,
  findFiatHintComplaintRisk,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
  type FiatHintView,
} from './fiat-reference-display-contract';

export {
  P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
};

function isCasinoFiatHintEligibleCurrency(currency: string): boolean {
  return (FIAT_REFERENCE_SETTLEMENT_CURRENCIES as readonly string[]).includes(currency);
}

export const CASINO_FIAT_HINT_WIRE_SURFACE = 'casino-money-with-fiat-hint.tsx' as const;

export const CASINO_FIAT_HINT_WIRE_HOOK = 'use-casino-fiat-hint.ts' as const;

export const CASINO_FIAT_HINT_WIRE_DISPLAY = 'casino-fiat-hint-display.ts' as const;

export const CASINO_FIAT_RATE_SESSION_OWNER = 'casino-fiat-rate-session.ts' as const;

/** Casino uses session-lock refresh — no interval refetch while locked (§13.1.4.4). */
export const CASINO_FIAT_HINT_REFRESH_POLICY = 'casino_session_lock' as const;

export const CASINO_FIAT_HINT_WIRE_OWNERS = [
  CASINO_FIAT_HINT_WIRE_HOOK,
  CASINO_FIAT_HINT_WIRE_DISPLAY,
  CASINO_FIAT_RATE_SESSION_OWNER,
  CASINO_FIAT_HINT_WIRE_SURFACE,
  'casino-game-shell.tsx',
] as const;

export type CasinoFiatHintWireRole = 'stake' | 'win';

/**
 * Stake/win hints only for settlement currencies with an active FiatHint view.
 * Win role still requires a payout amount (RPC settle) — never client recompute.
 */
export function resolveCasinoFiatHintVisible(
  currency: string | undefined,
  fiatHint: FiatHintView,
  role: CasinoFiatHintWireRole,
  amount: string | null | undefined,
): boolean {
  if (!currency || !isCasinoFiatHintEligibleCurrency(currency)) return false;
  if (fiatHint.disabled) return false;
  if (role === 'win') {
    return Boolean(amount && amount.trim().length > 0);
  }
  return Boolean(amount && amount.trim().length > 0);
}

/** Non-waivable sync for Fiat#11 closeout. */
export function assertCasinoFiatHintSessionLockDisplayContractSync(): void {
  if (P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO !== 'p10-casino-fiat-hint-session-lock') {
    throw new Error('casino-fiat-hint-session-lock: owner todo id drift');
  }
  if (CASINO_FIAT_HINT_REFRESH_POLICY !== 'casino_session_lock') {
    throw new Error('casino-fiat-hint-session-lock: refresh policy must be casino_session_lock');
  }
  if (
    !P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS.includes('p10-casino-replay-and-infra')
  ) {
    throw new Error(
      'casino-fiat-hint-session-lock: p10-casino-replay-and-infra prerequisite missing',
    );
  }
  if (
    !P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS.includes('p4-fiat-money-display-hint')
  ) {
    throw new Error(
      'casino-fiat-hint-session-lock: p4-fiat-money-display-hint prerequisite missing',
    );
  }

  const drift = findFiatHintComplaintRisk('fiat-hint-casino-drift');
  if (!drift || drift.ownerTodo !== P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO) {
    throw new Error(
      'casino-fiat-hint-session-lock: fiat-hint-casino-drift must be owned by p10-casino-fiat-hint-session-lock',
    );
  }
  if (drift.mitigatedBy !== 'live') {
    throw new Error(
      'casino-fiat-hint-session-lock: fiat-hint-casino-drift must be mitigatedBy live',
    );
  }
  if (drift.rpcPath !== 'CasinoFiatRateSession') {
    throw new Error(
      'casino-fiat-hint-session-lock: ComplaintRisk rpcPath must be CasinoFiatRateSession',
    );
  }
}
