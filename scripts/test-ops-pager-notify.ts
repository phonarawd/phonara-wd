#!/usr/bin/env tsx
/**
 * Ops pager smoke — ntfy (free push) and/or Telegram via ops-notify edge.
 *
 * Usage:
 *   bun run stack:test-ops-pager
 *   bun run stack:test-ops-pager -- --ntfy-direct
 *   bun run stack:test-ops-pager -- --sync-secrets
 */
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { LOCKED_SUPABASE_PROJECT_REF, LOCKED_SUPABASE_URL } from './lib/locked-supabase-project';
import { ntfySubscribeUrl, readOpsNtfyEnv, validateOpsPagerEnv } from './lib/ops-pager-env';
import { spawnSyncSafe } from './lib/spawn-safe';
import { ensureSupabaseAuth, readAccessTokenFromEnvFiles } from './lib/supabase-auth';

loadRepoEnvFiles();

const SERVICE_ROLE = process.env['SUPABASE_SERVICE_ROLE_KEY']?.replace(/^['"]|['"]$/g, '');
const FN_BASE = `${LOCKED_SUPABASE_URL}/functions/v1`;

const syncSecrets = process.argv.includes('--sync-secrets');
const ntfyDirect = process.argv.includes('--ntfy-direct');

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
  if (!res.ok) return { ok: false, rows: [], error: `${res.status} ${text}` };
  try {
    const parsed = JSON.parse(text) as unknown;
    return {
      ok: true,
      rows: Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [],
      error: '',
    };
  } catch {
    return { ok: false, rows: [], error: `non-json response: ${text.slice(0, 200)}` };
  }
}

async function testNtfyDirect(): Promise<boolean> {
  const ntfy = readOpsNtfyEnv();
  if (!ntfy.OPS_NTFY_TOPIC) {
    console.error(
      '[stack:test-ops-pager] missing OPS_NTFY_TOPIC — run: bun run stack:setup-ops-ntfy',
    );
    return false;
  }
  const server = (ntfy.OPS_NTFY_SERVER ?? 'https://ntfy.sh').replace(/\/+$/, '');
  const url = `${server}/${encodeURIComponent(ntfy.OPS_NTFY_TOPIC)}`;
  const headers: Record<string, string> = {
    Title: '[PHONARA TEST] ops pager',
    Priority: '3',
    Tags: 'phonara,test',
  };
  if (ntfy.OPS_NTFY_TOKEN) headers.Authorization = `Bearer ${ntfy.OPS_NTFY_TOKEN}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: 'PHONARA ntfy direct test — stack:test-ops-pager --ntfy-direct',
  });
  if (!res.ok) {
    console.error(`[stack:test-ops-pager] ntfy direct FAIL HTTP ${res.status}`);
    return false;
  }
  const subscribe = ntfySubscribeUrl(ntfy);
  console.log('[stack:test-ops-pager] ntfy direct OK — check ntfy app / notification shade');
  if (subscribe) console.log(`[stack:test-ops-pager] subscribe: ${subscribe}`);
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
  'stack_test_ops_pager',
  'critical',
  'open',
  'PHONARA ops pager 테스트 — 무시해도 됩니다',
  'stack_test_ops_pager',
  jsonb_build_object('test', true, 'source', 'stack:test-ops-pager')
)
RETURNING id::text AS alert_id;
`;
  const insertResult = await managementQuery(token, insertSql);
  if (!insertResult.ok || !insertResult.rows[0]?.alert_id) {
    console.error(`[stack:test-ops-pager] insert alert FAIL: ${insertResult.error || 'no id'}`);
    return null;
  }
  const alertId = String(insertResult.rows[0].alert_id);
  await managementQuery(
    token,
    `SELECT _enqueue_ops_telegram_for_alert('${alertId}'::uuid, 'immediate') AS enqueued;`,
  );
  const outboxResult = await managementQuery(
    token,
    `
SELECT id::text AS notify_id FROM ops_notify_outbox
 WHERE alert_id = '${alertId}'::uuid AND notify_kind = 'immediate'
 ORDER BY created_at DESC LIMIT 1;
`,
  );
  const notifyId = outboxResult.rows[0]?.notify_id;
  if (!notifyId) {
    console.error('[stack:test-ops-pager] enqueue FAIL: no outbox row');
    return null;
  }
  return { notifyId: String(notifyId), alertId };
}

async function invokeOpsNotify(): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  if (!SERVICE_ROLE) {
    console.error('[stack:test-ops-pager] missing SUPABASE_SERVICE_ROLE_KEY');
    return { ok: false, body: {} };
  }
  const res = await fetch(`${FN_BASE}/ops-notify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' },
    body: '{}',
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

async function main(): Promise<void> {
  if (syncSecrets) {
    const sync = spawnSyncSafe('tsx', ['scripts/sync-ops-pager-secrets.ts'], { stdio: 'inherit' });
    if (sync.status !== 0) process.exit(sync.status ?? 1);
  }

  if (ntfyDirect) {
    const ok = await testNtfyDirect();
    process.exit(ok ? 0 : 1);
  }

  const validated = validateOpsPagerEnv();
  if (!validated.ok) {
    console.error('[stack:test-ops-pager] no pager channel — bun run stack:setup-ops-ntfy');
    process.exit(1);
  }

  await ensureSupabaseAuth();
  const token = readAccessTokenFromEnvFiles();
  if (!token || !SERVICE_ROLE) {
    console.error('[stack:test-ops-pager] missing SUPABASE_ACCESS_TOKEN or SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`[stack:test-ops-pager] channel=${validated.channel} — enqueue + invoke ops-notify…`);
  const enqueued = await enqueueTestAlert(token);
  if (!enqueued) process.exit(1);

  const invoke = await invokeOpsNotify();
  console.log(`[stack:test-ops-pager] ops-notify: ${JSON.stringify(invoke.body)}`);
  const sentCount = Number(invoke.body.sent ?? 0);
  if (sentCount >= 1) {
    console.log('[stack:test-ops-pager] OK — check ntfy app or Telegram');
    return;
  }

  console.error('[stack:test-ops-pager] FAIL — deploy ops-notify + stack:sync-ops-pager-secrets');
  console.error('[stack:test-ops-pager] try: bun run stack:test-ops-pager -- --ntfy-direct');
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
