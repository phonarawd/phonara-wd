/**
 * `/wallet/redeem` — PHON point shop (P11).
 * ENGINE:partial — reuses wallet withdraw/deposit rails · no new redeem RPC.
 * PHON → KRW/USDT = `/wallet/withdraw/*` · giftcard → PHON = `/wallet/deposit/giftcard`.
 */

import type { MessageKey } from '@phonara/i18n';

export const WALLET_REDEEM_ROUTE = '/wallet/redeem' as const;
export const WALLET_REDEEM_LEGACY_REDIRECT_FROM = '/points/shop' as const;
export const P11_PAGE_WALLET_REDEEM_TODO = 'p11-page-wallet-redeem' as const;

export const WALLET_REDEEM_SEO_TITLE_KEY =
  'seo.walletRedeem.title' as const satisfies MessageKey;
export const WALLET_REDEEM_SEO_DESCRIPTION_KEY =
  'seo.walletRedeem.description' as const satisfies MessageKey;

/** Rail kinds — withdraw rails convert PHON out; giftcard deposits PHON in. */
export type WalletRedeemRailId = 'krw' | 'crypto' | 'giftcard';

export type WalletRedeemRailKind = 'withdraw' | 'deposit';

export type WalletRedeemRailView = {
  id: WalletRedeemRailId;
  kind: WalletRedeemRailKind;
  href: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  metaKey: MessageKey;
  ctaKey: MessageKey;
};

/**
 * Payment Method Card grammar — same slots as deposit/withdraw hubs.
 * No parallel redeem RPC · navigate to existing money rails only.
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
  },
  {
    id: 'crypto',
    kind: 'withdraw',
    href: '/wallet/withdraw/crypto',
    titleKey: 'wallet.redeem.rail.crypto',
    descriptionKey: 'wallet.redeem.rail.crypto.desc',
    metaKey: 'wallet.redeem.rail.crypto.meta',
    ctaKey: 'wallet.redeem.rail.cta.withdraw',
  },
  {
    id: 'giftcard',
    kind: 'deposit',
    href: '/wallet/deposit/giftcard',
    titleKey: 'wallet.redeem.rail.giftcard',
    descriptionKey: 'wallet.redeem.rail.giftcard.desc',
    metaKey: 'wallet.redeem.rail.giftcard.meta',
    ctaKey: 'wallet.redeem.rail.cta.deposit',
  },
] as const;

export function resolveRedeemRailDisabled(params: {
  rail: WalletRedeemRailView;
  withdrawalBlocked: boolean;
  withdrawalReady: boolean;
  depositBlocked: boolean;
}): boolean {
  if (params.rail.kind === 'withdraw') {
    return params.withdrawalBlocked || !params.withdrawalReady;
  }
  return params.depositBlocked;
}

export function assertWalletRedeemRailsSync(): void {
  if (WALLET_REDEEM_RAILS.length !== 3) {
    throw new Error('wallet redeem must expose exactly 3 payment method cards');
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
}
