import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P7_EARN_FIAT_HINT_CO_PRIMARY_TODO,
  P4_FIAT_MONEY_DISPLAY_HINT_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';

import {
  buildEarnFiatHint,
  isEarnRewardPhonHintEligible,
  P7_EARN_FIAT_HINT_CO_PRIMARY_PREREQUISITE_TODO,
  resolveEarnFiatHintPairKey,
} from '../earn-fiat-hint-display';

const SAMPLE_RATE = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1400',
  capturedAt: '2026-07-06T10:00:00.000Z',
  source: 'exchange_rate_snapshots:PHON/KRW',
  stale: false,
  tier: 'primary' as const,
  unavailable: false,
  blocked: false,
};

describe('earn-fiat-hint-display §13.1.4.4 Fiat#8', () => {
  it('tracks Fiat#8 owner and prerequisite', () => {
    expect(P7_EARN_FIAT_HINT_CO_PRIMARY_TODO).toBe('p7-earn-fiat-hint-co-primary');
    expect(P7_EARN_FIAT_HINT_CO_PRIMARY_PREREQUISITE_TODO).toBe(P4_FIAT_MONEY_DISPLAY_HINT_TODO);
  });

  it('resolves PHON/KRW pair for ko locale target', () => {
    expect(resolveEarnFiatHintPairKey('PHON', 'KRW')).toBe('PHON/KRW');
    expect(resolveEarnFiatHintPairKey('PHON', 'OFF')).toBeNull();
  });

  it('builds co-primary hint from RPC reward_phon without client reward math', () => {
    const hint = buildEarnFiatHint('25.000000', 'PHON', 'KRW', {
      'PHON/KRW': SAMPLE_RATE,
    });

    expect(hint.disabled).toBe(false);
    expect(hint.formattedHint).toMatch(/^≈ ₩/);
    expect(hint.sourceCurrency).toBe('PHON');
  });

  it('guards reward_phon eligibility', () => {
    expect(isEarnRewardPhonHintEligible('25.000000')).toBe(true);
    expect(isEarnRewardPhonHintEligible('0.000000')).toBe(false);
    expect(isEarnRewardPhonHintEligible(undefined)).toBe(false);
  });

  it('matches toFiatHint output for shared rate snapshot', () => {
    const snapshot = {
      displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
      rate: '1400',
      capturedAt: '2026-07-06T10:00:00.000Z',
      source: 'exchange_rate_snapshots:PHON/KRW',
      stale: false,
    };

    const fromBuilder = buildEarnFiatHint('10', 'PHON', 'KRW', {
      'PHON/KRW': SAMPLE_RATE,
    });
    const direct = toFiatHint('10', 'PHON', 'KRW', snapshot);

    expect(fromBuilder.formattedHint).toBe(direct.formattedHint);
  });
});
