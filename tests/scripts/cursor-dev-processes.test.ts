import { describe, expect, it } from 'vitest';
import {
  collectE2ePortPids,
  detectOrphanListingDrift,
  isE2eToolCommandLine,
  isInProcessTreeOf,
  isOrphanPatternCommandLine,
  isRepoScopedCommandLine,
  qualifiesE2eToolOrphanWithoutRepoSlug,
  shouldIncludeWindowsProcessRow,
  type RepoDevProcess,
} from '../../scripts/lib/cursor-dev-processes';

/** DRIFT fixture: Playwright worker argv without phonara-gb (operator PC symptom #7). */
const PLAYWRIGHT_NO_REPO =
  'node C:\\Users\\PC\\AppData\\Local\\ms-playwright\\chromium-1234\\node.exe ' +
  'node_modules\\@playwright\\test\\cli.js test tests/e2e/casino.spec.ts';

const VITEST_NO_REPO = 'node node_modules/vitest/vitest.mjs run apps/web/src/domain/foo.test.ts';

const REPO_VITE =
  'node C:\\Users\\PC\\Desktop\\phonara-gb\\apps\\web\\node_modules\\vite\\bin\\vite.js';

describe('cursor-dev-processes orphan filter (DRIFT fix)', () => {
  it('detects e2e tool argv without repo slug', () => {
    expect(isRepoScopedCommandLine(PLAYWRIGHT_NO_REPO)).toBe(false);
    expect(isE2eToolCommandLine(PLAYWRIGHT_NO_REPO)).toBe(true);
    expect(isOrphanPatternCommandLine(PLAYWRIGHT_NO_REPO)).toBe(true);
  });

  it('includes playwright row when tied to E2E port listener', () => {
    const e2ePortPids = new Set([42_000]);
    expect(
      shouldIncludeWindowsProcessRow(PLAYWRIGHT_NO_REPO, 42_001, e2ePortPids, (pid) =>
        pid === 42_001 ? 42_000 : null,
      ),
    ).toBe(true);
  });

  it('excludes playwright row when E2E ports are free and argv lacks repo slug', () => {
    expect(shouldIncludeWindowsProcessRow(PLAYWRIGHT_NO_REPO, 99_001, new Set())).toBe(false);
  });

  it('qualifies orphan without repo slug only with port-tree cross-validation', () => {
    const roots = new Set([30_000]);
    const parentOf = (pid: number): number | null => (pid === 30_001 ? 30_000 : null);

    expect(qualifiesE2eToolOrphanWithoutRepoSlug(PLAYWRIGHT_NO_REPO, 30_001, roots, parentOf)).toBe(
      true,
    );
    expect(qualifiesE2eToolOrphanWithoutRepoSlug(PLAYWRIGHT_NO_REPO, 88_888, roots, parentOf)).toBe(
      false,
    );
  });

  it('collectE2ePortPids merges listeners across ports', () => {
    const pids = collectE2ePortPids([3000, 3001], (port) => (port === 3000 ? [11] : [22]));
    expect([...pids]).toEqual([11, 22]);
  });

  it('isInProcessTreeOf walks parent chain to E2E listener', () => {
    const roots = new Set([10]);
    const parentOf = (pid: number): number | null => {
      if (pid === 11) return 10;
      if (pid === 12) return 11;
      return null;
    };
    expect(isInProcessTreeOf(12, roots, parentOf)).toBe(true);
    expect(isInProcessTreeOf(99, roots, parentOf)).toBe(false);
  });

  it('post-fix: playwright on E2E port yields orphan>=1 via inclusion contract', () => {
    const e2ePortPids = new Set([50_000]);
    const pid = 50_001;
    const included = shouldIncludeWindowsProcessRow(PLAYWRIGHT_NO_REPO, pid, e2ePortPids, (p) =>
      p === pid ? 50_000 : null,
    );
    expect(included).toBe(true);

    const orphans: RepoDevProcess[] = included
      ? [{ pid, name: 'node.exe', commandLine: PLAYWRIGHT_NO_REPO }]
      : [];

    expect(orphans.length).toBeGreaterThanOrEqual(1);
    expect(
      detectOrphanListingDrift(orphans.length, [pid], new Set(orphans.map((o) => o.pid))),
    ).toEqual({ drift_detected: false, missed_pids: [] });
  });

  it('detectOrphanListingDrift flags orphan=0 with playwright PID on E2E port', () => {
    const report = detectOrphanListingDrift(0, [77_001, 77_002], new Set());
    expect(report.drift_detected).toBe(true);
    expect(report.missed_pids).toEqual([77_001, 77_002]);
  });

  it('detectOrphanListingDrift is clear when orphans list covers e2e tool pids', () => {
    const listed = new Set([77_001]);
    expect(detectOrphanListingDrift(1, [77_001], listed)).toEqual({
      drift_detected: false,
      missed_pids: [],
    });
  });

  it('still includes repo-scoped vite without requiring E2E port association', () => {
    expect(isRepoScopedCommandLine(REPO_VITE)).toBe(true);
    expect(shouldIncludeWindowsProcessRow(REPO_VITE, 12_345, new Set())).toBe(true);
  });

  it('vitest without repo slug follows same port-tree gate as playwright', () => {
    const roots = new Set([40_000]);
    expect(
      qualifiesE2eToolOrphanWithoutRepoSlug(VITEST_NO_REPO, 40_001, roots, (pid) =>
        pid === 40_001 ? 40_000 : null,
      ),
    ).toBe(true);
  });
});
