import { spawnSyncSafe } from './lib/spawn-safe';

/** Launch gate: reconciliation Σ=0 + solvency hold (Phase 1 reseal). */
const RECON_TESTS = [
  'supabase/tests/solvency_reconciliation_test.sql',
  'supabase/tests/system_account_reconciliation_test.sql',
  'supabase/tests/phase5_gates_test.sql',
] as const;

const result = spawnSyncSafe('bun', ['x', 'tsx', 'scripts/run-sql-tests.ts', ...RECON_TESTS], {
  cwd: process.cwd(),
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

process.stdout.write('check:reconciliation-launch OK\n');
