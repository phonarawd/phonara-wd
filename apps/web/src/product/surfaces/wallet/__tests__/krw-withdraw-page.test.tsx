import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { KrwWithdrawControllerView } from '@/features/wallet/use-krw-withdraw-controller';
import { I18nProvider } from '@/product/i18n';
import { KrwWithdrawPage } from '@/product/surfaces/wallet/krw-withdraw-page';

const useKrwWithdrawControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/wallet/use-krw-withdraw-controller', () => ({
  useKrwWithdrawController: useKrwWithdrawControllerMock,
}));

function makeEngine(overrides: Partial<KrwWithdrawControllerView> = {}): KrwWithdrawControllerView {
  return {
    loading: false,
    withdrawalBlocked: false,
    withdrawalReady: true,
    phonRealAvailableDisplay: '100.000000',
    amountPhon: '25',
    setAmountPhon: vi.fn(),
    bankAccount: '110123456789',
    setBankAccount: vi.fn(),
    phonKrwRate: {
      id: 'rate-1',
      base_currency: 'PHON',
      quote_currency: 'KRW',
      rate: '10.000000',
      captured_at: '2026-07-04T12:00:00.000Z',
      source: 'bootstrap',
      is_active: true,
      created_by: null,
    },
    phonKrwRateStale: false,
    phonKrwRateUnavailable: false,
    phonKrwRateBlocked: false,
    phonKrwRateCapturedDisplay: '7월 4일 오후 09:00',
    amountGateKey: null,
    accountGateKey: null,
    balanceGateKey: null,
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
    submitWithdraw: vi.fn(),
    acknowledgeSubmitted: vi.fn(),
    submitted: false,
    timelineSteps: [
      { id: 'request', labelKey: 'wallet.withdraw.timeline.request', state: 'done' },
      { id: 'review', labelKey: 'wallet.withdraw.timeline.review', state: 'active' },
      { id: 'send', labelKey: 'wallet.withdraw.timeline.send', state: 'upcoming' },
      { id: 'done', labelKey: 'wallet.withdraw.timeline.done', state: 'upcoming' },
    ],
    tierLimits: {
      currentTier: 'bronze',
      currentTierLabelKey: 'earn.tier.bronze',
      currentLimitLabelKey: 'tier.guide.rows.bronze.withdraw',
      nextTier: 'silver',
      nextTierLabelKey: 'earn.tier.silver',
      nextLimitLabelKey: 'tier.guide.rows.silver.withdraw',
    },
    refreshRates: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: KrwWithdrawControllerView) {
  useKrwWithdrawControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <KrwWithdrawPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useKrwWithdrawControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('KrwWithdrawPage', () => {
  it('renders §31.3 tier limit card with current and next tier', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('wallet-withdraw-tier-limits')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-withdraw-tier-limits-current')).toHaveTextContent(/100,000/);
    expect(screen.getByTestId('wallet-withdraw-tier-limits-next')).toHaveTextContent(/500,000/);
  });

  it('renders §30.3 auto-convert disclosure and rate snapshot card', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('krw-withdraw-page')).toBeInTheDocument();
    expect(screen.getByTestId('krw-withdraw-auto-convert')).toHaveTextContent(/원화/);
    expect(screen.getByTestId('krw-withdraw-rate-card')).toBeInTheDocument();
    expect(screen.getByText('PHON/KRW 환율')).toBeInTheDocument();
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

    expect(screen.getByTestId('krw-withdraw-rate-stale')).toBeInTheDocument();
    expect(screen.getByTestId('krw-withdraw-submit')).toBeDisabled();
  });

  it('opens confirm dialog from submit and shows expected KRW from RPC result', () => {
    renderPage(
      makeEngine({
        confirmOpen: true,
        submitResult: {
          ok: true,
          withdrawal_id: 'wd-1',
          expected_krw: '250.000000',
          rate_snapshot_id: 'rate-1',
        },
        canAcknowledge: true,
      }),
    );

    const dialog = screen.getByTestId('krw-withdraw-confirm-dialog');
    expect(within(dialog).getByTestId('krw-withdraw-confirm-expected-krw')).toBeInTheDocument();
    expect(within(dialog).getByText('250')).toBeInTheDocument();
    expect(screen.getByTestId('krw-withdraw-acknowledge')).toBeEnabled();
  });

  it('disables acknowledge when expected KRW is missing (§30.3)', () => {
    renderPage(
      makeEngine({
        confirmOpen: true,
        submitResult: {
          ok: true,
          withdrawal_id: 'wd-1',
          expected_krw: '0',
          rate_snapshot_id: 'rate-1',
        },
        canAcknowledge: false,
      }),
    );

    expect(screen.getByTestId('krw-withdraw-acknowledge')).toBeDisabled();
  });

  it('renders success timeline with expected KRW after submission', () => {
    renderPage(
      makeEngine({
        submitted: true,
        submitResult: {
          ok: true,
          withdrawal_id: 'wd-1',
          expected_krw: '250.000000',
          rate_snapshot_id: 'rate-1',
        },
      }),
    );

    expect(screen.getByTestId('krw-withdraw-success')).toBeInTheDocument();
    expect(screen.getByTestId('krw-withdraw-expected-krw-card')).toBeInTheDocument();
    expect(screen.getByTestId('krw-withdraw-timeline')).toBeInTheDocument();
  });

  it('calls openConfirm when submit is clicked', () => {
    const openConfirm = vi.fn();
    renderPage(makeEngine({ openConfirm }));

    fireEvent.click(screen.getByTestId('krw-withdraw-submit'));
    expect(openConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows KYC lock when withdrawal is not ready', () => {
    renderPage(
      makeEngine({
        withdrawalReady: false,
        canOpenConfirm: false,
      }),
    );

    expect(screen.getByTestId('krw-withdraw-kyc-lock')).toBeInTheDocument();
    expect(screen.getByTestId('krw-withdraw-submit')).toBeDisabled();
  });
});
