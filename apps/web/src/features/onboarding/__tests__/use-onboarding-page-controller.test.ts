import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useOnboardingPageController } from '@/features/onboarding/use-onboarding-page-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const isOnboardingCompleteMock = vi.hoisted(() => vi.fn());
const markOnboardingCompleteMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: useAuthMock,
}));

vi.mock('@/lib/onboarding-funnel', () => ({
  isOnboardingComplete: isOnboardingCompleteMock,
  markOnboardingComplete: markOnboardingCompleteMock,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

beforeEach(() => {
  navigateMock.mockReset();
  useAuthMock.mockReset();
  isOnboardingCompleteMock.mockReset();
  markOnboardingCompleteMock.mockReset();
  useAuthMock.mockReturnValue({
    session: { user: { id: 'user-1' } },
    loading: false,
  });
  isOnboardingCompleteMock.mockReturnValue(false);
});

describe('useOnboardingPageController', () => {
  it('redirects unauthenticated users to login', async () => {
    useAuthMock.mockReturnValue({ session: null, loading: false });

    renderHook(() => useOnboardingPageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/login', replace: true });
    });
  });

  it('redirects completed users to home', async () => {
    isOnboardingCompleteMock.mockReturnValue(true);

    renderHook(() => useOnboardingPageController());

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/home', replace: true });
    });
  });

  it('maps onboarding steps to platform pillar keys', () => {
    const { result } = renderHook(() => useOnboardingPageController());

    expect(result.current.steps).toEqual([
      { titleKey: 'platform.pillars.earn.title', descKey: 'platform.pillars.earn.desc' },
      { titleKey: 'platform.pillars.wallet.title', descKey: 'platform.pillars.wallet.desc' },
      { titleKey: 'platform.pillars.play.title', descKey: 'platform.pillars.play.desc' },
    ]);
  });

  it('advances steps and finishes to missions route', () => {
    const { result } = renderHook(() => useOnboardingPageController());

    expect(result.current.step).toBe(1);
    act(() => {
      result.current.goNext();
    });
    expect(result.current.step).toBe(2);
    act(() => {
      result.current.goNext();
    });
    expect(result.current.step).toBe(3);
    act(() => {
      result.current.goNext();
    });

    expect(navigateMock).toHaveBeenCalledWith({ to: '/onboarding/missions', replace: true });
  });

  it('marks onboarding complete when skipped', () => {
    const { result } = renderHook(() => useOnboardingPageController());

    result.current.skip();

    expect(markOnboardingCompleteMock).toHaveBeenCalledWith('user-1');
    expect(navigateMock).toHaveBeenCalledWith({ to: '/home', replace: true });
  });
});
