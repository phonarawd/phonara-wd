/**
 * `/wallet/redeem` — PHON point shop (P11) + E10 giftcard redeem reverse.
 * PHON → KRW/USDT = `/wallet/withdraw/*` · giftcard → PHON = `/wallet/deposit/giftcard`.
 * PHON → giftcard = `/wallet/redeem/giftcard` (`ew-e10-wallet-settings-ui`).
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';

export const WALLET_REDEEM_ROUTE = '/wallet/redeem' as const;
export const WALLET_REDEEM_GIFTCARD_ROUTE = '/wallet/redeem/giftcard' as const;
export const WALLET_REDEEM_LEGACY_REDIRECT_FROM = '/points/shop' as const;
export const P11_PAGE_WALLET_REDEEM_TODO = 'p11-page-wallet-redeem' as const;

export const WALLET_REDEEM_SEO_TITLE_KEY = 'seo.walletRedeem.title' as const satisfies MessageKey;
export const WALLET_REDEEM_SEO_DESCRIPTION_KEY =
  'seo.walletRedeem.description' as const satisfies MessageKey;

export const WALLET_REDEEM_GIFTCARD_SEO_TITLE_KEY =
  'seo.walletRedeemGiftcard.title' as const satisfies MessageKey;
export const WALLET_REDEEM_GIFTCARD_SEO_DESCRIPTION_KEY =
  'seo.walletRedeemGiftcard.description' as const satisfies MessageKey;

/** Rail kinds — withdraw rails convert PHON out; giftcard deposit PHON in; redeem reverse PHON→giftcard. */
export type WalletRedeemRailId = 'krw' | 'crypto' | 'giftcard' | 'giftcard_out';

export type WalletRedeemRailKind = 'withdraw' | 'deposit' | 'redeem';

export type WalletRedeemRailView = {
  id: WalletRedeemRailId;
  kind: WalletRedeemRailKind;
  href: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  metaKey: MessageKey;
  ctaKey: MessageKey;
  /** When false, rail is omitted from hub cards (E10 live gate). */
  live: boolean;
};

/**
 * Payment Method Card grammar — same slots as deposit/withdraw hubs.
 * Giftcard reverse (`giftcard_out`) unlocks with `financialConnectivityLive`.
 */
export const WALLET_REDEEM_RAILS: readonly WalletRedeemRailView[] = [
  {
    id: 'krw',
    kind: 'withdraw',
    href: '/wallet/withdraw/krw',
    titleKey: 'wallet.redeem.rail.krw',
    descriptionKey: 'wallet.redeem.rail.krw.desc',
    metaKey: 'wallet.redeem.rail.krw.meta',
    ctaKey: 'wallet.redeem.rail.cta.withdraw',
    live: true,
  },
  {
    id: 'crypto',
    kind: 'withdraw',
    href: '/wallet/withdraw/crypto',
    titleKey: 'wallet.redeem.rail.crypto',
    descriptionKey: 'wallet.redeem.rail.crypto.desc',
    metaKey: 'wallet.redeem.rail.crypto.meta',
    ctaKey: 'wallet.redeem.rail.cta.withdraw',
    live: true,
  },
  {
    id: 'giftcard',
    kind: 'deposit',
    href: '/wallet/deposit/giftcard',
    titleKey: 'wallet.redeem.rail.giftcard',
    descriptionKey: 'wallet.redeem.rail.giftcard.desc',
    metaKey: 'wallet.redeem.rail.giftcard.meta',
    ctaKey: 'wallet.redeem.rail.cta.deposit',
    live: true,
  },
  {
    id: 'giftcard_out',
    kind: 'redeem',
    href: WALLET_REDEEM_GIFTCARD_ROUTE,
    titleKey: 'wallet.redeem.rail.giftcardOut',
    descriptionKey: 'wallet.redeem.rail.giftcardOut.desc',
    metaKey: 'wallet.redeem.rail.giftcardOut.meta',
    ctaKey: 'wallet.redeem.rail.cta.redeem',
    live: true,
  },
] as const;

export function isGiftcardRedeemReverseLive(): boolean {
  return LAUNCH_GATES.financialConnectivityEngine && LAUNCH_GATES.financialConnectivityLive;
}

export function resolveWalletRedeemRails(): readonly WalletRedeemRailView[] {
  return WALLET_REDEEM_RAILS.filter((rail) => {
    if (rail.id === 'giftcard_out') return isGiftcardRedeemReverseLive();
    return rail.live;
  });
}

export function resolveRedeemRailDisabled(params: {
  rail: WalletRedeemRailView;
  withdrawalBlocked: boolean;
  withdrawalReady: boolean;
  depositBlocked: boolean;
}): boolean {
  if (params.rail.kind === 'withdraw') {
    return params.withdrawalBlocked || !params.withdrawalReady;
  }
  if (params.rail.kind === 'redeem') {
    return params.withdrawalBlocked || !params.withdrawalReady;
  }
  return params.depositBlocked;
}

export function assertWalletRedeemRailsSync(): void {
  if (WALLET_REDEEM_RAILS.length !== 4) {
    throw new Error('wallet redeem must expose 4 payment method cards (incl. giftcard reverse)');
  }
  const hrefs = WALLET_REDEEM_RAILS.map((rail) => rail.href);
  if (!hrefs.includes('/wallet/withdraw/krw')) {
    throw new Error('wallet redeem must link PHON→KRW withdraw rail');
  }
  if (!hrefs.includes('/wallet/withdraw/crypto')) {
    throw new Error('wallet redeem must link PHON→USDT withdraw rail');
  }
  if (!hrefs.includes('/wallet/deposit/giftcard')) {
    throw new Error('wallet redeem must link giftcard deposit rail');
  }
  if (!hrefs.includes(WALLET_REDEEM_GIFTCARD_ROUTE)) {
    throw new Error('wallet redeem must link giftcard redeem reverse rail');
  }
  if (!isGiftcardRedeemReverseLive()) {
    throw new Error('wallet redeem giftcard reverse must be live after E10');
  }
}
