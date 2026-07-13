import { buildOutboundDispatchHeaders } from './outbound-dispatch-auth.ts';
import type { OpsTelegramDispatchPayload } from './ops-telegram-dispatch.ts';

export const OPS_WEB_PUSH_DEEP_LINK = '/queues' as const;
export const OPS_WEB_PUSH_EVENT_TYPE = 'ops_alert' as const;

export interface AdminPushSubscriptionRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface OpsWebPushPayload {
  title: string;
  body: string;
  url: typeof OPS_WEB_PUSH_DEEP_LINK;
  tag: string;
  event_type: typeof OPS_WEB_PUSH_EVENT_TYPE;
  subscriptions: AdminPushSubscriptionRow[];
}

export function buildOpsWebPushNotification(
  payload: OpsTelegramDispatchPayload,
  subscriptions: AdminPushSubscriptionRow[],
): OpsWebPushPayload {
  const kind = payload.notify_kind === 'digest' ? 'DIGEST' : 'ALERT';
  const severity = String(payload.severity ?? 'critical').toUpperCase();
  return {
    title: `[PHONARA ${kind}] ${severity}`,
    body: payload.summary?.trim() || 'Ops alert',
    url: OPS_WEB_PUSH_DEEP_LINK,
    tag: payload.alert_id ? `ops-alert:${payload.alert_id}` : `ops-alert:${kind.toLowerCase()}`,
    event_type: OPS_WEB_PUSH_EVENT_TYPE,
    subscriptions,
  };
}

export function buildOpsAdminQueuesClickUrl(adminPublicUrl: string | undefined): string | null {
  const base = adminPublicUrl?.trim();
  if (!base) return null;
  try {
    return new URL(OPS_WEB_PUSH_DEEP_LINK, base.endsWith('/') ? base : `${base}/`).href;
  } catch {
    return null;
  }
}

type AdminOpsPushQueryError = { message?: string } | null;

type AdminOpsPushQueryResult<T> = {
  data: T | null;
  error: AdminOpsPushQueryError;
};

type AdminOpsPushQueryBuilder<T> = {
  select: (columns: string) => AdminOpsPushQueryBuilder<T>;
  eq: (column: string, value: boolean) => PromiseLike<AdminOpsPushQueryResult<T>>;
  in: (column: string, values: string[]) => PromiseLike<AdminOpsPushQueryResult<T>>;
};

type AdminOpsPushSupabase = {
  from: (table: string) => AdminOpsPushQueryBuilder<unknown>;
};

/** Load push_subscriptions for enabled admin_role_grants (service_role). */
export async function loadAdminOpsPushSubscriptions(
  supabase: AdminOpsPushSupabase,
): Promise<{ subscriptions: AdminPushSubscriptionRow[]; error?: string }> {
  const { data: grants, error: grantErr } = await supabase
    .from('admin_role_grants')
    .select('user_id')
    .eq('enabled', true);

  if (grantErr) return { subscriptions: [], error: String(grantErr.message ?? grantErr) };

  const userIds = [
    ...new Set(
      ((grants ?? []) as { user_id?: string }[])
        .map((row) => row.user_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ];
  if (userIds.length === 0) return { subscriptions: [] };

  const { data: rows, error: subErr } = await supabase
    .from('push_subscriptions')
    .select('user_id,endpoint,p256dh,auth')
    .in('user_id', userIds);

  if (subErr) return { subscriptions: [], error: String(subErr.message ?? subErr) };
  return { subscriptions: (rows ?? []) as AdminPushSubscriptionRow[] };
}

export async function dispatchOpsWebPushAlert(
  payload: OpsTelegramDispatchPayload,
  subscriptions: AdminPushSubscriptionRow[],
  idempotencyKey: string,
  env: Pick<typeof Deno.env, 'get'> = Deno.env,
): Promise<{ ok: boolean; error?: string; providerAttempted?: boolean; sent?: number }> {
  if (subscriptions.length === 0) {
    return { ok: true, providerAttempted: false, sent: 0 };
  }

  const endpoint = env.get('WEB_PUSH_DISPATCH_URL')?.trim();
  if (!endpoint) {
    return { ok: false, error: 'web_push_not_configured', providerAttempted: false };
  }

  const notification = buildOpsWebPushNotification(payload, subscriptions);
  const body = JSON.stringify({
    event_type: OPS_WEB_PUSH_EVENT_TYPE,
    payload: notification,
    idempotency_key: idempotencyKey,
  });
  const headers = await buildOutboundDispatchHeaders(
    body,
    idempotencyKey,
    env.get('WEB_PUSH_DISPATCH_HMAC_SECRET') ?? undefined,
  );
  const res = await fetch(endpoint, { method: 'POST', headers, body });
  return res.ok
    ? { ok: true, providerAttempted: true, sent: subscriptions.length }
    : { ok: false, error: `web_push_${res.status}`, providerAttempted: true };
}
