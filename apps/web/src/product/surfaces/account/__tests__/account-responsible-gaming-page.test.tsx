import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountRgControllerView } from '@/features/account/use-account-rg-controller';
import { I18nProvider } from '@/product/i18n';
import { AccountResponsibleGamingPage } from '@/product/surfaces/account/account-responsible-gaming-page';

const useAccountRgControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/account/use-account-rg-controller', () => ({
  useAccountRgController: useAccountRgControllerMock,
}));

function emptyLimitView(): AccountRgControllerView['depositLimit'] {
  return {
    currentLimit: null,
    currentLimitDisplay: '—',
    monthUsage: null,
    monthUsageDisplay: null,
    pendingLimit: null,
    pendingLimitDisplay: null,
    pendingEffectiveAt: null,
    pendingEffectiveAtDisplay: null,
  };
}

function makeEngine(overrides: Partial<AccountRgControllerView> = {}): AccountRgControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    errorKey: null,
    depositLimit: emptyLimitView(),
    lossLimit: emptyLimitView(),
    selfExclusionActive: false,
    selfExclusionUntilDisplay: null,
    depositKrwInput: '',
    setDepositKrwInput: vi.fn(),
    lossGameUsdtInput: '',
    setLossGameUsdtInput: vi.fn(),
    selfExclusionDaysInput: '7',
    setSelfExclusionDaysInput: vi.fn(),
    depositKrwGateKey: null,
    lossGameUsdtGateKey: null,
    selfExclusionDaysGateKey: null,
    limitsSaveBusy: false,
    selfExclusionBusy: false,
    selfExclusionConfirmOpen: false,
    setSelfExclusionConfirmOpen: vi.fn(),
    refresh: vi.fn(),
    handleSaveLimits: vi.fn(),
    handleOpenSelfExclusionConfirm: vi.fn(),
    handleConfirmSelfExclusion: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: AccountRgControllerView) {
  useAccountRgControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <AccountResponsibleGamingPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useAccountRgControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('AccountResponsibleGamingPage', () => {
  it('renders page header and back link to account', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('account-rg-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '책임도박 설정' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '계정으로' })).toHaveAttribute('href', '/account');
  });

  it('shows current limits and disabled save when inputs empty', () => {
    renderPage(
      makeEngine({
        depositLimit: {
          ...emptyLimitView(),
          currentLimit: '100000',
          currentLimitDisplay: '₩100,000',
        },
        lossLimit: {
          ...emptyLimitView(),
          currentLimit: '50.000000',
          currentLimitDisplay: '50.000000 USDT',
          monthUsage: '10.000000',
          monthUsageDisplay: '10.000000 USDT',
        },
      }),
    );

    expect(screen.getByTestId('account-rg-limits-form')).toBeInTheDocument();
    expect(screen.getByText(/₩100,000/)).toBeInTheDocument();
    expect(screen.getByText(/10.000000 USDT/)).toBeInTheDocument();
    expect(screen.getByTestId('account-rg-limits-save')).toBeDisabled();
  });

  it('submits limits when deposit input is valid', () => {
    const handleSaveLimits = vi.fn();
    renderPage(
      makeEngine({
        depositKrwInput: '200000',
        handleSaveLimits,
      }),
    );

    fireEvent.click(screen.getByTestId('account-rg-limits-save'));
    expect(handleSaveLimits).toHaveBeenCalled();
  });

  it('shows self-exclusion active banner and policy link', () => {
    renderPage(
      makeEngine({
        selfExclusionActive: true,
        selfExclusionUntilDisplay: 'Jan 1, 2027',
      }),
    );

    expect(screen.getByTestId('account-rg-self-exclusion-active')).toBeInTheDocument();
    expect(screen.getByTestId('account-rg-policy-link')).toHaveAttribute(
      'href',
      '/legal/responsible-gaming',
    );
    expect(screen.getByTestId('account-rg-self-exclusion-start')).toBeDisabled();
  });
});
