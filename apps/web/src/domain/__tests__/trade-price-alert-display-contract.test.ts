import { describe, expect, it } from 'vitest';

import {
  formatPriceAlertDirectionLabel,
  isValidPriceAlertTarget,
  normalizePriceAlertTargetInput,
  shouldTriggerPriceAlert,
} from '../trade-price-alert-display-contract';

describe('trade-price-alert-display-contract', () => {
  it('validates positive alert targets only', () => {
    expect(isValidPriceAlertTarget('65000')).toBe(true);
    expect(isValidPriceAlertTarget('0')).toBe(false);
    expect(isValidPriceAlertTarget('-1')).toBe(false);
    expect(isValidPriceAlertTarget('abc')).toBe(false);
  });

  it('triggers above/below alerts against display price', () => {
    const base = {
      symbol: 'BTCUSDT-SIM',
      target: '65000',
      direction: 'above' as const,
      enabled: true,
      triggered: false,
    };

    expect(shouldTriggerPriceAlert('64999', base)).toBe(false);
    expect(shouldTriggerPriceAlert('65000', base)).toBe(true);
    expect(shouldTriggerPriceAlert('65001', { ...base, direction: 'below' })).toBe(false);
    expect(shouldTriggerPriceAlert('64999', { ...base, direction: 'below' })).toBe(true);
  });

  it('skips disabled or already-triggered alerts', () => {
    const alert = {
      symbol: 'ETH_USDT',
      target: '3200',
      direction: 'above' as const,
      enabled: false,
      triggered: false,
    };
    expect(shouldTriggerPriceAlert('4000', alert)).toBe(false);
    expect(shouldTriggerPriceAlert('4000', { ...alert, enabled: true, triggered: true })).toBe(
      false,
    );
  });

  it('formats direction labels via i18n callback', () => {
    const t = (key: 'notif.priceAlert.above' | 'notif.priceAlert.below') =>
      key === 'notif.priceAlert.above' ? 'Above' : 'Below';
    expect(formatPriceAlertDirectionLabel('above', t)).toBe('Above');
    expect(formatPriceAlertDirectionLabel('below', t)).toBe('Below');
  });

  it('normalizes decimal target input', () => {
    expect(normalizePriceAlertTargetInput(' 65000.5 ')).toBe('65000.5');
    expect(normalizePriceAlertTargetInput('')).toBe('');
  });
});
