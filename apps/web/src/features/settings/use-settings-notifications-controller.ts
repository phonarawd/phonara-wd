import { useCallback, useMemo, useState } from 'react';

import type { NotificationLocalPrefKey } from '@/domain/notifications-pwa-display-contract';
import {
  isPartialEngineNotificationPref,
  readSettingsNotificationPref,
  resolveNotificationPrefToastKey,
  resolveSettingsNotificationsGroupPrefKeys,
  resolveSettingsNotificationsPrefKeys,
  type SettingsNotificationsPrefGroup,
  writeSettingsNotificationPref,
} from '@/domain/settings-notifications-display-contract';
import { useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

const SETTINGS_NOTIFICATIONS_GROUP_ORDER: readonly SettingsNotificationsPrefGroup[] = [
  'money',
  'growth',
  'marketing',
] as const;

export type SettingsNotificationsControllerView = {
  t: ReturnType<typeof useT>;
  prefsByGroup: Readonly<Record<SettingsNotificationsPrefGroup, NotificationLocalPrefKey[]>>;
  notificationPrefs: Readonly<Record<NotificationLocalPrefKey, boolean>>;
  isPartialEnginePref: (key: NotificationLocalPrefKey) => boolean;
  setNotificationPref: (key: NotificationLocalPrefKey, enabled: boolean) => void;
};

export function useSettingsNotificationsController(): SettingsNotificationsControllerView {
  const t = useT();

  const visibleKeys = useMemo(() => resolveSettingsNotificationsPrefKeys(), []);

  const [notificationPrefs, setNotificationPrefs] = useState<
    Record<NotificationLocalPrefKey, boolean>
  >(
    () =>
      Object.fromEntries(
        visibleKeys.map((key) => [key, readSettingsNotificationPref(key)]),
      ) as Record<NotificationLocalPrefKey, boolean>,
  );

  const prefsByGroup = useMemo(() => {
    const groups: Record<SettingsNotificationsPrefGroup, NotificationLocalPrefKey[]> = {
      money: [],
      growth: [],
      marketing: [],
    };
    for (const group of SETTINGS_NOTIFICATIONS_GROUP_ORDER) {
      groups[group] = resolveSettingsNotificationsGroupPrefKeys(group);
    }
    return groups;
  }, []);

  const setNotificationPref = useCallback((key: NotificationLocalPrefKey, enabled: boolean) => {
    writeSettingsNotificationPref(key, enabled);
    setNotificationPrefs((prev) => ({ ...prev, [key]: enabled }));
    productToast.show({
      zone: 'warm',
      key: resolveNotificationPrefToastKey(key, enabled),
    });
  }, []);

  return {
    t,
    prefsByGroup,
    notificationPrefs,
    isPartialEnginePref: isPartialEngineNotificationPref,
    setNotificationPref,
  };
}
