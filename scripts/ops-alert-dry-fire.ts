#!/usr/bin/env tsx
/**
 * R4 / ADR-021 — Rollback Trigger ↔ ops alert dry-fire Evidence helper.
 *
 * Open → resolve cycle for §20b trigger keys. Optional --notify points to
 * stack:test-ops-pager for channel receipt (secrets required).
 *
 * Usage:
 *   bun run stack:ops-alert-dry-fire
 *   bun run stack:ops-alert-dry-fire -- --notify
 */
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { LOCKED_SUPABASE_PROJECT_REF } from './lib/locked-supabase-project';
import { ensureSupabaseAuth, readAccessTokenFromEnvFiles } from './lib/supabase-auth';

loadRepoEnvFiles();

const NOTIFY = process.argv.includes('--notify');

/** ADR-021 §4 / PLATFORM_SLO_SLA.yaml rollback_triggers */
const TRIGGER_KEYS = [
  'http_5xx_rate_pct_5m',
  'provider_timeout_rate_pct',
  'rpc_p95_ms',
  'money_delta_alarm',
  'wallet_error_burst_per_min',
  'permission_error_burst_per_min',
] as const;

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

async function main(): Promise<number> {
  await ensureSupabaseAuth();
  const token = readAccessTokenFromEnvFiles();
  if (!token) {
    console.error('[stack:ops-alert-dry-fire] missing SUPABASE_ACCESS_TOKEN');
    return 1;
  }

  const dedupeKeys = TRIGGER_KEYS.map((k) => `dryfire:${k}`);
  const keysSql = dedupeKeys.map((k) => `'${k}'`).join(', ');

  // Clear any leftover open dry-fire rows so unique active index allows insert.
  await managementQuery(
    token,
    `
UPDATE ops_alerts
   SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
 WHERE dedupe_key IN (${keysSql})
   AND status IN ('open', 'acknowledged');
`,
  );

  const values = TRIGGER_KEYS.map((k) => {
    const severity = k === 'money_delta_alarm' ? 'critical' : 'warning';
    return `(
  'dryfire:${k}',
  'adr021_dryfire',
  '${severity}',
  'open',
  'ADR-021 dry-fire for ${k}',
  'observability.adr021_dryfire',
  jsonb_build_object('dryFire', true, 'trigger', '${k}')
)`;
  }).join(',\n');

  const insertSql = `
INSERT INTO ops_alerts (
  dedupe_key, source_check_id, severity, status, summary, runbook_key, metadata
) VALUES
${values}
RETURNING dedupe_key, severity, status;
`;

  const inserted = await managementQuery(token, insertSql);
  if (!inserted.ok) {
    console.error('[stack:ops-alert-dry-fire] insert FAIL', inserted.error);
    return 1;
  }
  console.log(`[stack:ops-alert-dry-fire] opened ${inserted.rows.length}/${TRIGGER_KEYS.length}`);
  for (const row of inserted.rows) {
    console.log(`  - ${row['dedupe_key']} (${row['severity']})`);
  }

  if (NOTIFY) {
    console.log(
      '[stack:ops-alert-dry-fire] --notify: channel receipt via bun run stack:test-ops-pager',
    );
  }

  const resolveSql = `
UPDATE ops_alerts
   SET status = 'resolved',
       resolved_at = NOW(),
       updated_at = NOW()
 WHERE dedupe_key IN (${keysSql})
   AND status = 'open'
 RETURNING dedupe_key, status;
`;
  const resolved = await managementQuery(token, resolveSql);
  if (!resolved.ok) {
    console.error('[stack:ops-alert-dry-fire] resolve FAIL', resolved.error);
    return 1;
  }
  console.log(`[stack:ops-alert-dry-fire] resolved ${resolved.rows.length}`);
  console.log('[stack:ops-alert-dry-fire] OK — ADR-021 trigger open→resolve Evidence ready');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
