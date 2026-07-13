import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  LOCKED_SUPABASE_PROJECT_REF,
  REQUIRED_SECURITY_HEADER_TOKENS,
  assertHeadersFileContainsSecurityTokens,
  assertReleaseManifest,
  buildReleaseManifest,
  computeMigrationLockHash,
  sha256Hex,
  shortSha,
} from '../../scripts/lib/release-manifest';

describe('release-manifest (H-06 / R8)', () => {
  it('builds a schema-valid web+admin pair with shared SHA and lock hash', () => {
    const lockHash = computeMigrationLockHash();
    const sha = 'b'.repeat(40);
    const web = buildReleaseManifest({
      app: 'web',
      branch: 'preview',
      releaseSha: sha,
      migrationLockHash: lockHash,
      gitDirty: false,
      deploymentId: 'test-deploy',
      builtAt: '2026-07-13T06:00:00.000Z',
    });
    const admin = buildReleaseManifest({
      app: 'admin',
      branch: 'preview',
      releaseSha: sha,
      migrationLockHash: lockHash,
      gitDirty: false,
      deploymentId: 'test-deploy',
      builtAt: '2026-07-13T06:00:00.000Z',
    });

    expect(assertReleaseManifest(web).releaseSha).toBe(sha);
    expect(assertReleaseManifest(admin).releaseSha).toBe(sha);
    expect(web.releaseShaShort).toBe(shortSha(sha));
    expect(web.migrationLockHash).toBe(admin.migrationLockHash);
    expect(web.projectRef).toBe(LOCKED_SUPABASE_PROJECT_REF);
    expect(admin.projectRef).toBe(LOCKED_SUPABASE_PROJECT_REF);
    expect(web.gitDirty).toBe(false);
  });

  it('rejects dirty-shaped projectRef and bad sha', () => {
    expect(() =>
      assertReleaseManifest({
        schemaVersion: 1,
        app: 'web',
        releaseSha: 'not-a-sha',
        releaseShaShort: 'not-a-sh',
        deploymentId: null,
        branch: 'preview',
        migrationLockHash: 'a'.repeat(64),
        projectRef: LOCKED_SUPABASE_PROJECT_REF,
        builtAt: '2026-07-13T06:00:00.000Z',
        gitDirty: false,
      }),
    ).toThrow(/releaseSha/);

    expect(() =>
      assertReleaseManifest({
        schemaVersion: 1,
        app: 'web',
        releaseSha: 'c'.repeat(40),
        releaseShaShort: 'cccccccc',
        deploymentId: null,
        branch: 'preview',
        migrationLockHash: 'a'.repeat(64),
        projectRef: 'wrong-ref',
        builtAt: '2026-07-13T06:00:00.000Z',
        gitDirty: false,
      }),
    ).toThrow(/projectRef/);
  });

  it('hashes migration lock deterministically', () => {
    const lockPath = path.join(process.cwd(), 'supabase', 'migrations.lock.json');
    const raw = readFileSync(lockPath, 'utf8');
    expect(computeMigrationLockHash()).toBe(sha256Hex(raw));
  });

  it('requires CSP · HSTS · frame-ancestors · nosniff in web and admin _headers', () => {
    for (const rel of ['apps/web/public/_headers', 'apps/admin/public/_headers']) {
      const source = readFileSync(path.join(process.cwd(), rel), 'utf8');
      expect(() => assertHeadersFileContainsSecurityTokens(source, rel)).not.toThrow();
      for (const token of REQUIRED_SECURITY_HEADER_TOKENS) {
        expect(source).toContain(token);
      }
    }
  });
});
