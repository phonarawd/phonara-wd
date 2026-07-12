import { describe, expect, it } from 'vitest';

import {
  assertWalletRedeemRailsSync,
  P11_PAGE_WALLET_REDEEM_TODO,
  resolveRedeemRailDisabled,
  WALLET_REDEEM_LEGACY_REDIRECT_FROM,
  WALLET_REDEEM_RAILS,
  WALLET_REDEEM_ROUTE,
} from '../wallet-redeem-display-contract';

describe('wallet-redeem-display-contract', () => {
  it('binds canonical redeem route and legacy points/shop redirect source', () => {
    expect(WALLET_REDEEM_ROUTE).toBe('/wallet/redeem');
    expect(WALLET_REDEEM_LEGACY_REDIRECT_FROM).toBe('/points/shop');
    expect(P11_PAGE_WALLET_REDEEM_TODO).toBe('p11-page-wallet-redeem');
  });

  it('exposes four payment method cards reusing withdraw/deposit/redeem rails', () => {
    assertWalletRedeemRailsSync();
    expect(WALLET_REDEEM_RAILS.map((rail) => rail.href)).toEqual([
      '/wallet/withdraw/krw',
      '/wallet/withdraw/crypto',
      '/wallet/deposit/giftcard',
      '/wallet/redeem/giftcard',
    ]);
  });

  it('disables withdraw rails when blocked or KYC not ready', () => {
    const krw = WALLET_REDEEM_RAILS[0]!;
    expect(
      resolveRedeemRailDisabled({
        rail: krw,
        withdrawalBlocked: true,
        withdrawalReady: true,
        depositBlocked: false,
      }),
    ).toBe(true);
    expect(
      resolveRedeemRailDisabled({
        rail: krw,
        withdrawalBlocked: false,
        withdrawalReady: false,
        depositBlocked: false,
      }),
    ).toBe(true);
    expect(
      resolveRedeemRailDisabled({
        rail: krw,
        withdrawalBlocked: false,
        withdrawalReady: true,
        depositBlocked: true,
      }),
    ).toBe(false);
  });

  it('disables giftcard rail only when deposit is blocked', () => {
    const giftcard = WALLET_REDEEM_RAILS[2]!;
    expect(
      resolveRedeemRailDisabled({
        rail: giftcard,
        withdrawalBlocked: true,
        withdrawalReady: false,
        depositBlocked: false,
      }),
    ).toBe(false);
    expect(
      resolveRedeemRailDisabled({
        rail: giftcard,
        withdrawalBlocked: false,
        withdrawalReady: true,
        depositBlocked: true,
      }),
    ).toBe(true);
  });
});
