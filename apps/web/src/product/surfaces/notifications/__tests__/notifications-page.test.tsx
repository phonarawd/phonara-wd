import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NotificationsPageControllerView } from '@/features/notifications/use-notifications-page-controller';
import { I18nProvider } from '@/product/i18n';
import { NotificationsPage } from '@/product/surfaces/notifications/notifications-page';

const useNotificationsPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/notifications/use-notifications-page-controller', () => ({
  useNotificationsPageController: useNotificationsPageControllerMock,
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
  overrides: Partial<NotificationsPageControllerView> = {},
): NotificationsPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    errorKey: null,
    activeTab: 'all',
    tabs: ['all', 'mission', 'price', 'reward'],
    items: [
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

describe('NotificationsPage', () => {
  beforeEach(() => {
    useNotificationsPageControllerMock.mockReset();
  });

  it('renders inbox hub with settings handoff and unread badge', () => {
    useNotificationsPageControllerMock.mockReturnValue(makeEngine());

    render(
      <I18nProvider>
        <NotificationsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('notifications-page')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-unread-badge')).toHaveTextContent('1');
    expect(screen.getByTestId('notifications-settings-link')).toHaveAttribute(
      'href',
      '/settings/notifications',
    );
    expect(screen.getByTestId('notifications-item-outbox:1')).toBeInTheDocument();
  });

  it('calls enablePush from the Web Push card', () => {
    const enablePush = vi.fn().mockResolvedValue(undefined);
    useNotificationsPageControllerMock.mockReturnValue(makeEngine({ enablePush }));

    render(
      <I18nProvider>
        <NotificationsPage />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('notifications-enable-push'));
    expect(enablePush).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no visible items', () => {
    useNotificationsPageControllerMock.mockReturnValue(
      makeEngine({ items: [], visibleItems: [], unreadCount: 0 }),
    );

    render(
      <I18nProvider>
        <NotificationsPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('notifications-empty')).toBeInTheDocument();
  });
});
