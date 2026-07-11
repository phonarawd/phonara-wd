import axe from 'axe-core';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  P4_MONEY_DEAD_CONTROL_TEST_IDS,
  P4_MONEY_VISUAL_VIEWPORT_WIDTHS,
} from '@/domain/p4-money-visual-signoff-display-contract';
import type { DepositHubControllerView } from '@/features/wallet/use-deposit-hub-controller';
import type { KrwDepositControllerView } from '@/features/wallet/use-krw-deposit-controller';
import type { LedgerPageControllerView } from '@/features/wallet/use-ledger-page-controller';
import type { WalletPageControllerView } from '@/features/wallet/use-wallet-page-controller';
import type { WithdrawHubControllerView } from '@/features/wallet/use-withdraw-hub-controller';
import type { RewardsHistoryControllerView } from '@/features/earn/use-rewards-history-controller';
import { I18nProvider } from '@/product/i18n';
import { RewardsHistoryPage } from '@/product/surfaces/rewards/rewards-history-page';
import { DepositHubPage } from '@/product/surfaces/wallet/deposit-hub-page';
import { KrwDepositPage } from '@/product/surfaces/wallet/krw-deposit-page';
import { LedgerPage } from '@/product/surfaces/wallet/ledger-page';
import { WalletPage } from '@/product/surfaces/wallet/wallet-page';
import { WithdrawHubPage } from '@/product/surfaces/wallet/withdraw-hub-page';

const useWalletPageControllerMock = vi.hoisted(() => vi.fn());
const useWalletFiatHintMock = vi.hoisted(() => vi.fn());
const useDepositHubControllerMock = vi.hoisted(() => vi.fn());
const useWithdrawHubControllerMock = vi.hoisted(() => vi.fn());
const useLedgerPageControllerMock = vi.hoisted(() => vi.fn());
const useKrwDepositControllerMock = vi.hoisted(() => vi.fn());
const useRewardsHistoryControllerMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const useSearchMock = vi.hoisted(() => vi.fn(() => ({})));

vi.mock('@/features/wallet/use-wallet-page-controller', () => ({
  useWalletPageController: useWalletPageControllerMock,
}));
vi.mock('@/features/wallet/use-wallet-fiat-hint', () => ({
  useWalletFiatHint: useWalletFiatHintMock,
}));
vi.mock('@/features/wallet/use-deposit-hub-controller', () => ({
  useDepositHubController: useDepositHubControllerMock,
}));
vi.mock('@/features/wallet/use-withdraw-hub-controller', () => ({
  useWithdrawHubController: useWithdrawHubControllerMock,
}));
vi.mock('@/features/wallet/use-ledger-page-controller', () => ({
  useLedgerPageController: useLedgerPageControllerMock,
}));
vi.mock('@/features/wallet/use-krw-deposit-controller', () => ({
  useKrwDepositController: useKrwDepositControllerMock,
}));
vi.mock('@/features/earn/use-rewards-history-controller', () => ({
  useRewardsHistoryController: useRewardsHistoryControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: () => useSearchMock(),
    Link: ({
      children,
      to,
      ...rest
    }: {
      children: ReactNode;
      to: string;
      className?: string;
      'data-testid'?: string;
    }) => createElement('a', { href: to, ...rest }, children),
  };
});

function fiatHintOff() {
  return {
    targetFiat: 'OFF' as const,
    hintFor: () => ({
      displayOnly: true as const,
      disabled: true,
      formattedHint: '',
      targetFiat: 'OFF' as const,
      asOf: '',
      stale: false,
      sourceCurrency: 'PHON' as const,
    }),
    showDisclaimer: false,
  };
}

function makeWalletEngine(
  overrides: Partial<WalletPageControllerView> = {},
): WalletPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    errorKey: null,
    wallet: null,
    phonAvailableDisplay: '12345.000000',
    phonLockedDisplay: '0',
    phonRealAvailableDisplay: '10000.000000',
    phonBonusAvailableDisplay: '2345.000000',
    usdtAvailableDisplay: '500.000000',
    usdtLockedDisplay: '0',
    recentActivity: [],
    activityLoading: false,
    complianceLoading: false,
    withdrawalReady: true,
    kycStatusKey: 'wallet.kyc.verified',
    depositBlocked: false,
    withdrawalBlocked: false,
    refresh: vi.fn(),
    ...overrides,
  };
}

