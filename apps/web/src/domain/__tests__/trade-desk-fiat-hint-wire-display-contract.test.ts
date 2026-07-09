import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P9_TRADE_FIAT_HINT_WIRE_TODO,
} from '../fiat-reference-display-contract';
import {
  assertTradeDeskFiatHintWireDisplayContractSync,
  P2_FIAT_HINT_WIRE_PHASE_R_OWNER,
  P2_FIAT_HINT_WIRE_TODO,
  resolveTradeDeskFiatHintVisible,
  TRADE_DESK_FIAT_HINT_WIRE_OWNERS,
  TRADE_DESK_FIAT_HINT_WIRE_SURFACE,
} from '../trade-desk-fiat-hint-wire-display-contract';

describe('trade-desk-fiat-hint-wire-display-contract P2-E', () => {
  it('links P2-E todo to Phase R p9-trade-fiat-hint-wire owner', () => {
    expect(P2_FIAT_HINT_WIRE_TODO).toBe('p2-fiat-hint-wire');
    expect(P2_FIAT_HINT_WIRE_PHASE_R_OWNER).toBe(P9_TRADE_FIAT_HINT_WIRE_TODO);
    expect(TRADE_DESK_FIAT_HINT_WIRE_SURFACE).toBe('trade-money-with-fiat-hint.tsx');
    expect(TRADE_DESK_FIAT_HINT_WIRE_OWNERS).toContain('use-trade-fiat-hint.ts');
  });

  it('shows secondary hint only for eligible settlement currencies', () => {
    expect(
      resolveTradeDeskFiatHintVisible('USDT', {
        displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
        disabled: false,
        formattedHint: '≈ ₩140,000',
        targetFiat: 'KRW',
        asOf: '',
        stale: false,
        sourceCurrency: 'USDT',
      }),
    ).toBe(true);
    expect(
      resolveTradeDeskFiatHintVisible('KRW', {
        displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
        disabled: true,
        formattedHint: '',
        targetFiat: 'KRW',
        asOf: '',
        stale: false,
        sourceCurrency: 'KRW',
      }),
    ).toBe(false);
  });

  it('assertTradeDeskFiatHintWireDisplayContractSync passes', () => {
    expect(() => assertTradeDeskFiatHintWireDisplayContractSync()).not.toThrow();
  });
});
