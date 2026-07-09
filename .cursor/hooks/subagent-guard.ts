#!/usr/bin/env tsx
/**
 * Cursor hook: low-spec guard — warn/deny subagents that compete with heavy gates (G1).
 */
import { readFileSync } from 'node:fs';
import { countActiveHeavyRepoShells } from '../../scripts/lib/cursor-dev-processes.ts';

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function respond(payload: Record<string, unknown>): never {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
  process.exit(0);
}

const raw = readStdin();
let subagentType = '';
if (raw.trim()) {
  try {
    const input = JSON.parse(raw) as Record<string, unknown>;
    subagentType =
      typeof input['subagent_type'] === 'string'
        ? input['subagent_type']
        : typeof input['subagentType'] === 'string'
          ? input['subagentType']
          : '';
  } catch {
    respond({ permission: 'allow' });
  }
}

const heavyTypes = new Set(['shell', 'generalPurpose', 'gate-runner']);
const activeHeavy = countActiveHeavyRepoShells();

if (activeHeavy > 0 && heavyTypes.has(subagentType)) {
  respond({
    permission: 'deny',
    user_message:
      'Subagent blocked: a heavy gate (test/build/e2e/check) is already running. Wait for exit code, then retry.',
    agent_message:
      'G1 violation prevented — do not spawn shell/generalPurpose subagents while vitest/playwright/E2E processes are active. Use foreground sequential gates instead.',
  });
}

if (activeHeavy > 0) {
  respond({
    permission: 'allow',
    agent_message:
      'Heavy repo shell active — avoid parallel subagents that run tests or builds. One gate at a time.',
  });
}

respond({ permission: 'allow' });
