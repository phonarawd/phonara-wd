#!/usr/bin/env tsx
/** Smoke-test Cursor hook scripts (not run via shell hooks). */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runHook(script: string, stdin: string): { code: number; out: string } {
  const result = spawnSync('bun', [script], {
    cwd: ROOT,
    input: stdin,
    encoding: 'utf8',
  });
  return { code: result.status ?? 1, out: (result.stdout ?? '').trim() };
}

const cases: Array<{ name: string; script: string; stdin: string; expectCode: number }> = [
  {
    name: 'e2e deny playwright',
    script: '.cursor/hooks/e2e-raw-deny.ts',
    stdin: JSON.stringify({ command: 'playwright test' }),
    expectCode: 2,
  },
  {
    name: 'e2e allow typecheck',
    script: '.cursor/hooks/e2e-raw-deny.ts',
    stdin: JSON.stringify({ command: 'bun run typecheck' }),
    expectCode: 0,
  },
  {
    name: 'secrets deny .env',
    script: '.cursor/hooks/secrets-read-deny.ts',
    stdin: JSON.stringify({ file_path: '.env' }),
    expectCode: 2,
  },
  {
    name: 'secrets allow .env.example',
    script: '.cursor/hooks/secrets-read-deny.ts',
    stdin: JSON.stringify({ file_path: '.env.example' }),
    expectCode: 0,
  },
  {
    name: 'subagent allow when idle',
    script: '.cursor/hooks/subagent-guard.ts',
    stdin: JSON.stringify({ subagent_type: 'shell' }),
    expectCode: 0,
  },
];

let failed = 0;
for (const c of cases) {
  const { code, out } = runHook(c.script, c.stdin);
  const ok = code === c.expectCode;
  if (!ok) {
    failed++;
    console.error(`FAIL ${c.name}: expected exit ${c.expectCode}, got ${code}\n  ${out}`);
  } else {
    console.log(`OK   ${c.name}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
