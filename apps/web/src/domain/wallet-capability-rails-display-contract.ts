/**
 * Wallet capability rails — fail-closed predicates (H-03 · H-11).
 * Hub rail filtering lives in `features/wallet/*-hub-display` (imports this contract).
 */

import {
  shouldBlockDeriveCryptoAddressInvoke,
  shouldHideCryptoWalletPanels,
} from '@/domain/crypto-edge-display-contract';
import { LAUNCH_GATES } from '@/lib/launch-gates';

export const WALLET_DEPOSIT_HUB_ROUTE = '/wallet/deposit' as const;
export const WALLET_WITHDRAW_HUB_ROUTE = '/wallet/withdraw' as const;
export const WALLET_REDEEM_HUB_ROUTE = '/wallet/redeem' as const;
export const WALLET_DEPOSIT_CRYPTO_ROUTE = '/wallet/deposit/crypto' as const;
export const WALLET_WITHDRAW_CRYPTO_ROUTE = '/wallet/withdraw/crypto' as const;
export const WALLET_DEPOSIT_GIFTCARD_ROUTE = '/wallet/deposit/giftcard' as const;

export type WalletCapabilityRailsInput = {
  /** `LAUNCH_GATES.cryptoRails` — false → crypto rail omitted + invoke blocked. */
  cryptoRails: boolean;
  /**
   * True only when `rpc_list_giftcard_fee_market` returned ≥1 enabled+fresh row.
   * Fail-closed default: false (hide until confirmed).
   */
  giftcardMarketAvailable: boolean;
};

export function isCryptoWalletRailLive(cryptoRails: boolean = LAUNCH_GATES.cryptoRails): boolean {
  return !shouldHideCryptoWalletPanels(cryptoRails);
}

/** Enabled+fresh giftcard market row count ≥ 1 (RPC already filters stale/disabled). */
export function hasAvailableGiftcardMarket(rowCount: number): boolean {
  return rowCount >= 1;
}

export function shouldRedirectCryptoDepositRoute(cryptoRails: boolean): boolean {
  return shouldHideCryptoWalletPanels(cryptoRails);
}

export function shouldRedirectCryptoWithdrawRoute(cryptoRails: boolean): boolean {
  return shouldHideCryptoWalletPanels(cryptoRails);
}

export function shouldRedirectGiftcardDepositRoute(giftcardMarketAvailable: boolean): boolean {
  return !giftcardMarketAvailable;
}

export function shouldRedirectGiftcardRedeemRoute(giftcardMarketAvailable: boolean): boolean {
  return !giftcardMarketAvailable;
}

/** Defense-in-depth: block derive Edge + address RPC while cryptoRails is false. */
export function shouldBlockCryptoDepositInvoke(cryptoRails: boolean): boolean {
  return shouldBlockDeriveCryptoAddressInvoke(cryptoRails);
}

export function shouldBlockCryptoWithdrawInvoke(cryptoRails: boolean): boolean {
  return shouldHideCryptoWalletPanels(cryptoRails);
}

export function resolveWalletCapabilityRailsDefaults(): WalletCapabilityRailsInput {
  return {
    cryptoRails: LAUNCH_GATES.cryptoRails,
    giftcardMarketAvailable: false,
  };
}

/** Whether a catalog rail id should appear given capability input. */
export function isDepositRailCapabilityLive(
  railId: 'krw' | 'crypto' | 'giftcard',
  input: WalletCapabilityRailsInput,
): boolean {
  if (railId === 'crypto') return isCryptoWalletRailLive(input.cryptoRails);
  if (railId === 'giftcard') return input.giftcardMarketAvailable;
  return true;
}

export function isWithdrawRailCapabilityLive(
  railId: 'krw' | 'crypto',
  input: Pick<WalletCapabilityRailsInput, 'cryptoRails'>,
): boolean {
  if (railId === 'crypto') return isCryptoWalletRailLive(input.cryptoRails);
  return true;
}
