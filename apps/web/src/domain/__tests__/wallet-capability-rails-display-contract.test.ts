import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '@/lib/launch-gates';

import {
  hasAvailableGiftcardMarket,
  isCryptoWalletRailLive,
  isDepositRailCapabilityLive,
  isWithdrawRailCapabilityLive,
  resolveWalletCapabilityRailsDefaults,
  shouldBlockCryptoDepositInvoke,
  shouldBlockCryptoWithdrawInvoke,
  shouldRedirectCryptoDepositRoute,
  shouldRedirectCryptoWithdrawRoute,
  shouldRedirectGiftcardDepositRoute,
  shouldRedirectGiftcardRedeemRoute,
} from '../wallet-capability-rails-display-contract';

describe('wallet-capability-rails-display-contract', () => {
  it('keeps LAUNCH_GATES.cryptoRails false until provider green (H-03)', () => {
    expect(LAUNCH_GATES.cryptoRails).toBe(false);
    expect(isCryptoWalletRailLive(false)).toBe(false);
    expect(isCryptoWalletRailLive(true)).toBe(true);
  });

  it('gates deposit rail ids by crypto + giftcard capability (H-03 · H-11)', () => {
    expect(
      isDepositRailCapabilityLive('crypto', {
        cryptoRails: false,
        giftcardMarketAvailable: true,
      }),
    ).toBe(false);
    expect(
      isDepositRailCapabilityLive('giftcard', {
        cryptoRails: true,
        giftcardMarketAvailable: false,
      }),
    ).toBe(false);
    expect(
      isDepositRailCapabilityLive('krw', {
        cryptoRails: false,
        giftcardMarketAvailable: false,
      }),
    ).toBe(true);
    expect(
      isDepositRailCapabilityLive('giftcard', {
        cryptoRails: false,
        giftcardMarketAvailable: true,
      }),
    ).toBe(true);
  });

  it('gates withdraw crypto rail by cryptoRails', () => {
    expect(isWithdrawRailCapabilityLive('crypto', { cryptoRails: false })).toBe(false);
    expect(isWithdrawRailCapabilityLive('crypto', { cryptoRails: true })).toBe(true);
    expect(isWithdrawRailCapabilityLive('krw', { cryptoRails: false })).toBe(true);
  });

  it('treats giftcard market as unavailable until ≥1 enabled+fresh row', () => {
    expect(hasAvailableGiftcardMarket(0)).toBe(false);
    expect(hasAvailableGiftcardMarket(1)).toBe(true);
  });

  it('redirects direct crypto child URLs while gate is false', () => {
    expect(shouldRedirectCryptoDepositRoute(false)).toBe(true);
    expect(shouldRedirectCryptoWithdrawRoute(false)).toBe(true);
    expect(shouldRedirectCryptoDepositRoute(true)).toBe(false);
    expect(shouldBlockCryptoDepositInvoke(false)).toBe(true);
    expect(shouldBlockCryptoWithdrawInvoke(false)).toBe(true);
  });

  it('redirects direct giftcard child URLs when market is empty', () => {
    expect(shouldRedirectGiftcardDepositRoute(false)).toBe(true);
    expect(shouldRedirectGiftcardRedeemRoute(false)).toBe(true);
    expect(shouldRedirectGiftcardDepositRoute(true)).toBe(false);
  });

  it('defaults giftcardMarketAvailable to false (fail-closed)', () => {
    expect(resolveWalletCapabilityRailsDefaults()).toEqual({
      cryptoRails: LAUNCH_GATES.cryptoRails,
      giftcardMarketAvailable: false,
    });
  });
});
