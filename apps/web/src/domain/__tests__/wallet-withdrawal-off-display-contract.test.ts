import { describe, expect, it } from 'vitest';

import {
  resolveWalletWithdrawalOffBanner,
  shouldDisableWithdrawRails,
  WALLET_WITHDRAWAL_OFF_DESC_KEY,
  WALLET_WITHDRAWAL_OFF_GATE_PAUSED_KEY,
  WALLET_WITHDRAWAL_OFF_NEXT_ACTION_KEY,
  WALLET_WITHDRAWAL_OFF_NEXT_CTA_KEY,
  WALLET_WITHDRAWAL_OFF_NEXT_HREF,
  WALLET_WITHDRAWAL_OFF_TITLE_KEY,
  WALLET_WITHDRAW_HUB_ROUTE,
} from '../wallet-withdrawal-off-display-contract';

describe('wallet-withdrawal-off-display-contract (H-10)', () => {
  it('returns null when withdrawal is not blocked', () => {
    expect(resolveWalletWithdrawalOffBanner(false)).toBeNull();
    expect(shouldDisableWithdrawRails(false)).toBe(false);
  });

  it('exposes reason + next-action keys and deposit CTA when blocked', () => {
    const banner = resolveWalletWithdrawalOffBanner(true);
    expect(banner).toEqual({
      titleKey: WALLET_WITHDRAWAL_OFF_TITLE_KEY,
      descriptionKey: WALLET_WITHDRAWAL_OFF_DESC_KEY,
      nextActionKey: WALLET_WITHDRAWAL_OFF_NEXT_ACTION_KEY,
      nextCtaKey: WALLET_WITHDRAWAL_OFF_NEXT_CTA_KEY,
      nextHref: WALLET_WITHDRAWAL_OFF_NEXT_HREF,
    });
    expect(banner?.nextHref).toBe('/wallet/deposit');
    expect(shouldDisableWithdrawRails(true)).toBe(true);
  });

  it('locks hub route and paused gate key constants', () => {
    expect(WALLET_WITHDRAW_HUB_ROUTE).toBe('/wallet/withdraw');
    expect(WALLET_WITHDRAWAL_OFF_GATE_PAUSED_KEY).toBe('wallet.withdraw.gate.paused');
  });
});
