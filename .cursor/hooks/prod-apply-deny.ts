#!/usr/bin/env tsx
/**
 * Cursor hook: deny prod schema apply from agent shells and Supabase MCP write tools.
 * stdin: hook JSON { command } or { tool_name, tool_input, ... }
 */
import { readFileSync } from 'node:fs';
import {
  checkMcpToolForHook,
  checkShellCommandForHook,
} from '../../scripts/lib/prod-apply-guard.ts';

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
    user_message: `Prod apply blocked: ${reason}`,
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
const toolName =
  typeof input['tool_name'] === 'string'
    ? input['tool_name']
    : typeof input['toolName'] === 'string'
      ? input['toolName']
      : '';
const serverName =
  typeof input['server_name'] === 'string'
    ? input['server_name']
    : typeof input['server'] === 'string'
      ? input['server']
      : 'supabase';
const toolInput =
  (input['tool_input'] as Record<string, unknown> | undefined) ??
  (input['arguments'] as Record<string, unknown> | undefined);

if (command) {
  const shell = checkShellCommandForHook(command);
  if (!shell.allowed) deny(shell.reason ?? 'shell prod apply blocked');
  allow();
}

if (toolName) {
  const mcp = checkMcpToolForHook(serverName, toolName, toolInput);
  if (!mcp.allowed) deny(mcp.reason ?? 'MCP prod apply blocked');
  allow();
}

allow();
