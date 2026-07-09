/**
 * Install repo git hooks (pre-push main guard).
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitHooksDir } from './lib/main-push-guard';

const HOOK_BODY = `#!/bin/sh
# PHONARA — block push to main/master (feature branch + PR workflow)
cd "$(git rev-parse --show-toplevel)" || exit 1
exec bun x tsx scripts/git-pre-push-guard.ts
`;

function main(): void {
  const hooksDir = gitHooksDir();
  mkdirSync(hooksDir, { recursive: true });

  const hookPath = join(hooksDir, 'pre-push');
  const marker = '# PHONARA — block push to main/master';

  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, 'utf8');
    if (existing.includes(marker)) {
      process.stdout.write(`[git:hooks:install] pre-push hook already installed → ${hookPath}\n`);
      return;
    }
    process.stderr.write(
      `[git:hooks:install] WARN: custom pre-push exists — backing up to pre-push.phonara-backup\n`,
    );
    copyFileSync(hookPath, join(hooksDir, 'pre-push.phonara-backup'));
  }

  writeFileSync(hookPath, HOOK_BODY, { encoding: 'utf8' });
  try {
    chmodSync(hookPath, 0o755);
  } catch {
    // Windows — executable bit optional when invoked via git bash.
  }

  process.stdout.write(`[git:hooks:install] installed pre-push guard → ${hookPath}\n`);
  process.stdout.write('[git:hooks:install] safe push: bun run git:push\n');
}

main();
