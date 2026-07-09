#!/usr/bin/env tsx
/**
 * End-to-end ops Telegram pager smoke: enqueue test critical alert → invoke ops-notify → verify sent.
 *
 * Usage:
 *   bun run stack:test-ops-telegram
 *   bun run stack:test-ops-telegram -- --sync-secrets   # .env → Edge secrets then test
 *   bun run stack:test-ops-telegram -- --direct         # Bot API only (no DB/outbox)
 */
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { LOCKED_SUPABASE_PROJECT_REF, LOCKED_SUPABASE_URL } from './lib/locked-supabase-project';
import { validateOpsTelegramEnv } from './lib/ops-telegram-env';
import { spawnSyncSafe } from './lib/spawn-safe';
import { ensureSupabaseAuth, readAccessTokenFromEnvFiles } from './lib/supabase-auth';

loadRepoEnvFiles();

const SERVICE_ROLE = process.env['SUPABASE_SERVICE_ROLE_KEY']?.replace(/^['"]|['"]$/g, '');
const FN_BASE = `${LOCKED_SUPABASE_URL}/functions/v1`;

const syncSecrets = process.argv.includes('--sync-secrets');
const directOnly = process.argv.includes('--direct');
const discoverOnly = process.argv.includes('--discover');

interface TelegramChatSummary {
  id: number;
  type: string;
  label: string;
}

export async function discoverTelegramChats(botToken: string): Promise<TelegramChatSummary[]> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
  const body = (await res.json()) as {
    ok?: boolean;
    result?: Array<{
      message?: { chat?: Record<string, unknown> };
      my_chat_member?: { chat?: Record<string, unknown> };
    }>;
    description?: string;
  };
  if (!res.ok || !body.ok) {
    throw new Error(body.description ?? `getUpdates HTTP ${res.status}`);
  }

  const chats = new Map<number, TelegramChatSummary>();
  for (const update of body.result ?? []) {
    const chat = (update.message?.chat ?? update.my_chat_member?.chat) as
      | { id?: number; type?: string; first_name?: string; username?: string; title?: string }
      | undefined;
    if (!chat?.id) continue;
    chats.set(chat.id, {
      id: chat.id,
      type: chat.type ?? 'unknown',
      label: chat.title ?? chat.first_name ?? chat.username ?? String(chat.id),
    });
  }
  return [...chats.values()];
}

export function pickPrivateRecipientChat(
  chats: TelegramChatSummary[],
  botToken: string,
): TelegramChatSummary | null {
  const botId = Number(botToken.split(':')[0]);
  return (
    chats.find((c) => c.type === 'private' && c.id !== botId) ??
    chats.find((c) => c.type === 'private') ??
    null
  );
}

async function managementQuery(
  token: string,
  sql: string,
): Promise<{ ok: boolean; rows: Record<string, unknown>[]; error: string }> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${LOCKED_SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, rows: [], error: `${res.status} ${text}` };
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return { ok: true, rows: parsed as Record<string, unknown>[], error: '' };
    }
    return { ok: true, rows: [], error: '' };
  } catch {
    return { ok: false, rows: [], error: `non-json response: ${text.slice(0, 200)}` };
  }
}

