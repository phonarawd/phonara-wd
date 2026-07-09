#!/usr/bin/env tsx
/**
 * One-shot free ops pager setup — ntfy.sh (phone push, no Telegram chat id).
 *
 * Usage: bun run stack:setup-ops-ntfy
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadRepoEnvFiles } from './lib/load-repo-env';
import {
  generateOpsNtfyTopic,
  ntfySubscribeUrl,
  readOpsNtfyEnv,
  validateOpsPagerEnv,
} from './lib/ops-pager-env';
import { spawnSyncSafe } from './lib/spawn-safe';
import { stripUtf8Bom } from './lib/load-repo-env';

function upsertEnvKey(filename: string, key: string, value: string): void {
  const path = join(process.cwd(), filename);
  const lines = existsSync(path) ? stripUtf8Bom(readFileSync(path, 'utf8')).split(/\r?\n/) : [];
  let found = false;
  const out = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) out.push(`${key}=${value}`);
  writeFileSync(path, `${out.join('\n').replace(/\n*$/, '')}\n`, 'utf8');
}

async function main(): Promise<void> {
  loadRepoEnvFiles();

  const ntfy = readOpsNtfyEnv();
  if (!ntfy.OPS_NTFY_TOPIC) {
    const topic = generateOpsNtfyTopic();
    upsertEnvKey('.env', 'OPS_NTFY_TOPIC', topic);
    upsertEnvKey('.env', 'OPS_NTFY_SERVER', 'https://ntfy.sh');
    loadRepoEnvFiles();
    console.log(`[stack:setup-ops-ntfy] generated OPS_NTFY_TOPIC=${topic}`);
  }

  const validated = validateOpsPagerEnv();
  if (!validated.ok) {
    console.error('[stack:setup-ops-ntfy] pager env validation failed after topic generation');
    process.exit(1);
  }

  const subscribe = ntfySubscribeUrl(validated.secrets);
  console.log('');
  console.log('=== PHONARA ops pager (ntfy · free) ===');
  console.log('1) Install ntfy app (iOS/Android) or open subscribe URL in browser');
  if (subscribe) console.log(`2) Subscribe: ${subscribe}`);
  console.log('3) Syncing Edge secrets + running test…');
  console.log('');

  const sync = spawnSyncSafe('tsx', ['scripts/sync-ops-pager-secrets.ts'], { stdio: 'inherit' });
  if (sync.status !== 0) process.exit(sync.status ?? 1);

  const test = spawnSyncSafe('tsx', ['scripts/test-ops-pager-notify.ts', '--ntfy-direct'], {
    stdio: 'inherit',
  });
  if (test.status !== 0) {
    console.error(
      '[stack:setup-ops-ntfy] direct ntfy test failed — subscribe to topic first, then re-run',
    );
    process.exit(test.status ?? 1);
  }

  console.log('[stack:setup-ops-ntfy] OK — subscribe on phone, then: bun run stack:test-ops-pager');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
