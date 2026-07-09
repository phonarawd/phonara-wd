#!/usr/bin/env tsx
/**
 * Cursor hook: deny raw Playwright, manual dev servers, and repo log spam (G5).
 */
import { readFileSync } from 'node:fs';
import { checkE2eShellCommandForHook } from '../../scripts/lib/e2e-shell-guard.ts';

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function deny(reason: string): never {
  const payload = {
    permission: 'deny' as const,
    user_message: `E2E/dev shell blocked: ${reason}`,
    agent_message: reason,
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
  process.exit(2);
}

function allow(): never {
  process.stdout.write('{ "permission": "allow" }\n');
  process.exit(0);
}

const raw = readStdin();
let input: Record<string, unknown> = {};
if (raw.trim()) {
  try {
    input = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    deny('invalid hook JSON');
  }
}

const command = typeof input['command'] === 'string' ? input['command'] : '';
if (command) {
  const result = checkE2eShellCommandForHook(command);
  if (!result.allowed) {
    deny(result.reason ?? 'E2E shell blocked');
  }
}

allow();
