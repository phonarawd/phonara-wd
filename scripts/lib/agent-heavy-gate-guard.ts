/**
 * Agent heavy-gate guard — blocks local SQL/E2E/check:full for Cursor agents (G13).
 * Authoritative verification = GitHub Actions CI after push.
 *
 * Operator override (「gate 실행」): PHONARA_ALLOW_LOCAL_HEAVY_GATE=1
 * 정본: docs/SSOT/CI_GATE_AUTHORITY.md · .cursor/rules/80-absolute-gate-prohibitions.mdc (G13)
 */

export const ALLOW_ENV = 'PHONARA_ALLOW_LOCAL_HEAVY_GATE';

const CI_HINT =
  'Heavy gates are CI-authoritative. Push → GitHub Actions CI green. Operator 1회: PHONARA_ALLOW_LOCAL_HEAVY_GATE=1. See: docs/SSOT/CI_GATE_AUTHORITY.md · bun run ci:status';

/** Commands agents must not run autonomously on 8GB operator PC. */
const AGENT_BLOCKED = [
  /\bbun\s+run\s+(?:pretest:e2e|posttest:e2e|test:e2e(?::|\b))/i,
  /\bbun\s+run\s+(?:pretest:sql|posttest:sql|test:sql)\b/i,
  /\bbun\s+run\s+check:full\b/i,
  /\bbun\s+run\s+gate:phase-r\b/i,
  /\bsupabase\s+db\s+reset\b/i,
];

/** Commands that orchestrate heavy gates internally — allowed at shell hook level. */
const AGENT_ORCHESTRATORS = [/\bbun\s+run\s+gate:local-autopilot\b/i];

export function isLocalHeavyGateAllowed(): boolean {
  return process.env[ALLOW_ENV] === '1';
}

export function checkAgentHeavyGateCommandForHook(command: string): {
  allowed: boolean;
  reason?: string;
} {
  if (isLocalHeavyGateAllowed()) {
    return { allowed: true };
  }

  const trimmed = command.trim();
  if (!trimmed) {
    return { allowed: true };
  }

  for (const pattern of AGENT_ORCHESTRATORS) {
    if (pattern.test(trimmed)) {
      return { allowed: true };
    }
  }

  for (const pattern of AGENT_BLOCKED) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: `Agent heavy gate blocked (G13). ${CI_HINT}`,
      };
    }
  }

  return { allowed: true };
}
