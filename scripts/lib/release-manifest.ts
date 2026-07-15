/**
 * R8 / H-06 — release manifest SOT (Web + Admin).
 * Exposed at `/release-manifest.json` after production build.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RELEASE_MANIFEST_SCHEMA_VERSION = 1 as const;
export const LOCKED_SUPABASE_PROJECT_REF = 'yocjhjsdwoijfdrehzoq' as const;
export const RELEASE_MANIFEST_FILENAME = 'release-manifest.json' as const;

export type ReleaseApp = 'web' | 'admin';
export type ReleaseBranch = 'main' | 'preview';

export interface ReleaseManifest {
  schemaVersion: typeof RELEASE_MANIFEST_SCHEMA_VERSION;
  app: ReleaseApp;
  releaseSha: string;
  releaseShaShort: string;
  /** Cloudflare Pages deployment id when known; null until deploy records it. */
  deploymentId: string | null;
  branch: ReleaseBranch;
  migrationLockHash: string;
  projectRef: typeof LOCKED_SUPABASE_PROJECT_REF;
  builtAt: string;
  gitDirty: boolean;
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function resolveRepoRoot(repoRoot?: string): string {
  return repoRoot ?? REPO_ROOT;
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(normalizeText(text), 'utf8').digest('hex');
}

export function computeMigrationLockHash(repoRoot?: string): string {
  const root = resolveRepoRoot(repoRoot);
  const lockPath = path.join(root, 'supabase', 'migrations.lock.json');
  if (!existsSync(lockPath)) {
    throw new Error(`migrations.lock.json missing at ${lockPath}`);
  }
  return sha256Hex(readFileSync(lockPath, 'utf8'));
}

export function readGitHeadSha(repoRoot?: string): string {
  const root = resolveRepoRoot(repoRoot);
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error(`invalid git HEAD sha: ${sha}`);
  }
  return sha.toLowerCase();
}

export function isGitWorkingTreeDirty(repoRoot?: string): boolean {
  const root = resolveRepoRoot(repoRoot);
  const out = execFileSync('git', ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  return out.length > 0;
}

export function shortSha(sha: string): string {
  return sha.slice(0, 8);
}

export function buildReleaseManifest(input: {
  app: ReleaseApp;
  branch: ReleaseBranch;
  repoRoot?: string;
  deploymentId?: string | null;
  releaseSha?: string;
  builtAt?: string;
  gitDirty?: boolean;
  migrationLockHash?: string;
}): ReleaseManifest {
  const releaseSha = (input.releaseSha ?? readGitHeadSha(input.repoRoot)).toLowerCase();
  if (!/^[0-9a-f]{40}$/i.test(releaseSha)) {
    throw new Error(`releaseSha must be 40-char hex, got: ${releaseSha}`);
  }
  const projectRef = LOCKED_SUPABASE_PROJECT_REF;
  return {
    schemaVersion: RELEASE_MANIFEST_SCHEMA_VERSION,
    app: input.app,
    releaseSha,
    releaseShaShort: shortSha(releaseSha),
    deploymentId: input.deploymentId ?? process.env.PHONARA_DEPLOYMENT_ID?.trim() ?? null,
    branch: input.branch,
    migrationLockHash: input.migrationLockHash ?? computeMigrationLockHash(input.repoRoot),
    projectRef,
    builtAt: input.builtAt ?? new Date().toISOString(),
    gitDirty: input.gitDirty ?? isGitWorkingTreeDirty(input.repoRoot),
  };
}

export function assertReleaseManifest(value: unknown): ReleaseManifest {
  if (!value || typeof value !== 'object') {
    throw new Error('release-manifest: not an object');
  }
  const m = value as Record<string, unknown>;
  if (m.schemaVersion !== RELEASE_MANIFEST_SCHEMA_VERSION) {
    throw new Error(`release-manifest: schemaVersion drift (${String(m.schemaVersion)})`);
  }
  if (m.app !== 'web' && m.app !== 'admin') {
    throw new Error(`release-manifest: invalid app ${String(m.app)}`);
  }
  if (typeof m.releaseSha !== 'string' || !/^[0-9a-f]{40}$/i.test(m.releaseSha)) {
    throw new Error('release-manifest: releaseSha must be 40-char hex');
  }
  if (typeof m.releaseShaShort !== 'string' || m.releaseShaShort !== m.releaseSha.slice(0, 8)) {
    throw new Error('release-manifest: releaseShaShort mismatch');
  }
  if (m.deploymentId !== null && typeof m.deploymentId !== 'string') {
    throw new Error('release-manifest: deploymentId must be string|null');
  }
  if (m.branch !== 'main' && m.branch !== 'preview') {
    throw new Error(`release-manifest: invalid branch ${String(m.branch)}`);
  }
  if (typeof m.migrationLockHash !== 'string' || !/^[0-9a-f]{64}$/i.test(m.migrationLockHash)) {
    throw new Error('release-manifest: migrationLockHash must be sha256 hex');
  }
  if (m.projectRef !== LOCKED_SUPABASE_PROJECT_REF) {
    throw new Error(
      `release-manifest: projectRef must be ${LOCKED_SUPABASE_PROJECT_REF} (got ${String(m.projectRef)})`,
    );
  }
  if (typeof m.builtAt !== 'string' || Number.isNaN(Date.parse(m.builtAt))) {
    throw new Error('release-manifest: builtAt must be ISO timestamp');
  }
  if (typeof m.gitDirty !== 'boolean') {
    throw new Error('release-manifest: gitDirty must be boolean');
  }
  return m as unknown as ReleaseManifest;
}

export function distManifestPath(app: ReleaseApp, repoRoot?: string): string {
  const root = resolveRepoRoot(repoRoot);
  return path.join(root, 'apps', app, 'dist', RELEASE_MANIFEST_FILENAME);
}

/** Required security header tokens for Pages `_headers` (H-06 P2). */
export const REQUIRED_SECURITY_HEADER_TOKENS = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'frame-ancestors',
  'nosniff',
] as const;

export function assertHeadersFileContainsSecurityTokens(
  headersSource: string,
  label: string,
): string[] {
  const missing: string[] = [];
  for (const token of REQUIRED_SECURITY_HEADER_TOKENS) {
    if (!headersSource.includes(token)) {
      missing.push(token);
    }
  }
  if (missing.length > 0) {
    throw new Error(`${label}: missing security header token(s): ${missing.join(', ')}`);
  }
  return [];
}
