import axe from 'axe-core';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountHubControllerView } from '@/features/account/use-account-hub-controller';
import type { AccountProfileControllerView } from '@/features/account/use-account-profile-controller';
import type { EarnHomePageControllerView } from '@/features/earn/use-earn-home-page-controller';
import type { NotificationsPageControllerView } from '@/features/notifications/use-notifications-page-controller';
import type { SettingsHubControllerView } from '@/features/settings/use-settings-hub-controller';
import type { SettingsNotificationsControllerView } from '@/features/settings/use-settings-notifications-controller';
import type { SettingsPreferencesControllerView } from '@/features/settings/use-settings-preferences-controller';
import { P8_CORE_VISUAL_VIEWPORT_WIDTHS } from '@/domain/p8-core-visual-signoff-display-contract';
import { I18nProvider } from '@/product/i18n';
import { AccountHubPage } from '@/product/surfaces/account/account-hub-page';
import { AccountProfilePage } from '@/product/surfaces/account/account-profile-page';
import { EarnHomePage } from '@/product/surfaces/home/earn-home-page';
import { NotificationsPage } from '@/product/surfaces/notifications/notifications-page';
import { NotificationsSettingsPage } from '@/product/surfaces/settings/notifications-settings-page';
import { PreferencesSettingsPage } from '@/product/surfaces/settings/preferences-settings-page';
import { SettingsHubPage } from '@/product/surfaces/settings/settings-hub-page';

const useEarnHomePageControllerMock = vi.hoisted(() => vi.fn());
const useEarnFiatHintMock = vi.hoisted(() => vi.fn());
const useNotificationsPageControllerMock = vi.hoisted(() => vi.fn());
const useSettingsHubControllerMock = vi.hoisted(() => vi.fn());
const useSettingsNotificationsControllerMock = vi.hoisted(() => vi.fn());
const useSettingsPreferencesControllerMock = vi.hoisted(() => vi.fn());
const useAccountHubControllerMock = vi.hoisted(() => vi.fn());
const useAccountProfileControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-earn-home-page-controller', () => ({
  useEarnHomePageController: useEarnHomePageControllerMock,
}));
vi.mock('@/features/earn/use-earn-fiat-hint', () => ({
  useEarnFiatHint: useEarnFiatHintMock,
}));
vi.mock('@/features/notifications/use-notifications-page-controller', () => ({
  useNotificationsPageController: useNotificationsPageControllerMock,
}));
vi.mock('@/features/settings/use-settings-hub-controller', () => ({
  useSettingsHubController: useSettingsHubControllerMock,
}));
vi.mock('@/features/settings/use-settings-notifications-controller', () => ({
  useSettingsNotificationsController: useSettingsNotificationsControllerMock,
}));
vi.mock('@/features/settings/use-settings-preferences-controller', () => ({
  useSettingsPreferencesController: useSettingsPreferencesControllerMock,
}));
vi.mock('@/features/account/use-account-hub-controller', () => ({
  useAccountHubController: useAccountHubControllerMock,
}));
vi.mock('@/features/account/use-account-profile-controller', () => ({
  useAccountProfileController: useAccountProfileControllerMock,
}));

