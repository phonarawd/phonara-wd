import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { KrwDepositControllerView } from '@/features/wallet/use-krw-deposit-controller';
import { I18nProvider } from '@/product/i18n';
import { KrwDepositPage } from '@/product/surfaces/wallet/krw-deposit-page';

const useKrwDepositControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/wallet/use-krw-deposit-controller', () => ({
  useKrwDepositController: useKrwDepositControllerMock,
}));

function makeEngine(overrides: Partial<KrwDepositControllerView> = {}): KrwDepositControllerView {
  return {
    loading: false,
    depositBlocked: false,
    amountKrw: '50000',
    setAmountKrw: vi.fn(),
    addChip: vi.fn(),
    chipAmounts: ['10000', '50000', '100000'],
    phonKrwRate: {
      id: 'rate-1',
      base_currency: 'PHON',
      quote_currency: 'KRW',
      rate: '1380.000000',
      captured_at: '2026-07-04T12:00:00.000Z',
      source: 'synthetic',
      is_active: true,
      created_by: null,
    },
    usdtKrwRate: {
      id: 'rate-2',
      base_currency: 'USDT',
      quote_currency: 'KRW',
      rate: '1350.000000',
      captured_at: '2026-07-04T12:00:00.000Z',
      source: 'feed',
      is_active: true,
      created_by: null,
    },
    phonKrwRateStale: false,
    phonKrwRateUnavailable: false,
    phonKrwRateBlocked: false,
    phonKrwRateCapturedDisplay: '7월 4일 오후 09:00',
    usdtKrwRateCapturedDisplay: '7월 4일 오후 09:00',
    amountGateKey: null,
    rateGateKey: null,
    canOpenConfirm: true,
    confirmOpen: false,
    openConfirm: vi.fn(),
    closeConfirm: vi.fn(),
    confirmReview: false,
    submitResult: null,
    submitting: false,
    submitErrorKey: null,
    canSubmit: true,
    canAcknowledge: false,
    submitDeposit: vi.fn(),
    acknowledgeSubmitted: vi.fn(),
    submitted: false,
    timelineSteps: [
      { id: 'request', labelKey: 'wallet.deposit.timeline.request', state: 'done' },
      {
        id: 'match',
        labelKey: 'wallet.deposit.timeline.match',
        state: 'active',
        detailKey: 'wallet.deposit.timeline.reviewEta',
        detailParams: { hours: '24' },
      },
      { id: 'credit', labelKey: 'wallet.deposit.timeline.credit', state: 'upcoming' },
    ],
    copyReference: vi.fn(),
    copyState: 'idle',
    refreshRates: vi.fn(),
    proofLive: true,
    showProofUpload: false,
    proofStatus: null,
    proofStatusKey: null,
    proofFileName: null,
    proofBusy: false,
    proofErrorKey: null,
    canAttachProof: false,
    handleProofSelect: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: KrwDepositControllerView) {
  useKrwDepositControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <KrwDepositPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useKrwDepositControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('KrwDepositPage', () => {
  it('renders §30.3 auto-convert disclosure and rate snapshot card', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('krw-deposit-page')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-auto-convert')).toHaveTextContent(/PHON/);
    expect(screen.getByTestId('krw-deposit-no-limit')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-rate-card')).toBeInTheDocument();
    expect(screen.getByText('PHON/KRW 환율')).toBeInTheDocument();
    expect(screen.getByText('USDT/KRW 환율')).toBeInTheDocument();
  });

  it('does not render proof upload controls before deposit success', () => {
    renderPage(makeEngine({ showProofUpload: false }));

    expect(screen.queryByTestId('krw-deposit-proof-upload')).not.toBeInTheDocument();
  });

  it('renders M-21 proof upload on success when gate live', () => {
    renderPage(
      makeEngine({
        submitted: true,
        submitResult: {
          ok: true,
          deposit_id: 'dep-1',
          reference_code: 'REF1234567',
          expected_phon: '36.231884',
          sla_hours: '24',
        },
        showProofUpload: true,
        canAttachProof: true,
      }),
    );

    expect(screen.getByTestId('krw-deposit-proof-upload')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-proof-ledger-notice')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-proof-choose')).toBeEnabled();
  });

  it('shows pending proof status without choose control when already attached', () => {
    renderPage(
      makeEngine({
        submitted: true,
        submitResult: {
          ok: true,
          deposit_id: 'dep-1',
          reference_code: 'REF1234567',
          expected_phon: '36.231884',
          sla_hours: '24',
        },
        showProofUpload: true,
        proofStatus: 'pending',
        proofStatusKey: 'wallet.deposit.krw.proof.status.pending',
        canAttachProof: false,
      }),
    );

    expect(screen.getByTestId('krw-deposit-proof-status')).toBeInTheDocument();
    expect(screen.queryByTestId('krw-deposit-proof-choose')).not.toBeInTheDocument();
  });

  it('opens confirm dialog from submit and shows expected PHON from RPC result', () => {
    renderPage(
      makeEngine({
        confirmOpen: true,
        submitResult: {
          ok: true,
          deposit_id: 'dep-1',
          reference_code: 'REF1234567',
          expected_phon: '36.231884',
          sla_hours: '24',
        },
        canAcknowledge: true,
      }),
    );

    const dialog = screen.getByTestId('krw-deposit-confirm-dialog');
    expect(within(dialog).getByTestId('krw-deposit-confirm-expected-phon')).toBeInTheDocument();
    expect(within(dialog).getByText('36.231884')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-acknowledge')).toBeEnabled();
  });

  it('shows stale rate refresh banner and disables submit when rate is blocked', () => {
    renderPage(
      makeEngine({
        phonKrwRateStale: true,
        phonKrwRateBlocked: true,
        canOpenConfirm: false,
        rateGateKey: 'wallet.rate.staleGate',
      }),
    );

    expect(screen.getByTestId('krw-deposit-rate-stale')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-submit')).toBeDisabled();
  });

  it('renders success timeline with reference code after submission', () => {
    renderPage(
      makeEngine({
        submitted: true,
        submitResult: {
          ok: true,
          deposit_id: 'dep-1',
          reference_code: 'REF1234567',
          expected_phon: '36.231884',
          sla_hours: '24',
        },
      }),
    );

    expect(screen.getByTestId('krw-deposit-success')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-reference-code')).toHaveTextContent('REF1234567');
    expect(screen.getByTestId('krw-deposit-expected-phon-card')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-timeline')).toBeInTheDocument();
  });

  it('calls openConfirm when submit is clicked', () => {
    const openConfirm = vi.fn();
    renderPage(makeEngine({ openConfirm }));

    fireEvent.click(screen.getByTestId('krw-deposit-submit'));
    expect(openConfirm).toHaveBeenCalledTimes(1);
  });
});