function makeDepositHub(
  overrides: Partial<DepositHubControllerView> = {},
): DepositHubControllerView {
  return {
    loading: false,
    depositBlocked: false,
    rails: [
      {
        id: 'krw',
        href: '/wallet/deposit/krw',
        titleKey: 'wallet.deposit.rail.krw',
        descriptionKey: 'wallet.deposit.rail.krw.desc',
        metaKey: 'wallet.deposit.krw.sla',
      },
      {
        id: 'crypto',
        href: '/wallet/deposit/crypto',
        titleKey: 'wallet.deposit.rail.crypto',
        descriptionKey: 'wallet.deposit.rail.crypto.desc',
        metaKey: 'wallet.deposit.crypto.min',
      },
      {
        id: 'giftcard',
        href: '/wallet/deposit/giftcard',
        titleKey: 'wallet.deposit.rail.giftcard',
        descriptionKey: 'wallet.deposit.rail.giftcard.desc',
        metaKey: 'wallet.deposit.giftcard.eta',
      },
    ],
    historyRows: [],
    historyLoading: false,
    ...overrides,
  };
}

function makeWithdrawHub(
  overrides: Partial<WithdrawHubControllerView> = {},
): WithdrawHubControllerView {
  return {
    loading: false,
    withdrawalBlocked: false,
    withdrawalReady: true,
    railsDisabled: false,
    rails: [
      {
        id: 'krw',
        href: '/wallet/withdraw/krw',
        titleKey: 'wallet.withdraw.rail.krw',
        descriptionKey: 'wallet.withdraw.rail.krw.desc',
        metaKey: 'wallet.withdraw.rail.krw.meta',
      },
      {
        id: 'crypto',
        href: '/wallet/withdraw/crypto',
        titleKey: 'wallet.withdraw.rail.crypto',
        descriptionKey: 'wallet.withdraw.rail.crypto.desc',
        metaKey: 'wallet.withdraw.rail.crypto.meta',
      },
    ],
    historyRows: [],
    historyLoading: false,
    ...overrides,
  };
}

function makeLedger(overrides: Partial<LedgerPageControllerView> = {}): LedgerPageControllerView {
  return {
    loading: false,
    errorKey: null,
    rows: [],
    filteredCount: 0,
    page: 1,
    totalPages: 1,
    empty: false,
    filterEmpty: false,
    refresh: vi.fn(),
    ...overrides,
  };
}

function makeRewards(
  overrides: Partial<RewardsHistoryControllerView> = {},
): RewardsHistoryControllerView {
  return {
    loading: false,
    errorKey: null,
    rows: [],
    filteredCount: 0,
    page: 1,
    totalPages: 1,
    empty: false,
    filterEmpty: false,
    refresh: vi.fn(),
    ...overrides,
  };
}

function makeKrwDeposit(
  overrides: Partial<KrwDepositControllerView> = {},
): KrwDepositControllerView {
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
    ...overrides,
  };
}

function wrap(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

async function expectAxeCriticalZero(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
}

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
  useWalletPageControllerMock.mockReset();
  useWalletFiatHintMock.mockReset();
  useDepositHubControllerMock.mockReset();
  useWithdrawHubControllerMock.mockReset();
  useLedgerPageControllerMock.mockReset();
  useKrwDepositControllerMock.mockReset();
  useRewardsHistoryControllerMock.mockReset();
  navigateMock.mockReset();
  useSearchMock.mockReturnValue({});

  useWalletPageControllerMock.mockReturnValue(makeWalletEngine());
  useWalletFiatHintMock.mockReturnValue(fiatHintOff());
  useDepositHubControllerMock.mockReturnValue(makeDepositHub());
  useWithdrawHubControllerMock.mockReturnValue(makeWithdrawHub());
  useLedgerPageControllerMock.mockReturnValue(makeLedger());
  useKrwDepositControllerMock.mockReturnValue(makeKrwDeposit());
  useRewardsHistoryControllerMock.mockReturnValue(makeRewards());
});

