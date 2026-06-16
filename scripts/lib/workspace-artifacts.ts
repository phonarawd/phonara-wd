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
 * Archival doc trees — exclude entire dirs from Cursor index + watchers.
 * `docs/archive/` holds restored Lovable reference copies (38+ files).
 */
export const CURSOR_ARCHIVAL_DIR_PATTERNS = ['docs/archive/'] as const;

/** Bulk LOCK/EXECUTE docs — glob prefix in .cursorignore (tactical docs stay indexed). */
export const CURSOR_ARCHIVAL_DOC_GLOB_PREFIXES = [
  'docs/LOVABLE_ZENITH_PHASE12_',
  'docs/PHONARA_CURSOR_PASTE_',
] as const;

/**
 * Large archival docs — exclude from Cursor semantic index + file watchers.
 * Keep tactical handoff small: INDEX · CRUSH_HANDOFF · NEW_CHAT · CURRENT_STATUS · active LOCK/EXECUTE.
 */
export const CURSOR_ARCHIVAL_DOC_PATHS = [
  'docs/PHONARA_V2_MASTER_PLAN.md',
  'docs/PHONARA_UI_UX_MASTER.md',
  'docs/PHONARA_UI_UX_REBUILD_LOG.md',
  'docs/AUDIT_REPORT_2026-06-11.md',
  'docs/AUDIT_FINAL_REPORT.md',
  'docs/ENGINE_100_HANDOFF.md',
  'docs/WORK_LOG_2026-06-14.md',
  'docs/RUNBOOK.md',
  'docs/SCORECARD.md',
  'docs/CHAT_HANDOFF_2026-06-14.md',
  'docs/GAMES-INTEGRATION.md',
  'docs/GAMES-INTEGRATION.delta.md',
  'docs/LOVABLE_ZENITH_CHAT_HANDOFF.md',
  'docs/LOVABLE_ZENITH_SESSION_HANDOFF.md',
  'docs/LOVABLE_ZENITH_MASTER_PLAN.md',
  'docs/LOVABLE_P1_FINAL_PHONARA.md',
  'docs/LOVABLE_HANDOFF.md',
  'docs/LOVABLE_PRODUCT_PLATFORM_MANIFEST.md',
  'docs/LOVABLE_WORKSPACE_DUMP_REQUEST.md',
  'docs/LOVABLE_CRASH_CHECKPOINT.md',
  'docs/LOVABLE_ABSORPTION_PLAN_FINAL.md',
  'docs/LOVABLE_ZENITH_ROADMAP.md',
  'docs/LOVABLE_ZENITH_BOOTSTRAP_PASTE.md',
  'docs/LOVABLE_ZENITH_NEW_CHAT_PASTE.md',
  'docs/LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md',
  'docs/LOVABLE_ZENITH_PHASE12_GAP_AUDIT.md',
  'docs/LOVABLE_ZENITH_PHASE12_FINAL_PARALLEL_LOCK.md',
  'docs/LOVABLE_ZENITH_PHASE12_E_LOCK.md',
  'docs/LOVABLE_ZENITH_PHASE12_B_LOCK.md',
  'docs/LOVABLE_ZENITH_PHASE12_C_LOCK.md',
  'docs/LOVABLE_ZENITH_PHASE12_D_LOCK.md',
  'docs/PHONARA_NORTH_STAR_PLAN.md',
  'docs/PHONARA_CURSOR_PASTE_CRUSH_LOCK.md',
  'docs/PHONARA_CURSOR_PASTE_CRUSH_P1_1_LOCK.md',
  'docs/PHONARA_CURSOR_PASTE_CRUSH_P1_3_LOCK.md',
  'docs/PHONARA_CURSOR_PASTE_CRUSH_P1_4_LOCK.md',
  'docs/PHONARA_CURSOR_PASTE_CRUSH_P1_5_LOCK.md',
  'docs/PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md',
  'docs/PHONARA_CURSOR_PASTE_ROUTE_DEDUP_LOCK.md',
  'docs/LOVABLE_ZENITH_CRUSH_HANDOFF.md',
  'docs/LOVABLE_ZENITH_NEW_CHAT.md',
  'project_dump.md',
] as const;

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
  'engine-dump/',
  'docs/archive/',
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
  '**/docs/archive/**',
  '**/engine-dump/**',
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
