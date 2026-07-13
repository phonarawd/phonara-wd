import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
  findFiatHintComplaintRisk,
} from '../fiat-reference-display-contract';
import {
  assertCasinoFiatHintSessionLockDisplayContractSync,
  CASINO_FIAT_HINT_REFRESH_POLICY,
  CASINO_FIAT_HINT_WIRE_OWNERS,
  CASINO_FIAT_HINT_WIRE_SURFACE,
  CASINO_FIAT_RATE_SESSION_OWNER,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS,
  resolveCasinoFiatHintVisible,
} from '../casino-fiat-hint-session-lock-display-contract';

describe('casino-fiat-hint-session-lock-display-contract Fiat#11', () => {
  it('registers Fiat#11 owner, prerequisites, and casino_session_lock policy', () => {
    expect(P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO).toBe('p10-casino-fiat-hint-session-lock');
    expect(P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS).toContain(
      'p10-casino-replay-and-infra',
    );
    expect(P10_CASINO_FIAT_HINT_SESSION_LOCK_PREREQUISITE_TODOS).toContain(
      'p4-fiat-money-display-hint',
    );
    expect(CASINO_FIAT_HINT_REFRESH_POLICY).toBe('casino_session_lock');
    expect(CASINO_FIAT_HINT_WIRE_SURFACE).toBe('casino-money-with-fiat-hint.tsx');
    expect(CASINO_FIAT_HINT_WIRE_OWNERS).toContain('use-casino-fiat-hint.ts');
    expect(CASINO_FIAT_RATE_SESSION_OWNER).toBe('casino-fiat-rate-session.ts');
  });

  it('owns fiat-hint-casino-drift ComplaintRisk as live via CasinoFiatRateSession', () => {
    const row = findFiatHintComplaintRisk('fiat-hint-casino-drift');
    expect(row?.ownerTodo).toBe(P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO);
    expect(row?.mitigatedBy).toBe('live');
    expect(row?.rpcPath).toBe('CasinoFiatRateSession');
  });

  it('requires stake/win amounts before showing hint', () => {
    const hint = {
      displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
      disabled: false,
      formattedHint: '≈ ₩14,000',
      targetFiat: 'KRW' as const,
      asOf: '',
      stale: false,
      sourceCurrency: 'USDT',
    };

    expect(resolveCasinoFiatHintVisible('USDT', hint, 'win', null)).toBe(false);
    expect(resolveCasinoFiatHintVisible('USDT', hint, 'win', '')).toBe(false);
    expect(resolveCasinoFiatHintVisible('USDT', hint, 'win', '19.50')).toBe(true);
    expect(resolveCasinoFiatHintVisible('USDT', hint, 'stake', '10')).toBe(true);
    expect(resolveCasinoFiatHintVisible('KRW', hint, 'stake', '10')).toBe(false);
  });

  it('assertCasinoFiatHintSessionLockDisplayContractSync passes', () => {
    expect(() => assertCasinoFiatHintSessionLockDisplayContractSync()).not.toThrow();
  });
});