describe('p4-money visual sign-off §20.12 · §22.2 Wallet · §25.12.6', () => {
  it.each(P4_MONEY_VISUAL_VIEWPORT_WIDTHS)(
    'renders WalletPage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      wrap(<WalletPage />);

      expect(screen.getByTestId('wallet-page')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-balance-hero')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-cta-row')).toBeInTheDocument();
    },
  );

  it.each(P4_MONEY_VISUAL_VIEWPORT_WIDTHS)(
    'renders DepositHubPage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      wrap(<DepositHubPage />);

      expect(screen.getByTestId('deposit-hub-page')).toBeInTheDocument();
      expect(screen.getByTestId('deposit-rail-grid')).toBeInTheDocument();
    },
  );

  it('WalletPage has axe critical 0 · hero · Toss CTA row', async () => {
    const { container } = wrap(<WalletPage />);

    await expectAxeCriticalZero(container);

    const hero = screen.getByTestId('wallet-balance-hero');
    expect(hero).toHaveAttribute('data-card-variant', 'wallet-hero');
    expect(within(hero).getByText('12,345')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-cta-deposit')).toHaveAttribute('href', '/wallet/deposit');
    expect(screen.getByTestId('wallet-cta-withdraw')).toHaveAttribute('href', '/wallet/withdraw');
    expect(screen.getByTestId('wallet-cta-ledger')).toHaveAttribute('href', '/ledger');
  });

  it('DepositHubPage has axe critical 0 · 3-rail §4', async () => {
    const { container } = wrap(<DepositHubPage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('deposit-rail-krw')).toHaveAttribute('href', '/wallet/deposit/krw');
    expect(screen.getByTestId('deposit-rail-crypto')).toHaveAttribute(
      'href',
      '/wallet/deposit/crypto',
    );
    expect(screen.getByTestId('deposit-rail-giftcard')).toHaveAttribute(
      'href',
      '/wallet/deposit/giftcard',
    );
  });

  it('WithdrawHubPage has axe critical 0 · KRW+crypto rails', async () => {
    const { container } = wrap(<WithdrawHubPage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('withdraw-hub-page')).toBeInTheDocument();
    expect(screen.getByTestId('withdraw-rail-krw')).toHaveAttribute(
      'href',
      '/wallet/withdraw/krw',
    );
    expect(screen.getByTestId('withdraw-rail-crypto')).toHaveAttribute(
      'href',
      '/wallet/withdraw/crypto',
    );
  });

  it('KrwDepositPage has axe critical 0 · §30.3 auto-convert disclosure', async () => {
    const { container } = wrap(<KrwDepositPage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('krw-deposit-auto-convert')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-rate-card')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-no-limit')).toBeInTheDocument();
    expect(screen.getByTestId('krw-deposit-submit')).toBeInTheDocument();
  });

  it('LedgerPage has axe critical 0 and filters', async () => {
    const { container } = wrap(<LedgerPage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('ledger-page')).toBeInTheDocument();
    expect(screen.getByTestId('ledger-filters')).toBeInTheDocument();
  });

  it('RewardsHistoryPage has axe critical 0 · ledger reward link', async () => {
    const { container } = wrap(<RewardsHistoryPage />);

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('rewards-history-page')).toBeInTheDocument();
    expect(screen.getByTestId('rewards-history-ledger-link')).toHaveAttribute(
      'href',
      '/ledger?filter=reward',
    );
  });

  it('declares all dead-control test ids present on primary surfaces', () => {
    wrap(
      <>
        <WalletPage />
        <DepositHubPage />
        <WithdrawHubPage />
        <KrwDepositPage />
        <RewardsHistoryPage />
      </>,
    );

    for (const testId of P4_MONEY_DEAD_CONTROL_TEST_IDS) {
      expect(screen.getByTestId(testId), `missing dead-control id: ${testId}`).toBeInTheDocument();
    }
  });
});
