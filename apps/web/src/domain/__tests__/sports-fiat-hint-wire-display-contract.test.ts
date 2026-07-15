import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P10_SPORTS_FIAT_HINT_WIRE_TODO,
  findFiatHintComplaintRisk,
} from '../fiat-reference-display-contract';
import {
  assertSportsFiatHintWireDisplayContractSync,
  P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS,
  resolveSportsFiatHintVisible,
  SPORTS_FIAT_HINT_REFRESH_POLICY,
  SPORTS_FIAT_HINT_WIRE_OWNERS,
  SPORTS_FIAT_HINT_WIRE_SURFACE,
} from '../sports-fiat-hint-wire-display-contract';

describe('sports-fiat-hint-wire-display-contract Fiat#10', () => {
  it('registers Fiat#10 owner, prerequisites, and trade 30s policy', () => {
    expect(P10_SPORTS_FIAT_HINT_WIRE_TODO).toBe('p10-sports-fiat-hint-wire');
    expect(P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS).toContain('p10-page-sports');
    expect(P10_SPORTS_FIAT_HINT_WIRE_PREREQUISITE_TODOS).toContain('p4-fiat-money-display-hint');
    expect(SPORTS_FIAT_HINT_REFRESH_POLICY).toBe('trade');
    expect(SPORTS_FIAT_HINT_WIRE_SURFACE).toBe('sports-money-with-fiat-hint.tsx');
    expect(SPORTS_FIAT_HINT_WIRE_OWNERS).toContain('use-sports-fiat-hint.ts');
  });

  it('owns fiat-hint-sports-odds-order ComplaintRisk as live', () => {
    const row = findFiatHintComplaintRisk('fiat-hint-sports-odds-order');
    expect(row?.ownerTodo).toBe(P10_SPORTS_FIAT_HINT_WIRE_TODO);
    expect(row?.mitigatedBy).toBe('live');
  });

  it('hides potential_return hint until preview amount exists (odds-after)', () => {
    const hint = {
      displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
      disabled: false,
      formattedHint: '≈ ₩14,000',
      targetFiat: 'KRW' as const,
      asOf: '',
      stale: false,
      sourceCurrency: 'USDT',
    };

    expect(resolveSportsFiatHintVisible('USDT', hint, 'potential_return', null)).toBe(false);
    expect(resolveSportsFiatHintVisible('USDT', hint, 'potential_return', '')).toBe(false);
    expect(resolveSportsFiatHintVisible('USDT', hint, 'potential_return', '19.50')).toBe(true);
    expect(resolveSportsFiatHintVisible('USDT', hint, 'stake', '10')).toBe(true);
    expect(resolveSportsFiatHintVisible('KRW', hint, 'stake', '10')).toBe(false);
  });

  it('assertSportsFiatHintWireDisplayContractSync passes', () => {
    expect(() => assertSportsFiatHintWireDisplayContractSync()).not.toThrow();
  });
});
