/**
 * Prod DB apply guard — agent uses `bun run stack:push-remote` (canonical).
 * Raw `supabase db push` / MCP apply_migration blocked unless PHONARA_ALLOW_PROD_DB_PUSH=1 (legacy).
 */

const LOCKED_REF = 'yocjhjsdwoijfdrehzoq';

const BLOCKED_SHELL_PATTERNS: readonly RegExp[] = [
  /\bsupabase\s+db\s+push\b/i,
  /\bsupabase\s+migration\s+up\b/i,
  /\bsupabase\s+db\s+remote\s+commit\b/i,
  /\bsupabase\s+db\s+execute\b/i,
  /\bapply_migration\b/i,
  /\bdeploy_edge_function\b/i,
  /\brestore_project\b/i,
  /\bpause_project\b/i,
];

const BLOCKED_MCP_TOOLS = new Set([
  'apply_migration',
  'deploy_edge_function',
  'restore_project',
  'pause_project',
  'reset_branch',
  'merge_branch',
  'rebase_branch',
  'create_branch',
  'delete_branch',
]);

export function isProdApplyAllowed(): boolean {
  return process.env['PHONARA_ALLOW_PROD_DB_PUSH'] === '1';
}

/** Cursor hooks — respects PHONARA_ALLOW_PROD_DB_PUSH=1 (standing autonomy after local gates). */
export function checkShellCommandForHook(command: string): { allowed: boolean; reason?: string } {
  if (isProdApplyAllowed()) return { allowed: true };
  for (const pattern of BLOCKED_SHELL_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: `Blocked prod-apply shell pattern (hook; unset PHONARA_ALLOW_PROD_DB_PUSH — set =1 for legacy bypass): ${pattern.source}`,
      };
    }
  }
  return { allowed: true };
}

export function checkMcpToolForHook(
  serverName: string,
  toolName: string,
  args: Record<string, unknown> | undefined,
): { allowed: boolean; reason?: string } {
  if (isProdApplyAllowed()) {
    if (args?.['project_id'] && String(args['project_id']) !== LOCKED_REF) {
      return { allowed: false, reason: 'Blocked MCP call to non-locked Supabase project' };
    }
    return { allowed: true };
  }
  if (BLOCKED_MCP_TOOLS.has(toolName)) {
    return {
      allowed: false,
      reason: `Blocked MCP tool ${serverName}/${toolName} (hook; unset PHONARA_ALLOW_PROD_DB_PUSH — set =1 for legacy bypass)`,
    };
  }

  if (toolName === 'execute_sql' && args) {
    const query = String(args['query'] ?? '').trim();
    if (
      /^\s*(CREATE|ALTER|DROP|GRANT|REVOKE|INSERT|UPDATE|DELETE|TRUNCATE)\b/i.test(query) &&
      !/ROLLBACK\s*;?\s*$/i.test(query)
    ) {
      return {
        allowed: false,
        reason:
          'Blocked MCP execute_sql DDL/DML without trailing ROLLBACK (hook; unset PHONARA_ALLOW_PROD_DB_PUSH — set =1 for legacy bypass)',
      };
    }
  }

  if (args?.['project_id'] && String(args['project_id']) !== LOCKED_REF) {
    return { allowed: false, reason: 'Blocked MCP call to non-locked Supabase project' };
  }

  return { allowed: true };
}

export function checkShellCommand(command: string): { allowed: boolean; reason?: string } {
  if (isProdApplyAllowed()) return { allowed: true };
  for (const pattern of BLOCKED_SHELL_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: `Blocked prod-apply shell pattern: ${pattern.source} (set PHONARA_ALLOW_PROD_DB_PUSH=1 on operator shell only)`,
      };
    }
  }
  return { allowed: true };
}

export function checkMcpTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown> | undefined,
): { allowed: boolean; reason?: string } {
  if (isProdApplyAllowed()) return { allowed: true };

  if (BLOCKED_MCP_TOOLS.has(toolName)) {
    return {
      allowed: false,
      reason: `Blocked MCP tool ${serverName}/${toolName} — prod schema/deploy (operator-only)`,
    };
  }

  if (toolName === 'execute_sql' && args) {
    const query = String(args['query'] ?? '').trim();
    if (
      /^\s*(CREATE|ALTER|DROP|GRANT|REVOKE|INSERT|UPDATE|DELETE|TRUNCATE)\b/i.test(query) &&
      !/ROLLBACK\s*;?\s*$/i.test(query)
    ) {
      return {
        allowed: false,
        reason:
          'Blocked MCP execute_sql DDL/DML without trailing ROLLBACK — use local stack or operator shell',
      };
    }
  }

  if (args?.['project_id'] && String(args['project_id']) !== LOCKED_REF) {
    return { allowed: false, reason: 'Blocked MCP call to non-locked Supabase project' };
  }

  return { allowed: true };
}

export function prodApplyBoundaryReport(): string {
  const lines = [
    `[prod-apply-boundary] project lock: ${LOCKED_REF}`,
    `[prod-apply-boundary] remote apply canonical: bun run stack:push-remote`,
    `[prod-apply-boundary] PHONARA_ALLOW_PROD_DB_PUSH=${process.env['PHONARA_ALLOW_PROD_DB_PUSH'] ?? '(unset → raw push/MCP blocked)'}`,
    `[prod-apply-boundary] blocked raw: supabase db push / MCP apply_migration / deploy_edge_function`,
    `[prod-apply-boundary] allowed agent path: test:sql green → stack:push-remote → advisor 0`,
  ];
  return lines.join('\n');
}
