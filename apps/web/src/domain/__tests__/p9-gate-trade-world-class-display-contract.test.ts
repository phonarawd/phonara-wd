import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertP9TradeWorldClassGateSync,
  P9_TRADE_DUAL_CURRENCY_TRADE_ROW_IDS,
  P9_TRADE_WORLD_CLASS_COMPLAINT_RISK_IDS,
  P9_TRADE_WORLD_CLASS_GATE_TEST_PATHS,
  P9_TRADE_WORLD_CLASS_GATE_TODO,
  P9_TRADE_WORLD_CLASS_PREREQUISITE_TODOS,
} from '../p9-gate-trade-world-class-display-contract';
import {
  findTradeComplaintRisk,
  findTradeDualCurrencyRow,
  listTradeParityRowsByTier,
  P9_TRADE_LAYOUT_DEDUP_GATE_TODO,
} from '../trade-exchange-parity-display-contract';

const TRADE_ERROR_TOAST_PATH = resolve(
  import.meta.dirname,
  '../../features/trading/use-trade-error-toast.ts',
);

describe('p9-gate-trade-world-class-display-contract §22.2 · §13.1.1 · §32.7 H1–H4', () => {
  it('registers gate todo id and prerequisite WORLD todos', () => {
    expect(P9_TRADE_WORLD_CLASS_GATE_TODO).toBe('p9-gate-trade-world-class');
    expect(P9_TRADE_WORLD_CLASS_PREREQUISITE_TODOS).toEqual(
      expect.arrayContaining([
        P9_TRADE_LAYOUT_DEDUP_GATE_TODO,
        'p9-trade-audit-remediation-a1',
        'p9-trade-audit-remediation-a2',
        'p9-operator-visual-signoff',
      ]),
    );
    expect(P9_TRADE_WORLD_CLASS_GATE_TEST_PATHS.length).toBeGreaterThanOrEqual(4);
  });

  it('requires §13.1.1 trade dual-currency rows at phonara yes', () => {
    for (const id of P9_TRADE_DUAL_CURRENCY_TRADE_ROW_IDS) {
      const row = findTradeDualCurrencyRow(id);
      expect(row?.phonara).toBe('yes');
      expect(row?.usdt).toBe(true);
      expect(row?.phon).toBe(true);
    }
  });

  it('maps §32.7 H1–H4 P9 trade complaint risks to live | disabled | disabled+key | built_hidden', () => {
    for (const id of P9_TRADE_WORLD_CLASS_COMPLAINT_RISK_IDS) {
      const row = findTradeComplaintRisk(id);
      expect(row).toBeDefined();
      expect(['live', 'disabled', 'disabled+key', 'built_hidden']).toContain(row?.mitigatedBy);
    }
    expect(findTradeComplaintRisk('hedge-visible')?.mitigatedBy).toBe('live');
    expect(findTradeComplaintRisk('cross-margin-live-claim')?.mitigatedBy).toBe('disabled+key');
    expect(findTradeComplaintRisk('spot-stake-hardcode-usdt')?.mitigatedBy).toBe('live');
  });

  it('has no pending Tier-A parity rows owned by p9-trade-* todos', () => {
    const tierA = listTradeParityRowsByTier('A');
    for (const row of tierA) {
      expect(row.ownerTodo?.startsWith('p9-')).not.toBe(true);
    }
  });

  it('passes assertP9TradeWorldClassGateSync bundle guard', () => {
    expect(() => assertP9TradeWorldClassGateSync()).not.toThrow();
  });

  it('removes use-trade-error-toast glue (§32.7 H4 · §3.4 productToast strict only)', () => {
    expect(existsSync(TRADE_ERROR_TOAST_PATH)).toBe(false);
  });
});
