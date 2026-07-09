#!/usr/bin/env tsx
/**
 * Invoke deployed WorldNo1 edge functions (service-role paths) + sync Vault cron secrets.
 * Usage: `bun run stack:verify-worldno1-edge`
 */
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { LOCKED_SUPABASE_PROJECT_REF, LOCKED_SUPABASE_URL } from './lib/locked-supabase-project';
import { ensureSupabaseAuth, readAccessTokenFromEnvFiles } from './lib/supabase-auth';

loadRepoEnvFiles();

const SERVICE_ROLE = process.env['SUPABASE_SERVICE_ROLE_KEY']?.replace(/^['"]|['"]$/g, '');
if (!SERVICE_ROLE) {
  console.error('[verify-worldno1-edge] missing SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const FN_BASE = `${LOCKED_SUPABASE_URL}/functions/v1`;

const SERVICE_FNS: Array<{ name: string; body?: Record<string, unknown> }> = [
  { name: 'price-feed' },
  { name: 'crypto-chain-watcher' },
  { name: 'usdt-krw-feed' },
  { name: 'notification-dispatch' },
  { name: 'ops-notify' },
  { name: 'crypto-withdraw-broadcast' },
];

const VAULT_PAIRS: Array<{ urlKey: string; invokeKey: string; fn: string }> = [
  { urlKey: 'price_feed_url', invokeKey: 'price_feed_invoke_key', fn: 'price-feed' },
  {
    urlKey: 'crypto_chain_watcher_url',
    invokeKey: 'crypto_chain_watcher_invoke_key',
    fn: 'crypto-chain-watcher',
  },
  { urlKey: 'usdt_krw_feed_url', invokeKey: 'usdt_krw_feed_invoke_key', fn: 'usdt-krw-feed' },
  {
    urlKey: 'notification_dispatch_url',
    invokeKey: 'notification_dispatch_invoke_key',
    fn: 'notification-dispatch',
  },
  {
    urlKey: 'ops_notify_url',
    invokeKey: 'ops_notify_invoke_key',
    fn: 'ops-notify',
  },
];

async function invokeFn(
  name: string,
  body: Record<string, unknown> = {},
  method: 'GET' | 'POST' = 'POST',
): Promise<Response> {
  return fetch(`${FN_BASE}/${name}`, {
    method,
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

async function syncVaultSecrets(token: string): Promise<void> {
  const blocks = VAULT_PAIRS.map(({ urlKey, invokeKey, fn }) => {
    const url = `${FN_BASE}/${fn}`;
    return `
DO $vault$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = '${urlKey}') THEN
    PERFORM vault.create_secret('${url}', '${urlKey}', 'WorldNo1 edge cron URL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = '${invokeKey}') THEN
    PERFORM vault.create_secret('${SERVICE_ROLE}', '${invokeKey}', 'WorldNo1 edge invoke key');
  END IF;
END $vault$;`;
  }).join('\n');

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${LOCKED_SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: blocks }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vault secret sync failed: ${res.status} ${text}`);
  }
  console.log('[verify-worldno1-edge] Vault cron secrets synced (idempotent)');
}

async function main(): Promise<void> {
  await ensureSupabaseAuth();
  const token = readAccessTokenFromEnvFiles();
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN missing after auth');
  await syncVaultSecrets(token);

  let failed = 0;
  for (const { name, body } of SERVICE_FNS) {
    const res = await invokeFn(name, body ?? {});
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep raw */
    }
    const ok =
      res.ok &&
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as { ok?: boolean }).ok !== false;
    console.log(`[verify-worldno1-edge] ${name} → HTTP ${res.status} ${text.slice(0, 200)}`);
    if (!ok) failed += 1;
  }

  const deriveRes = await invokeFn('derive-crypto-address', { chain: 'TRC20' });
  const deriveText = await deriveRes.text();
  // derive-crypto-address requires user JWT — service role should return 401/403 unauthenticated
  const deriveOk = deriveRes.status === 401 || deriveRes.status === 403;
  console.log(
    `[verify-worldno1-edge] derive-crypto-address → HTTP ${deriveRes.status} (user-JWT gate ${deriveOk ? 'OK' : 'FAIL'}) ${deriveText.slice(0, 120)}`,
  );
  if (!deriveOk) failed += 1;

  const signRes = await invokeFn('crypto-sign', {
    withdrawal_id: '00000000-0000-0000-0000-000000000000',
  });
  const signText = await signRes.text();
  let signParsed: { error?: string; code?: string } = {};
  try {
    signParsed = JSON.parse(signText) as { error?: string; code?: string };
  } catch {
    /* keep raw */
  }
  const signOk =
    signRes.status === 404 && signParsed.error === 'withdrawal_not_found' && !signParsed.code;
  console.log(
    `[verify-worldno1-edge] crypto-sign → HTTP ${signRes.status} (service-role gate ${signOk ? 'OK' : 'FAIL'}) ${signText.slice(0, 120)}`,
  );
  if (!signOk) failed += 1;

  const pgRes = await invokeFn('pg-bank-webhook', {}, 'GET');
  const pgText = await pgRes.text();
  let pgParsed: { ok?: boolean; service?: string } = {};
  try {
    pgParsed = JSON.parse(pgText) as { ok?: boolean; service?: string };
  } catch {
    /* keep raw */
  }
  const pgOk = pgRes.ok && pgParsed.ok === true && pgParsed.service === 'pg-bank-webhook';
  console.log(
    `[verify-worldno1-edge] pg-bank-webhook → HTTP ${pgRes.status} (GET health ${pgOk ? 'OK' : 'FAIL'}) ${pgText.slice(0, 120)}`,
  );
  if (!pgOk) failed += 1;

  if (failed > 0) {
    console.error(`[verify-worldno1-edge] FAIL — ${failed} function(s) unhealthy`);
    process.exit(1);
  }
  console.log('[verify-worldno1-edge] OK — 9 edge functions deployed + cron secrets wired');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
