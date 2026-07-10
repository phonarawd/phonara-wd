import { describe, expect, it } from 'vitest';

import {
  SPORTS_VIP_ENGINE_TODO,
  SPORTS_VIP_ROUTE,
  SPORTS_VIP_UI_UNLOCK_TODO,
} from '../dead-controls-display-contract';
import { P10_SPORTS_LAYOUT_DEDUP_TODO } from '../sports-exchange-parity-display-contract';
import {
  assertSportsRulesAndVipDisplayContractSync,
  canBrowseSportsVipMarkets,
  P10_SPORTS_RULES_AND_VIP_PREREQUISITE_TODOS,
  P10_SPORTS_RULES_AND_VIP_TODO,
  resolveSportsRulesPageExposure,
  resolveSportsRulesRoute,
  resolveSportsVipMinTierLabelKey,
  resolveSportsVipPageExposure,
  resolveSportsVipStubRoute,
  SPORTS_RULES_AND_VIP_ROUTE_OWNERS,
  SPORTS_RULES_ENGINE_STATUS,
  SPORTS_RULES_SECTIONS,
  SPORTS_RULES_SURFACE_ROUTE,
  SPORTS_VIP_MARKETS_ENGINE_STATUS,
  SPORTS_VIP_MIN_TIER,
  SPORTS_VIP_STUB_ROUTE,
} from '../sports-rules-and-vip-display-contract';

describe('sports-rules-and-vip-display-contract Sports#4', () => {
  it('locks Sports#4 owner todo, layout-dedup prerequisite, and routes', () => {
    expect(P10_SPORTS_RULES_AND_VIP_TODO).toBe('p10-sports-rules-and-vip-stub');
    expect(P10_SPORTS_RULES_AND_VIP_PREREQUISITE_TODOS).toContain(P10_SPORTS_LAYOUT_DEDUP_TODO);
    expect(SPORTS_RULES_SURFACE_ROUTE).toBe('/sports/rules');
    expect(SPORTS_VIP_STUB_ROUTE).toBe('/sports/vip');
    expect(resolveSportsRulesRoute()).toBe('/sports/rules');
    expect(resolveSportsVipStubRoute()).toBe('/sports/vip');
    expect(SPORTS_VIP_ROUTE).toBe('/sports/vip');
    expect(SPORTS_RULES_AND_VIP_ROUTE_OWNERS).toEqual(['sports.rules.tsx', 'sports.vip.tsx']);
  });

  it('keeps rules live (i18n) and VIP markets as defer stub until E4/E5', () => {
    expect(SPORTS_RULES_ENGINE_STATUS).toBe('ui_only');
    expect(SPORTS_VIP_MARKETS_ENGINE_STATUS).toBe('gap');
    expect(resolveSportsRulesPageExposure()).toBe('live');
    expect(resolveSportsVipPageExposure()).toBe('defer_stub');
    expect(canBrowseSportsVipMarkets()).toBe(false);
    expect(SPORTS_VIP_MIN_TIER).toBe('platinum');
    expect(resolveSportsVipMinTierLabelKey()).toBe('sports.vip.eligibility.tier');
    expect(SPORTS_VIP_ENGINE_TODO).toBe('ew-e4-gate-tier-option-b');
    expect(SPORTS_VIP_UI_UNLOCK_TODO).toBe('ew-e5-gap-surfaces-wire');
  });

  it('defines five honest rules sections without client settlement math', () => {
    expect(SPORTS_RULES_SECTIONS.map((s) => s.id)).toEqual([
      'odds',
      'settlement',
      'void',
      'live',
      'responsible',
    ]);
    expect(SPORTS_RULES_SECTIONS).toHaveLength(5);
  });

  it('assertSportsRulesAndVipDisplayContractSync passes', () => {
    expect(() => assertSportsRulesAndVipDisplayContractSync()).not.toThrow();
  });
});
