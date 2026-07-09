/**
 * P9 Trade World-Class gate bundle (Plan §22.2.1 Tier-A · §22.2.2 · §22.2.3 · §13.1.1 · §32.7 H1–H4).
 * Authority: `p9-gate-trade-world-class` · WORLD step 28 · YAML #153.
 */

import {
  assertTradeLayoutDedupContractSync,
  assertTradeParityContractSync,
  findTradeComplaintRisk,
  findTradeDualCurrencyRow,
  P9_TRADE_LAYOUT_DEDUP_GATE_TODO,
  P9_TRADE_WORLD_CLASS_GATE_TODO,
  TRADE_EXCHANGE_PARITY_MATRIX,
  TRADE_USER_COMPLAINT_RISKS,
} from './trade-exchange-parity-display-contract';
import {
  assertTradeBeginnerLanguageContractSync,
  TRADE_BEGINNER_HOW_IT_WORKS,
} from './trade-beginner-language-display-contract';

export { P9_TRADE_WORLD_CLASS_GATE_TODO };

/** Prerequisite WORLD todos (#25 · #26a · #26b · #27) before gate closeout. */
export const P9_TRADE_WORLD_CLASS_PREREQUISITE_TODOS = [
  P9_TRADE_LAYOUT_DEDUP_GATE_TODO,
  'p9-trade-audit-remediation-a1',
  'p9-trade-audit-remediation-a2',
  'p9-operator-visual-signoff',
] as const;

/** gate:ai-impl bundle paths (Plan §25.12.9.1 G). */
export const P9_TRADE_WORLD_CLASS_GATE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/trade-layout-dedup-contract.test.ts',
  'apps/web/src/domain/__tests__/trade-action-path-contract.test.ts',
  'apps/web/src/domain/__tests__/p9-gate-trade-world-class-display-contract.test.ts',
  'apps/web/src/product/surfaces/trade',
] as const;

/** §13.1.1 trade-surface dual currency rows — phonara yes at gate closeout. */
export const P9_TRADE_DUAL_CURRENCY_TRADE_ROW_IDS = [
  'futures-margin-selector',
  'futures-table-columns',
  'spot-stake-rules',
  'desk-dual-balance',
] as const;

/** §32.7 H1–H4 P9 trade complaint risks (excludes P10 sports/casino deferrals). */
export const P9_TRADE_WORLD_CLASS_COMPLAINT_RISK_IDS = [
  'trade-dock-orphan',
  'futures-inline-positions',
  'desk-no-cancel',
  'pnl-dash',
  'fills-missing',
  'funding-history-missing',
  'duplicate-est-fee-row',
  'partial-close-ui',
  'margin-adjust-ui',
  'hedge-visible',
  'spot-limit-visible',
  'cross-margin-live-claim',
  'reduce-only-visible',
  'position-tpsl-edit',
  'dock-page-close-split',
  'futures-margin-phon-hidden',
  'spot-stake-hardcode-usdt',
  'fills-currency-mismatch',
  'chart-price-settlement',
  'recent-trades-missing',
  'duplicate-status-banner',
  'external-exchange-copy',
] as const;

const P9_COMPLAINT_MITIGATIONS = ['live', 'disabled', 'disabled+key', 'built_hidden'] as const;

function isP9TradeComplaintRiskOwner(ownerTodo: string): boolean {
  return ownerTodo.startsWith('p9-') || ownerTodo.startsWith('ew-e21-');
}

/** Non-waivable sync for P9 WORLD step 28 gate closeout. */
export function assertP9TradeWorldClassGateSync(): void {
  assertTradeParityContractSync();
  assertTradeLayoutDedupContractSync();
  assertTradeBeginnerLanguageContractSync();

  for (const row of TRADE_EXCHANGE_PARITY_MATRIX) {
    if (row.tier === 'A' && row.ownerTodo?.startsWith('p9-')) {
      throw new Error(
        `p9-gate-trade-world-class: Tier-A parity row ${row.id} still owned by ${row.ownerTodo}`,
      );
    }
  }

  for (const id of P9_TRADE_DUAL_CURRENCY_TRADE_ROW_IDS) {
    const row = findTradeDualCurrencyRow(id);
    if (!row || row.phonara !== 'yes') {
      throw new Error(`p9-gate-trade-world-class: dual currency row ${id} must be phonara yes`);
    }
    if (row.ownerTodo?.startsWith('p9-')) {
      throw new Error(
        `p9-gate-trade-world-class: dual currency row ${id} still owned by ${row.ownerTodo}`,
      );
    }
  }

  for (const id of P9_TRADE_WORLD_CLASS_COMPLAINT_RISK_IDS) {
    const row = findTradeComplaintRisk(id);
    if (!row) {
      throw new Error(`p9-gate-trade-world-class: missing complaint risk ${id}`);
    }
    if (!P9_COMPLAINT_MITIGATIONS.includes(row.mitigatedBy)) {
      throw new Error(`p9-gate-trade-world-class: complaint risk ${id} has invalid mitigatedBy`);
    }
    if (row.mitigatedBy === 'disabled+key' && !row.disabledReasonKey) {
      throw new Error(`p9-gate-trade-world-class: complaint risk ${id} missing disabledReasonKey`);
    }
  }

  for (const row of TRADE_USER_COMPLAINT_RISKS) {
    if (!isP9TradeComplaintRiskOwner(row.ownerTodo)) {
      continue;
    }
    if (!P9_COMPLAINT_MITIGATIONS.includes(row.mitigatedBy)) {
      throw new Error(`p9-gate-trade-world-class: P9 risk ${row.id} unmitigated`);
    }
  }

  if (TRADE_BEGINNER_HOW_IT_WORKS.length !== 3) {
    throw new Error(
      'p9-gate-trade-world-class: §13.1.3 HowItWorks must cover spot · futures · staking',
    );
  }
}
