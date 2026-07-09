#!/usr/bin/env tsx
/**
 * Cursor hook: deny agent-autonomous heavy gates (G13) — test:e2e · test:sql · check:full.
 * Operator override: PHONARA_ALLOW_LOCAL_HEAVY_GATE=1
 */
import { readFileSync } from 'node:fs';
import { checkAgentHeavyGateCommandForHook } from '../../scripts/lib/agent-heavy-gate-guard.ts';

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
    user_message: `Heavy gate blocked (CI authoritative): use push → GitHub Actions. Operator 1회: PHONARA_ALLOW_LOCAL_HEAVY_GATE=1`,
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
  const result = checkAgentHeavyGateCommandForHook(command);
  if (!result.allowed) {
    deny(result.reason ?? 'Agent heavy gate blocked');
  }
}

allow();
