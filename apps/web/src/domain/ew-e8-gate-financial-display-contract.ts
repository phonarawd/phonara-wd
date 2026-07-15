/**
 * E8 Financial GATE pin (YAML `ew-e8-gate-financial`).
 * Authority: Plan §21.1 · ADR-018 · remote verify.
 *
 * GATE does not remigrate EXISTS giftcard deposit / withdraw rails — asserts WAVE
 * green · remote apply · advisor 0 · SQL Σ=0 pin (CI authoritative · G13).
 * Hub live (`financialConnectivityLive`) = `ew-e10-wallet-settings-ui`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  EW_E8_CREATE_API_KEY_RPC,
  EW_E8_CREATE_GIFTCARD_REDEEM_RPC,
  EW_E8_EXISTS_FEATURES,
  EW_E8_EXISTS_GIFTCARD_DEPOSIT_RPC,
  EW_E8_FINANCIAL_ARTIFACT_PATHS,
  EW_E8_FINANCIAL_MIGRATION_NAME,
  EW_E8_FINANCIAL_NEXT_TODO,
  EW_E8_FINANCIAL_TODO,
  EW_E8_NEW_ENGINE_FEATURES,
  EW_E8_TRANSFER_TO_USER_RPC,
  assertEwE8FinancialWaveSync,
  isEwE8FinancialEngineReady,
} from './ew-e8-financial-display-contract';

export const EW_E8_GATE_FINANCIAL_TODO = 'ew-e8-gate-financial' as const;
export const EW_E8_GATE_FINANCIAL_PREREQUISITE_TODO = EW_E8_FINANCIAL_TODO;
export const EW_E8_GATE_FINANCIAL_NEXT_TODO = 'ew-e9-identity-wave' as const;

export const EW_E8_GATE_FINANCIAL_REMOTE_MIGRATION_NAME = EW_E8_FINANCIAL_MIGRATION_NAME;

export const EW_E8_GATE_FINANCIAL_SQL_TEST = 'supabase/tests/ew_e8_financial_test.sql' as const;

/** Filled after `stack:push-remote` — remote version timestamp ≠ local prefix OK. */
export const EW_E8_GATE_FINANCIAL_REMOTE_TAIL = '20260711192506_ew_e8_financial' as const;

/**
 * Hub / transfer / API keys IA — GATE keeps built_hidden; E10 flips live.
 * Engine RPCs remain ready (`financialConnectivityEngine`).
 */
export function resolveEwE8GateUiUnlockWireStatus(): {
  readonly wallet_transfer_hub: 'live' | 'built_hidden';
  readonly settings_api_keys_hub: 'live' | 'built_hidden';
  readonly giftcard_redeem_reverse_ui: 'live' | 'built_hidden';
} {
  const mode = LAUNCH_GATES.financialConnectivityLive ? 'live' : 'built_hidden';
  return {
    wallet_transfer_hub: mode,
    settings_api_keys_hub: mode,
    giftcard_redeem_reverse_ui: mode,
  };
}

export const EW_E8_GATE_UI_UNLOCK_WIRE_STATUS = resolveEwE8GateUiUnlockWireStatus();

export type EwE8GateUiUnlockWireKey = keyof typeof EW_E8_GATE_UI_UNLOCK_WIRE_STATUS;

function isEwE8UiPathAuthorized(status: 'live' | 'built_hidden'): boolean {
  return status === 'built_hidden' || status === 'live';
}

export const EW_E8_GATE_FINANCIAL_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e8-gate-financial-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e8-gate-financial-display-contract.test.ts',
  'apps/web/src/domain/ew-e8-financial-display-contract.ts',
  'apps/web/src/lib/launch-gates.ts',
  'docs/PRODUCT/ADR/018-financial-connectivity.md',
  'docs/OPERATIONS/ENGINE_GAP_E8_FINANCIAL.md',
  'docs/OPERATIONS/ENGINE_GAP_E8_GATE_FINANCIAL.md',
  'supabase/migrations/20260811000001_ew_e8_financial.sql',
  EW_E8_GATE_FINANCIAL_SQL_TEST,
] as const;

export const EW_E8_GATE_FINANCIAL_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e8-gate-financial-display-contract.test.ts',
  'apps/web/src/domain/__tests__/ew-e8-financial-display-contract.test.ts',
] as const;

/** P2P transfer engine path authorized (GATE / E10 hub). */
export function isP2pTransferEnginePathReady(): boolean {
  return (
    EW_E8_TRANSFER_TO_USER_RPC === 'rpc_transfer_to_user' &&
    (EW_E8_NEW_ENGINE_FEATURES as readonly string[]).includes('p2p_transfer') &&
    isEwE8UiPathAuthorized(EW_E8_GATE_UI_UNLOCK_WIRE_STATUS.wallet_transfer_hub) &&
    LAUNCH_GATES.financialConnectivityEngine === true
  );
}

