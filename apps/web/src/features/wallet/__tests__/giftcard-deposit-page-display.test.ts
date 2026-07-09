import { describe, expect, it } from 'vitest';

import type { GiftcardDepositSnapshot, GiftcardFeeMarketRow } from '@/domain/wallet';

import {
  buildGiftcardDepositTimelineSteps,
  canConfirmGiftcardDepositPreview,
  canLoadGiftcardDepositPreview,
  canOpenGiftcardDepositSubmit,
  canSubmitGiftcardDepositRequest,
  formatBpsAsPercent,
  giftcardDepositPinGateKey,
  isGiftcardPreviewSnapshotValid,
  mapGiftcardFeeMarketRow,
  normalizeGiftcardFaceValueInput,
} from '../giftcard-deposit-page-display';

const SAMPLE_MARKET_ROW: GiftcardFeeMarketRow = {
  kind: 'culture',
  provider_name: 'Cultureland',
  giftcard_type: 'culture',
  payout_rate_bps: 9000,
  percent_fee_bps: 500,
  fixed_fee_krw: '0',
  min_face_value_krw: '10000',
  max_face_value_krw: '500000',
  sla_minutes: 1440,
  last_checked_at: '2026-07-04T12:00:00.000Z',
};

const SAMPLE_SNAPSHOT: GiftcardDepositSnapshot = {
  ok: true,
  kind: 'culture',
  provider_name: 'Cultureland',
  giftcard_type: 'culture',
  face_value_krw: '50000',
  payout_rate_bps: 9000,
  percent_fee_bps: 500,
  fixed_fee_krw: '0',
  total_fee_krw: '2500',
  net_krw: '47500',
  expected_phon: '34.420290',
  sla_minutes: 1440,
  evidence_url: null,
  last_checked_at: '2026-07-04T12:00:00.000Z',
};

describe('giftcard-deposit-page-display', () => {
  it('normalizes face value to whole-won digits', () => {
    expect(normalizeGiftcardFaceValueInput('50,000원')).toBe('50000');
    expect(normalizeGiftcardFaceValueInput('00010000')).toBe('10000');
  });

  it('formats bps as percent without PHON math', () => {
    expect(formatBpsAsPercent(500)).toBe('5');
    expect(formatBpsAsPercent(1250)).toBe('12.5');
  });

  it('maps fee market rows for table display', () => {
    const view = mapGiftcardFeeMarketRow(SAMPLE_MARKET_ROW, (amount) => `${amount}원`);
    expect(view.percentFeeDisplay).toBe('5');
    expect(view.fixedFeeDisplay).toBeNull();
    expect(view.faceRangeDisplay).toBe('10000원~500000원');
  });

  it('blocks preview load when market empty or amount invalid', () => {
    expect(
      canLoadGiftcardDepositPreview({
        depositBlocked: false,
        marketEmpty: true,
        kind: 'culture',
        faceValueKrw: '50000',
        previewLoading: false,
      }),
    ).toBe(false);
    expect(
      canLoadGiftcardDepositPreview({
        depositBlocked: false,
        marketEmpty: false,
        kind: 'culture',
        faceValueKrw: '',
        previewLoading: false,
      }),
    ).toBe(false);
  });

  it('requires valid RPC preview before confirm and PIN submit', () => {
    expect(
      canConfirmGiftcardDepositPreview({
        previewLoading: false,
        previewErrorKey: null,
        snapshot: SAMPLE_SNAPSHOT,
      }),
    ).toBe(true);
    expect(
      canOpenGiftcardDepositSubmit({
        depositBlocked: false,
        previewConfirmed: false,
        kind: 'culture',
        faceValueKrw: '50000',
        pin: '12345678',
      }),
    ).toBe(false);
    expect(
      canOpenGiftcardDepositSubmit({
        depositBlocked: false,
        previewConfirmed: true,
        kind: 'culture',
        faceValueKrw: '50000',
        pin: '12345678',
      }),
    ).toBe(true);
    expect(giftcardDepositPinGateKey('12')).toBe('wallet.deposit.giftcard.gate.pin');
  });

  it('requires preview snapshot for final submit', () => {
    expect(
      canSubmitGiftcardDepositRequest({
        depositBlocked: false,
        previewConfirmed: true,
        snapshot: SAMPLE_SNAPSHOT,
        kind: 'culture',
        faceValueKrw: '50000',
        pin: '12345678',
        submitting: false,
      }),
    ).toBe(true);
    expect(
      canSubmitGiftcardDepositRequest({
        depositBlocked: false,
        previewConfirmed: true,
        snapshot: { ...SAMPLE_SNAPSHOT, expected_phon: '0' },
        kind: 'culture',
        faceValueKrw: '50000',
        pin: '12345678',
        submitting: false,
      }),
    ).toBe(false);
    expect(isGiftcardPreviewSnapshotValid({ ...SAMPLE_SNAPSHOT, ok: false })).toBe(false);
  });

  it('builds giftcard timeline with SLA hours', () => {
    const steps = buildGiftcardDepositTimelineSteps(120);
    expect(steps[1]?.state).toBe('active');
    expect(steps[1]?.detailParams).toEqual({ hours: '2' });
  });
});
