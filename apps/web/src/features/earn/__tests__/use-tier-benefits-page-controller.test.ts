import { createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTierBenefitsPageController } from '@/features/earn/use-tier-benefits-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  navigateMock.mockReset();
  useAuthMock.mockReturnValue({
    session: { user: { id: 'user-1' } },
    loading: false,
  });

  rpcMock.mockImplementation((name: string) => {
    if (name === 'rpc_get_earn_hub_status') {
      return Promise.resolve({
        data: {
          tier: 'platinum',
          xp: 120000,
          next_tier_xp: 500000,
        },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
});

describe('useTierBenefitsPageController', () => {
  it('loads unified benefit rows and visible columns for current tier', async () => {
    const { result } = renderHook(() => useTierBenefitsPageController(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.currentTier).toBe('platinum');
    expect(result.current.tierSnapshot).toEqual(
      expect.objectContaining({ tier: 'platinum', xp: 120000 }),
    );
    expect(result.current.narrativeSteps).toHaveLength(3);
    expect(result.current.benefitRows).toHaveLength(5);
    expect(result.current.benefitRows.find((row) => row.current)?.tier).toBe('platinum');
    expect(result.current.visibleColumns).toHaveLength(5);
    expect(result.current.decayPolicies).toHaveLength(5);
  });

  it('redirects guests to login', async () => {
    useAuthMock.mockReturnValue({ session: null, loading: false });
    renderHook(() => useTierBenefitsPageController(), { wrapper });
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith({ to: '/login', replace: true }));
  });
});
