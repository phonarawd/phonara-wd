import { describe, expect, it } from 'vitest';

import {
  buildDepositKrwLimitView,
  buildLossGameUsdtLimitView,
  depositKrwGateKey,
  lossGameUsdtGateKey,
  normalizeKrwLimitInput,
  normalizeUsdtLimitInput,
  selfExclusionDaysGateKey,
  selfExclusionUntilIso,
  toRpcKrwAmount,
  toRpcUsdtAmount,
} from '@/features/account/rg-display';
import type { RgLimitRow, RgLossRow } from '@/features/responsible-gaming/rg-snapshot';

describe('rg-display', () => {
  it('normalizes KRW and USDT limit inputs', () => {
    expect(normalizeKrwLimitInput('1,000,000원')).toBe('1000000');
    expect(normalizeUsdtLimitInput('12.3456789')).toBe('12.345678');
  });

  it('validates gate keys', () => {
    expect(depositKrwGateKey('100000')).toBeNull();
    expect(depositKrwGateKey('0')).toBe('rg.gate.depositKrw');
    expect(lossGameUsdtGateKey('50')).toBeNull();
    expect(selfExclusionDaysGateKey('7')).toBeNull();
    expect(selfExclusionDaysGateKey('0')).toBe('rg.gate.selfExclusionDays');
  });

  it('formats RPC amounts without float math', () => {
    expect(toRpcKrwAmount('100000')).toBe('100000');
    expect(toRpcUsdtAmount('50.5')).toBe('50.500000');
  });

  it('builds deposit limit view with pending increase', () => {
    const limits: RgLimitRow[] = [
      {
        limit_kind: 'deposit',
        domain: null,
        currency: 'KRW',
        current_limit: '500000',
        pending_limit: '800000',
        pending_effective_at: '2099-01-01T00:00:00.000Z',
      },
    ];

    const view = buildDepositKrwLimitView(limits, 'ko');
    expect(view.currentLimit).toBe('500000');
    expect(view.currentLimitDisplay).toContain('500');
    expect(view.pendingLimit).toBe('800000');
    expect(view.pendingEffectiveAtDisplay).not.toBeNull();
  });

  it('builds loss limit view with month usage', () => {
    const limits: RgLimitRow[] = [
      {
        limit_kind: 'loss',
        domain: 'game',
        currency: 'USDT',
        current_limit: '100.000000',
        pending_limit: null,
        pending_effective_at: null,
      },
    ];
    const losses: RgLossRow[] = [{ domain: 'game', currency: 'USDT', net_loss: '25.000000' }];

    const view = buildLossGameUsdtLimitView(limits, losses, 'en');
    expect(view.currentLimit).toBe('100.000000');
    expect(view.monthUsage).toBe('25.000000');
    expect(view.monthUsageDisplay).toContain('25');
  });

  it('computes self-exclusion until from days', () => {
    const iso = selfExclusionUntilIso('7');
    expect(Date.parse(iso)).toBeGreaterThan(Date.now());
  });
});
