import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import {
  assertEwE10WalletSettingsUiSync,
  EW_E10_WALLET_SETTINGS_UI_ARTIFACT_PATHS,
  EW_E10_WALLET_SETTINGS_UI_NEXT_TODO,
  EW_E10_WALLET_SETTINGS_UI_PREREQUISITE_TODO,
  EW_E10_WALLET_SETTINGS_UI_TEST_PATHS,
  EW_E10_WALLET_SETTINGS_UI_TODO,
  isEwE10WalletSettingsUiUnlocked,
} from '../ew-e10-wallet-settings-ui-display-contract';
import { resolveEwE8GateUiUnlockWireStatus } from '../ew-e8-gate-financial-display-contract';
import { canManageTradingApiKeys } from '../settings-api-keys-display-contract';
import { shouldExposeWalletTransferInSubnav } from '../wallet-transfer-display-contract';
import { isGiftcardRedeemReverseLive } from '../wallet-redeem-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

describe('ew-e10-wallet-settings-ui-display-contract', () => {
  it('pins todo · prerequisite · next · live unlock', () => {
    expect(EW_E10_WALLET_SETTINGS_UI_TODO).toBe('ew-e10-wallet-settings-ui');
    expect(EW_E10_WALLET_SETTINGS_UI_PREREQUISITE_TODO).toBe(
      'ew-e10-platform-engine-wave',
    );
    expect(EW_E10_WALLET_SETTINGS_UI_NEXT_TODO).toBe('ew-e10-trust-support-ui');
    expect(LAUNCH_GATES.financialConnectivityLive).toBe(true);
    expect(isEwE10WalletSettingsUiUnlocked()).toBe(true);
    expect(() => assertEwE10WalletSettingsUiSync()).not.toThrow();
  });

  it('wires transfer · api-keys · giftcard redeem reverse live', () => {
    const wire = resolveEwE8GateUiUnlockWireStatus();
    expect(wire.wallet_transfer_hub).toBe('live');
    expect(wire.settings_api_keys_hub).toBe('live');
    expect(wire.giftcard_redeem_reverse_ui).toBe('live');
    expect(shouldExposeWalletTransferInSubnav()).toBe(true);
    expect(canManageTradingApiKeys()).toBe(true);
    expect(isGiftcardRedeemReverseLive()).toBe(true);
  });

  it('requires artifacts on disk', () => {
    for (const rel of EW_E10_WALLET_SETTINGS_UI_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readFileSync(resolve(REPO_ROOT, rel), 'utf8').length).toBeGreaterThan(40);
    }
    for (const rel of EW_E10_WALLET_SETTINGS_UI_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });
});
