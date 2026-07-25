/**
 * Single source of truth for workspace artifacts that cause Cursor lag when
 * indexed or watched. Used by clean-artifacts, check-workspace-hygiene, and
 * agent rules — update all three consumers via this module only.
 */

/** Dirs at repo root that must be cleaned and excluded from watchers/index. */
export const ROOT_ARTIFACT_DIRS = [
  '.paste-intake/staging',
  '.turbo',
  '.vite',
  'blob-report',
  'coverage',
  'gate-manifest',
  'playwright-report',
  'test-results',
  'supabase/.temp',
  'supabase/.branches',
  'supabase/functions-sql',
] as const;

/** Files at repo root that must be cleaned. */
export const ROOT_ARTIFACT_FILES = [
  '.eslintcache',
  'tsconfig.tsbuildinfo',
  'check-full-log.txt',
  'check-gate-log.txt',
  'e2e-log.txt',
] as const;

/** Artifact names under each apps/* and packages/* workspace (session clean — no dist/build). */
export const WORKSPACE_ARTIFACT_NAMES = [
  '.turbo',
  '.vite',
  'coverage',
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
export const EPHEMERAL_AUTH_PATHS = ['tests/e2e/.auth.json', 'tests/e2e/.admin-auth.json'] as const;

/** Repo-local Cursor/MCP ephemeral files — never commit. */
export const CURSOR_EPHEMERAL_PATHS = [
  '.cursor/mcp-smoke-stderr.txt',
  '.cursor/.phonara-render-fix-at',
] as const;

/** Local perf rollout artifacts (gate-diagnosis · evidence · remediation). */
export const CURSOR_PERF_DIR = '.cursor/perf' as const;

/**
 * Archival / legacy paths excluded from Cursor index (P8 — Final UI Reset).
 * High-volume PNG mockups, deleted-doc staging, and superseded visual baselines.
 */
export const CURSOR_ARCHIVAL_DIR_PATTERNS = [
  'docs_archive',
  'archive',
  'docs/archive',
  'tests/visual/mockups',
  'tests/visual/m0-baselines',
  /** CDP visual-audit output — high-volume PNG churn; local evidence only (ACTIVE_WORK_SSOT). */
  'screenshots',
] as const;

/** Bulk LOCK globs — cleared after Presentation/paste archive purge. */
export const CURSOR_ARCHIVAL_DOC_GLOB_PREFIXES = [] as const;

/** Large docs excluded from Cursor index — RELEASE_ROADMAP.md deleted 2026-07-04 (git history). */
export const CURSOR_ARCHIVAL_DOC_PATHS = ['docs/rebuild/LOWSPEC_RULES.md'] as const;

/**
 * Patterns that MUST exist in `.cursorignore` (substring match).
 * Prevents index noise from high-volume generated paths + secret material.
 * Secrets rows align with deny inventory A (check:secrets-deploy-deny).
 */
export const CURSORIGNORE_REQUIRED_PATTERNS = [
  'node_modules/',
  '**/node_modules/',
  '.bun/',
  '**/.bun/',
  '**/dist/',
  'test-results/',
  'playwright-report/',
  'gate-manifest/',
  '.vite/',
  '**/.vite/',
  '*.tsbuildinfo',
  '.eslintcache',
  'apps/*/dist/',
  'packages/*/dist/',
  'supabase/functions-sql/',
  'engine-dump/',
  '.paste-intake/',
  '.tmp/',
  '.tmp-presentation-',
  '.tmp-zip-extract/',
  '.tmp-*/',
  'bun.lock',
  'scripts/tmp-',
  'check-full-log.txt',
  'check-gate-log.txt',
  'e2e-log.txt',
  '**/*.zip',
  '_audit/',
  'docs_archive/',
  'archive/',
  'docs/archive/',
  'tests/visual/mockups/',
  'tests/visual/m0-baselines/',
  '.cursor/perf/',
  // Secrets / key material — never index (check:secrets-deploy-deny · ignore-cursor)
  '.env',
  '.env.*',
  'setup/.env.secrets',
  '.dev.vars',
  '**/.dev.vars',
  'tests/e2e/.auth.json',
  'tests/e2e/.admin-auth.json',
  '*.pem',
  '*.p12',
  '*.pfx',
  '*.key',
  'credentials.json',
  '**/credentials.json',
  'secrets.toml',
  '**/secrets.toml',
] as const;

/**
 * Keys that MUST be present in `.vscode/settings.json` → `files.watcherExclude`.
 */
export const VSCODE_WATCHER_EXCLUDE_REQUIRED = [
  '**/node_modules/**',
  '**/.bun/**',
  '**/dist/**',
  '**/.vite/**',
  '**/test-results/**',
  '**/playwright-report/**',
  '**/gate-manifest/**',
  '**/packages/*/dist/**',
  '**/apps/*/dist/**',
  '**/.paste-intake/**',
  '**/.tmp/**',
  '**/.tmp-zip-extract/**',
  '**/.tmp-presentation-*/**',
  '**/engine-dump/**',
  '**/_audit/**',
  '**/*.zip',
  '**/docs_archive/**',
  '**/archive/**',
  '**/docs/archive/**',
  '**/tests/visual/mockups/**',
  '**/tests/visual/m0-baselines/**',
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
