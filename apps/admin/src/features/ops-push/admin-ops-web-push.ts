import {
  ADMIN_OPS_PUSH_SUBSCRIPTIONS_TABLE,
  ADMIN_OPS_PUSH_SW_PATH,
  type AdminOpsPushStatus,
} from '@/domain/admin-ops-push-display-contract';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export type AdminOpsPushEnableResult =
  | { ok: true; status: 'on' }
  | { ok: false; status: Exclude<AdminOpsPushStatus, 'on' | 'loading'> };

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength);
}

function subscriptionKeys(subscription: PushSubscription): { p256dh: string; auth: string } | null {
  const json = subscription.toJSON();
  if (!json.keys?.['p256dh'] || !json.keys?.['auth']) return null;
  return { p256dh: json.keys['p256dh'], auth: json.keys['auth'] };
}

export function resolveAdminOpsPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export async function ensureAdminOpsPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!resolveAdminOpsPushSupported()) return null;
  const existing = await navigator.serviceWorker.getRegistration(ADMIN_OPS_PUSH_SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(ADMIN_OPS_PUSH_SW_PATH, { scope: '/' });
}

async function persistAdminPushSubscription(
  userId: string,
  subscription: PushSubscription,
): Promise<void> {
  const keys = subscriptionKeys(subscription);
  if (!keys) throw new Error('push_subscription_keys_missing');

  const { error } = await supabase.from(ADMIN_OPS_PUSH_SUBSCRIPTIONS_TABLE).upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      ua: globalThis.navigator?.userAgent ?? null,
    },
    { onConflict: 'user_id,endpoint' },
  );
  if (error) throw error;
}

async function removeAdminPushSubscription(
  userId: string,
  subscription: PushSubscription | null,
): Promise<void> {
  if (!subscription) return;
  const { error } = await supabase
    .from(ADMIN_OPS_PUSH_SUBSCRIPTIONS_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', subscription.endpoint);
  if (error) throw error;
}

export async function resolveAdminOpsPushStatus(
  userId: string | null,
): Promise<AdminOpsPushStatus> {
  if (!resolveAdminOpsPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (!userId) return 'off';

  try {
    const registration = await ensureAdminOpsPushServiceWorker();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription && Notification.permission === 'granted') return 'on';
    return 'off';
  } catch {
    return 'error';
  }
}

export async function enableAdminOpsPush(userId: string): Promise<AdminOpsPushEnableResult> {
  if (!resolveAdminOpsPushSupported()) {
    return { ok: false, status: 'unsupported' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission === 'denied') return { ok: false, status: 'denied' };
  if (permission !== 'granted') return { ok: false, status: 'error' };

  try {
    const registration = await ensureAdminOpsPushServiceWorker();
    if (!registration) return { ok: false, status: 'unsupported' };

    const vapidPublicKey = env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      // Permission granted — still useful for local Notification; subscription needs VAPID.
      return { ok: false, status: 'error' };
    }

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }));

    await persistAdminPushSubscription(userId, subscription);
    return { ok: true, status: 'on' };
  } catch {
    return { ok: false, status: 'error' };
  }
}

export type AdminOpsPushDisableResult =
  | { ok: true; status: 'off' }
  | { ok: false; status: Exclude<AdminOpsPushStatus, 'on' | 'off' | 'loading'> };

export async function disableAdminOpsPush(userId: string): Promise<AdminOpsPushDisableResult> {
  if (!resolveAdminOpsPushSupported()) {
    return { ok: false, status: 'unsupported' };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(ADMIN_OPS_PUSH_SW_PATH);
    const subscription = (await registration?.pushManager.getSubscription()) ?? null;
    if (subscription) {
      await removeAdminPushSubscription(userId, subscription);
      await subscription.unsubscribe();
    }
    return { ok: true, status: 'off' };
  } catch {
    return { ok: false, status: 'error' };
  }
}
