/**
 * Single source of truth for workspace artifacts that cause Cursor lag when
 * indexed or watched. Used by clean-artifacts, check-workspace-hygiene, and
 * agent rules — update all three consumers via this module only.
 */

/** Dirs at repo root that must be cleaned and excluded from watchers/index. */
export const ROOT_ARTIFACT_DIRS = [
  '.turbo',
  '.vite',
  'blob-report',
  'coverage',
  'playwright-report',
  'test-results',
  'supabase/.temp',
  'supabase/.branches',
] as const;

/** Files at repo root that must be cleaned. */
export const ROOT_ARTIFACT_FILES = [
  '.eslintcache',
  'tsconfig.tsbuildinfo',
] as const;

/** Artifact names under each apps/* and packages/* workspace. */
export const WORKSPACE_ARTIFACT_NAMES = [
  '.turbo',
  '.vite',
  'build',
  'coverage',
  'dist',
  'node_modules/.cache',
  'node_modules/.vite',
  'playwright-report',
  'test-results',
  'tsconfig.tsbuildinfo',
  'tsconfig.app.tsbuildinfo',
  'tsconfig.node.tsbuildinfo',
] as const;

export const WORKSPACE_ROOTS = ['apps', 'packages'] as const;

/** E2E ephemeral auth — never commit; cleaned on artifact sweep. */
export const EPHEMERAL_AUTH_PATHS = [
  'tests/e2e/.auth.json',
  'tests/e2e/.admin-auth.json',
] as const;

/** Repo-local Cursor/MCP ephemeral files — never commit. */
export const CURSOR_EPHEMERAL_PATHS = ['.cursor/mcp-smoke-stderr.txt'] as const;

/**
 * Patterns that MUST exist in `.cursorignore` (substring match).
 * Prevents index noise from high-volume generated paths.
 */
export const CURSORIGNORE_REQUIRED_PATTERNS = [
  'node_modules/',
  '**/node_modules/',
  '**/dist/',
  'test-results/',
  'playwright-report/',
  '.vite/',
  '**/.vite/',
  '*.tsbuildinfo',
  '.eslintcache',
  'apps/*/dist/',
  'packages/*/dist/',
  'supabase/functions-sql/',
  'bun.lock',
] as const;

/**
 * Keys that MUST be present in `.vscode/settings.json` → `files.watcherExclude`.
 */
export const VSCODE_WATCHER_EXCLUDE_REQUIRED = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.vite/**',
  '**/test-results/**',
  '**/playwright-report/**',
  '**/packages/*/dist/**',
  '**/apps/*/dist/**',
] as const;

/**
 * Leftover dirs that should never persist after a session (fail check:hygiene).
 * `dist` is intentionally omitted — builds are valid mid-session.
 */
export const SESSION_RESIDUE_DIRS = [
  'test-results',
  'playwright-report',
  'blob-report',
  'coverage',
  '.turbo',
  '.vite',
] as const;
