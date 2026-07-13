/**
 * §5-B standby failure isolation — merge gate for perf-rollout standby-test step.
 * Runs vitest contract for exe_missing · permission_denied · 8s hang.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = 'tests/scripts/standby-failure-cases.test.ts';

try {
  execSync(`bun run test -- ${SPEC}`, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    timeout: 120_000,
  });
  process.stdout.write('[cursor:standby-test] standby-failure-cases green\n');
} catch {
  process.stderr.write('[cursor:standby-test] standby-failure-cases FAILED\n');
  process.exit(1);
}
