import {
  NOTIFICATION_LOCAL_PREF_KEYS,
  readNotificationLocalPref,
  writeNotificationLocalPref,
} from '../../domain/notifications-pwa-display-contract';

/** E17 local pref — deposit credited in-app/browser alerts (default on). */
export const DEPOSIT_NOTIF_PREF_KEY = NOTIFICATION_LOCAL_PREF_KEYS.deposit;

export function readDepositNotifPref(fallback = true): boolean {
  return readNotificationLocalPref('deposit', fallback);
}

export function writeDepositNotifPref(enabled: boolean): void {
  writeNotificationLocalPref('deposit', enabled);
}
