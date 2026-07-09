/**
 * E2E shell guard — blocks raw Playwright / repo log spam that bypasses teardown hooks.
 * Canonical paths: `bun run test:e2e*` · `bun run e2e:kill` · `bun run setup:playwright`.
 */

const ALLOW_ENV = 'PHONARA_ALLOW_RAW_E2E';

/** All `test:e2e*` · lifecycle scripts · setup — keep in sync with package.json + E2E-LOWSPEC-RUNBOOK.md */
const CANONICAL_E2E =
  /\bbun\s+run\s+(?:pretest:)?(?:posttest:)?(?:test:e2e(?::[a-z0-9-]+)?|e2e:(?:kill|pretest|posttest)|setup:playwright)\b/i;

const RAW_PLAYWRIGHT = [
  /\bplaywright\s+test\b/i,
  /\bbunx\s+playwright\b/i,
  /\bnpx\s+playwright\b/i,
  /\bpnpm\s+(exec|dlx)\s+playwright\b/i,
];

const LOG_SPAM = [
  /\bTee-Object\b/i,
  />\s*check-full-log\.txt/i,
  />\s*check-gate-log\.txt/i,
  />\s*e2e-log\.txt/i,
];

/** Manual preview/dev servers collide with Playwright webServer on 3000–3002. */
const MANUAL_DEV_SERVER = /\bbun\s+run\s+(dev:web|dev:admin|dev)\b/i;

export function isRawE2eAllowed(): boolean {
  return process.env[ALLOW_ENV] === '1';
}

export function checkE2eShellCommandForHook(command: string): {
  allowed: boolean;
  reason?: string;
} {
  if (isRawE2eAllowed()) {
    return { allowed: true };
  }

  const trimmed = command.trim();
  if (!trimmed) {
    return { allowed: true };
  }

  if (CANONICAL_E2E.test(trimmed)) {
    return { allowed: true };
  }

  if (/\bplaywright\s+install\b/i.test(trimmed) || /\bsetup:playwright\b/i.test(trimmed)) {
    return { allowed: true };
  }

  for (const pattern of RAW_PLAYWRIGHT) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason: 'Raw Playwright bypasses E2E teardown (ports 3000–3002). Use: bun run test:e2e',
      };
    }
  }

  for (const pattern of LOG_SPAM) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason:
          'Repo-root gate logs cause watcher/index lag on low-spec PCs. Use terminal output only.',
      };
    }
  }

  if (MANUAL_DEV_SERVER.test(trimmed)) {
    return {
      allowed: false,
      reason:
        'Manual dev servers collide with E2E webServer (3000–3002). Use bun run test:e2e* or stop dev servers first.',
    };
  }

  return { allowed: true };
}
