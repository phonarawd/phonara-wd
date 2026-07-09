#!/usr/bin/env tsx
/**
 * Read OPS_TELEGRAM_* from repo `.env` / `.env.local` and push to Supabase Edge secrets.
 *
 * Usage:
 *   bun run stack:sync-ops-telegram-secrets          # push to remote ops-notify
 *   bun run stack:sync-ops-telegram-secrets -- --check # validate .env only (no push)
 *   bun run stack:sync-ops-telegram-secrets -- --dry-run
 */
import { loadRepoEnvFiles } from './lib/load-repo-env';
import { LOCKED_SUPABASE_PROJECT_REF } from './lib/locked-supabase-project';
import {
  formatSupabaseSecretArgs,
  maskSecret,
  validateOpsTelegramEnv,
} from './lib/ops-telegram-env';
import { spawnSyncSafe } from './lib/spawn-safe';
import { ensureSupabaseAuth } from './lib/supabase-auth';

const checkOnly = process.argv.includes('--check');
const dryRun = process.argv.includes('--dry-run');

async function main(): Promise<void> {
  loadRepoEnvFiles();

  const validated = validateOpsTelegramEnv();
  if (!validated.ok) {
    console.error('[stack:sync-ops-telegram-secrets] missing or placeholder values in .env:');
    for (const key of validated.missing) {
      console.error(`  - ${key}`);
    }
    console.error('');
    console.error('Add BotFather token + chat id to .env (see .env.example), then re-run.');
    console.error('Required: OPS_TELEGRAM_BOT_TOKEN · OPS_TELEGRAM_CHAT_ID');
    process.exit(1);
  }

  const { secrets } = validated;
  const keys = Object.keys(secrets) as Array<keyof typeof secrets>;

  console.log('[stack:sync-ops-telegram-secrets] .env values OK:');
  for (const key of keys) {
    const value = secrets[key];
    if (!value) continue;
    console.log(`  - ${key}=${maskSecret(value)}`);
  }

  if (checkOnly) {
    console.log('[stack:sync-ops-telegram-secrets] --check OK (no remote push)');
    return;
  }

  const secretArgs = formatSupabaseSecretArgs(secrets);
  if (secretArgs.length === 0) {
    console.error('[stack:sync-ops-telegram-secrets] no secrets to push');
    process.exit(1);
  }

  if (dryRun) {
    console.log('[stack:sync-ops-telegram-secrets] --dry-run OK — would push:');
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
    console.error('[stack:sync-ops-telegram-secrets] FAIL — supabase secrets set exited non-zero');
    process.exit(result.status ?? 1);
  }

  console.log(
    `[stack:sync-ops-telegram-secrets] OK — ${keys.length} secret(s) pushed to project ${LOCKED_SUPABASE_PROJECT_REF}`,
  );
  console.log('[stack:sync-ops-telegram-secrets] optional: bun run stack:verify-worldno1-edge');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
