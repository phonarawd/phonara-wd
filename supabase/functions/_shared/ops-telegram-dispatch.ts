import { buildOutboundDispatchHeaders } from './outbound-dispatch-auth.ts';
import { readOpsNtfyConfigFromEnv, sendOpsNtfyMessage } from './ops-ntfy-dispatch.ts';

export interface OpsTelegramDispatchPayload {
  alert_id?: string | null;
  notify_kind?: string;
  severity?: string;
  summary?: string;
  runbook_key?: string;
  dedupe_key?: string;
  source_check_id?: string;
  occurrence_count?: number;
}

export interface OpsTelegramDispatchResult {
  ok: boolean;
  error?: string;
  providerAttempted?: boolean;
  channel?: 'ntfy' | 'webhook' | 'telegram' | 'fallback';
}

function truncateTelegram(text: string, max = 3900): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function formatOpsTelegramMessage(payload: OpsTelegramDispatchPayload): string {
  const kind = payload.notify_kind === 'digest' ? 'DIGEST' : 'ALERT';
  const lines = [
    `[PHONARA ${kind}] ${String(payload.severity ?? 'critical').toUpperCase()}`,
    payload.summary ?? 'Ops alert',
    `runbook: ${payload.runbook_key ?? 'unknown'}`,
  ];
  if (payload.source_check_id) lines.push(`check: ${payload.source_check_id}`);
  if (payload.dedupe_key) lines.push(`dedupe: ${payload.dedupe_key}`);
  if (payload.alert_id) lines.push(`alert_id: ${payload.alert_id}`);
  return truncateTelegram(lines.join('\n'));
}

async function postSignedWebhook(
  url: string,
  secret: string | undefined,
  body: string,
  idempotencyKey: string,
): Promise<{ ok: boolean; status: number }> {
  const headers = await buildOutboundDispatchHeaders(body, idempotencyKey, secret);
  const res = await fetch(url, { method: 'POST', headers, body });
  return { ok: res.ok, status: res.status };
}

async function sendTelegramBotMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; status: number }> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  return { ok: res.ok, status: res.status };
}

export async function dispatchOpsTelegramAlert(
  payload: OpsTelegramDispatchPayload,
  idempotencyKey: string,
): Promise<OpsTelegramDispatchResult> {
  const message = formatOpsTelegramMessage(payload);
  const body = JSON.stringify({
    event_type: 'ops_alert',
    notify_kind: payload.notify_kind ?? 'immediate',
    severity: payload.severity ?? 'critical',
    message,
    payload,
    idempotency_key: idempotencyKey,
  });

  const ntfyConfig = readOpsNtfyConfigFromEnv(Deno.env);
  if (ntfyConfig) {
    const ntfy = await sendOpsNtfyMessage(ntfyConfig, payload);
    if (ntfy.ok) {
      return { ok: true, providerAttempted: true, channel: 'ntfy' };
    }
  }

  const webhookUrl = Deno.env.get('OPS_TELEGRAM_WEBHOOK_URL');
  const webhookSecret = Deno.env.get('OPS_TELEGRAM_WEBHOOK_HMAC_SECRET') ?? undefined;

  if (webhookUrl) {
    const primary = await postSignedWebhook(webhookUrl, webhookSecret, body, idempotencyKey);
    if (primary.ok) {
      return { ok: true, providerAttempted: true, channel: 'webhook' };
    }
  }

  const botToken = Deno.env.get('OPS_TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('OPS_TELEGRAM_CHAT_ID');
  if (botToken && chatId) {
    const tg = await sendTelegramBotMessage(botToken, chatId, message);
    if (tg.ok) {
      return { ok: true, providerAttempted: true, channel: 'telegram' };
    }
  }

  const fallbackUrl = Deno.env.get('OPS_TELEGRAM_FALLBACK_URL');
  const fallbackSecret = Deno.env.get('OPS_TELEGRAM_FALLBACK_HMAC_SECRET') ?? undefined;
  if (fallbackUrl) {
    const fallback = await postSignedWebhook(fallbackUrl, fallbackSecret, body, idempotencyKey);
    if (fallback.ok) {
      return { ok: true, providerAttempted: true, channel: 'fallback' };
    }
    return {
      ok: false,
      error: `fallback_${fallback.status}`,
      providerAttempted: true,
      channel: 'fallback',
    };
  }

  if (ntfyConfig || webhookUrl || (botToken && chatId)) {
    return {
      ok: false,
      error: ntfyConfig ? 'ntfy_dispatch_failed' : 'telegram_dispatch_failed',
      providerAttempted: true,
      channel: ntfyConfig ? 'ntfy' : webhookUrl ? 'webhook' : 'telegram',
    };
  }

  return { ok: false, error: 'pager_not_configured', providerAttempted: false };
}
