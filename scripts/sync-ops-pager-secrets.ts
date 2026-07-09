#!/usr/bin/env tsx
/**
 * Push ops pager secrets (ntfy and/or Telegram) from `.env` to Supabase Edge `ops-notify`.
 *
 * Usage:
 *   bun run stack:sync-ops-pager-secrets
 *   bun run stack:sync-ops-pager-secrets -- --check
 */
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { LOCKED_SUPABASE_PROJECT_REF } from './lib/locked-supabase-project';
import {
  formatSupabaseSecretArgs,
  maskSecret,
  ntfySubscribeUrl,
  validateOpsPagerEnv,
} from './lib/ops-pager-env';
import { spawnSyncSafe } from './lib/spawn-safe';
import { ensureSupabaseAuth } from './lib/supabase-auth';

const checkOnly = process.argv.includes('--check');
const dryRun = process.argv.includes('--dry-run');

async function main(): Promise<void> {
  loadRepoEnvFiles();

  const validated = validateOpsPagerEnv();
  if (!validated.ok) {
    console.error('[stack:sync-ops-pager-secrets] no pager channel configured in .env');
    console.error('  ntfy (recommended): OPS_NTFY_TOPIC=phonara-ops-...');
    console.error('  telegram: OPS_TELEGRAM_BOT_TOKEN + OPS_TELEGRAM_CHAT_ID');
    console.error('  setup: bun run stack:setup-ops-ntfy');
    process.exit(1);
  }

  const { secrets, channel } = validated;
  const keys = Object.keys(secrets) as Array<keyof typeof secrets>;

  console.log(`[stack:sync-ops-pager-secrets] channel=${channel}`);
  for (const key of keys) {
    const value = secrets[key];
    if (!value) continue;
    if (key === 'OPS_NTFY_TOPIC') {
      console.log(`  - ${key}=${value}`);
    } else {
      console.log(`  - ${key}=${maskSecret(value)}`);
    }
  }
  const subscribe = ntfySubscribeUrl(secrets);
  if (subscribe) {
    console.log(`[stack:sync-ops-pager-secrets] ntfy subscribe URL: ${subscribe}`);
  }

  if (checkOnly) {
    console.log('[stack:sync-ops-pager-secrets] --check OK (no remote push)');
    return;
  }

  const secretArgs = formatSupabaseSecretArgs(secrets);
  if (secretArgs.length === 0) {
    console.error('[stack:sync-ops-pager-secrets] no secrets to push');
    process.exit(1);
  }

  if (dryRun) {
    console.log('[stack:sync-ops-pager-secrets] --dry-run OK — would push:');
    for (const key of keys) console.log(`  - ${key}`);
    return;
  }

  await ensureSupabaseAuth();

  const result = spawnSyncSafe(
    'supabase',
    ['secrets', 'set', ...secretArgs, '--project-ref', LOCKED_SUPABASE_PROJECT_REF],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    console.error('[stack:sync-ops-pager-secrets] FAIL — supabase secrets set exited non-zero');
    process.exit(result.status ?? 1);
  }

  console.log(
    `[stack:sync-ops-pager-secrets] OK — ${keys.length} secret(s) pushed to project ${LOCKED_SUPABASE_PROJECT_REF}`,
  );
  console.log('[stack:sync-ops-pager-secrets] test: bun run stack:test-ops-pager');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