async function testDirectTelegram(): Promise<boolean> {
  const validated = validateOpsTelegramEnv();
  if (!validated.ok) {
    console.error(
      '[stack:test-ops-telegram] --direct needs OPS_TELEGRAM_BOT_TOKEN + OPS_TELEGRAM_CHAT_ID in .env',
    );
    for (const key of validated.missing) console.error(`  - ${key}`);
    return false;
  }

  const { secrets } = validated;
  const res = await fetch(
    `https://api.telegram.org/bot${secrets.OPS_TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: secrets.OPS_TELEGRAM_CHAT_ID,
        text: '[PHONARA TEST] Bot API direct ping — stack:test-ops-telegram --direct',
        disable_web_page_preview: true,
      }),
    },
  );
  const body = (await res.json()) as { ok?: boolean; description?: string };
  if (!res.ok || !body.ok) {
    console.error(
      `[stack:test-ops-telegram] direct Telegram FAIL HTTP ${res.status}: ${body.description ?? JSON.stringify(body)}`,
    );
    return false;
  }
  console.log('[stack:test-ops-telegram] direct Telegram OK — check your Telegram app');
  return true;
}

async function enqueueTestAlert(
  token: string,
): Promise<{ notifyId: string; alertId: string } | null> {
  const insertSql = `
INSERT INTO ops_alerts (
  dedupe_key, source_check_id, severity, status,
  summary, runbook_key, metadata
) VALUES (
  'stack_test_' || gen_random_uuid()::text,
  'stack_test_ops_telegram',
  'critical',
  'open',
  'PHONARA Telegram 연동 테스트 — 무시해도 됩니다',
  'stack_test_ops_telegram',
  jsonb_build_object('test', true, 'source', 'stack:test-ops-telegram')
)
RETURNING id::text AS alert_id;
`;

  const insertResult = await managementQuery(token, insertSql);
  if (!insertResult.ok || !insertResult.rows[0]?.alert_id) {
    console.error(`[stack:test-ops-telegram] insert alert FAIL: ${insertResult.error || 'no id'}`);
    return null;
  }

  const alertId = String(insertResult.rows[0].alert_id);
  if (!/^[0-9a-f-]{36}$/i.test(alertId)) {
    console.error('[stack:test-ops-telegram] insert alert FAIL: invalid alert_id');
    return null;
  }

  const enqueueCall = await managementQuery(
    token,
    `SELECT _enqueue_ops_telegram_for_alert('${alertId}'::uuid, 'immediate') AS enqueued;`,
  );
  if (!enqueueCall.ok) {
    console.error(`[stack:test-ops-telegram] enqueue FAIL: ${enqueueCall.error}`);
    return null;
  }

  const outboxResult = await managementQuery(
    token,
    `
SELECT id::text AS notify_id, alert_id::text AS alert_id, status
  FROM ops_notify_outbox
 WHERE alert_id = '${alertId}'::uuid
   AND notify_kind = 'immediate'
 ORDER BY created_at DESC
 LIMIT 1;
`,
  );
  if (!outboxResult.ok) {
    console.error(`[stack:test-ops-telegram] outbox lookup FAIL: ${outboxResult.error}`);
    return null;
  }

  const row = outboxResult.rows[0];
  if (!row?.notify_id) {
    console.error('[stack:test-ops-telegram] enqueue FAIL: no outbox row (critical alert hook?)');
    return null;
  }

  return { notifyId: String(row.notify_id), alertId };
}

async function invokeOpsNotify(): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  if (!SERVICE_ROLE) {
    console.error('[stack:test-ops-telegram] missing SUPABASE_SERVICE_ROLE_KEY in .env');
    return { ok: false, body: {} };
  }

  const res = await fetch(`${FN_BASE}/ops-notify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const text = await res.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    body = { raw: text };
  }
  return { ok: res.ok && body.ok !== false, body };
}

async function fetchOutboxStatus(
  token: string,
  notifyId: string,
): Promise<Record<string, unknown> | null> {
  if (!/^[0-9a-f-]{36}$/i.test(notifyId)) return null;
  const sql = `
SELECT id::text, status, last_error_code, provider_attempted, updated_at
  FROM ops_notify_outbox
 WHERE id = '${notifyId}'::uuid;
`;
  const result = await managementQuery(token, sql);
  if (!result.ok || !result.rows[0]) return null;
  return result.rows[0];
}

