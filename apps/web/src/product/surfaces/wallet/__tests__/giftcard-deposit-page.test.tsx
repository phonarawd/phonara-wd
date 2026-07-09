import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GiftcardDepositControllerView } from '@/features/wallet/use-giftcard-deposit-controller';
import { I18nProvider } from '@/product/i18n';
import { GiftcardDepositPage } from '@/product/surfaces/wallet/giftcard-deposit-page';

const useGiftcardDepositControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/wallet/use-giftcard-deposit-controller', () => ({
  useGiftcardDepositController: useGiftcardDepositControllerMock,
}));

const SAMPLE_PREVIEW = {
  ok: true,
  kind: 'culture' as const,
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

function makeEngine(
  overrides: Partial<GiftcardDepositControllerView> = {},
): GiftcardDepositControllerView {
  return {
    loading: false,
    depositBlocked: false,
    marketEmpty: false,
    marketRows: [
      {
        kind: 'culture',
        kindLabelKey: 'wallet.deposit.giftcard.kind.culture',
        percentFeeDisplay: '5',
        fixedFeeDisplay: null,
        faceRangeDisplay: '10,000~500,000',
        providerName: 'Cultureland',
      },
    ],
    marketLoading: false,
    refreshMarket: vi.fn(),
    kinds: ['culture'],
    kind: 'culture',
    setKind: vi.fn(),
    faceValueKrw: '50000',
    setFaceValueKrw: vi.fn(),
    pin: '',
    setPin: vi.fn(),
    pinEnabled: false,
    kindGateKey: null,
    faceGateKey: null,
    pinGateKey: null,
    previewGateKey: null,
    canLoadPreview: true,
    previewLoading: false,
    previewErrorKey: null,
    previewSnapshot: null,
    previewConfirmed: false,
    previewRequested: false,
    loadPreview: vi.fn(),
    confirmPreview: vi.fn(),
    canConfirmPreview: false,
    canOpenSubmit: false,
    confirmOpen: false,
    openConfirm: vi.fn(),
    closeConfirm: vi.fn(),
    submitResult: null,
    submitting: false,
    submitErrorKey: null,
    canSubmit: false,
    canAcknowledge: false,
    submitDeposit: vi.fn(),
    acknowledgeSubmitted: vi.fn(),
    submitted: false,
    timelineSteps: [
      { id: 'request', labelKey: 'wallet.deposit.giftcard.timeline.request', state: 'done' },
      {
        id: 'review',
        labelKey: 'wallet.deposit.giftcard.timeline.review',
        state: 'active',
        detailKey: 'wallet.deposit.timeline.reviewEta',
        detailParams: { hours: '24' },
      },
      { id: 'credit', labelKey: 'wallet.deposit.giftcard.timeline.credit', state: 'upcoming' },
    ],
    ...overrides,
  };
}

function renderPage(engine: GiftcardDepositControllerView) {
  useGiftcardDepositControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <GiftcardDepositPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useGiftcardDepositControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('GiftcardDepositPage', () => {
  it('renders §30.3 fee notice and fee market table', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('giftcard-deposit-page')).toBeInTheDocument();
    expect(screen.getByTestId('giftcard-deposit-fee-notice')).toHaveTextContent(/매입 시세/);
    expect(screen.getByTestId('giftcard-deposit-fee-market')).toBeInTheDocument();
    expect(screen.getByTestId('giftcard-fee-row-culture')).toBeInTheDocument();
    expect(screen.getByTestId('giftcard-deposit-no-limit')).toBeInTheDocument();
  });

  it('keeps PIN input locked until preview is confirmed', () => {
    renderPage(
      makeEngine({
        previewRequested: true,
        previewSnapshot: SAMPLE_PREVIEW,
        canConfirmPreview: true,
      }),
    );

    const pinInput = screen.getByTestId('giftcard-deposit-pin-input');
    expect(pinInput).toBeDisabled();
    expect(screen.getByTestId('giftcard-deposit-pin-locked')).toBeInTheDocument();
    expect(screen.getByTestId('giftcard-deposit-submit')).toBeDisabled();
  });

  it('enables submit only after preview confirmed and valid PIN', () => {
    renderPage(
      makeEngine({
        previewRequested: true,
        previewConfirmed: true,
        previewSnapshot: SAMPLE_PREVIEW,
        pinEnabled: true,
        pin: '12345678',
        canOpenSubmit: true,
      }),
    );

    expect(screen.getByTestId('giftcard-deposit-pin-input')).not.toBeDisabled();
    expect(screen.getByTestId('giftcard-deposit-preview-confirmed')).toBeInTheDocument();
    expect(screen.getByTestId('giftcard-deposit-submit')).not.toBeDisabled();
  });

  it('shows preview card with RPC expected PHON after load', () => {
    renderPage(
      makeEngine({
        previewRequested: true,
        previewSnapshot: SAMPLE_PREVIEW,
        canConfirmPreview: true,
      }),
    );

    const card = screen.getByTestId('giftcard-deposit-preview-card');
    expect(within(card).getByTestId('giftcard-deposit-preview-summary')).toHaveTextContent(
      /34\.420290/,
    );
    expect(screen.getByTestId('giftcard-deposit-confirm-preview')).not.toBeDisabled();
  });

  it('shows confirm dialog with expected PHON from RPC', () => {
    renderPage(
      makeEngine({
        previewConfirmed: true,
        previewSnapshot: SAMPLE_PREVIEW,
        pin: '12345678',
        confirmOpen: true,
        canSubmit: true,
      }),
    );

    const dialog = screen.getByTestId('giftcard-deposit-confirm-dialog');
    expect(within(dialog).getByTestId('giftcard-deposit-confirm-preview')).toHaveTextContent(
      /34\.420290/,
    );
  });

  it('calls openConfirm when submit is clicked', () => {
    const openConfirm = vi.fn();
    renderPage(
      makeEngine({
        previewConfirmed: true,
        previewSnapshot: SAMPLE_PREVIEW,
        pinEnabled: true,
        pin: '12345678',
        canOpenSubmit: true,
        openConfirm,
      }),
    );

    fireEvent.click(screen.getByTestId('giftcard-deposit-submit'));
    expect(openConfirm).toHaveBeenCalled();
  });

  it('renders success timeline after submission', () => {
    renderPage(
      makeEngine({
        submitted: true,
        submitResult: { ...SAMPLE_PREVIEW, deposit_id: 'dep-gc-1' },
      }),
    );

    expect(screen.getByTestId('giftcard-deposit-success')).toBeInTheDocument();
    expect(screen.getByTestId('giftcard-deposit-timeline-review')).toBeInTheDocument();
  });
});
