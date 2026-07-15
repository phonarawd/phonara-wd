/**
 * E8 Financial WAVE pin (YAML ew-e8-financial-wave).
 * Authority: docs/PRODUCT/ADR/018-financial-connectivity.md
 *
 * Same-PR WAVE: ADR + P2P transfer · trading API keys · giftcard redeem reverse.
 * UI live unlock = ew-e8-gate / ew-e10-wallet-settings-ui (financialConnectivityLive).
 * EXISTS (migration 0 semantics): giftcard deposit · withdraw rails.
 */
import { LAUNCH_GATES } from '../lib/launch-gates';

export const EW_E8_FINANCIAL_TODO = 'ew-e8-financial-wave' as const;
export const EW_E8_FINANCIAL_PREREQUISITE_TODO = 'ew-e23-ui-casino-live-unlocks' as const;
export const EW_E8_FINANCIAL_NEXT_TODO = 'ew-e8-gate-financial' as const;

export const EW_E8_FINANCIAL_ADR_PATH = 'docs/PRODUCT/ADR/018-financial-connectivity.md' as const;
export const EW_E8_FINANCIAL_MIGRATION_NAME = 'ew_e8_financial' as const;

export const EW_E8_TRANSFER_TO_USER_RPC = 'rpc_transfer_to_user' as const;
export const EW_E8_LIST_P2P_TRANSFERS_RPC = 'rpc_list_p2p_transfers' as const;

export const EW_E8_LIST_API_KEYS_RPC = 'rpc_list_trading_api_keys' as const;
export const EW_E8_CREATE_API_KEY_RPC = 'rpc_create_trading_api_key' as const;
export const EW_E8_REVOKE_API_KEY_RPC = 'rpc_revoke_trading_api_key' as const;

export const EW_E8_PREVIEW_GIFTCARD_REDEEM_RPC = 'rpc_preview_giftcard_redeem' as const;
export const EW_E8_CREATE_GIFTCARD_REDEEM_RPC = 'rpc_create_giftcard_redeem_request' as const;
export const EW_E8_ADMIN_FULFILL_GIFTCARD_REDEEM_RPC = 'rpc_admin_fulfill_giftcard_redeem' as const;
export const EW_E8_ADMIN_REJECT_GIFTCARD_REDEEM_RPC = 'rpc_admin_reject_giftcard_redeem' as const;

/** EXISTS giftcard deposit — do not remigrate semantics. */
export const EW_E8_EXISTS_GIFTCARD_DEPOSIT_RPC = 'rpc_create_giftcard_deposit_request' as const;

export const EW_E8_NEW_ENGINE_FEATURES = [
  'p2p_transfer',
  'trading_api_keys',
  'giftcard_redeem_reverse',
] as const;

export const EW_E8_EXISTS_FEATURES = ['giftcard_deposit', 'withdraw_rails'] as const;

/** Hub /wallet/transfer live deferred to GATE/E10. */
export const EW_E8_DEFERRED_FEATURES = [
  'wallet_transfer_ui_live',
  'settings_api_keys_hub_live',
  'p2p_usdt',
] as const;

export const EW_E8_FINANCIAL_ARTIFACT_PATHS = [
  EW_E8_FINANCIAL_ADR_PATH,
  'supabase/migrations/20260811000001_ew_e8_financial.sql',
  'supabase/tests/ew_e8_financial_test.sql',
  'apps/web/src/domain/ew-e8-financial-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e8-financial-display-contract.test.ts',
  'docs/OPERATIONS/ENGINE_GAP_E8_FINANCIAL.md',
] as const;

export const EW_E8_FINANCIAL_MIGRATION_IN_THIS_TODO = true as const;
export const EW_E8_GIFTCARD_DEPOSIT_SEMANTICS_PRESERVED = true as const;
export const EW_E8_LIVE_UI_SAME_PR_FORBIDDEN = true as const;
export const EW_E8_P2P_LEGAL_REREVIEW_REQUIRED = true as const;

/** Engine RPCs ready (WAVE). Hub/transfer UI still gated. */
export function isEwE8FinancialEngineReady(): boolean {
  return (
    EW_E8_TRANSFER_TO_USER_RPC === 'rpc_transfer_to_user' &&
    EW_E8_CREATE_API_KEY_RPC === 'rpc_create_trading_api_key' &&
    EW_E8_CREATE_GIFTCARD_REDEEM_RPC === 'rpc_create_giftcard_redeem_request' &&
    LAUNCH_GATES.financialConnectivityEngine === true
  );
}

/** Transfer / API keys hub / redeem reverse UI — GATE/E10. */
export function isEwE8FinancialUiUnlocked(): boolean {
  return LAUNCH_GATES.financialConnectivityLive;
}

export function assertEwE8FinancialWaveSync(): void {
  if (EW_E8_FINANCIAL_TODO !== 'ew-e8-financial-wave') {
    throw new Error('E8 todo id drift');
  }
  if (EW_E8_FINANCIAL_PREREQUISITE_TODO !== 'ew-e23-ui-casino-live-unlocks') {
    throw new Error('E8 prerequisite must be ew-e23-ui-casino-live-unlocks');
  }
  if (EW_E8_FINANCIAL_NEXT_TODO !== 'ew-e8-gate-financial') {
    throw new Error('E8 next must be ew-e8-gate-financial');
  }
  if (EW_E8_FINANCIAL_MIGRATION_IN_THIS_TODO !== true) {
    throw new Error('E8 must ship financial migration in this todo');
  }
  if (EW_E8_GIFTCARD_DEPOSIT_SEMANTICS_PRESERVED !== true) {
    throw new Error('E8 must preserve giftcard deposit semantics');
  }
  if (EW_E8_LIVE_UI_SAME_PR_FORBIDDEN !== true) {
    throw new Error('E8 WAVE must not unlock transfer/API hub UI in same PR');
  }
  if (EW_E8_P2P_LEGAL_REREVIEW_REQUIRED !== true) {
    throw new Error('E8 must require legal re-review before P2P marketing');
  }
  if (EW_E8_NEW_ENGINE_FEATURES.length !== 3) {
    throw new Error('E8 NEW features must be p2p+api_keys+giftcard_redeem');
  }
  if (!isEwE8FinancialEngineReady()) {
    throw new Error('E8 engine RPCs / launch gate not ready');
  }
  // Hub live (`financialConnectivityLive`) is owned by `ew-e10-wallet-settings-ui` —
  // WAVE readiness does not require it false after UI unlock.
}
