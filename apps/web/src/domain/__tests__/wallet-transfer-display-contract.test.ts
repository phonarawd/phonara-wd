import { describe, expect, it } from 'vitest';

import { PLATFORM_EWAVE_HIDDEN_ROUTES } from '../platform-narrative-display-contract';
import {
  assertWalletTransferLiveSync,
  canSubmitP2pTransfer,
  resolveWalletTransferHubExposure,
  shouldExposeWalletTransferInSubnav,
  WALLET_TRANSFER_ROUTE,
  WALLET_TRANSFER_UI_UNLOCK_TODO,
} from '../wallet-transfer-display-contract';

describe('wallet-transfer-display-contract', () => {
  it('locks canonical route and E10 live hub', () => {
    expect(WALLET_TRANSFER_ROUTE).toBe('/wallet/transfer');
    expect(WALLET_TRANSFER_UI_UNLOCK_TODO).toBe('ew-e10-wallet-settings-ui');
    expect(PLATFORM_EWAVE_HIDDEN_ROUTES).not.toContain('/wallet/transfer');
    expect(resolveWalletTransferHubExposure()).toBe('live');
    expect(shouldExposeWalletTransferInSubnav()).toBe(true);
    expect(canSubmitP2pTransfer()).toBe(true);
    expect(() => assertWalletTransferLiveSync()).not.toThrow();
  });
});
