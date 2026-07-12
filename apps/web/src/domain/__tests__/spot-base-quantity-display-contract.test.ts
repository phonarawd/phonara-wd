import { describe, expect, it } from 'vitest';

import {
  SPOT_BASE_QUANTITY_FAIL_CLOSED,
  SPOT_HOLDING_ENGINE_QUANTITY_PRECISION,
  formatSpotBaseQuantityDisplay,
  isValidSpotQuantityPrecision,
  resolveSpotBaseQuantityPrecision,
} from '../spot-base-quantity-display-contract';

describe('spot-base-quantity-display-contract (M-03)', () => {
  it('accepts integer precision 0–18 only', () => {
    expect(isValidSpotQuantityPrecision(0)).toBe(true);
    expect(isValidSpotQuantityPrecision(8)).toBe(true);
    expect(isValidSpotQuantityPrecision(18)).toBe(true);
    expect(isValidSpotQuantityPrecision(-1)).toBe(false);
    expect(isValidSpotQuantityPrecision(6.5)).toBe(false);
    expect(isValidSpotQuantityPrecision(null)).toBe(false);
    expect(isValidSpotQuantityPrecision(undefined)).toBe(false);
  });

  it('prefers market quantity_precision when valid', () => {
    expect(resolveSpotBaseQuantityPrecision({ quantity_precision: 8 })).toBe(8);
    expect(resolveSpotBaseQuantityPrecision({ quantity_precision: null })).toBe(
      SPOT_HOLDING_ENGINE_QUANTITY_PRECISION,
    );
    expect(resolveSpotBaseQuantityPrecision(undefined)).toBe(SPOT_HOLDING_ENGINE_QUANTITY_PRECISION);
  });

  it('formats with Decimal precision and fails closed on unknown precision', () => {
    expect(formatSpotBaseQuantityDisplay('1.23456789', 8)).toBe('1.23456789');
    expect(formatSpotBaseQuantityDisplay('1.23456789', 4)).toBe('1.2345');
    expect(formatSpotBaseQuantityDisplay('1000.5', 2)).toBe('1,000.50');
    expect(formatSpotBaseQuantityDisplay('1.23', null)).toBe(SPOT_BASE_QUANTITY_FAIL_CLOSED);
    expect(formatSpotBaseQuantityDisplay('', 6)).toBe(SPOT_BASE_QUANTITY_FAIL_CLOSED);
    expect(formatSpotBaseQuantityDisplay('not-a-number', 6)).toBe(SPOT_BASE_QUANTITY_FAIL_CLOSED);
  });

  it('does not apply USDT wallet currency rules to BTC-scale amounts', () => {
    // 8dp BTC-style quantity must keep 8 places when precision is 8 — not USDT 6.
    expect(formatSpotBaseQuantityDisplay('0.12345678', 8)).toBe('0.12345678');
    expect(formatSpotBaseQuantityDisplay('0.12345678', 6)).toBe('0.123456');
  });
});
