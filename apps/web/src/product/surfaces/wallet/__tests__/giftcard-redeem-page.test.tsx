import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { GiftcardRedeemControllerView } from '@/features/wallet/use-giftcard-redeem-controller';
import { I18nProvider } from '@/product/i18n';
import { GiftcardRedeemPage } from '@/product/surfaces/wallet/giftcard-redeem-page';

const useGiftcardRedeemControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/wallet/use-giftcard-redeem-controller', () => ({
  useGiftcardRedeemController: useGiftcardRedeemControllerMock,
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
  overrides: Partial<GiftcardRedeemControllerView> = {},
): GiftcardRedeemControllerView {
  return {
    t: (key: string) => key,
    route: '/wallet/redeem/giftcard',
    live: true,
    loading: false,
    withdrawalBlocked: false,
    kinds: ['culture'],
    kind: null,
    setKind: vi.fn(),
    faceValueKrw: '',
    setFaceValueKrw: vi.fn(),
    canLoadPreview: false,
    previewLoading: false,
    previewErrorKey: null,
    preview: null,
    loadPreview: vi.fn(),
    confirmOpen: false,
    openConfirm: vi.fn(),
    closeConfirm: vi.fn(),
    submitting: false,
    submitErrorKey: null,
    submitResult: null,
    submitRedeem: vi.fn(),
    acknowledge: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: GiftcardRedeemControllerView = makeEngine()) {
  useGiftcardRedeemControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <GiftcardRedeemPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useGiftcardRedeemControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('GiftcardRedeemPage', () => {
  it('renders redeem form', () => {
    renderPage();
    expect(screen.getByTestId('giftcard-redeem-page')).toBeInTheDocument();
    expect(screen.getByTestId('giftcard-redeem-back')).toHaveAttribute(
      'href',
      '/wallet/redeem',
    );
    expect(screen.getByTestId('giftcard-redeem-form-card')).toBeInTheDocument();
  });

  it('shows quote when preview is ready', () => {
    renderPage(
      makeEngine({
        kind: 'culture',
        faceValueKrw: '10000',
        canLoadPreview: true,
        preview: {
          ok: true,
          kind: 'culture',
          face_value_krw: '10000.000000',
          phon_gross: '100.000000',
          fee_phon: '5.000000',
          phon_cost: '105.000000',
          fee_rate_bps: 500,
          rate_snapshot_id: 'r1',
          fee_market_id: 'm1',
        },
      }),
    );
    expect(screen.getByTestId('giftcard-redeem-quote')).toBeInTheDocument();
    expect(screen.getByTestId('giftcard-redeem-submit')).toBeInTheDocument();
  });
});