/** Trading API key CRUD path authorized (GATE / E10 hub). */
export function isTradingApiKeysEnginePathReady(): boolean {
  return (
    EW_E8_CREATE_API_KEY_RPC === 'rpc_create_trading_api_key' &&
    (EW_E8_NEW_ENGINE_FEATURES as readonly string[]).includes('trading_api_keys') &&
    isEwE8UiPathAuthorized(EW_E8_GATE_UI_UNLOCK_WIRE_STATUS.settings_api_keys_hub) &&
    LAUNCH_GATES.financialConnectivityEngine === true
  );
}

/** Giftcard redeem reverse path authorized (GATE / E10 UI). */
export function isGiftcardRedeemReverseEnginePathReady(): boolean {
  return (
    EW_E8_CREATE_GIFTCARD_REDEEM_RPC === 'rpc_create_giftcard_redeem_request' &&
    (EW_E8_NEW_ENGINE_FEATURES as readonly string[]).includes('giftcard_redeem_reverse') &&
    isEwE8UiPathAuthorized(EW_E8_GATE_UI_UNLOCK_WIRE_STATUS.giftcard_redeem_reverse_ui) &&
    LAUNCH_GATES.financialConnectivityEngine === true
  );
}

/** EXISTS giftcard deposit honesty — remigration forbidden. */
export function isExistsGiftcardDepositPinned(): boolean {
  return (
    EW_E8_EXISTS_GIFTCARD_DEPOSIT_RPC === 'rpc_create_giftcard_deposit_request' &&
    EW_E8_EXISTS_FEATURES.length === 2 &&
    EW_E8_EXISTS_FEATURES[0] === 'giftcard_deposit' &&
    EW_E8_EXISTS_FEATURES[1] === 'withdraw_rails'
  );
}

/**
 * GATE complete when engine remote-ready + EXISTS pin + hub paths authorized
 * (built_hidden or live). Full live (`financialConnectivityLive`) is owned by
 * `ew-e10-wallet-settings-ui` and may become true after GATE closeout —
 * does not invalidate GATE readiness.
 */
export function isEwE8FinancialGateReady(): boolean {
  return (
    LAUNCH_GATES.financialConnectivityEngine === true &&
    isEwE8FinancialEngineReady() &&
    isExistsGiftcardDepositPinned() &&
    isP2pTransferEnginePathReady() &&
    isTradingApiKeysEnginePathReady() &&
    isGiftcardRedeemReverseEnginePathReady()
  );
}

export function assertEwE8GateFinancialSync(): void {
  assertEwE8FinancialWaveSync();

  if (EW_E8_GATE_FINANCIAL_TODO !== 'ew-e8-gate-financial') {
    throw new Error('E8 GATE todo id drift');
  }
  if (EW_E8_GATE_FINANCIAL_PREREQUISITE_TODO !== 'ew-e8-financial-wave') {
    throw new Error('E8 GATE prerequisite must be ew-e8-financial-wave');
  }
  if (EW_E8_GATE_FINANCIAL_NEXT_TODO !== 'ew-e9-identity-wave') {
    throw new Error('E8 GATE next must be ew-e9-identity-wave');
  }
  if (EW_E8_FINANCIAL_NEXT_TODO !== 'ew-e8-gate-financial') {
    throw new Error('E8 WAVE next must unlock ew-e8-gate-financial');
  }
  if (EW_E8_GATE_FINANCIAL_REMOTE_MIGRATION_NAME !== 'ew_e8_financial') {
    throw new Error('E8 GATE remote migration name drift');
  }
  if (EW_E8_NEW_ENGINE_FEATURES.length !== 3) {
    throw new Error('E8 GATE must pin NEW = p2p+api_keys+giftcard_redeem');
  }
  if (EW_E8_EXISTS_FEATURES.length !== 2) {
    throw new Error('E8 GATE must pin EXISTS = giftcard_deposit+withdraw_rails');
  }
  if (!isP2pTransferEnginePathReady()) {
    throw new Error('E8 GATE P2P engine path not ready');
  }
  if (!isTradingApiKeysEnginePathReady()) {
    throw new Error('E8 GATE trading API keys path not ready');
  }
  if (!isGiftcardRedeemReverseEnginePathReady()) {
    throw new Error('E8 GATE giftcard redeem reverse path not ready');
  }
  if (!isExistsGiftcardDepositPinned()) {
    throw new Error('E8 GATE EXISTS giftcard deposit pin missing');
  }
  if (!isEwE8FinancialGateReady()) {
    throw new Error('E8 GATE financial not ready');
  }
  if (EW_E8_FINANCIAL_ARTIFACT_PATHS.length < 5) {
    throw new Error('E8 WAVE artifacts missing');
  }
}
