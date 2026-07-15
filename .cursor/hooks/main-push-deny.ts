#!/usr/bin/env tsx
/**
 * Cursor hook: deny git push to main/master — feature branch workflow only.
 * stdin: hook JSON { command }
 */
import { readFileSync } from 'node:fs';
import { checkShellPushCommandForHook } from '../../scripts/lib/main-push-guard';

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
    user_message: `Main push blocked — use feature branch: bun run wip:branch then bun run git:push`,
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
  const result = checkShellPushCommandForHook(command);
  if (!result.allowed) {
    deny(result.reason ?? 'main push blocked');
  }
}

allow();
