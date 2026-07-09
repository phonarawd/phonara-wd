/**

 * Trade desk submit gate — desk-scoped kill-switch + submit-only stale (Phase 1 PR-2/PR-4/PR-5).

 * Unified submit-disabled reason resolver for spot · futures · staking (Phase 2 P2-2).

 * Display banners use `trade-market-status-display-contract`; tickets use inline reason keys here.

 */

import type { MessageKey } from '@phonara/i18n';

import { resolveHouseCounterpartySubmitBlocked } from '@/domain/trade-synthetic-book-disclosure-display-contract';
import type { TradeDeskKind } from '@/domain/trade-market-status-display-contract';
import { isPositiveAmount } from '@/lib/money-display';

export type { TradeDeskKind };

export type TradeDeskSubmitGateInput = {
  desk: TradeDeskKind;

  /** spotBlocked or futuresBlocked from platform gates (includes system halt). */

  deskBlocked: boolean;

  /** consent_gate_enabled + incomplete onboarding consent (server authoritative). */

  consentBlocked?: boolean;

  priceStale: boolean;

  priceFrozen?: boolean;

  realtimeDisconnected?: boolean;
};

export type TradeDeskSubmitGateView = {
  submitBlocked: boolean;

  reasonKey: MessageKey | null;
};

/** Desk-scoped submit block — never OR spot+futures kill switches (PR-2). */

export function resolveTradeDeskSubmitGate(
  input: TradeDeskSubmitGateInput,
): TradeDeskSubmitGateView {
  if (input.consentBlocked) {
    return {
      submitBlocked: true,

      reasonKey: 'error.CONSENT_REQUIRED',
    };
  }

  if (input.deskBlocked) {
    return {
      submitBlocked: true,

      reasonKey: input.desk === 'spot' ? 'trade.gate.spotBlocked' : 'trade.gate.futuresBlocked',
    };
  }

  if (input.realtimeDisconnected) {
    return {
      submitBlocked: true,

      reasonKey: 'trade.dataStatus.realtimeDisconnectedDescription',
    };
  }

  if (input.priceFrozen) {
    return {
      submitBlocked: true,

      reasonKey: 'trade.dataStatus.freezeDescription',
    };
  }

  if (input.priceStale) {
    return {
      submitBlocked: true,

      reasonKey: 'trade.dataStatus.staleDescription',
    };
  }

  return { submitBlocked: false, reasonKey: null };
}

export type FuturesOrderSubmitStateInput = {
  busy: boolean;

  walletLoading: boolean;

  marginModeBusy: boolean;

  orderType: 'market' | 'limit' | 'stop_market' | 'stop_limit';

  preview: unknown;

  orderPricesReady: boolean;

  submitBlocked: boolean;

  submitBlockedReason: MessageKey | null;

  isHighLeverage: boolean;

  riskAcknowledged: boolean;

  /** P2-D — house counterparty one-time ack before first trade submit. */
  houseCounterpartyAcknowledged: boolean;

  insufficientAvail: boolean;
};

export type SpotOrderSubmitStateInput = {
  busy: boolean;

  orderType: 'market' | 'limit' | 'stop_market' | 'stop_limit';

  estimate: string | null;

  orderPricesReady: boolean;

  submitBlocked: boolean;

  submitBlockedReason: MessageKey | null;

  /** P2-D — house counterparty one-time ack before first trade submit. */
  houseCounterpartyAcknowledged: boolean;

  insufficientAvail?: boolean;
};

export type StakingSubmitStateInput = {
  stakingBlocked: boolean;

  consentBlocked?: boolean;

  stakeBusy: boolean;

  selectedPoolId: string | null;

  stakeAmount: string;

  insufficientAvail?: boolean;
};

export type SubmitDisabledReasonInput =
  | { domain: 'spot'; state: SpotOrderSubmitStateInput }
  | { domain: 'futures'; state: FuturesOrderSubmitStateInput }
  | { domain: 'staking'; state: StakingSubmitStateInput };

/** Unified inline ticket reason — highest-priority user-actionable block first (P2-2). */

export function resolveSubmitDisabledReason(input: SubmitDisabledReasonInput): MessageKey | null {
  switch (input.domain) {
    case 'spot':
      return resolveSpotOrderSubmitDisabledReason(input.state);

    case 'futures':
      return resolveFuturesOrderSubmitDisabledReason(input.state);

    case 'staking':
      return resolveStakingSubmitDisabledReason(input.state);
  }
}