async function main(): Promise<void> {
  if (discoverOnly) {
    const validated = validateOpsTelegramEnv();
    if (!validated.ok || !validated.secrets.OPS_TELEGRAM_BOT_TOKEN) {
      console.error('[stack:test-ops-telegram] --discover needs OPS_TELEGRAM_BOT_TOKEN in .env');
      process.exit(1);
    }
    const chats = await discoverTelegramChats(validated.secrets.OPS_TELEGRAM_BOT_TOKEN);
    if (chats.length === 0) {
      console.error(
        '[stack:test-ops-telegram] no chats in getUpdates — open @phonara_ops_alert_bot → Start → send hi, then retry',
      );
      process.exit(1);
    }
    console.log('[stack:test-ops-telegram] discovered chats:');
    for (const chat of chats) {
      console.log(`  - id=${chat.id} type=${chat.type} label=${chat.label}`);
    }
    const pick = pickPrivateRecipientChat(chats, validated.secrets.OPS_TELEGRAM_BOT_TOKEN);
    if (pick) {
      console.log(
        `[stack:test-ops-telegram] suggested OPS_TELEGRAM_CHAT_ID=${pick.id} (${pick.label})`,
      );
    }
    return;
  }

  if (syncSecrets) {
    console.log(
      '[stack:test-ops-telegram] syncing OPS_TELEGRAM_* from .env → Supabase Edge secrets…',
    );
    const sync = spawnSyncSafe('tsx', ['scripts/sync-ops-telegram-secrets.ts'], {
      stdio: 'inherit',
    });
    if (sync.status !== 0) process.exit(sync.status ?? 1);
  }

  if (directOnly) {
    const ok = await testDirectTelegram();
    process.exit(ok ? 0 : 1);
  }

  await ensureSupabaseAuth();
  const token = readAccessTokenFromEnvFiles();
  if (!token) {
    console.error('[stack:test-ops-telegram] missing SUPABASE_ACCESS_TOKEN');
    process.exit(1);
  }
  if (!SERVICE_ROLE) {
    console.error('[stack:test-ops-telegram] missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('[stack:test-ops-telegram] enqueue test critical alert → ops_notify_outbox…');
  const enqueued = await enqueueTestAlert(token);
  if (!enqueued) process.exit(1);
  console.log(`[stack:test-ops-telegram] outbox notify_id=${enqueued.notifyId}`);

  console.log('[stack:test-ops-telegram] invoke ops-notify edge…');
  const invoke = await invokeOpsNotify();
  console.log(`[stack:test-ops-telegram] ops-notify response: ${JSON.stringify(invoke.body)}`);
  if (!invoke.ok) {
    console.error('[stack:test-ops-telegram] ops-notify invoke FAIL');
    process.exit(1);
  }

  const sentCount = Number(invoke.body.sent ?? 0);
  let outbox = await fetchOutboxStatus(token, enqueued.notifyId);
  if (!outbox) {
    const fallback = await managementQuery(
      token,
      `
SELECT id::text, status, last_error_code, provider_attempted, updated_at
  FROM ops_notify_outbox
 WHERE alert_id = '${enqueued.alertId}'::uuid
 ORDER BY created_at DESC
 LIMIT 1;
`,
    );
    outbox = fallback.rows[0] ?? null;
  }
  const status = outbox?.status;
  const errorCode = outbox?.last_error_code;

  if (sentCount >= 1 && status === 'sent') {
    console.log(
      '[stack:test-ops-telegram] OK — Telegram should show [PHONARA ALERT] CRITICAL message',
    );
    console.log('[stack:test-ops-telegram] tip: @phonara_ops_alert_bot Start 눌렀는지 확인');
    return;
  }

  console.error(
    `[stack:test-ops-telegram] FAIL — sent=${sentCount} outbox.status=${String(status ?? 'unknown')} last_error_code=${String(errorCode ?? 'n/a')}`,
  );
  if (errorCode === 'telegram_not_configured') {
    console.error(
      '[stack:test-ops-telegram] Edge secrets missing — Dashboard 또는 bun run stack:sync-ops-telegram-secrets',
    );
  } else if (errorCode === 'telegram_dispatch_failed') {
    console.error(
      '[stack:test-ops-telegram] Telegram API rejected — @phonara_ops_alert_bot Start · chat id · token 확인',
    );
  } else if (String(errorCode ?? '').startsWith('fallback_')) {
    console.error(
      '[stack:test-ops-telegram] OPS_TELEGRAM_WEBHOOK_URL 설정 오류 — 비우거나 Bot API만 쓰세요',
    );
  }
  console.error(
    '[stack:test-ops-telegram] checks: Edge secrets OPS_TELEGRAM_* · chat id · bot Start',
  );
  console.error(
    '[stack:test-ops-telegram] quick Bot API only: bun run stack:test-ops-telegram -- --direct',
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
