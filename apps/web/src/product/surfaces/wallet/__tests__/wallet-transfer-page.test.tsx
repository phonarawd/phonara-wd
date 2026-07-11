import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { WalletTransferControllerView } from '@/features/wallet/use-wallet-transfer-controller';
import { I18nProvider } from '@/product/i18n';
import { WalletTransferPage } from '@/product/surfaces/wallet/wallet-transfer-page';

const useWalletTransferControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/wallet/use-wallet-transfer-controller', () => ({
  useWalletTransferController: useWalletTransferControllerMock,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
    'data-testid'?: string;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

function makeEngine(
  overrides: Partial<WalletTransferControllerView> = {},
): WalletTransferControllerView {
  return {
    t: (key: string) => key,
    route: '/wallet/transfer',
    hubExposure: 'live',
    canSubmit: true,
    recipient: 'alice',
    setRecipient: vi.fn(),
    amount: '10.000000',
    setAmount: vi.fn(),
    memo: '',
    setMemo: vi.fn(),
    confirmOpen: false,
    openConfirm: vi.fn(),
    closeConfirm: vi.fn(),
    submitting: false,
    submitErrorKey: null,
    submitResult: null,
    submitTransfer: vi.fn(),
    acknowledgeResult: vi.fn(),
    history: [],
    historyLoading: false,
    refreshHistory: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: WalletTransferControllerView = makeEngine()) {
  useWalletTransferControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <WalletTransferPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useWalletTransferControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('WalletTransferPage', () => {
  it('renders transfer form and empty history', () => {
    renderPage();
    expect(screen.getByTestId('wallet-transfer-page')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-transfer-back')).toHaveAttribute('href', '/wallet');
    expect(screen.getByTestId('wallet-transfer-form-card')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-transfer-submit')).not.toBeDisabled();
    expect(screen.getByTestId('wallet-transfer-history')).toBeInTheDocument();
  });

  it('shows success card after submit', () => {
    renderPage(
      makeEngine({
        submitResult: {
          ok: true,
          transfer_id: 't1',
          amount: '10.000000',
          fee_amount: '0.000000',
          net_amount: '10.000000',
          recipient_id: 'u2',
        },
      }),
    );
    expect(screen.getByTestId('wallet-transfer-success')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-transfer-ack')).toBeInTheDocument();
  });
});
