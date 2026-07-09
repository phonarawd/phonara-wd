import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertP4FiatReferenceWorldClassGateSync,
  P4_FIAT_REFERENCE_P10_DEFERRED_COMPLAINT_RISK_IDS,
  P4_FIAT_REFERENCE_WORLD_CLASS_ARTIFACT_PATHS,
  P4_FIAT_REFERENCE_WORLD_CLASS_COMPLAINT_RISK_IDS,
  P4_FIAT_REFERENCE_WORLD_CLASS_GATE_TEST_PATHS,
  P4_FIAT_REFERENCE_WORLD_CLASS_GATE_TODO,
  P4_FIAT_REFERENCE_WORLD_CLASS_INFRA_TODOS,
  P4_FIAT_REFERENCE_WORLD_CLASS_PREREQUISITE_TODOS,
} from '../p4-gate-fiat-reference-world-class-display-contract';
import {
  findFiatHintComplaintRisk,
  P4_FIAT_HINT_DISPLAY_CONTRACT_TODO,
  P4_FIAT_REFERENCE_PREFLIGHT_TODO,
  P4_FIAT_REFERENCE_RATES_HOOK_TODO,
  P4_PAGE_WALLET_FIAT_HINT_TODO,
  P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO,
  P7_EARN_FIAT_HINT_CO_PRIMARY_TODO,
  P9_TRADE_FIAT_HINT_WIRE_TODO,
} from '../fiat-reference-display-contract';
import { assertFiatReferencePreflightSync } from './fiat-reference-display-audit-lib';

const WEB_SRC = resolve(import.meta.dirname, '../..');

describe('p4-gate-fiat-reference-world-class-display-contract §13.1.4 · §20.13.2 Fiat#9G', () => {
  it('registers gate todo id · Fiat#1–5 infra · Fiat#6–9 prerequisite wires', () => {
    expect(P4_FIAT_REFERENCE_WORLD_CLASS_GATE_TODO).toBe('p4-gate-fiat-reference-world-class');
    expect(P4_FIAT_REFERENCE_WORLD_CLASS_INFRA_TODOS).toEqual([
      P4_FIAT_REFERENCE_PREFLIGHT_TODO,
      'p4-fiat-currency-precision-ssot',
      P4_FIAT_REFERENCE_RATES_HOOK_TODO,
      P4_FIAT_HINT_DISPLAY_CONTRACT_TODO,
      'p4-fiat-money-display-hint',
    ]);
    expect(P4_FIAT_REFERENCE_WORLD_CLASS_PREREQUISITE_TODOS).toEqual([
      P4_PAGE_WALLET_FIAT_HINT_TODO,
      P9_TRADE_FIAT_HINT_WIRE_TODO,
      P7_EARN_FIAT_HINT_CO_PRIMARY_TODO,
      P5_PAGE_SETTINGS_FIAT_REFERENCE_TODO,
    ]);
    expect(P4_FIAT_REFERENCE_WORLD_CLASS_GATE_TEST_PATHS.length).toBeGreaterThanOrEqual(10);
  });

  it('maps §13.1.4.5 core fiat-hint-* ComplaintRisk rows to live mitigation', () => {
    for (const id of P4_FIAT_REFERENCE_WORLD_CLASS_COMPLAINT_RISK_IDS) {
      const row = findFiatHintComplaintRisk(id);
      expect(row).toBeDefined();
      expect(row?.mitigatedBy).toBe('live');
    }
    expect(findFiatHintComplaintRisk('fiat-hint-ledger-leak')?.ownerTodo).toBe(
      P4_FIAT_REFERENCE_PREFLIGHT_TODO,
    );
    expect(findFiatHintComplaintRisk('fiat-hint-stale-hidden')?.ownerTodo).toBe(
      P4_FIAT_REFERENCE_RATES_HOOK_TODO,
    );
    expect(findFiatHintComplaintRisk('fiat-hint-locale-hardcode-krw')?.ownerTodo).toBe(
      P4_FIAT_HINT_DISPLAY_CONTRACT_TODO,
    );
  });

  it('defers sports/casino fiat-hint-* rows to P10 owner todos', () => {
    for (const id of P4_FIAT_REFERENCE_P10_DEFERRED_COMPLAINT_RISK_IDS) {
      const row = findFiatHintComplaintRisk(id);
      expect(row?.ownerTodo.startsWith('p10-')).toBe(true);
    }
    expect(findFiatHintComplaintRisk('fiat-hint-casino-drift')?.ownerTodo).toBe(
      'p10-casino-fiat-hint-session-lock',
    );
    expect(findFiatHintComplaintRisk('fiat-hint-sports-odds-order')?.ownerTodo).toBe(
      'p10-sports-fiat-hint-wire',
    );
  });

  it('requires Fiat#1–9 infra + surface wire artifacts on disk', () => {
    for (const rel of P4_FIAT_REFERENCE_WORLD_CLASS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
  });

  it('passes assertP4FiatReferenceWorldClassGateSync bundle guard', () => {
    expect(() => assertP4FiatReferenceWorldClassGateSync()).not.toThrow();
  });

  it('passes Fiat#1 preflight grep gate (naming + settlement leak · §13.1.4.5 core)', () => {
    expect(() => assertFiatReferencePreflightSync()).not.toThrow();
  });
});
