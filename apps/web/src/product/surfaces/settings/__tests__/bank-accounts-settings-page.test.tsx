import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettingsBankAccountsControllerView } from '@/features/settings/use-settings-bank-accounts-controller';
import { I18nProvider } from '@/product/i18n';
import { BankAccountsSettingsPage } from '@/product/surfaces/settings/bank-accounts-settings-page';

const useSettingsBankAccountsControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/settings/use-settings-bank-accounts-controller', () => ({
  useSettingsBankAccountsController: useSettingsBankAccountsControllerMock,
}));

function makeEngine(
  overrides: Partial<SettingsBankAccountsControllerView> = {},
): SettingsBankAccountsControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    errorKey: null,
    bankAccounts: [],
    whitelistEnabled: false,
    accountInput: '',
    setAccountInput: vi.fn(),
    labelInput: '',
    setLabelInput: vi.fn(),
    accountGateKey: null,
    addBusy: false,
    removeBusyId: null,
    addFormOpen: false,
    openAddForm: vi.fn(),
    closeAddForm: vi.fn(),
    refresh: vi.fn(),
    handleAddBankAccount: vi.fn(),
    handleRemoveBankAccount: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: SettingsBankAccountsControllerView) {
  useSettingsBankAccountsControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <BankAccountsSettingsPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useSettingsBankAccountsControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('BankAccountsSettingsPage', () => {
  it('renders page header and back link to account', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('settings-bank-accounts-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '출금 계좌' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '계정으로' })).toHaveAttribute('href', '/account');
  });

  it('shows empty state and add action', () => {
    const openAddForm = vi.fn();
    renderPage(makeEngine({ openAddForm }));

    expect(screen.getByTestId('settings-bank-accounts-empty')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('settings-bank-accounts-add-open'));
    expect(openAddForm).toHaveBeenCalled();
  });

  it('lists bank accounts with remove actions', () => {
    const handleRemoveBankAccount = vi.fn();
    renderPage(
      makeEngine({
        bankAccounts: [
          {
            id: 'acct-1',
            account: '110123456789',
            displayAccount: '•••• 6789',
            label: '국민은행',
            cooldownActive: false,
            cooldownUntilDisplay: null,
          },
        ],
        handleRemoveBankAccount,
      }),
    );

    const list = screen.getByTestId('settings-bank-accounts-list');
    expect(within(list).getByText('•••• 6789')).toBeInTheDocument();
    expect(within(list).getByText('국민은행')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('settings-bank-accounts-remove-acct-1'));
    expect(handleRemoveBankAccount).toHaveBeenCalledWith('acct-1');
  });

  it('shows cooldown badge when account is in security hold', () => {
    renderPage(
      makeEngine({
        bankAccounts: [
          {
            id: 'acct-2',
            account: '110987654321',
            displayAccount: '•••• 4321',
            label: null,
            cooldownActive: true,
            cooldownUntilDisplay: '7월 5일 오후 02:00',
          },
        ],
      }),
    );

    expect(screen.getByTestId('settings-bank-accounts-cooldown-acct-2')).toBeInTheDocument();
  });

  it('renders add form with submit', async () => {
    const handleAddBankAccount = vi.fn();
    renderPage(
      makeEngine({
        addFormOpen: true,
        accountInput: '110123456789',
        handleAddBankAccount,
      }),
    );

    expect(screen.getByTestId('settings-bank-accounts-add-form')).toBeInTheDocument();
    fireEvent.submit(screen.getByTestId('settings-bank-accounts-add-form'));
    await waitFor(() => {
      expect(handleAddBankAccount).toHaveBeenCalled();
    });
  });

  it('shows whitelist hint when enabled', () => {
    renderPage(makeEngine({ whitelistEnabled: true }));

    expect(screen.getByTestId('settings-bank-accounts-whitelist-hint')).toBeInTheDocument();
  });

  it('shows error state with retry', () => {
    const refresh = vi.fn();
    renderPage(makeEngine({ errorKey: 'common.error.generic', refresh }));

    expect(screen.getByTestId('settings-bank-accounts-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(refresh).toHaveBeenCalled();
  });

  it('shows loading shell', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('settings-bank-accounts-loading')).toBeInTheDocument();
  });
});
