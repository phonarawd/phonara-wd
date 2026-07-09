import { describe, expect, it } from 'vitest';

import {
  assertTradeFiatHintConsistencyContractSync,
  TRADE_FIAT_HINT_CONSISTENCY_OWNERS,
  TRADE_FIAT_HINT_SURFACE_WRAPPER,
} from '../trade-fiat-hint-consistency-display-contract';

describe('trade-fiat-hint-consistency-display-contract · P2-8', () => {
  it('registers trade fiat hint surface owners', () => {
    expect(TRADE_FIAT_HINT_SURFACE_WRAPPER).toBe('trade-money-with-fiat-hint.tsx');
    expect(TRADE_FIAT_HINT_CONSISTENCY_OWNERS).toContain('use-trade-fiat-hint.ts');
    expect(TRADE_FIAT_HINT_CONSISTENCY_OWNERS).toContain('spot-desk-page.tsx');
  });

  it('asserts PHON/USDT-only eligible currencies and sync guard', () => {
    expect(() => assertTradeFiatHintConsistencyContractSync()).not.toThrow();
  });
});
