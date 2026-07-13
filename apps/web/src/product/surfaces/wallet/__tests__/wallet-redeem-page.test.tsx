import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletRedeemControllerView } from '@/features/wallet/use-wallet-redeem-controller';
import { I18nProvider } from '@/product/i18n';
import { WalletRedeemPage } from '@/product/surfaces/wallet/wallet-redeem-page';

const useWalletRedeemControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/wallet/use-wallet-redeem-controller', () => ({
  useWalletRedeemController: useWalletRedeemControllerMock,
}));

function makeEngine(
  overrides: Partial<WalletRedeemControllerView> = {},
): WalletRedeemControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    errorKey: null,
    phonAvailableDisplay: '100.000000',
    withdrawalBlocked: false,
    withdrawalReady: true,
    depositBlocked: false,
    rails: [
      {
        id: 'krw',
        kind: 'withdraw',
        href: '/wallet/withdraw/krw',
        titleKey: 'wallet.redeem.rail.krw',
        descriptionKey: 'wallet.redeem.rail.krw.desc',
        metaKey: 'wallet.redeem.rail.krw.meta',
        ctaKey: 'wallet.redeem.rail.cta.withdraw',
        live: true,
        disabled: false,
      },
      {
        id: 'crypto',
        kind: 'withdraw',
        href: '/wallet/withdraw/crypto',
        titleKey: 'wallet.redeem.rail.crypto',
        descriptionKey: 'wallet.redeem.rail.crypto.desc',
        metaKey: 'wallet.redeem.rail.crypto.meta',
        ctaKey: 'wallet.redeem.rail.cta.withdraw',
        live: true,
        disabled: false,
      },
      {
        id: 'giftcard',
        kind: 'deposit',
        href: '/wallet/deposit/giftcard',
        titleKey: 'wallet.redeem.rail.giftcard',
        descriptionKey: 'wallet.redeem.rail.giftcard.desc',
        metaKey: 'wallet.redeem.rail.giftcard.meta',
        ctaKey: 'wallet.redeem.rail.cta.deposit',
        live: true,
        disabled: false,
      },
      {
        id: 'giftcard_out',
        kind: 'redeem',
        href: '/wallet/redeem/giftcard',
        titleKey: 'wallet.redeem.rail.giftcardOut',
        descriptionKey: 'wallet.redeem.rail.giftcardOut.desc',
        metaKey: 'wallet.redeem.rail.giftcardOut.meta',
        ctaKey: 'wallet.redeem.rail.cta.redeem',
        live: true,
        disabled: false,
      },
    ],
    ...overrides,
  };
}

function renderPage(engine: WalletRedeemControllerView = makeEngine()) {
  useWalletRedeemControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <WalletRedeemPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useWalletRedeemControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('WalletRedeemPage', () => {
  it('renders payment method cards including giftcard reverse rail', () => {
    renderPage();

    expect(screen.getByTestId('wallet-redeem-page')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-redeem-rail-krw')).toHaveAttribute(
      'href',
      '/wallet/withdraw/krw',
    );
    expect(screen.getByTestId('wallet-redeem-rail-crypto')).toHaveAttribute(
      'href',
      '/wallet/withdraw/crypto',
    );
    expect(screen.getByTestId('wallet-redeem-rail-giftcard')).toHaveAttribute(
      'href',
      '/wallet/deposit/giftcard',
    );
    expect(screen.getByTestId('wallet-redeem-rail-giftcard_out')).toHaveAttribute(
      'href',
      '/wallet/redeem/giftcard',
    );
    expect(screen.getByTestId('wallet-redeem-balance')).toBeInTheDocument();
  });

  it('hides crypto and giftcard rails when controller fail-closes them (H-03 · H-11)', () => {
    renderPage(
      makeEngine({
        rails: [
          {
            id: 'krw',
            kind: 'withdraw',
            href: '/wallet/withdraw/krw',
            titleKey: 'wallet.redeem.rail.krw',
            descriptionKey: 'wallet.redeem.rail.krw.desc',
            metaKey: 'wallet.redeem.rail.krw.meta',
            ctaKey: 'wallet.redeem.rail.cta.withdraw',
            live: true,
            disabled: false,
          },
        ],
      }),
    );

    expect(screen.getByTestId('wallet-redeem-rail-krw')).toBeInTheDocument();
    expect(screen.queryByTestId('wallet-redeem-rail-crypto')).not.toBeInTheDocument();
    expect(screen.queryByTestId('wallet-redeem-rail-giftcard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('wallet-redeem-rail-giftcard_out')).not.toBeInTheDocument();
  });

  it('disables withdraw rails and shows KYC lock when withdrawal is not ready', () => {
    renderPage(
      makeEngine({
        withdrawalReady: false,
        rails: makeEngine().rails.map((rail) =>
          rail.kind === 'withdraw' ? { ...rail, disabled: true } : rail,
        ),
      }),
    );

    expect(screen.getByTestId('wallet-redeem-kyc-lock')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-redeem-rail-krw')).not.toHaveAttribute('href');
    expect(screen.getByTestId('wallet-redeem-rail-giftcard')).toHaveAttribute(
      'href',
      '/wallet/deposit/giftcard',
    );
  });

  it('shows deposit paused banner when deposit is blocked', () => {
    renderPage(
      makeEngine({
        depositBlocked: true,
        rails: makeEngine().rails.map((rail) =>
          rail.kind === 'deposit' ? { ...rail, disabled: true } : rail,
        ),
      }),
    );

    expect(screen.getByTestId('wallet-redeem-deposit-paused')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-redeem-rail-giftcard')).not.toHaveAttribute('href');
  });

  it('shows loading shell while controller is loading', () => {
    renderPage(makeEngine({ loading: true }));
    expect(screen.getByTestId('wallet-redeem-loading')).toBeInTheDocument();
  });
});
