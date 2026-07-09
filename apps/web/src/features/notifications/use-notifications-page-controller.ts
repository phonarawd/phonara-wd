import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import {
  countUnreadInboxItems,
  filterInboxItemsByTab,
  NOTIFICATION_INBOX_TABS,
  NOTIFICATIONS_PREFS_ROUTE,
  type NotificationInboxItem,
  type NotificationInboxTab,
} from '@/domain/notifications-center-display-contract';
import { useAuth } from '@/contexts/auth-context';
import { useT } from '@/product/i18n';
import {
  markAllNotificationInboxRead,
  markNotificationInboxRead,
  readNotificationInboxReadIds,
} from '@/features/notifications/notifications-read-state';
import {
  fetchNotificationOutboxRows,
  mergeNotificationInboxItems,
  NOTIFICATIONS_INBOX_QUERY_KEY,
} from '@/features/notifications/notifications-inbox-read';
import {
  enableWebPushSubscription,
  resolveWebPushSupported,
} from '@/features/notifications/web-push-subscription';
import { useNotificationStore, type BrowserNotificationPermission } from '@/stores/notifications';

export type NotificationsPageControllerView = {
  t: ReturnType<typeof useT>;
  loading: boolean;
  errorKey: MessageKey | null;
  activeTab: NotificationInboxTab;
  tabs: readonly NotificationInboxTab[];
  items: NotificationInboxItem[];
  visibleItems: NotificationInboxItem[];
  unreadCount: number;
  readIds: Set<string>;
  settingsRoute: typeof NOTIFICATIONS_PREFS_ROUTE;
  permission: BrowserNotificationPermission;
  permissionBusy: boolean;
  permissionError: MessageKey | null;
  webPushSupported: boolean;
  setActiveTab: (tab: NotificationInboxTab) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  enablePush: () => Promise<void>;
  refresh: () => void;
};

export function useNotificationsPageController(): NotificationsPageControllerView {
  const t = useT();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const localNotifications = useNotificationStore((state) => state.notifications);
  const permission = useNotificationStore((state) => state.permission);
  const permissionBusy = useNotificationStore((state) => state.permissionBusy);
  const permissionError = useNotificationStore((state) => state.permissionError);
  const setPermission = useNotificationStore((state) => state.setPermission);
  const setPermissionBusy = useNotificationStore((state) => state.setPermissionBusy);
  const setPermissionError = useNotificationStore((state) => state.setPermissionError);

  const [activeTab, setActiveTab] = useState<NotificationInboxTab>('all');
  const [readIds, setReadIds] = useState<Set<string>>(() => readNotificationInboxReadIds());

  const {
    data: outboxRows = [],
    isLoading: outboxLoading,
    error: outboxError,
  } = useQuery({
    queryKey: [NOTIFICATIONS_INBOX_QUERY_KEY, userId],
    queryFn: () => fetchNotificationOutboxRows(userId!),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const items = useMemo(
    () => mergeNotificationInboxItems(outboxRows, localNotifications),
    [localNotifications, outboxRows],
  );

  const visibleItems = useMemo(() => filterInboxItemsByTab(items, activeTab), [activeTab, items]);

  const unreadCount = useMemo(() => countUnreadInboxItems(items, readIds), [items, readIds]);

  const markRead = useCallback((id: string) => {
    setReadIds(markNotificationInboxRead(id));
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(markAllNotificationInboxRead(items.map((item) => item.id)));
  }, [items]);

  const enablePush = useCallback(async () => {
    if (!userId) return;
    setPermissionBusy(true);
    setPermissionError(null);
    try {
      const result = await enableWebPushSubscription(userId);
      if (result.ok) {
        setPermission(result.permission);
        return;
      }
      if (result.reason === 'unsupported') {
        setPermission('unsupported');
        setPermissionError('notif.permission.unsupported');
        return;
      }
      if (result.reason === 'denied') {
        setPermission('denied');
        setPermissionError('notif.permission.deniedTitle');
        return;
      }
      setPermissionError('notif.permission.errorTitle');
    } finally {
      setPermissionBusy(false);
    }
  }, [setPermission, setPermissionBusy, setPermissionError, userId]);

  const refresh = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_INBOX_QUERY_KEY, userId] });
  }, [queryClient, userId]);

  const loading = authLoading || outboxLoading;
  const errorKey: MessageKey | null = outboxError ? 'common.retry' : null;

  return {
    t,
    loading,
    errorKey,
    activeTab,
    tabs: NOTIFICATION_INBOX_TABS,
    items,
    visibleItems,
    unreadCount,
    readIds,
    settingsRoute: NOTIFICATIONS_PREFS_ROUTE,
    permission,
    permissionBusy,
    permissionError,
    webPushSupported: resolveWebPushSupported(),
    setActiveTab,
    markRead,
    markAllRead,
    enablePush,
    refresh,
  };
}