vi.mock('@/product/surfaces/landing/live-activity-ticker', () => ({
  LiveActivityTicker: () => <div data-testid="landing-activity-ticker-mock" />,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      search?: Record<string, unknown>;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function makeEarnHomeEngine(
  overrides: Partial<EarnHomePageControllerView> = {},
): EarnHomePageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    tierProgress: {
      tier: 'silver',
      xp: 12000,
      nextTier: 'gold',
      nextTierXp: 25000,
      progressPercent: 35,
      atMaxTier: false,
    },
    catalogRewardsLabel: '+12,500P',
    wallet: { phonBalanceLabel: '+2,500P' },
    season: { id: 1, percent: 62, daysLeft: 9 },
    launchSlots: { filled: 12, total: 1000 },
    cooldown: { active: false, reasonKey: null },
    missionsInProgress: 2,
    attendanceRewardLabel: '+1,000P',
    rouletteRemaining: 2,
    rouletteMax: 2,
    goldenEarthRemaining: 5,
    nextAction: {
      kind: 'attendance',
      titleKey: 'earn.home.todayOpportunity.attendance',
      bodyKey: 'earn.attendance.head.desc',
      ctaKey: 'earn.attendance.cta',
      route: '/home/attendance',
    },
    missionPreviews: [
      {
        id: 'daily-quiz',
        titleKey: 'mission.daily.quiz',
        rewardLabel: '+200P',
        progressLabel: '0 / 1',
        state: 'in_progress',
        route: '/home/missions',
      },
    ],
    entryCards: [
      {
        id: 'missions',
        titleKey: 'earn.home.entry.missions.title',
        bodyKey: 'earn.home.entry.missions.body',
        ctaKey: 'earn.home.entry.missions.cta',
        route: '/home/missions',
      },
      {
        id: 'events',
        titleKey: 'earn.home.entry.events.title',
        bodyKey: 'earn.home.entry.events.body',
        ctaKey: 'earn.home.entry.events.cta',
        route: '/home/attendance',
      },
      {
        id: 'wallet',
        titleKey: 'earn.home.entry.wallet.title',
        bodyKey: 'earn.home.entry.wallet.body',
        ctaKey: 'earn.home.entry.wallet.cta',
        route: '/wallet',
      },
      {
        id: 'bet',
        titleKey: 'earn.home.entry.bet.title',
        bodyKey: 'earn.home.entry.bet.body',
        ctaKey: 'earn.home.entry.bet.cta',
        route: '/sports',
      },
    ],
    useAmbientTicker: true,
    ...overrides,
  };
}

function makeNotificationsEngine(
  overrides: Partial<NotificationsPageControllerView> = {},
): NotificationsPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    errorKey: null,
    activeTab: 'all',
    tabs: ['all', 'mission', 'price', 'reward'],
    items: [],
    visibleItems: [
      {
        id: 'outbox:1',
        source: 'outbox',
        kind: 'deposit_credited',
        tab: 'reward',
        tone: 'success',
        titleKey: 'notif.deposit.credited.title',
        bodyKey: 'notif.deposit.credited.body',
        bodyValues: { amount: '100', currency: 'PHON' },
        createdAt: '2026-07-05T10:00:00.000Z',
        nextAction: { route: '/wallet', labelKey: 'notifications.next.wallet' },
        prefKey: 'deposit',
      },
    ],
    unreadCount: 1,
    readIds: new Set<string>(),
    settingsRoute: '/settings/notifications',
    permission: 'default',
    permissionBusy: false,
    permissionError: null,
    webPushSupported: true,
    setActiveTab: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    enablePush: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
    ...overrides,
  };
}

function makeSettingsHubEngine(
  overrides: Partial<SettingsHubControllerView> = {},
): SettingsHubControllerView {
  return {
    t: (key: string) => key,
    navByGroup: {
      account: [
        {
          id: 'security',
          route: '/settings/security',
          labelKey: 'account.menu.security',
          group: 'account',
        },
      ],
      alerts: [
        {
          id: 'notifications-prefs',
          route: '/settings/notifications',
          labelKey: 'settings.hub.link.notificationsDetail',
          group: 'alerts',
        },
        {
          id: 'notifications-inbox',
          route: '/notifications',
          labelKey: 'settings.hub.link.inbox',
          group: 'alerts',
        },
      ],
      display: [
        {
          id: 'preferences',
          route: '/settings/preferences',
          labelKey: 'settings.hub.link.preferences',
          group: 'display',
        },
      ],
    },
    notificationPrefs: {
      deposit: true,
      mission: true,
      priceAlert: true,
      referral: true,
      marketing: false,
    },
    casinoConfirm: false,
    tradeOneClick: false,
    tradeConfirm: true,
    setNotificationPref: vi.fn(),
    setCasinoConfirm: vi.fn(),
    setTradeOneClick: vi.fn(),
    setTradeConfirm: vi.fn(),
    ...overrides,
  };
}

