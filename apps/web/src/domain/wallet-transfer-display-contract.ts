/**
 * `/wallet/transfer` — P2P PHON transfer hub (E8 engine · E10 UI unlock).
 * Authority: ADR-018 · `ew-e10-wallet-settings-ui`.
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';
import {
  EW_E8_LIST_P2P_TRANSFERS_RPC,
  EW_E8_TRANSFER_TO_USER_RPC,
} from './ew-e8-financial-display-contract';

export const WALLET_TRANSFER_ROUTE = '/wallet/transfer' as const;
export const WALLET_TRANSFER_UI_UNLOCK_TODO = 'ew-e10-wallet-settings-ui' as const;

export const WALLET_TRANSFER_SEO_TITLE_KEY =
  'seo.walletTransfer.title' as const satisfies MessageKey;
export const WALLET_TRANSFER_SEO_DESCRIPTION_KEY =
  'seo.walletTransfer.description' as const satisfies MessageKey;

export type WalletTransferExposureMode = 'live' | 'built_hidden';

export function resolveWalletTransferRoute(): typeof WALLET_TRANSFER_ROUTE {
  return WALLET_TRANSFER_ROUTE;
}

export function resolveWalletTransferHubExposure(): WalletTransferExposureMode {
  return LAUNCH_GATES.financialConnectivityLive ? 'live' : 'built_hidden';
}

export function shouldExposeWalletTransferInSubnav(): boolean {
  return LAUNCH_GATES.financialConnectivityEngine && LAUNCH_GATES.financialConnectivityLive;
}

export function canSubmitP2pTransfer(): boolean {
  return (
    LAUNCH_GATES.financialConnectivityEngine &&
    LAUNCH_GATES.financialConnectivityLive &&
    EW_E8_TRANSFER_TO_USER_RPC === 'rpc_transfer_to_user' &&
    EW_E8_LIST_P2P_TRANSFERS_RPC === 'rpc_list_p2p_transfers'
  );
}

export function assertWalletTransferLiveSync(): void {
  if (WALLET_TRANSFER_ROUTE !== '/wallet/transfer') {
    throw new Error('wallet-transfer: canonical route drift');
  }
  if (!shouldExposeWalletTransferInSubnav()) {
    throw new Error('wallet-transfer: subnav must be live after E10 unlock');
  }
  if (!canSubmitP2pTransfer()) {
    throw new Error('wallet-transfer: submit path not ready');
  }
}
