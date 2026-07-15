/**
 * E10 wallet+settings UI unlock (YAML `ew-e10-wallet-settings-ui`).
 * Authority: ADR-018 §5 · Plan §21.1 E10 linear · E8 GATE DONE.
 *
 * Flips `LAUNCH_GATES.financialConnectivityLive` · `/wallet/transfer` ·
 * `/settings/api-keys` hub · giftcard redeem reverse wire.
 * Next: `ew-e10-trust-support-ui`.
 */

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  EW_E8_CREATE_API_KEY_RPC,
  EW_E8_CREATE_GIFTCARD_REDEEM_RPC,
  EW_E8_TRANSFER_TO_USER_RPC,
  isEwE8FinancialEngineReady,
  isEwE8FinancialUiUnlocked,
} from './ew-e8-financial-display-contract';
import {
  EW_E8_GATE_FINANCIAL_TODO,
  EW_E8_GATE_UI_UNLOCK_WIRE_STATUS,
  isEwE8FinancialGateReady,
  isGiftcardRedeemReverseEnginePathReady,
  isP2pTransferEnginePathReady,
  isTradingApiKeysEnginePathReady,
  resolveEwE8GateUiUnlockWireStatus,
} from './ew-e8-gate-financial-display-contract';
import {
  canManageTradingApiKeys,
  shouldExposeSettingsApiKeysInHubNav,
} from './settings-api-keys-display-contract';
import {
  shouldExposeWalletTransferInSubnav,
  WALLET_TRANSFER_ROUTE,
} from './wallet-transfer-display-contract';
import { isGiftcardRedeemReverseLive } from './wallet-redeem-display-contract';

export const EW_E10_WALLET_SETTINGS_UI_TODO = 'ew-e10-wallet-settings-ui' as const;
export const EW_E10_WALLET_SETTINGS_UI_PREREQUISITE_TODO = 'ew-e10-platform-engine-wave' as const;
export const EW_E10_WALLET_SETTINGS_UI_NEXT_TODO = 'ew-e10-trust-support-ui' as const;

export const EW_E10_WALLET_SETTINGS_UI_ARTIFACT_PATHS = [
  'apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts',
  'apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts',
  'apps/web/src/lib/launch-gates.ts',
  'apps/web/src/domain/wallet-transfer-display-contract.ts',
  'apps/web/src/domain/settings-api-keys-display-contract.ts',
  'apps/web/src/domain/wallet-redeem-display-contract.ts',
  'apps/web/src/product/surfaces/wallet/wallet-transfer-page.tsx',
  'apps/web/src/product/surfaces/settings/api-keys-settings-page.tsx',
  'apps/web/src/product/surfaces/wallet/giftcard-redeem-page.tsx',
  'docs/OPERATIONS/ENGINE_GAP_E10_WALLET_SETTINGS_UI.md',
  'docs/PRODUCT/ADR/018-financial-connectivity.md',
] as const;

export const EW_E10_WALLET_SETTINGS_UI_TEST_PATHS = [
  'apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts',
  'apps/web/src/domain/__tests__/wallet-transfer-display-contract.test.ts',
  'apps/web/src/domain/__tests__/settings-api-keys-display-contract.test.ts',
  'apps/web/src/product/surfaces/wallet/__tests__/wallet-transfer-page.test.tsx',
  'apps/web/src/product/surfaces/settings/__tests__/api-keys-settings-page.test.tsx',
  'apps/web/src/product/surfaces/wallet/__tests__/giftcard-redeem-page.test.tsx',
] as const;

/** Full financial connectivity UI unlocked after E8 GATE + E10 wire. */
export function isEwE10WalletSettingsUiUnlocked(): boolean {
  const wire = resolveEwE8GateUiUnlockWireStatus();
  return (
    LAUNCH_GATES.financialConnectivityEngine === true &&
    LAUNCH_GATES.financialConnectivityLive === true &&
    isEwE8FinancialEngineReady() &&
    isEwE8FinancialUiUnlocked() &&
    isEwE8FinancialGateReady() &&
    isP2pTransferEnginePathReady() &&
    isTradingApiKeysEnginePathReady() &&
    isGiftcardRedeemReverseEnginePathReady() &&
    wire.wallet_transfer_hub === 'live' &&
    wire.settings_api_keys_hub === 'live' &&
    wire.giftcard_redeem_reverse_ui === 'live' &&
    EW_E8_GATE_UI_UNLOCK_WIRE_STATUS.wallet_transfer_hub === 'live' &&
    EW_E8_GATE_UI_UNLOCK_WIRE_STATUS.settings_api_keys_hub === 'live' &&
    EW_E8_GATE_UI_UNLOCK_WIRE_STATUS.giftcard_redeem_reverse_ui === 'live' &&
    shouldExposeWalletTransferInSubnav() &&
    shouldExposeSettingsApiKeysInHubNav() &&
    canManageTradingApiKeys() &&
    isGiftcardRedeemReverseLive() &&
    WALLET_TRANSFER_ROUTE === '/wallet/transfer' &&
    EW_E8_TRANSFER_TO_USER_RPC === 'rpc_transfer_to_user' &&
    EW_E8_CREATE_API_KEY_RPC === 'rpc_create_trading_api_key' &&
    EW_E8_CREATE_GIFTCARD_REDEEM_RPC === 'rpc_create_giftcard_redeem_request'
  );
}

export function assertEwE10WalletSettingsUiSync(): void {
  if (EW_E10_WALLET_SETTINGS_UI_TODO !== 'ew-e10-wallet-settings-ui') {
    throw new Error('E10 wallet-settings UI todo id drift');
  }
  if (EW_E10_WALLET_SETTINGS_UI_PREREQUISITE_TODO !== 'ew-e10-platform-engine-wave') {
    throw new Error('E10 wallet-settings prerequisite must be ew-e10-platform-engine-wave');
  }
  if (EW_E10_WALLET_SETTINGS_UI_NEXT_TODO !== 'ew-e10-trust-support-ui') {
    throw new Error('E10 wallet-settings next must be ew-e10-trust-support-ui');
  }
  if (EW_E8_GATE_FINANCIAL_TODO !== 'ew-e8-gate-financial') {
    throw new Error('E10 wallet-settings requires E8 GATE pin');
  }
  if (!isEwE10WalletSettingsUiUnlocked()) {
    throw new Error('E10 wallet-settings UI unlock not complete');
  }
  if (LAUNCH_GATES.financialConnectivityLive !== true) {
    throw new Error('E10 wallet-settings must set financialConnectivityLive true');
  }
  if (resolveEwE8GateUiUnlockWireStatus().wallet_transfer_hub !== 'live') {
    throw new Error('E10 must wire wallet_transfer_hub live');
  }
  if (resolveEwE8GateUiUnlockWireStatus().settings_api_keys_hub !== 'live') {
    throw new Error('E10 must wire settings_api_keys_hub live');
  }
  if (resolveEwE8GateUiUnlockWireStatus().giftcard_redeem_reverse_ui !== 'live') {
    throw new Error('E10 must wire giftcard_redeem_reverse_ui live');
  }
}
