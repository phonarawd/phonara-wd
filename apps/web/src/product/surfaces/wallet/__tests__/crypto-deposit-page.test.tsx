import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CryptoDepositControllerView } from '@/features/wallet/use-crypto-deposit-controller';
import { I18nProvider } from '@/product/i18n';
import { CryptoDepositPage } from '@/product/surfaces/wallet/crypto-deposit-page';

const useCryptoDepositControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/wallet/use-crypto-deposit-controller', () => ({
  useCryptoDepositController: useCryptoDepositControllerMock,
}));

function makeEngine(
  overrides: Partial<CryptoDepositControllerView> = {},
): CryptoDepositControllerView {
  return {
    loading: false,
    depositBlocked: false,
    chain: 'TRC20',
    setChain: vi.fn(),
    chains: ['TRC20', 'ERC20'],
    chainHintKey: 'wallet.crypto.deposit.networkTrc20Hint',
    amountUsdt: '100',
    setAmountUsdt: vi.fn(),
    address: 'TExampleDepositAddress123',
    addressLoading: false,
    addressErrorKey: null,
    refreshAddress: vi.fn(),
    amountGateKey: null,
    canOpenConfirm: true,
    confirmOpen: false,
    openConfirm: vi.fn(),
    closeConfirm: vi.fn(),
    submitResult: null,
    submitting: false,
    submitErrorKey: null,
    canSubmit: true,
    canAcknowledge: false,
    submitDeposit: vi.fn(),
    acknowledgeSubmitted: vi.fn(),
    submitted: false,
    timelineSteps: [
      { id: 'request', labelKey: 'wallet.crypto.deposit.timeline.request', state: 'done' },
      {
        id: 'confirm',
        labelKey: 'wallet.crypto.deposit.timeline.confirm',
        state: 'active',
        detailKey: 'wallet.crypto.deposit.confirmations',
        detailParams: { seen: '0', required: '1' },
      },
      { id: 'credit', labelKey: 'wallet.crypto.deposit.timeline.credit', state: 'upcoming' },
    ],
    copyAddress: vi.fn(),
    copyState: 'idle',
    ...overrides,
  };
}

function renderPage(engine: CryptoDepositControllerView) {
  useCryptoDepositControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <CryptoDepositPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useCryptoDepositControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('CryptoDepositPage', () => {
  it('renders USDT single-rail form with network selector and deposit address', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('crypto-deposit-page')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-deposit-no-limit')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-deposit-network')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-deposit-address')).toHaveTextContent(
      'TExampleDepositAddress123',
    );
    expect(screen.queryByTestId('crypto-deposit-usdt-route')).not.toBeInTheDocument();
  });

  it('does not expose a duplicate /usdt route link on the page', () => {
    renderPage(makeEngine());

    expect(screen.queryByRole('link', { name: /\/usdt/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /usdt 입금/i })).not.toBeInTheDocument();
  });

  it('opens confirm dialog and shows RPC result before acknowledge', () => {
    renderPage(
      makeEngine({
        confirmOpen: true,
        submitResult: {
          ok: true,
          deposit_id: 'dep-1',
          address: 'TExampleDepositAddress123',
          asset: 'USDT',
          chain: 'TRC20',
          amount: '100',
          confirmations_required: 1,
          sla_hours: 24,
        },
        canAcknowledge: true,
      }),
    );

    const dialog = screen.getByTestId('crypto-deposit-confirm-dialog');
    expect(within(dialog).getByTestId('crypto-deposit-confirm-address')).toHaveTextContent(
      'TExampleDepositAddress123',
    );
    expect(screen.getByTestId('crypto-deposit-acknowledge')).toBeEnabled();
  });

  it('shows success timeline after submission', () => {
    renderPage(
      makeEngine({
        submitted: true,
        submitResult: {
          ok: true,
          deposit_id: 'dep-1',
          address: 'TExampleDepositAddress123',
          asset: 'USDT',
          chain: 'TRC20',
          amount: '100',
          confirmations_required: 1,
          sla_hours: 24,
        },
      }),
    );

    expect(screen.getByTestId('crypto-deposit-success')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-deposit-success-address')).toHaveTextContent(
      'TExampleDepositAddress123',
    );
    expect(screen.getByTestId('crypto-deposit-timeline')).toBeInTheDocument();
  });

  it('disables submit when address is not ready', () => {
    renderPage(
      makeEngine({
        address: null,
        canOpenConfirm: false,
      }),
    );

    expect(screen.getByTestId('crypto-deposit-submit')).toBeDisabled();
  });

  it('calls openConfirm when submit is clicked', () => {
    const openConfirm = vi.fn();
    renderPage(makeEngine({ openConfirm }));

    fireEvent.click(screen.getByTestId('crypto-deposit-submit'));
    expect(openConfirm).toHaveBeenCalledTimes(1);
  });
});
