import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountProfileControllerView } from '@/features/account/use-account-profile-controller';
import { I18nProvider } from '@/product/i18n';
import { AccountProfilePage } from '@/product/surfaces/account/account-profile-page';

const useAccountProfileControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/account/use-account-profile-controller', () => ({
  useAccountProfileController: useAccountProfileControllerMock,
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

function makeEngine(
  overrides: Partial<AccountProfileControllerView> = {},
): AccountProfileControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    email: 'user@example.com',
    displayLabel: 'phon_user',
    tierProgress: {
      tier: 'gold',
      xp: 12000,
      nextTier: 'platinum',
      nextTierXp: 100000,
      progressPercent: 12,
      atMaxTier: false,
    },
    tierColorVar: '--ds-tier-gold',
    username: 'phon_user',
    setUsername: vi.fn(),
    displayName: 'Operator',
    setDisplayName: vi.fn(),
    usernameGateKey: null,
    displayNameGateKey: null,
    submitBusy: false,
    profileComplete: true,
    refresh: vi.fn(),
    handleSubmit: vi.fn(),
    ...overrides,
  };
}

describe('AccountProfilePage', () => {
  beforeEach(() => {
    useAccountProfileControllerMock.mockReset();
  });

  it('renders profile form, tier badge, and back link', () => {
    useAccountProfileControllerMock.mockReturnValue(makeEngine());

    render(
      <I18nProvider>
        <AccountProfilePage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('account-profile-page')).toBeInTheDocument();
    expect(screen.getByTestId('account-profile-back')).toHaveAttribute('href', '/account');
    expect(screen.getByTestId('account-profile-tier-badge')).toHaveTextContent('earn.tier.gold');
    expect(screen.getByTestId('account-profile-email')).toHaveValue('user@example.com');
    expect(screen.getByTestId('account-profile-username')).toHaveValue('phon_user');
    expect(screen.getByTestId('account-profile-display-name')).toHaveValue('Operator');
  });

  it('shows incomplete hint when username is not set', () => {
    useAccountProfileControllerMock.mockReturnValue(
      makeEngine({ profileComplete: false, displayLabel: '', username: '' }),
    );

    render(
      <I18nProvider>
        <AccountProfilePage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('account-profile-incomplete-hint')).toBeInTheDocument();
  });

  it('submits profile form through controller handler', () => {
    const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });
    useAccountProfileControllerMock.mockReturnValue(makeEngine({ handleSubmit }));

    render(
      <I18nProvider>
        <AccountProfilePage />
      </I18nProvider>,
    );

    fireEvent.submit(screen.getByTestId('account-profile-form'));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows loading shell while engine is loading', () => {
    useAccountProfileControllerMock.mockReturnValue(makeEngine({ loading: true }));

    render(
      <I18nProvider>
        <AccountProfilePage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('account-profile-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('account-profile-page')).not.toBeInTheDocument();
  });
});
