/**
 * H-10 — withdrawal globally OFF (`feature_withdrawal_enabled=false`).
 * Fail-closed is intentional soft-launch / T1 policy — not a client bug.
 * User copy must expose reason + next action; re-enable only via Feature Flag 5-condition gate.
 *
 * Ops SOT: `docs/OPERATIONS/PLATFORM_WITHDRAWAL_REENABLE_GATE.md`
 * Decision: `docs/OPERATIONS/PLATFORM_AUDIT_DECISION_LOG.md` DL-R2B-H10
 */

import type { MessageKey } from '@phonara/i18n';

export const WALLET_WITHDRAW_HUB_ROUTE = '/wallet/withdraw' as const;
export const WALLET_WITHDRAWAL_OFF_NEXT_HREF = '/wallet/deposit' as const;

/** Banner when platform kill-switch blocks new withdrawals. */
export const WALLET_WITHDRAWAL_OFF_TITLE_KEY =
  'wallet.withdraw.unavailableTitle' as const satisfies MessageKey;
export const WALLET_WITHDRAWAL_OFF_DESC_KEY =
  'wallet.withdraw.unavailableDesc' as const satisfies MessageKey;
export const WALLET_WITHDRAWAL_OFF_NEXT_ACTION_KEY =
  'wallet.withdraw.unavailableNextAction' as const satisfies MessageKey;
export const WALLET_WITHDRAWAL_OFF_NEXT_CTA_KEY =
  'wallet.withdraw.unavailableNextCta' as const satisfies MessageKey;
/** Short tooltip / wallet home CTA title when blocked. */
export const WALLET_WITHDRAWAL_OFF_GATE_PAUSED_KEY =
  'wallet.withdraw.gate.paused' as const satisfies MessageKey;

export type WalletWithdrawalOffBannerView = {
  titleKey: typeof WALLET_WITHDRAWAL_OFF_TITLE_KEY;
  descriptionKey: typeof WALLET_WITHDRAWAL_OFF_DESC_KEY;
  nextActionKey: typeof WALLET_WITHDRAWAL_OFF_NEXT_ACTION_KEY;
  nextCtaKey: typeof WALLET_WITHDRAWAL_OFF_NEXT_CTA_KEY;
  nextHref: typeof WALLET_WITHDRAWAL_OFF_NEXT_HREF;
};

/** Resolve paused-banner copy when `withdrawalBlocked` from platform gates. */
export function resolveWalletWithdrawalOffBanner(
  withdrawalBlocked: boolean,
): WalletWithdrawalOffBannerView | null {
  if (!withdrawalBlocked) return null;
  return {
    titleKey: WALLET_WITHDRAWAL_OFF_TITLE_KEY,
    descriptionKey: WALLET_WITHDRAWAL_OFF_DESC_KEY,
    nextActionKey: WALLET_WITHDRAWAL_OFF_NEXT_ACTION_KEY,
    nextCtaKey: WALLET_WITHDRAWAL_OFF_NEXT_CTA_KEY,
    nextHref: WALLET_WITHDRAWAL_OFF_NEXT_HREF,
  };
}

/** Rails / submit must stay disabled while the platform flag is off. */
export function shouldDisableWithdrawRails(withdrawalBlocked: boolean): boolean {
  return withdrawalBlocked;
}
