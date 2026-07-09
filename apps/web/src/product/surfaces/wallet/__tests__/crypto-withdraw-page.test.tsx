import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CryptoWithdrawControllerView } from '@/features/wallet/use-crypto-withdraw-controller';
import { I18nProvider } from '@/product/i18n';
import { CryptoWithdrawPage } from '@/product/surfaces/wallet/crypto-withdraw-page';

const useCryptoWithdrawControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/wallet/use-crypto-withdraw-controller', () => ({
  useCryptoWithdrawController: useCryptoWithdrawControllerMock,
}));

function makeEngine(
  overrides: Partial<CryptoWithdrawControllerView> = {},
): CryptoWithdrawControllerView {
  return {
    loading: false,
    withdrawalBlocked: false,
    withdrawalReady: true,
    usdtAvailableDisplay: '100.000000',
    showPriorityCopy: false,
    chain: 'TRC20',
    setChain: vi.fn(),
    chains: ['TRC20', 'ERC20'],
    chainHintKey: 'wallet.crypto.withdraw.networkTrc20Hint',
    feeHintKey: 'wallet.crypto.withdraw.feeTrc20Hint',
    amountUsdt: '10',
    setAmountUsdt: vi.fn(),
    address: 'TExampleWithdrawAddress123',
    setAddress: vi.fn(),
    whitelistEnabled: false,
    whitelistHintVisible: false,
    estimatedNetUsdt: '9.000000',
    estimatedFeeUsdt: '1',
    amountGateKey: null,
    addressGateKey: null,
    balanceGateKey: null,
    netGateKey: null,
    whitelistGateKey: null,
    canOpenConfirm: true,
    confirmOpen: false,
    openConfirm: vi.fn(),
    closeConfirm: vi.fn(),
    submitResult: null,
    submitting: false,
    submitErrorKey: null,
    canSubmit: true,
    canAcknowledge: false,
    submitWithdraw: vi.fn(),
    acknowledgeSubmitted: vi.fn(),
    submitted: false,
    timelineSteps: [
      { id: 'request', labelKey: 'wallet.crypto.withdraw.timeline.request', state: 'done' },
      { id: 'review', labelKey: 'wallet.crypto.withdraw.timeline.review', state: 'active' },
      { id: 'approve', labelKey: 'wallet.crypto.withdraw.timeline.approve', state: 'upcoming' },
      { id: 'broadcast', labelKey: 'wallet.crypto.withdraw.timeline.broadcast', state: 'upcoming' },
      { id: 'done', labelKey: 'wallet.crypto.withdraw.timeline.done', state: 'upcoming' },
    ],
    tierLimits: {
      currentTier: 'gold',
      currentTierLabelKey: 'earn.tier.gold',
      currentLimitLabelKey: 'tier.guide.rows.gold.withdraw',
      nextTier: 'platinum',
      nextTierLabelKey: 'earn.tier.platinum',
      nextLimitLabelKey: 'tier.guide.rows.platinum.withdraw',
    },
    ...overrides,
  };
}

function renderPage(engine: CryptoWithdrawControllerView) {
  useCryptoWithdrawControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <CryptoWithdrawPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useCryptoWithdrawControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('CryptoWithdrawPage', () => {
  it('renders USDT single-rail form with network selector and preview net card', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('crypto-withdraw-page')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-withdraw-network')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-withdraw-preview-net-card')).toBeInTheDocument();
    expect(screen.queryByTestId('crypto-withdraw-usdt-route')).not.toBeInTheDocument();
  });

  it('shows §31.3 tier limits on withdraw form', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('wallet-withdraw-tier-limits')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-withdraw-tier-limits-current')).toHaveTextContent(
      /2,000,000/,
    );
    expect(screen.getByTestId('wallet-withdraw-tier-limits-next')).toHaveTextContent(/10,000,000/);
  });

  it('shows high-tier priority copy only when enabled', () => {
    renderPage(makeEngine({ showPriorityCopy: true }));

    expect(screen.getByTestId('crypto-withdraw-priority-copy')).toBeInTheDocument();
  });

  it('opens confirm dialog and shows expected net before acknowledge', () => {
    renderPage(
      makeEngine({
        confirmOpen: true,
        submitResult: {
          ok: true,
          withdrawal_id: 'wd-1',
          amount_usdt: '10.000000',
          chain: 'TRC20',
          address: 'TExampleWithdrawAddress123',
          estimated_net_usdt: '9.000000',
        },
        canAcknowledge: true,
      }),
    );

    const dialog = screen.getByTestId('crypto-withdraw-confirm-dialog');
    expect(within(dialog).getByTestId('crypto-withdraw-confirm-expected-net')).toBeInTheDocument();
    expect(within(dialog).getByText('9')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-withdraw-acknowledge')).toBeEnabled();
  });

  it('disables acknowledge when estimated net is missing (§30.3)', () => {
    renderPage(
      makeEngine({
        confirmOpen: true,
        submitResult: {
          ok: true,
          withdrawal_id: 'wd-1',
          amount_usdt: '10.000000',
          chain: 'TRC20',
          address: 'TExampleWithdrawAddress123',
          estimated_net_usdt: '0',
        },
        canAcknowledge: false,
      }),
    );

    expect(screen.getByTestId('crypto-withdraw-acknowledge')).toBeDisabled();
  });

  it('renders success timeline with expected net after submission', () => {
    renderPage(
      makeEngine({
        submitted: true,
        submitResult: {
          ok: true,
          withdrawal_id: 'wd-1',
          amount_usdt: '10.000000',
          chain: 'TRC20',
          address: 'TExampleWithdrawAddress123',
          estimated_net_usdt: '9.000000',
        },
      }),
    );

    expect(screen.getByTestId('crypto-withdraw-success')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-withdraw-expected-net-card')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-withdraw-timeline')).toBeInTheDocument();
  });

  it('calls openConfirm when submit is clicked', () => {
    const openConfirm = vi.fn();
    renderPage(makeEngine({ openConfirm }));

    fireEvent.click(screen.getByTestId('crypto-withdraw-submit'));
    expect(openConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows KYC lock when withdrawal is not ready', () => {
    renderPage(
      makeEngine({
        withdrawalReady: false,
        canOpenConfirm: false,
      }),
    );

    expect(screen.getByTestId('crypto-withdraw-kyc-lock')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-withdraw-submit')).toBeDisabled();
  });
});
