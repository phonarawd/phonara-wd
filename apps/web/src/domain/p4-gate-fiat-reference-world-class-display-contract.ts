/**
 * P4 Fiat Reference World-Class gate bundle (Plan §13.1.4 · §20.13.2 Fiat#9G · §32.7 fiat-hint-* core).
 * Authority: `p4-gate-fiat-reference-world-class` · YAML #167 · P10 page unblock.
 */

import { assertCurrencyPrecisionContractRegistrySync } from './currency-precision-display-contract';
import {
  assertFiatHintDisplayContractSync,
  assertFiatReferenceContractRegistrySync,
  findFiatHintComplaintRisk,
  P4_FIAT_HINT_DISPLAY_CONTRACT_TODO,
  P4_FIAT_MONEY_DISPLAY_HINT_TODO,
  P4_FIAT_REFERENCE_PREFLIGHT_TODO,
  P4_FIAT_REFERENCE_RATES_HOOK_TODO,
  P4_FIAT_REFERENCE_WORLD_CLASS_GATE_PREREQUISITE_TODOS,
  P4_FIAT_REFERENCE_WORLD_CLASS_GATE_TODO,
} from './fiat-reference-display-contract';

export {
  P4_FIAT_REFERENCE_WORLD_CLASS_GATE_TODO,
  P4_FIAT_REFERENCE_WORLD_CLASS_GATE_PREREQUISITE_TODOS as P4_FIAT_REFERENCE_WORLD_CLASS_PREREQUISITE_TODOS,
};

/** Fiat#1–5 infra owner todos — must be closed before Fiat#9G. */
export const P4_FIAT_REFERENCE_WORLD_CLASS_INFRA_TODOS = [
  P4_FIAT_REFERENCE_PREFLIGHT_TODO,
  'p4-fiat-currency-precision-ssot',
  P4_FIAT_REFERENCE_RATES_HOOK_TODO,
  P4_FIAT_HINT_DISPLAY_CONTRACT_TODO,
  P4_FIAT_MONEY_DISPLAY_HINT_TODO,
] as const;

/** gate:ai-impl bundle paths (Plan §13.1.4 · §20.13.2 Fiat#9G). */
export const P4_FIAT_REFERENCE_WORLD_CLASS_GATE_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p4-gate-fiat-reference-world-class-display-contract.test.ts',
  'apps/web/src/domain/__tests__/fiat-reference-display-contract.test.ts',
  'apps/web/src/domain/__tests__/fiat-hint-display-contract.test.ts',
  'apps/web/src/domain/__tests__/currency-precision-display-contract.test.ts',
  'apps/web/src/features/money',
  'apps/web/src/features/wallet/__tests__/wallet-fiat-hint-display.test.ts',
  'apps/web/src/features/wallet/__tests__/use-wallet-fiat-hint.test.ts',
  'apps/web/src/features/trading/__tests__/trade-fiat-hint-display.test.ts',
  'apps/web/src/features/trading/__tests__/use-trade-fiat-hint.test.ts',
  'apps/web/src/features/earn/__tests__/earn-fiat-hint-display.test.ts',
  'apps/web/src/features/earn/__tests__/use-earn-fiat-hint.test.ts',
  'apps/web/src/features/settings/__tests__/use-fiat-hint-preference.test.ts',
  'apps/web/src/product/primitives/__tests__/money-display-with-fiat-hint.test.tsx',
  'apps/web/src/product/surfaces/wallet/__tests__/wallet-money-with-fiat-hint.test.tsx',
  'apps/web/src/product/surfaces/trade/__tests__/trade-money-with-fiat-hint.test.tsx',
  'apps/web/src/product/surfaces/home/__tests__/earn-money-with-fiat-hint.test.tsx',
  'apps/web/src/product/surfaces/settings/__tests__/preferences-settings-page.test.tsx',
] as const;

