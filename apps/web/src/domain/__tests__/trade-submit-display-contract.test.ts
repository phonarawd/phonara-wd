import { describe, expect, it } from 'vitest';

import {
  resolveFuturesOrderSubmitDisabled,
  resolveFuturesOrderSubmitDisabledReason,
  resolveSpotOrderSubmitDisabled,
  resolveSpotOrderSubmitDisabledReason,
  resolveStakingClaimBlockedReason,
  resolveStakingPositionActionsDisabled,
  resolveStakingPositionClaimDisabled,
  resolveStakingPositionClaimBlockedReason,
  resolveStakingSubmitDisabled,
  resolveStakingSubmitDisabledReason,
  resolveSubmitDisabledReason,
  resolveTradeDeskSubmitGate,
} from '../trade-submit-display-contract';

describe('trade-submit-display-contract · Phase 1 PR-2/PR-4/PR-5', () => {
  describe('resolveTradeDeskSubmitGate (PR-2 · desk-scoped kill)', () => {
    it('does not block spot when only futures kill-switch is off', () => {
      const gate = resolveTradeDeskSubmitGate({
        desk: 'spot',
        deskBlocked: false,
        priceStale: false,
      });

      expect(gate.submitBlocked).toBe(false);
      expect(gate.reasonKey).toBeNull();
    });

    it('blocks submit when consent gate precheck fails (PQA F2)', () => {
      const gate = resolveTradeDeskSubmitGate({
        desk: 'spot',
        deskBlocked: false,
        consentBlocked: true,
        priceStale: false,
      });

      expect(gate.submitBlocked).toBe(true);
      expect(gate.reasonKey).toBe('error.CONSENT_REQUIRED');
    });

    it('blocks spot with spot gate reason when spot kill-switch is off', () => {
      const gate = resolveTradeDeskSubmitGate({
        desk: 'spot',
        deskBlocked: true,
        priceStale: false,
      });

      expect(gate.submitBlocked).toBe(true);
      expect(gate.reasonKey).toBe('trade.gate.spotBlocked');
    });

    it('blocks futures with futures gate reason when futures kill-switch is off', () => {
      const gate = resolveTradeDeskSubmitGate({
        desk: 'futures',
        deskBlocked: true,
        priceStale: false,
      });

      expect(gate.submitBlocked).toBe(true);
      expect(gate.reasonKey).toBe('trade.gate.futuresBlocked');
    });

    it('submit-only stale block returns stale description (PR-4)', () => {
      const gate = resolveTradeDeskSubmitGate({
        desk: 'spot',
        deskBlocked: false,
        priceStale: true,
      });

      expect(gate.submitBlocked).toBe(true);
      expect(gate.reasonKey).toBe('trade.dataStatus.staleDescription');
    });

    it('blocks submit when mark is frozen (P4-A)', () => {
      const gate = resolveTradeDeskSubmitGate({
        desk: 'spot',
        deskBlocked: false,
        priceStale: false,
        priceFrozen: true,
      });

      expect(gate.submitBlocked).toBe(true);
      expect(gate.reasonKey).toBe('trade.dataStatus.freezeDescription');
    });

    it('blocks submit when realtime is disconnected (P0-4)', () => {
      const gate = resolveTradeDeskSubmitGate({
        desk: 'futures',
        deskBlocked: false,
        priceStale: false,
        realtimeDisconnected: true,
      });

      expect(gate.submitBlocked).toBe(true);
      expect(gate.reasonKey).toBe('trade.dataStatus.realtimeDisconnectedDescription');
    });
  });

  describe('resolveFuturesOrderSubmitDisabledReason (PR-5)', () => {
    const base = {
      busy: false,
      walletLoading: false,
      marginModeBusy: false,
      orderType: 'market' as const,
      preview: null,
      orderPricesReady: true,
      submitBlocked: false,
      submitBlockedReason: null,
      isHighLeverage: false,
      riskAcknowledged: true,
      houseCounterpartyAcknowledged: true,
      insufficientAvail: false,
    };

    it('returns previewUnavailable when market preview is null', () => {
      expect(resolveFuturesOrderSubmitDisabledReason(base)).toBe('trade.submit.previewUnavailable');
    });

    it('returns insufficient balance before preview-unavailable when both apply', () => {
      expect(
        resolveFuturesOrderSubmitDisabledReason({
          ...base,
          preview: { notional: '100', openFee: '1', liquidationPrice: '0.5', quantity: '1' },
          insufficientAvail: true,
        }),
      ).toBe('error.INSUFFICIENT_BALANCE');
    });

    it('mirrors submit disabled for preview-null market path', () => {
      const input = { ...base };
      expect(resolveFuturesOrderSubmitDisabled(input)).toBe(true);
      expect(resolveFuturesOrderSubmitDisabledReason(input)).toBe(
        'trade.submit.previewUnavailable',
      );
    });
  });

  describe('resolveSubmitDisabledReason unified API (P2-2)', () => {
    it('routes futures preview-null to previewUnavailable', () => {
      expect(
        resolveSubmitDisabledReason({
          domain: 'futures',
          state: {
            busy: false,
            walletLoading: false,
            marginModeBusy: false,
            orderType: 'market',
            preview: null,
            orderPricesReady: true,
            submitBlocked: false,
            submitBlockedReason: null,
            isHighLeverage: false,
            riskAcknowledged: true,
            houseCounterpartyAcknowledged: true,
            insufficientAvail: false,
          },
        }),
      ).toBe('trade.submit.previewUnavailable');
    });

    it('routes spot missing estimate to previewUnavailable', () => {
      expect(
        resolveSubmitDisabledReason({
          domain: 'spot',
          state: {
            busy: false,
            orderType: 'market',
            estimate: null,
            orderPricesReady: true,
            submitBlocked: false,
            submitBlockedReason: null,
            houseCounterpartyAcknowledged: true,
          },
        }),
      ).toBe('trade.submit.previewUnavailable');
    });

    it('routes staking missing pool to selectPool reason', () => {
      expect(
        resolveSubmitDisabledReason({
          domain: 'staking',
          state: {
            stakingBlocked: false,
            stakeBusy: false,
            selectedPoolId: null,
            stakeAmount: '100',
          },
        }),
      ).toBe('staking.submit.selectPool');
    });

    it('keeps spot and staking helper exports aligned', () => {
      expect(
        resolveSpotOrderSubmitDisabledReason({
          busy: false,
          orderType: 'limit',
          estimate: '1',
          orderPricesReady: false,
          submitBlocked: false,
          submitBlockedReason: null,
          houseCounterpartyAcknowledged: true,
        }),
      ).toBe('trade.submit.blocked');
      expect(
        resolveStakingSubmitDisabledReason({
          stakingBlocked: false,
          stakeBusy: false,
          selectedPoolId: 'pool-1',
          stakeAmount: '',
        }),
      ).toBe('staking.submit.enterAmount');
    });

    it('blocks staking submit for zero and invalid amount strings', () => {
      for (const stakeAmount of ['0', 'abc']) {
        expect(
          resolveStakingSubmitDisabled({
            stakingBlocked: false,
            stakeBusy: false,
            selectedPoolId: 'pool-1',
            stakeAmount,
          }),
        ).toBe(true);
        expect(
          resolveStakingSubmitDisabledReason({
            stakingBlocked: false,
            stakeBusy: false,
            selectedPoolId: 'pool-1',
            stakeAmount,
          }),
        ).toBe('staking.submit.enterAmount');
      }
    });

    it('allows staking submit for positive amount when other gates are clear', () => {
      expect(
        resolveStakingSubmitDisabled({
          stakingBlocked: false,
          stakeBusy: false,
          selectedPoolId: 'pool-1',
          stakeAmount: '10',
        }),
      ).toBe(false);
    });

    it('blocks staking submit when insufficientAvail is true', () => {
      expect(
        resolveStakingSubmitDisabled({
          stakingBlocked: false,
          stakeBusy: false,
          selectedPoolId: 'pool-1',
          stakeAmount: '100',
          insufficientAvail: true,
        }),
      ).toBe(true);
      expect(
        resolveStakingSubmitDisabledReason({
          stakingBlocked: false,
          stakeBusy: false,
          selectedPoolId: 'pool-1',
          stakeAmount: '100',
          insufficientAvail: true,
        }),
      ).toBe('error.INSUFFICIENT_BALANCE');
    });

    it('blocks staking claim/unstake when tier RPC failed (P0-4)', () => {
      expect(resolveStakingClaimBlockedReason(true)).toBe('staking.tier.loadErrorRetry');
      expect(resolveStakingClaimBlockedReason(false)).toBeNull();
      expect(resolveStakingPositionActionsDisabled(true)).toBe(true);
      expect(resolveStakingPositionActionsDisabled(false)).toBe(false);
    });

    it('blocks staking claim when pending reward is zero (P1-C)', () => {
      expect(
        resolveStakingPositionClaimDisabled({
          tierError: false,
          pendingRewardDisplay: '0.000000',
        }),
      ).toBe(true);
      expect(
        resolveStakingPositionClaimBlockedReason({
          tierError: false,
          pendingRewardDisplay: '0.000000',
        }),
      ).toBe('staking.claimNothingYet');
      expect(
        resolveStakingPositionClaimDisabled({
          tierError: false,
          pendingRewardDisplay: '1.000000',
        }),
      ).toBe(false);
      expect(
        resolveStakingPositionClaimDisabled({
          tierError: false,
          pendingRewardDisplay: null,
        }),
      ).toBe(false);
      expect(
        resolveStakingPositionClaimDisabled({
          tierError: true,
          pendingRewardDisplay: '1.000000',
        }),
      ).toBe(true);
    });

    it('aligns spot inline and mobile sticky via resolveSpotOrderSubmitDisabled', () => {
      const state = {
        busy: false,
        orderType: 'market' as const,
        estimate: '10',
        orderPricesReady: true,
        submitBlocked: false,
        submitBlockedReason: null,
        insufficientAvail: true,
        houseCounterpartyAcknowledged: true,
      };
      expect(resolveSpotOrderSubmitDisabled(state)).toBe(true);
      expect(resolveSpotOrderSubmitDisabledReason(state)).toBe('error.INSUFFICIENT_BALANCE');
    });
  });
});