function makeSettingsNotificationsEngine(
  overrides: Partial<SettingsNotificationsControllerView> = {},
): SettingsNotificationsControllerView {
  return {
    t: (key: string) => key,
    prefsByGroup: {
      money: ['deposit', 'priceAlert'],
      growth: ['mission', 'referral', 'tierUpgrade'],
      marketing: ['marketing'],
    },
    notificationPrefs: {
      deposit: true,
      priceAlert: true,
      mission: true,
      referral: true,
      tierUpgrade: true,
      tierDecayWarning: true,
      marketing: false,
    },
    isPartialEnginePref: (key) => key === 'mission' || key === 'referral' || key === 'tierUpgrade',
    setNotificationPref: vi.fn(),
    ...overrides,
  };
}

function makeSettingsPreferencesEngine(
  overrides: Partial<SettingsPreferencesControllerView> = {},
): SettingsPreferencesControllerView {
  return {
    t: (key: string) => key,
    displayLocale: 'ko',
    theme: 'dark',
    fiatHintEnabled: true,
    setDisplayLocale: vi.fn(),
    setTheme: vi.fn(),
    setFiatHintEnabled: vi.fn(),
    ...overrides,
  };
}

function makeAccountHubEngine(
  overrides: Partial<AccountHubControllerView> = {},
): AccountHubControllerView {
  return {
    t: (key: string) => key,
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

function makeAccountProfileEngine(
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

async function expectAxeCriticalZero(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  useEarnHomePageControllerMock.mockReturnValue(makeEarnHomeEngine());
  useEarnFiatHintMock.mockReturnValue({
    targetFiat: 'OFF',
    hintFor: () => ({
      displayOnly: true,
      disabled: true,
      formattedHint: '',
      targetFiat: 'OFF',
      asOf: '',
      stale: false,
      sourceCurrency: 'PHON',
    }),
    showDisclaimer: false,
  });
  useNotificationsPageControllerMock.mockReturnValue(makeNotificationsEngine());
  useSettingsHubControllerMock.mockReturnValue(makeSettingsHubEngine());
  useSettingsNotificationsControllerMock.mockReturnValue(makeSettingsNotificationsEngine());
  useSettingsPreferencesControllerMock.mockReturnValue(makeSettingsPreferencesEngine());
  useAccountHubControllerMock.mockReturnValue(makeAccountHubEngine());
  useAccountProfileControllerMock.mockReturnValue(makeAccountProfileEngine());
});

describe('p8-core visual sign-off §20.12 · §22.2 Earn+Home', () => {
  it.each(P8_CORE_VISUAL_VIEWPORT_WIDTHS)(
    'renders EarnHomePage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <EarnHomePage />
        </I18nProvider>,
      );

      expect(screen.getByTestId('earn-home-page')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-next-action')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-mission-grid')).toBeInTheDocument();
      expect(screen.getByTestId('earn-home-entry-grid')).toBeInTheDocument();
    },
  );

  it('EarnHomePage has axe critical 0 and §25.12.8 structural checklist', async () => {
    const { container } = render(
      <I18nProvider>
        <EarnHomePage />
      </I18nProvider>,
    );

    await expectAxeCriticalZero(container);

    const nextAction = screen.getByTestId('earn-home-next-action');
    expect(nextAction.className).toContain('border-accent');
    expect(screen.getByTestId('earn-home-tier-card')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-activity-ticker')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-mission-daily-quiz')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-entry-missions')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-entry-bet')).toBeInTheDocument();
    expect(screen.getByTestId('earn-home-catalog-sum')).toHaveClass('tabular-nums');
  });

  it('EarnHomePage dead controls wire navigation targets (dead control 0)', () => {
    render(
      <I18nProvider>
        <EarnHomePage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('earn-home-next-action-cta')).toHaveAttribute(
      'href',
      '/home/attendance',
    );
    expect(screen.getByTestId('earn-home-entry-cta-missions')).toHaveAttribute(
      'href',
      '/home/missions',
    );
    expect(screen.getByTestId('earn-home-entry-cta-wallet')).toHaveAttribute('href', '/wallet');
    expect(screen.getByTestId('earn-home-tier-link')).toHaveAttribute('href', '/tier/me');
  });
});

