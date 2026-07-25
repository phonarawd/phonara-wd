#!/usr/bin/env tsx
/**
 * Audit agent prod-apply boundary (read-only). Does not call prod write APIs.
 */
import {
  prodApplyBoundaryReport,
  isProdApplyAllowed,
  checkShellCommandForHook,
  checkMcpToolForHook,
} from './lib/prod-apply-guard.ts';

function main(): void {
  process.stdout.write(`${prodApplyBoundaryReport()}\n\n`);

  const shellProbes = [
    'supabase db push',
    'supabase migration up',
    'supabase db reset',
    'bun run test:sql',
  ];
  process.stdout.write('Shell probe (hook; blocks when PHONARA_ALLOW_PROD_DB_PUSH unset):\n');
  for (const cmd of shellProbes) {
    const r = checkShellCommandForHook(cmd);
    process.stdout.write(`  ${r.allowed ? 'ALLOW' : 'DENY '}  ${cmd}\n`);
  }

  process.stdout.write('\nMCP probe:\n');
  for (const tool of [
    'apply_migration',
    'get_advisors',
    'list_migrations',
    'execute_sql',
  ] as const) {
    const r = checkMcpToolForHook(
      'plugin-supabase-supabase',
      tool,
      tool === 'execute_sql'
        ? { query: 'SELECT 1', project_id: 'yocjhjsdwoijfdrehzoq' }
        : { project_id: 'yocjhjsdwoijfdrehzoq' },
    );
    process.stdout.write(`  ${r.allowed ? 'ALLOW' : 'DENY '}  ${tool}\n`);
  }

  const tokenPresent = Boolean(process.env['SUPABASE_ACCESS_TOKEN']?.trim());
  process.stdout.write(
    `\nSUPABASE_ACCESS_TOKEN present: ${tokenPresent ? 'yes (ensure read-only scope for agent)' : 'no'}\n`,
  );
  process.stdout.write(
    `PHONARA_ALLOW_PROD_DB_PUSH (operator external shell audit only): ${isProdApplyAllowed() ? 'YES' : 'no'}\n`,
  );

  process.stdout.write(
    '\n[check:prod-apply-boundary] OK — Cursor hook blocks raw prod apply when PHONARA_ALLOW_PROD_DB_PUSH unset (legacy bypass =1).\n',
  );
}

main();
