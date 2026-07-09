import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettingsBankAccountsController } from '@/features/settings/use-settings-bank-accounts-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const refetchMock = vi.hoisted(() => vi.fn());
const registerAddressMock = vi.hoisted(() => vi.fn());
const removeAddressMock = vi.hoisted(() => vi.fn());
const productToastShowMock = vi.hoisted(() => vi.fn());

const whitelistState = vi.hoisted(() => ({
  addresses: [] as Array<{
    id: string;
    user_id: string;
    chain: string;
    address: string;
    label: string | null;
    cooldown_until: string | null;
    created_at: string;
  }>,
  whitelistEnabled: false,
  loading: false,
}));

const authState = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  loading: false,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => authState,
}));

vi.mock('@/features/wallet/use-crypto-withdraw', () => ({
  useWithdrawalWhitelist: () => ({
    addresses: whitelistState.addresses,
    whitelistEnabled: whitelistState.whitelistEnabled,
    loading: whitelistState.loading,
    refetch: refetchMock,
  }),
  useAddWithdrawalAddress: () => ({
    registerAddress: registerAddressMock,
    loading: false,
    error: null,
  }),
  useRemoveWithdrawalAddress: () => ({
    removeAddress: removeAddressMock,
    loading: false,
    error: null,
  }),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
  useI18n: () => ({ locale: 'ko' }),
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShowMock },
}));

beforeEach(() => {
  navigateMock.mockReset();
  refetchMock.mockReset();
  registerAddressMock.mockReset();
  removeAddressMock.mockReset();
  productToastShowMock.mockReset();
  authState.session = null;
  authState.loading = false;
  whitelistState.addresses = [];
  whitelistState.whitelistEnabled = false;
  whitelistState.loading = false;
  refetchMock.mockResolvedValue(undefined);
  registerAddressMock.mockResolvedValue(undefined);
  removeAddressMock.mockResolvedValue(undefined);
});

describe('useSettingsBankAccountsController', () => {
  it('redirects unauthenticated users to login', async () => {
    renderHook(() => useSettingsBankAccountsController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/login', replace: true });
    });
  });

  it('filters BANK chain entries into bankAccounts', async () => {
    authState.session = { user: { id: 'user-1' } };
    whitelistState.addresses = [
      {
        id: 'bank-1',
        user_id: 'user-1',
        chain: 'BANK',
        address: '110123456789',
        label: '국민',
        cooldown_until: null,
        created_at: '2026-07-05T00:00:00.000Z',
      },
      {
        id: 'trc-1',
        user_id: 'user-1',
        chain: 'TRC20',
        address: 'TExampleAddress',
        label: null,
        cooldown_until: null,
        created_at: '2026-07-05T00:00:00.000Z',
      },
    ];

    const { result } = renderHook(() => useSettingsBankAccountsController());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bankAccounts).toHaveLength(1);
    expect(result.current.bankAccounts[0]?.id).toBe('bank-1');
    expect(result.current.bankAccounts[0]?.displayAccount).toBe('•••• 6789');
  });

  it('registers a bank account via whitelist RPC', async () => {
    authState.session = { user: { id: 'user-1' } };

    const { result } = renderHook(() => useSettingsBankAccountsController());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setAccountInput('110-1234-56789');
      result.current.setLabelInput('국민');
    });

    await act(async () => {
      await result.current.handleAddBankAccount({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(registerAddressMock).toHaveBeenCalledWith({
      chain: 'BANK',
      address: '110123456789',
      label: '국민',
    });
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'bankAccounts.addOk',
    });
  });

  it('removes a bank account via whitelist RPC', async () => {
    authState.session = { user: { id: 'user-1' } };

    const { result } = renderHook(() => useSettingsBankAccountsController());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.handleRemoveBankAccount('bank-1');
    });

    expect(removeAddressMock).toHaveBeenCalledWith('bank-1');
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'bankAccounts.removeOk',
    });
  });
});
