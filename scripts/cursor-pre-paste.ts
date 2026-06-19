#!/usr/bin/env tsx
/**
 * Full workspace prep before Lovable paste / large UI absorption.
 * One command: orphans · ports · artifacts · tmp staging · metadata · hygiene gate.
 *
 *   bun run cursor:pre-paste
 *   bun run cursor:pre-paste -- --skip-metadata
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { LOVABLE_INTAKE_STAGING } from './lib/lovable-paste-map';

const repoRoot = process.cwd();
const skipMetadata = process.argv.includes('--skip-metadata');

function run(label: string, cmd: string): void {
  process.stdout.write(`\n[pre-paste] ${label}\n`);
  execSync(cmd, { cwd: repoRoot, stdio: 'inherit', shell: true });
}

function removePath(rel: string): boolean {
  const abs = join(repoRoot, rel);
  if (!existsSync(abs)) return false;
  rmSync(abs, { recursive: true, force: true });
  process.stdout.write(`[pre-paste] removed ${rel}\n`);
  return true;
}

function removeTmpLovableDirs(): number {
  let n = 0;
  for (const name of readdirSync(repoRoot)) {
    if (!name.startsWith('.tmp-lovable')) continue;
    const abs = join(repoRoot, name);
    if (statSync(abs).isDirectory()) {
      rmSync(abs, { recursive: true, force: true });
      process.stdout.write(`[pre-paste] removed ${name}/\n`);
      n++;
    }
  }
  return n;
}

function printPortStatus(): void {
  if (process.platform !== 'win32') return;
  for (const port of [3000, 3001, 3002]) {
    try {
      const out = execSync(
        `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).Count"`,
        { encoding: 'utf8' },
      ).trim();
      const busy = out !== '' && out !== '0';
      process.stdout.write(`[pre-paste] port ${port}: ${busy ? 'BUSY (run e2e:kill)' : 'free'}\n`);
    } catch {
      process.stdout.write(`[pre-paste] port ${port}: free\n`);
    }
  }
}

process.stdout.write('=== PHONARA pre-paste hygiene (world-class gate) ===\n');

run('orphan sweep', 'bun run cursor:kill-orphans');
run('E2E port kill', 'bun run e2e:kill');
run('artifact clean', 'bun run clean:artifacts');

const tmpRemoved = removeTmpLovableDirs();
if (tmpRemoved === 0) {
  process.stdout.write('[pre-paste] no .tmp-lovable-* dirs\n');
}

removePath(LOVABLE_INTAKE_STAGING);

run('sync Cursor excludes', 'bun run tsx scripts/sync-cursor-archival-excludes.ts');

if (!skipMetadata) {
  run(
    'Cursor logs/cache (transcripts kept)',
    'bun run cursor:clean-metadata -- --apply --include-cursor-logs --skip-transcripts',
  );
}

run('hygiene gate', 'bun run check:hygiene');

process.stdout.write('\n[pre-paste] port check\n');
printPortStatus();

process.stdout.write(`
=== pre-paste READY ===
Next: drop Lovable ZIP → bun run lovable:intake
Paste: operator 「PHONARA paste GO Wave-1」
Tip: fully quit Cursor (tray) and reopen after this run if IDE still feels heavy.
`);
