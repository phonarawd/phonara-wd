/**
 * Safe push — current feature branch only. Never pushes main.
 */
import { spawnSync } from 'node:child_process';
import { currentBranch, isProtectedBranch } from './lib/git-wip';
import { isMainPushAllowed } from './lib/main-push-guard';

const branch = currentBranch();

if (!isMainPushAllowed() && isProtectedBranch(branch)) {
  process.stderr.write(`[git:push] FAIL: on protected branch "${branch}".\n`);
  process.stderr.write('[git:push] Run: bun run wip:branch -- "<topic>"\n');
  process.exit(1);
}

process.stdout.write(`[git:push] pushing feature branch ${branch} → origin\n`);

const result = spawnSync('git', ['push', '-u', 'origin', 'HEAD'], {
  encoding: 'utf8',
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
