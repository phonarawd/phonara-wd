import {
  NOTIFICATIONS_CONSENT_RPC,
  PUSH_CONSENT_DOC_TYPE,
  PUSH_CONSENT_DOC_VERSION,
} from '@/domain/notifications-pwa-display-contract';
import { env } from '@/lib/env';
import { callRpc } from '@/lib/rpc';
import { supabase } from '@/lib/supabase';

export type WebPushEnableResult =
  | { ok: true; permission: NotificationPermission }
  | { ok: false; reason: 'unsupported' | 'denied' | 'error' };

function consentLocale(): 'ko' | 'en' {
  if (typeof window === 'undefined') return 'ko';
  const stored = window.localStorage.getItem('phonara.locale');
  return stored === 'en' ? 'en' : 'ko';
}

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

async function persistPushSubscription(
  userId: string,
  subscription: PushSubscription,
): Promise<void> {
  const keys = subscriptionKeys(subscription);
  if (!keys) return;

  const { error } = await supabase.from('push_subscriptions').upsert(
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

async function recordPushConsent(accepted: boolean): Promise<void> {
  await callRpc(NOTIFICATIONS_CONSENT_RPC, {
    p_doc_type: PUSH_CONSENT_DOC_TYPE,
    p_doc_version: PUSH_CONSENT_DOC_VERSION,
    p_accepted: accepted,
    p_ip_address: undefined,
    p_user_agent: globalThis.navigator?.userAgent,
    p_locale: consentLocale(),
  });
}

/** Browser permission + optional VAPID push_subscriptions row + consent audit. */
export async function enableWebPushSubscription(userId: string): Promise<WebPushEnableResult> {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'unsupported' };
  }
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, reason: 'unsupported' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    await recordPushConsent(false).catch(() => undefined);
    return { ok: false, reason: permission === 'denied' ? 'denied' : 'error' };
  }

  try {
    await recordPushConsent(true);

    const vapidPublicKey = env.VITE_VAPID_PUBLIC_KEY;
    if (vapidPublicKey) {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      await persistPushSubscription(userId, subscription);
    }

    return { ok: true, permission: 'granted' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export function resolveWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}
