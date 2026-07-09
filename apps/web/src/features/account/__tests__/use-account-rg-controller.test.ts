import { act, renderHook, waitFor, type FormEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountRgController } from '@/features/account/use-account-rg-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());
const refetchMock = vi.hoisted(() => vi.fn());
const setRgLimitMock = vi.hoisted(() => vi.fn());
const setSelfExclusionMock = vi.hoisted(() => vi.fn());
const productToastShowMock = vi.hoisted(() => vi.fn());
const loadRgSnapshotMock = vi.hoisted(() => vi.fn());

const snapshotState = vi.hoisted(() => ({
  data: {
    limits: [] as Array<{
      limit_kind: string;
      domain: string | null;
      currency: string;
      current_limit: string;
      pending_limit: string | null;
      pending_effective_at: string | null;
    }>,
    exclusions: [] as Array<{
      status: string;
      starts_at: string;
      excluded_until: string;
      release_cooldown_until: string | null;
    }>,
    losses: [] as Array<{ domain: string; currency: string; net_loss: string }>,
  },
  isLoading: false,
  isError: false,
}));

const authState = vi.hoisted(() => ({
  session: { user: { id: 'user-1' } } as { user: { id: string } } | null,
  loading: false,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: snapshotState.data,
    isLoading: snapshotState.isLoading,
    isError: snapshotState.isError,
    refetch: refetchMock,
  }),
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => authState,
}));

vi.mock('@/features/responsible-gaming/rg-snapshot', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/responsible-gaming/rg-snapshot')>();
  return {
    ...actual,
    loadRgSnapshot: loadRgSnapshotMock,
  };
});

vi.mock('@/domain/responsible-gaming', () => ({
  setRgLimit: setRgLimitMock,
  setSelfExclusion: setSelfExclusionMock,
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
  invalidateQueriesMock.mockReset();
  setRgLimitMock.mockReset();
  setSelfExclusionMock.mockReset();
  productToastShowMock.mockReset();
  loadRgSnapshotMock.mockReset();
  snapshotState.data = { limits: [], exclusions: [], losses: [] };
  snapshotState.isLoading = false;
  snapshotState.isError = false;
  authState.session = { user: { id: 'user-1' } };
  authState.loading = false;
});

describe('useAccountRgController', () => {
  it('redirects guests to login', async () => {
    authState.session = null;
    renderHook(() => useAccountRgController());
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/login', replace: true });
    });
  });

  it('saves deposit limit via RPC', async () => {
    setRgLimitMock.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useAccountRgController());

    act(() => {
      result.current.setDepositKrwInput('100000');
    });

    const event = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
    await act(async () => {
      await result.current.handleSaveLimits(event);
    });

    expect(setRgLimitMock).toHaveBeenCalledWith('deposit', '', 'KRW', '100000');
    expect(productToastShowMock).toHaveBeenCalledWith({ zone: 'strict', key: 'rg.saveSuccess' });
  });

  it('starts self-exclusion after confirm', async () => {
    setSelfExclusionMock.mockResolvedValue({ exclusion_id: 'ex-1' });
    const { result } = renderHook(() => useAccountRgController());

    await act(async () => {
      await result.current.handleConfirmSelfExclusion();
    });

    expect(setSelfExclusionMock).toHaveBeenCalled();
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'rg.selfExclusion.success',
    });
  });
});
