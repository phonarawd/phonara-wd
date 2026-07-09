import { useCallback, useMemo, useState } from 'react';
import type { MessageKey } from '@phonara/i18n';

import type { NotificationLocalPrefKey } from '@/domain/notifications-pwa-display-contract';
import {
  readCasinoConfirmPref,
  readSettingsHubNotificationPref,
  resolveNotificationPrefToastKey,
  resolveSettingsHubNavItems,
  SETTINGS_HUB_NOTIFICATION_PREF_KEYS,
  type SettingsHubNavGroup,
  type SettingsHubNavItem,
  writeCasinoConfirmPref,
  writeSettingsHubNotificationPref,
} from '@/domain/settings-hub-display-contract';
import {
  readTradeConfirmPref,
  readTradeOneClickPref,
  writeTradeConfirmPref,
  writeTradeOneClickPref,
} from '@/domain/trade-settings-prefs-display-contract';
import { useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

export type SettingsHubControllerView = {
  t: ReturnType<typeof useT>;
  navByGroup: Readonly<Record<SettingsHubNavGroup, SettingsHubNavItem[]>>;
  notificationPrefs: Readonly<Record<NotificationLocalPrefKey, boolean>>;
  casinoConfirm: boolean;
  tradeOneClick: boolean;
  tradeConfirm: boolean;
  setNotificationPref: (key: NotificationLocalPrefKey, enabled: boolean) => void;
  setCasinoConfirm: (enabled: boolean) => void;
  setTradeOneClick: (enabled: boolean) => void;
  setTradeConfirm: (enabled: boolean) => void;
};

export function useSettingsHubController(): SettingsHubControllerView {
  const t = useT();

  const [notificationPrefs, setNotificationPrefs] = useState<
    Record<NotificationLocalPrefKey, boolean>
  >(
    () =>
      Object.fromEntries(
        SETTINGS_HUB_NOTIFICATION_PREF_KEYS.map((key) => [
          key,
          readSettingsHubNotificationPref(key),
        ]),
      ) as Record<NotificationLocalPrefKey, boolean>,
  );

  const [casinoConfirm, setCasinoConfirmState] = useState(() => readCasinoConfirmPref());
  const [tradeOneClick, setTradeOneClickState] = useState(() => readTradeOneClickPref());
  const [tradeConfirm, setTradeConfirmState] = useState(() => readTradeConfirmPref());

  const navByGroup = useMemo(() => {
    const groups: Record<SettingsHubNavGroup, SettingsHubNavItem[]> = {
      account: [],
      alerts: [],
      display: [],
    };
    for (const item of resolveSettingsHubNavItems()) {
      groups[item.group].push(item);
    }
    return groups;
  }, []);

  const setNotificationPref = useCallback((key: NotificationLocalPrefKey, enabled: boolean) => {
    writeSettingsHubNotificationPref(key, enabled);
    setNotificationPrefs((prev) => ({ ...prev, [key]: enabled }));
    productToast.show({
      zone: 'warm',
      key: resolveNotificationPrefToastKey(key, enabled),
    });
  }, []);

  const setCasinoConfirm = useCallback((enabled: boolean) => {
    writeCasinoConfirmPref(enabled);
    setCasinoConfirmState(enabled);
    const key: MessageKey = enabled
      ? 'settings.casino.toast.confirmOn'
      : 'settings.casino.toast.confirmOff';
    productToast.show({ zone: 'warm', key });
  }, []);

  const setTradeOneClick = useCallback((enabled: boolean) => {
    writeTradeOneClickPref(enabled);
    setTradeOneClickState(enabled);
    if (enabled) {
      writeTradeConfirmPref(false);
      setTradeConfirmState(false);
    }
    const key: MessageKey = enabled
      ? 'settings.trade.toast.oneClickOn'
      : 'settings.trade.toast.oneClickOff';
    productToast.show({ zone: 'warm', key });
  }, []);

  const setTradeConfirm = useCallback((enabled: boolean) => {
    writeTradeConfirmPref(enabled);
    setTradeConfirmState(enabled);
    if (enabled) {
      writeTradeOneClickPref(false);
      setTradeOneClickState(false);
    }
    const key: MessageKey = enabled
      ? 'settings.trade.toast.confirmOn'
      : 'settings.trade.toast.confirmOff';
    productToast.show({ zone: 'warm', key });
  }, []);

  return {
    t,
    navByGroup,
    notificationPrefs,
    casinoConfirm,
    tradeOneClick,
    tradeConfirm,
    setNotificationPref,
    setCasinoConfirm,
    setTradeOneClick,
    setTradeConfirm,
  };
}
