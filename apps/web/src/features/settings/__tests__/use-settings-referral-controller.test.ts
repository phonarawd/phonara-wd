import { act, createElement, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettingsReferralController } from '@/features/settings/use-settings-referral-controller';

const navigateMock = vi.fn();
const productToastShow = vi.hoisted(() => vi.fn());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    session: { user: { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' } },
    loading: false,
  }),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShow },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { username: 'phon_user' }, error: null }),
        })),
      })),
    })),
  },
}));

describe('useSettingsReferralController', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    productToastShow.mockReset();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('loads referral code from profile username and exposes invite route only', async () => {
    const { result } = renderHook(() => useSettingsReferralController(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.referralCode).toBe('phon_user');
    expect(result.current.inviteRoute).toBe('/referral/invite');
    expect(result.current.error).toBeNull();
  });

  it('copies referral code to clipboard', async () => {
    const { result } = renderHook(() => useSettingsReferralController(), { wrapper });

    await waitFor(() => {
      expect(result.current.referralCode).toBe('phon_user');
    });

    await act(async () => {
      await result.current.copyReferralCode();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('phon_user');
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'referral.toast.codeCopied',
    });
  });
});
