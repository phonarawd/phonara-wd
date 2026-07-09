import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountHubControllerView } from '@/features/account/use-account-hub-controller';
import { I18nProvider } from '@/product/i18n';
import { AccountHubPage } from '@/product/surfaces/account/account-hub-page';

const useAccountHubControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/account/use-account-hub-controller', () => ({
  useAccountHubController: useAccountHubControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function makeEngine(overrides: Partial<AccountHubControllerView> = {}): AccountHubControllerView {
  return {
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
    loading: false,
    error: null,
    displayLabel: 'Phon User',
    email: 'user@example.com',
    avatarInitial: 'P',
    joinedAt: '2026-01-15T00:00:00.000Z',
    tierProgress: {
      tier: 'silver',
      xp: 12000,
      nextTierXp: 25000,
      progressPercent: 28,
      nextTier: 'gold',
      atMaxTier: false,
    },
    tierColorVar: '--ds-tier-silver',
    qualifiedReferrals: 2,
    navByGroup: {
      profile: [
        {
          id: 'profile',
          route: '/account/profile',
          labelKey: 'account.menu.profile',
          group: 'profile',
        },
        {
          id: 'kyc',
          route: '/account/kyc',
          labelKey: 'account.menu.kyc',
          group: 'profile',
        },
        {
          id: 'responsible-gaming',
          route: '/account/responsible-gaming',
          labelKey: 'more.menu.responsibleGaming',
          group: 'profile',
        },
      ],
      money: [
        {
          id: 'wallet',
          route: '/wallet',
          labelKey: 'account.hub.wallet',
          group: 'money',
        },
      ],
      help: [],
    },
    notificationPrefs: {
      deposit: true,
      mission: true,
    },
    logoutBusy: false,
    deleteBusy: false,
    setNotificationPref: vi.fn(),
    handleLogout: vi.fn(),
    handleDeleteAccount: vi.fn(),
    ...overrides,
  };
}

describe('AccountHubPage', () => {
  beforeEach(() => {
    useAccountHubControllerMock.mockReset();
  });

  it('renders hub identity, profile · KYC · RG links, and danger actions', () => {
    useAccountHubControllerMock.mockReturnValue(makeEngine());

    render(
      <I18nProvider>
        <AccountHubPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('account-hub-page')).toBeInTheDocument();
    expect(screen.getByTestId('account-hub-avatar')).toHaveTextContent('P');
    expect(screen.getByTestId('account-hub-tier-badge')).toBeInTheDocument();
    expect(screen.getByTestId('account-hub-link-profile')).toHaveAttribute(
      'href',
      '/account/profile',
    );
    expect(screen.getByTestId('account-hub-link-kyc')).toHaveAttribute('href', '/account/kyc');
    expect(screen.getByTestId('account-hub-link-responsible-gaming')).toHaveAttribute(
      'href',
      '/account/responsible-gaming',
    );
    expect(screen.getByTestId('account-hub-logout')).toBeInTheDocument();
    expect(screen.getByTestId('account-hub-delete')).toBeInTheDocument();
  });

  it('calls setNotificationPref when a toggle changes', () => {
    const setNotificationPref = vi.fn();
    useAccountHubControllerMock.mockReturnValue(makeEngine({ setNotificationPref }));

    render(
      <I18nProvider>
        <AccountHubPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'settings.notifications.mission.label' }));
    expect(setNotificationPref).toHaveBeenCalledWith('mission', false);
  });

  it('shows loading shell while controller loads', () => {
    useAccountHubControllerMock.mockReturnValue(makeEngine({ loading: true }));

    render(
      <I18nProvider>
        <AccountHubPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('account-hub-loading')).toBeInTheDocument();
  });
});
