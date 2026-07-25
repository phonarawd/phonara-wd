#!/usr/bin/env tsx
/**
 * Secrets / deploy deny gate.
 *
 * Default: tracked forbidden paths + high-confidence content + .gitignore coverage.
 * Optional:
 *   --dist   scan apps/web/dist + apps/admin/dist when present (skip if missing)
 *
 * Values in violation output are always masked (never log raw secrets).
 *
 * Usage:
 *   bun run check:secrets-deploy-deny
 *   bun run check:secrets-deploy-deny -- --dist
 */
import {
  formatSecretViolations,
  scanDistTree,
  scanRepoSecretsDeny,
  type SecretViolation,
} from './lib/secrets-deploy-deny';

const DEFAULT_DIST_DIRS = ['apps/web/dist', 'apps/admin/dist'] as const;

function main(): void {
  const wantDist = process.argv.includes('--dist');
  const violations: SecretViolation[] = [...scanRepoSecretsDeny()];

  if (wantDist) {
    for (const dir of DEFAULT_DIST_DIRS) {
      // Missing dist → skip (local mid-session). Deploy hard-stop uses the same
      // flag after build so present trees are required in practice.
      violations.push(...scanDistTree(dir));
    }
  }

  if (violations.length > 0) {
    console.error(`[check:secrets-deploy-deny] FAIL — ${violations.length} violation(s)`);
    console.error(formatSecretViolations(violations));
    process.exit(1);
  }

  const distNote = wantDist ? ' · dist scanned (present trees only)' : '';
  console.log(
    `[check:secrets-deploy-deny] OK — tracked path/content + gitignore coverage${distNote}`,
  );
}

main();
