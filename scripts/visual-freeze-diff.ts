#!/usr/bin/env bun
/**
 * R3 engine freeze gate — no controller/RPC/money-path diff after R1b commit.
 * Reads tests/visual/freeze-baseline.json · no jq required (Windows-safe).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO_ROOT = join(import.meta.dirname, '..');
const BASELINE_PATH = join(REPO_ROOT, 'tests/visual/freeze-baseline.json');

const FREEZE_PATHS = [
  'apps/web/src/features',
  'apps/web/src/contracts',
  'packages/money',
  'supabase',
];

type FreezeBaseline = {
  r1bCommit?: string;
  recordedAt?: string;
};

function loadBaseline(): FreezeBaseline {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`[visual:freeze-diff] missing ${BASELINE_PATH}`);
    process.exit(2);
  }
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as FreezeBaseline;
}

function main(): void {
  const baseline = loadBaseline();
  const r1bCommit = baseline.r1bCommit?.trim();
  if (!r1bCommit) {
    console.error(
      '[visual:freeze-diff] freeze-baseline.json r1bCommit is empty — set after recovery(R1b) commit',
    );
    process.exit(2);
  }

  const verify = spawnSync('git', ['cat-file', '-e', `${r1bCommit}^{commit}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (verify.status !== 0) {
    console.error(`[visual:freeze-diff] invalid r1bCommit: ${r1bCommit}`);
    process.exit(2);
  }

  const diff = spawnSync(
    'git',
    ['diff', '--name-only', `${r1bCommit}..HEAD`, '--', ...FREEZE_PATHS],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  if (diff.status !== 0) {
    console.error('[visual:freeze-diff] git diff failed:', diff.stderr || diff.stdout);
    process.exit(1);
  }

  const changed = diff.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (changed.length > 0) {
    console.error('[visual:freeze-diff] engine/controller paths changed since R1b freeze:');
    for (const path of changed) console.error(`  ${path}`);
    process.exit(1);
  }

  console.log(`[visual:freeze-diff] OK — no diff in freeze paths since ${r1bCommit.slice(0, 8)}`);
}

main();