/** §13.1.4.5 core ComplaintRisk rows — live at Fiat#9G (excludes P10 sports/casino deferrals). */
export const P4_FIAT_REFERENCE_WORLD_CLASS_COMPLAINT_RISK_IDS = [
  'fiat-hint-ledger-leak',
  'fiat-hint-stale-hidden',
  'fiat-hint-locale-hardcode-krw',
] as const;

/** P10 deferrals — registered · ownerTodo p10-* · closeout at Fiat#12 gate bundle. */
export const P4_FIAT_REFERENCE_P10_DEFERRED_COMPLAINT_RISK_IDS = [
  'fiat-hint-casino-drift',
  'fiat-hint-sports-odds-order',
] as const;

/** Required infra + surface wire artifacts for Fiat#1–9 (verified in gate test layer). */
export const P4_FIAT_REFERENCE_WORLD_CLASS_ARTIFACT_PATHS = [
  'domain/fiat-reference-display-contract.ts',
  'domain/currency-precision-display-contract.ts',
  'domain/settings-preferences-display-contract.ts',
  'features/money/fiat-reference-rates-lib.ts',
  'features/money/use-fiat-reference-rates.ts',
  'features/wallet/wallet-fiat-hint-display.ts',
  'features/wallet/use-wallet-fiat-hint.ts',
  'features/trading/trade-fiat-hint-display.ts',
  'features/trading/use-trade-fiat-hint.ts',
  'features/earn/earn-fiat-hint-display.ts',
  'features/earn/use-earn-fiat-hint.ts',
  'features/settings/use-fiat-hint-preference.ts',
  'product/primitives/money-display-with-fiat-hint.tsx',
  'product/surfaces/wallet/wallet-money-with-fiat-hint.tsx',
  'product/surfaces/trade/trade-money-with-fiat-hint.tsx',
  'product/surfaces/trade/trade-price-with-fiat-hint.tsx',
  'product/surfaces/home/earn-money-with-fiat-hint.tsx',
] as const;

/** Non-waivable sync for Fiat#9G core gate closeout — P10 page unblock. */
export function assertP4FiatReferenceWorldClassGateSync(): void {
  assertFiatReferenceContractRegistrySync();
  assertFiatHintDisplayContractSync();
  assertCurrencyPrecisionContractRegistrySync();

  for (const id of P4_FIAT_REFERENCE_WORLD_CLASS_COMPLAINT_RISK_IDS) {
    const row = findFiatHintComplaintRisk(id);
    if (!row) {
      throw new Error(`p4-gate-fiat-reference-world-class: missing core complaint risk ${id}`);
    }
    if (row.mitigatedBy !== 'live') {
      throw new Error(
        `p4-gate-fiat-reference-world-class: core complaint risk ${id} must be mitigatedBy live`,
      );
    }
  }

  const staleRow = findFiatHintComplaintRisk('fiat-hint-stale-hidden');
  if (!staleRow || staleRow.ownerTodo !== P4_FIAT_REFERENCE_RATES_HOOK_TODO) {
    throw new Error(
      'p4-gate-fiat-reference-world-class: fiat-hint-stale-hidden must be owned by p4-fiat-reference-rates-hook',
    );
  }

  const localeRow = findFiatHintComplaintRisk('fiat-hint-locale-hardcode-krw');
  if (!localeRow || localeRow.ownerTodo !== P4_FIAT_HINT_DISPLAY_CONTRACT_TODO) {
    throw new Error(
      'p4-gate-fiat-reference-world-class: fiat-hint-locale-hardcode-krw must be owned by p4-fiat-hint-display-contract',
    );
  }

  for (const id of P4_FIAT_REFERENCE_P10_DEFERRED_COMPLAINT_RISK_IDS) {
    const row = findFiatHintComplaintRisk(id);
    if (!row) {
      throw new Error(
        `p4-gate-fiat-reference-world-class: missing P10 deferred complaint risk ${id}`,
      );
    }
    if (!row.ownerTodo.startsWith('p10-')) {
      throw new Error(
        `p4-gate-fiat-reference-world-class: P10 deferred risk ${id} must be owned by p10-* todo`,
      );
    }
  }
}