describe('p8-core visual sign-off · notifications · settings · account', () => {
  it.each(P8_CORE_VISUAL_VIEWPORT_WIDTHS)(
    'renders NotificationsPage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <NotificationsPage />
        </I18nProvider>,
      );

      expect(screen.getByTestId('notifications-page')).toBeInTheDocument();
      expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
    },
  );

  it('NotificationsPage has axe critical 0 and prefs handoff route', async () => {
    const enablePush = vi.fn().mockResolvedValue(undefined);
    useNotificationsPageControllerMock.mockReturnValue(makeNotificationsEngine({ enablePush }));

    const { container } = render(
      <I18nProvider>
        <NotificationsPage />
      </I18nProvider>,
    );

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('notifications-settings-link')).toHaveAttribute(
      'href',
      '/settings/notifications',
    );

    fireEvent.click(screen.getByTestId('notifications-enable-push'));
    expect(enablePush).toHaveBeenCalledTimes(1);
  });

  it.each(P8_CORE_VISUAL_VIEWPORT_WIDTHS)(
    'renders SettingsHubPage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <SettingsHubPage />
        </I18nProvider>,
      );

      expect(screen.getByTestId('settings-hub-page')).toBeInTheDocument();
      expect(screen.getByTestId('settings-hub-group-alerts')).toBeInTheDocument();
    },
  );

  it('SettingsHubPage has axe critical 0 and dead controls wire nav (dead control 0)', async () => {
    const setNotificationPref = vi.fn();
    useSettingsHubControllerMock.mockReturnValue(makeSettingsHubEngine({ setNotificationPref }));

    const { container } = render(
      <I18nProvider>
        <SettingsHubPage />
      </I18nProvider>,
    );

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('settings-hub-back')).toHaveAttribute('href', '/account');
    expect(screen.getByTestId('settings-hub-link-security')).toHaveAttribute(
      'href',
      '/settings/security',
    );
    expect(screen.getByTestId('settings-hub-link-notifications-prefs')).toHaveAttribute(
      'href',
      '/settings/notifications',
    );
    expect(screen.getByTestId('settings-hub-link-notifications-inbox')).toHaveAttribute(
      'href',
      '/notifications',
    );

    const depositToggle = screen.getByTestId('settings-hub-toggle-deposit');
    fireEvent.click(within(depositToggle).getByRole('switch'));
    expect(setNotificationPref).toHaveBeenCalled();
  });

  it.each(P8_CORE_VISUAL_VIEWPORT_WIDTHS)(
    'renders AccountHubPage at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <AccountHubPage />
        </I18nProvider>,
      );

      expect(screen.getByTestId('account-hub-page')).toBeInTheDocument();
      expect(screen.getByTestId('account-hub-tier-badge')).toBeInTheDocument();
    },
  );

  it('AccountHubPage has axe critical 0 and dead controls wire handlers', async () => {
    const handleLogout = vi.fn();
    useAccountHubControllerMock.mockReturnValue(makeAccountHubEngine({ handleLogout }));

    const { container } = render(
      <I18nProvider>
        <AccountHubPage />
      </I18nProvider>,
    );

    await expectAxeCriticalZero(container);

    expect(screen.getByTestId('account-hub-link-profile')).toHaveAttribute(
      'href',
      '/account/profile',
    );
    fireEvent.click(screen.getByTestId('account-hub-logout'));
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('settings sub-pages and account profile mount at mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });

    const { unmount: unmountNotif } = render(
      <I18nProvider>
        <NotificationsSettingsPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('settings-notifications-page')).toBeInTheDocument();
    unmountNotif();

    const { unmount: unmountPrefs } = render(
      <I18nProvider>
        <PreferencesSettingsPage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('settings-preferences-page')).toBeInTheDocument();
    unmountPrefs();

    render(
      <I18nProvider>
        <AccountProfilePage />
      </I18nProvider>,
    );
    expect(screen.getByTestId('account-profile-page')).toBeInTheDocument();
    expect(screen.getByTestId('account-profile-back')).toHaveAttribute('href', '/account');
  });

  it('AccountProfilePage has axe critical 0 and save wires handler', async () => {
    const handleSubmit = vi.fn();
    useAccountProfileControllerMock.mockReturnValue(makeAccountProfileEngine({ handleSubmit }));

    const { container } = render(
      <I18nProvider>
        <AccountProfilePage />
      </I18nProvider>,
    );

    await expectAxeCriticalZero(container);

    fireEvent.click(screen.getByTestId('account-profile-save'));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
