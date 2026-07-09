import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettingsReferralControllerView } from '@/features/settings/use-settings-referral-controller';
import { I18nProvider } from '@/product/i18n';
import { ReferralSettingsPage } from '@/product/surfaces/settings/referral-settings-page';

const useSettingsReferralControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/settings/use-settings-referral-controller', () => ({
  useSettingsReferralController: useSettingsReferralControllerMock,
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
  overrides: Partial<SettingsReferralControllerView> = {},
): SettingsReferralControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    referralCode: 'phon_user',
    inviteRoute: '/referral/invite',
    copyReferralCode: vi.fn(),
    ...overrides,
  };
}

describe('ReferralSettingsPage', () => {
  beforeEach(() => {
    useSettingsReferralControllerMock.mockReset();
  });

  it('renders referral code, back link, and invite link CTA only (no Web Share)', () => {
    useSettingsReferralControllerMock.mockReturnValue(makeEngine());

    render(
      <I18nProvider>
        <ReferralSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-referral-page')).toBeInTheDocument();
    expect(screen.getByTestId('settings-referral-back')).toHaveAttribute('href', '/settings');
    expect(screen.getByTestId('settings-referral-code')).toHaveTextContent('phon_user');
    expect(screen.getByTestId('settings-referral-invite-link')).toHaveAttribute(
      'href',
      '/referral/invite',
    );
    expect(screen.queryByTestId('settings-referral-share')).not.toBeInTheDocument();
    expect(screen.queryByText('referral.share.card.share')).not.toBeInTheDocument();
  });

  it('calls copyReferralCode when copy button is clicked', () => {
    const copyReferralCode = vi.fn();
    useSettingsReferralControllerMock.mockReturnValue(makeEngine({ copyReferralCode }));

    render(
      <I18nProvider>
        <ReferralSettingsPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('settings-referral-copy'));
    expect(copyReferralCode).toHaveBeenCalledTimes(1);
  });

  it('shows loading shell while engine is loading', () => {
    useSettingsReferralControllerMock.mockReturnValue(makeEngine({ loading: true }));

    render(
      <I18nProvider>
        <ReferralSettingsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('settings-referral-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-referral-page')).not.toBeInTheDocument();
  });
});
