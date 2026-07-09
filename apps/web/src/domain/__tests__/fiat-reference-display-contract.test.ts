import { describe, expect, it } from 'vitest';

import {
  assertFiatReferenceContractRegistrySync,
  buildFiatReferenceRateQueryKey,
  FIAT_FORBIDDEN_IDENTIFIER_PATTERNS,
  FIAT_HINT_COMPLAINT_RISK_IDS,
  FIAT_HINT_COMPLAINT_RISKS,
  FIAT_HINT_I18N_KEY_PREFIX,
  FIAT_LEAK_SCAN_ROOTS,
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  FIAT_REFERENCE_HINT_FIAT_CODES,
  FIAT_REFERENCE_RATE_PAIRS,
  FIAT_REFERENCE_SETTLEMENT_CURRENCIES,
  FIAT_REFERENCE_STALE_TTL_SECONDS,
  FIAT_SETTLEMENT_LEAK_PATTERNS,
  findFiatHintComplaintRisk,
  listFiatHintComplaintRisksByOwnerTodo,
  P4_FIAT_REFERENCE_PREFLIGHT_PREREQUISITE_TODO,
  P4_FIAT_REFERENCE_PREFLIGHT_TODO,
  P4_FIAT_REFERENCE_RATES_HOOK_TODO,
  P4_FIAT_REFERENCE_RATES_PREREQUISITE_TODO,
} from '../fiat-reference-display-contract';
import {
  assertFiatReferencePreflightSync,
  scanFiatForbiddenNamingViolations,
  scanFiatSettlementLeakViolations,
} from './fiat-reference-display-audit-lib';

describe('fiat-reference-display-contract §13.1.4 Fiat#1 preflight', () => {
  it('registers Fiat#1 todo with Launch E4 prerequisite', () => {
    expect(P4_FIAT_REFERENCE_PREFLIGHT_TODO).toBe('p4-fiat-reference-preflight');
    expect(P4_FIAT_REFERENCE_PREFLIGHT_PREREQUISITE_TODO).toBe(
      'launch-engine-e4-concurrent-race-test',
    );
  });

  it('registers Fiat#3 rates hook with Fiat#2 prerequisite', () => {
    expect(P4_FIAT_REFERENCE_RATES_HOOK_TODO).toBe('p4-fiat-reference-rates-hook');
    expect(P4_FIAT_REFERENCE_RATES_PREREQUISITE_TODO).toBe('p4-fiat-currency-precision-ssot');
  });

  it('anchors canonical rate pairs and wallet-shared query keys', () => {
    expect(FIAT_REFERENCE_RATE_PAIRS).toHaveLength(3);
    expect(buildFiatReferenceRateQueryKey('PHON', 'KRW')).toEqual([
      'exchange-rate',
      'PHON',
      'KRW',
      'active',
    ]);
    expect(FIAT_REFERENCE_STALE_TTL_SECONDS['PHON/USDT']).toBe(5 * 60);
    expect(FIAT_REFERENCE_STALE_TTL_SECONDS['USDT/KRW']).toBe(15 * 60);
  });

  it('marks display_only boundary non-waivable', () => {
    expect(FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY).toBe(true);
  });

  it('separates settlement currencies from fiat hint codes', () => {
    expect(FIAT_REFERENCE_SETTLEMENT_CURRENCIES).toEqual(['PHON', 'USDT']);
    expect(FIAT_REFERENCE_HINT_FIAT_CODES).toContain('KRW');
    expect(FIAT_REFERENCE_SETTLEMENT_CURRENCIES).not.toContain('KRW');
  });

  it('registers five §32.7 fiat-hint-* ComplaintRisk rows', () => {
    expect(FIAT_HINT_COMPLAINT_RISKS).toHaveLength(5);
    expect(FIAT_HINT_COMPLAINT_RISK_IDS).toEqual([
      'fiat-hint-ledger-leak',
      'fiat-hint-stale-hidden',
      'fiat-hint-locale-hardcode-krw',
      'fiat-hint-casino-drift',
      'fiat-hint-sports-odds-order',
    ]);
    for (const row of FIAT_HINT_COMPLAINT_RISKS) {
      expect(['live', 'disabled+key', 'built_hidden']).toContain(row.mitigatedBy);
    }
  });

  it('assigns ledger-leak row to p4-fiat-reference-preflight', () => {
    const row = findFiatHintComplaintRisk('fiat-hint-ledger-leak');
    expect(row?.ownerTodo).toBe(P4_FIAT_REFERENCE_PREFLIGHT_TODO);
    expect(row?.mitigatedBy).toBe('live');
    expect(row?.failSymptom).toMatch(/KRW|fiat/i);
  });

  it('maps future owner todos for stale · locale · casino · sports rows', () => {
    expect(findFiatHintComplaintRisk('fiat-hint-stale-hidden')?.ownerTodo).toBe(
      'p4-fiat-reference-rates-hook',
    );
    expect(findFiatHintComplaintRisk('fiat-hint-locale-hardcode-krw')?.ownerTodo).toBe(
      'p4-fiat-hint-display-contract',
    );
    expect(findFiatHintComplaintRisk('fiat-hint-casino-drift')?.ownerTodo).toBe(
      'p10-casino-fiat-hint-session-lock',
    );
    expect(findFiatHintComplaintRisk('fiat-hint-sports-odds-order')?.ownerTodo).toBe(
      'p10-sports-fiat-hint-wire',
    );
    expect(listFiatHintComplaintRisksByOwnerTodo(P4_FIAT_REFERENCE_PREFLIGHT_TODO)).toHaveLength(1);
  });

  it('anchors future i18n namespace for FiatHint copy', () => {
    expect(FIAT_HINT_I18N_KEY_PREFIX).toBe('trade.fiatHint');
  });

  it('defines settlement leak grep roots excluding wallet KRW rail', () => {
    expect(FIAT_LEAK_SCAN_ROOTS).toContain('features/trading');
    expect(FIAT_LEAK_SCAN_ROOTS).toContain('product/surfaces/trade');
    expect(FIAT_LEAK_SCAN_ROOTS).not.toContain('features/wallet');
  });

  it('assertFiatReferenceContractRegistrySync stays green', () => {
    expect(() => assertFiatReferenceContractRegistrySync()).not.toThrow();
  });

  it('assertFiatReferencePreflightSync stays green (naming + leak grep)', () => {
    expect(() => assertFiatReferencePreflightSync()).not.toThrow();
  });

  it('finds zero forbidden krwHint/KrwDisplay identifiers in apps/web', () => {
    expect(scanFiatForbiddenNamingViolations()).toEqual([]);
    expect(FIAT_FORBIDDEN_IDENTIFIER_PATTERNS.length).toBeGreaterThanOrEqual(2);
  });

  it('finds zero fiat settlement leaks in trade/sports/casino/staking surfaces', () => {
    expect(scanFiatSettlementLeakViolations()).toEqual([]);
    expect(FIAT_SETTLEMENT_LEAK_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });
});
