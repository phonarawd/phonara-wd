import type { MessageKey } from '@phonara/i18n';

import type { GiftcardDepositSnapshot, GiftcardFeeMarketRow, GiftcardKind } from '@/domain/wallet';
import { isPositiveAmount } from '@/lib/money-display';

export const GIFTCARD_DEPOSIT_KINDS = [
  'culture',
  'happy',
  'book',
  'department',
  'mobile',
  'game',
] as const satisfies readonly GiftcardKind[];

export type GiftcardDepositTimelineStepId = 'request' | 'review' | 'credit';

export type GiftcardDepositTimelineStepView = {
  id: GiftcardDepositTimelineStepId;
  labelKey: MessageKey;
  state: 'done' | 'active' | 'upcoming';
  detailKey?: MessageKey;
  detailParams?: Record<string, string>;
};

export type GiftcardFeeMarketRowView = {
  kind: GiftcardKind;
  kindLabelKey: MessageKey;
  percentFeeDisplay: string;
  fixedFeeDisplay: string | null;
  faceRangeDisplay: string;
  providerName: string;
};

/** Strip non-digits from KRW face value — whole-won only. */
export function normalizeGiftcardFaceValueInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.replace(/^0+(?=\d)/, '');
}

export function giftcardKindLabelKey(kind: GiftcardKind): MessageKey {
  return `wallet.deposit.giftcard.kind.${kind}` as MessageKey;
}

/** Display percent from server bps only — no client PHON math. */
export function formatBpsAsPercent(bps: number): string {
  if (!Number.isFinite(bps)) return '—';
  const pct = bps / 100;
  if (Number.isInteger(pct)) return String(pct);
  return pct.toFixed(2).replace(/\.?0+$/, '');
}

export function mapGiftcardFeeMarketRow(
  row: GiftcardFeeMarketRow,
  formatKrw: (amount: string) => string,
): GiftcardFeeMarketRowView {
  const fixed = row.fixed_fee_krw?.trim() ?? '';
  const fixedNumeric = fixed && Number(fixed) > 0;
  return {
    kind: row.kind,
    kindLabelKey: giftcardKindLabelKey(row.kind),
    percentFeeDisplay: formatBpsAsPercent(row.percent_fee_bps),
    fixedFeeDisplay: fixedNumeric ? formatKrw(fixed) : null,
    faceRangeDisplay: `${formatKrw(row.min_face_value_krw)}~${formatKrw(row.max_face_value_krw)}`,
    providerName: row.provider_name,
  };
}

export function giftcardDepositKindGateKey(kind: GiftcardKind | null): MessageKey | null {
  if (!kind) return 'wallet.deposit.giftcard.gate.kind';
  return null;
}

export function giftcardDepositFaceGateKey(faceValueKrw: string): MessageKey | null {
  const normalized = normalizeGiftcardFaceValueInput(faceValueKrw);
  if (!normalized) return 'wallet.deposit.giftcard.gate.face';
  if (!isPositiveAmount(normalized)) return 'wallet.deposit.giftcard.gate.face';
  return null;
}

export function giftcardDepositPinGateKey(pin: string): MessageKey | null {
  const trimmed = pin.trim();
  if (trimmed.length < 4) return 'wallet.deposit.giftcard.gate.pin';
  return null;
}

export function isGiftcardPreviewSnapshotValid(
  snapshot: GiftcardDepositSnapshot | null | undefined,
): snapshot is GiftcardDepositSnapshot {
  if (!snapshot?.ok) return false;
  return isPositiveAmount(snapshot.expected_phon);
}

export function canLoadGiftcardDepositPreview(input: {
  depositBlocked: boolean;
  marketEmpty: boolean;
  kind: GiftcardKind | null;
  faceValueKrw: string;
  previewLoading: boolean;
}): boolean {
  if (input.depositBlocked || input.marketEmpty || input.previewLoading) return false;
  if (giftcardDepositKindGateKey(input.kind)) return false;
  if (giftcardDepositFaceGateKey(input.faceValueKrw)) return false;
  return true;
}

export function canConfirmGiftcardDepositPreview(input: {
  previewLoading: boolean;
  previewErrorKey: MessageKey | null;
  snapshot: GiftcardDepositSnapshot | null | undefined;
}): boolean {
  if (input.previewLoading || input.previewErrorKey) return false;
  return isGiftcardPreviewSnapshotValid(input.snapshot);
}

export function canOpenGiftcardDepositSubmit(input: {
  depositBlocked: boolean;
  previewConfirmed: boolean;
  kind: GiftcardKind | null;
  faceValueKrw: string;
  pin: string;
}): boolean {
  if (input.depositBlocked || !input.previewConfirmed) return false;
  if (giftcardDepositKindGateKey(input.kind)) return false;
  if (giftcardDepositFaceGateKey(input.faceValueKrw)) return false;
  if (giftcardDepositPinGateKey(input.pin)) return false;
  return true;
}

export function canSubmitGiftcardDepositRequest(input: {
  depositBlocked: boolean;
  previewConfirmed: boolean;
  snapshot: GiftcardDepositSnapshot | null | undefined;
  kind: GiftcardKind | null;
  faceValueKrw: string;
  pin: string;
  submitting: boolean;
}): boolean {
  if (input.submitting) return false;
  if (!isGiftcardPreviewSnapshotValid(input.snapshot)) return false;
  return canOpenGiftcardDepositSubmit(input);
}

export function canAcknowledgeGiftcardDepositResult(
  result: GiftcardDepositSnapshot | null,
): boolean {
  return isGiftcardPreviewSnapshotValid(result);
}

export function buildGiftcardDepositTimelineSteps(
  slaMinutes: number | null | undefined,
): GiftcardDepositTimelineStepView[] {
  const minutes = slaMinutes && slaMinutes > 0 ? slaMinutes : 24 * 60;
  const hours = minutes >= 60 ? String(Math.max(1, Math.round(minutes / 60))) : '1';
  return [
    { id: 'request', labelKey: 'wallet.deposit.giftcard.timeline.request', state: 'done' },
    {
      id: 'review',
      labelKey: 'wallet.deposit.giftcard.timeline.review',
      state: 'active',
      detailKey: 'wallet.deposit.timeline.reviewEta',
      detailParams: { hours },
    },
    { id: 'credit', labelKey: 'wallet.deposit.giftcard.timeline.credit', state: 'upcoming' },
  ];
}