export function resolveFuturesOrderSubmitDisabled(input: FuturesOrderSubmitStateInput): boolean {
  return (
    input.busy ||
    input.walletLoading ||
    input.marginModeBusy ||
    (input.orderType === 'market' && !input.preview) ||
    !input.orderPricesReady ||
    input.submitBlocked ||
    (input.isHighLeverage && !input.riskAcknowledged) ||
    resolveHouseCounterpartySubmitBlocked(input.houseCounterpartyAcknowledged) ||
    input.insufficientAvail
  );
}

/** Inline futures ticket reason — highest-priority user-actionable block first (PR-5). */

export function resolveFuturesOrderSubmitDisabledReason(
  input: FuturesOrderSubmitStateInput,
): MessageKey | null {
  if (input.busy || input.walletLoading || input.marginModeBusy) return null;

  if (input.submitBlocked && input.submitBlockedReason) return input.submitBlockedReason;

  if (input.orderType === 'market' && !input.preview) return 'trade.submit.previewUnavailable';

  if (!input.orderPricesReady) return 'trade.submit.blocked';

  if (input.insufficientAvail) return 'error.INSUFFICIENT_BALANCE';

  return null;
}

export function resolveSpotOrderSubmitDisabled(input: SpotOrderSubmitStateInput): boolean {
  return (
    input.busy ||
    !input.estimate ||
    !input.orderPricesReady ||
    input.submitBlocked ||
    resolveHouseCounterpartySubmitBlocked(input.houseCounterpartyAcknowledged) ||
    Boolean(input.insufficientAvail)
  );
}

export function resolveSpotOrderSubmitDisabledReason(
  input: SpotOrderSubmitStateInput,
): MessageKey | null {
  if (input.busy) return null;

  if (input.submitBlocked && input.submitBlockedReason) return input.submitBlockedReason;

  if (!input.orderPricesReady) return 'trade.submit.blocked';

  if (input.insufficientAvail) return 'error.INSUFFICIENT_BALANCE';

  if (!input.estimate) return 'trade.submit.previewUnavailable';

  return null;
}

export function resolveStakingSubmitDisabled(input: StakingSubmitStateInput): boolean {
  return (
    input.stakingBlocked ||
    Boolean(input.consentBlocked) ||
    input.stakeBusy ||
    !input.selectedPoolId ||
    !isPositiveAmount(input.stakeAmount) ||
    Boolean(input.insufficientAvail)
  );
}

export function resolveStakingSubmitDisabledReason(
  input: StakingSubmitStateInput,
): MessageKey | null {
  if (input.stakeBusy) return null;

  if (input.consentBlocked) return 'error.CONSENT_REQUIRED';

  if (input.stakingBlocked) return 'staking.gate.paused';

  if (!input.selectedPoolId) return 'staking.submit.selectPool';

  if (input.insufficientAvail) return 'error.INSUFFICIENT_BALANCE';

  if (!input.stakeAmount) return 'staking.submit.enterAmount';

  if (!isPositiveAmount(input.stakeAmount)) return 'staking.submit.enterAmount';

  return null;
}

export type StakingClaimBlockInput = {
  tierError: boolean;
  /** Engine-exposed pending reward; null = field not yet available (P1-C stage 2). */
  pendingRewardDisplay: string | null;
};

/** Staking claim CTA disabled when tier RPC failed or pending reward is zero (P0-4 · P1-C). */
export function resolveStakingPositionClaimDisabled(input: StakingClaimBlockInput): boolean {
  if (input.tierError) return true;
  if (input.pendingRewardDisplay === null) return false;
  return !isPositiveAmount(input.pendingRewardDisplay);
}

/** Per-position or global claim block reason — tier error takes precedence (P0-4 · P1-C). */
export function resolveStakingPositionClaimBlockedReason(
  input: StakingClaimBlockInput,
): MessageKey | null {
  if (input.tierError) return 'staking.tier.loadErrorRetry';
  if (input.pendingRewardDisplay !== null && !isPositiveAmount(input.pendingRewardDisplay)) {
    return 'staking.claimNothingYet';
  }
  return null;
}

/** Global tier banner — tier RPC failure only (P0-4). */
export function resolveStakingClaimBlockedReason(tierError: boolean): MessageKey | null {
  return resolveStakingPositionClaimBlockedReason({ tierError, pendingRewardDisplay: null });
}

/** Staking unstake block when tier RPC failed — no tier-blind money actions (P0-4). */
export function resolveStakingPositionActionsDisabled(tierError: boolean): boolean {
  return tierError;
}
