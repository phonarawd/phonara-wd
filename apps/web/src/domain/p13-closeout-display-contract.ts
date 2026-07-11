/**
 * P13 Launch Closeout BUNDLE — legacy class purge · docs sync · CI gate
 * (§20.14.4 official GO · §25.8.1 P13 strict · YAML #236).
 * Authority: `p13-closeout-bundle` · docs/OPERATIONS/P13_LAUNCH_CLOSEOUT_BUNDLE.md
 *
 * Merges former `p13-closeout-legacy-class-purge` + `p13-closeout-docs` +
 * `p13-closeout-ci` (51st merge · same-PR required).
 * OPS/DOC + token/CI contracts — engine migration · packages/*-engine diff **0**.
 * Heavy gates (check:full · money E2E Sigma=0) = GitHub CI authoritative (G13).
 */

export const P13_CLOSEOUT_BUNDLE_TODO = 'p13-closeout-bundle' as const;

/** Prerequisite — DA W7 VISUAL agent impl must be closed before official GO. */
export const P13_CLOSEOUT_PREREQUISITE_TODO =
  'da-w7-operator-visual-dae-signoff' as const;

/** Next Track A todo after official GO (§20.14.3 Wave 6 ramp). */
export const P13_CLOSEOUT_NEXT_TODO = 'launch-ramp-t1-feature-gates' as const;

/** T2 scale follows T1 ramp (not parallel with this closeout). */
export const P13_CLOSEOUT_T2_SCALE_TODO = 'launch-scale-t2-triggers' as const;

/** Engine freeze — this bundle must not touch migrations or *-engine packages. */
export const P13_CLOSEOUT_ENGINE_MIGRATION_TOUCH = false as const;

/**
 * Absorbed pre-51st-merge todo ids — do not recreate as parallel todos.
 * Retroactive content edits forbidden (§22.8) — execute this BUNDLE only.
 */
export const P13_CLOSEOUT_ABSORBED_TODO_IDS = [
  'p13-closeout-legacy-class-purge',
  'p13-closeout-docs',
  'p13-closeout-ci',
] as const;

/** Closeout checklist section ids — 1:1 with P13_LAUNCH_CLOSEOUT_BUNDLE.md §2. */
export const P13_CLOSEOUT_CHECKLIST_SECTIONS = [
  'legacy_class_purge',
  'docs_sync',
  'ci_gate',
] as const;

export type P13CloseoutChecklistSection =
  (typeof P13_CLOSEOUT_CHECKLIST_SECTIONS)[number];

/**
 * §20.14.4 VISUAL six — Part operator visual sign-offs assumed agent-green
 * before official GO (Soft Launch prior set + P13 lock).
 */
export const P13_CLOSEOUT_VISUAL_SIX_TODOS = [
  'p3-operator-visual-signoff',
  'p4-operator-visual-signoff',
  'p6-operator-visual-signoff',
  'p8-operator-visual-signoff',
  'p9-operator-visual-signoff',
  'p10-operator-visual-signoff',
] as const;

/** Companion display-contract owners for VISUAL six (on-disk pin). */
export const P13_CLOSEOUT_VISUAL_CONTRACT_PATHS = [
  'apps/web/src/domain/auth-landing-visual-signoff-display-contract.ts',
  'apps/web/src/domain/p4-money-visual-signoff-display-contract.ts',
  'apps/web/src/domain/appshell-visual-signoff-display-contract.ts',
  'apps/web/src/domain/p8-core-visual-signoff-display-contract.ts',
  'apps/web/src/domain/p9-trade-visual-signoff-display-contract.ts',
  'apps/web/src/domain/p10-betting-visual-signoff-display-contract.ts',
] as const;

/**
 * Required GitHub CI jobs for official GO (§20.14.4 · CI_GATE_AUTHORITY).
 * Local agent must not run check:full / test:e2e / test:sql (G13).
 */
export const P13_CLOSEOUT_REQUIRED_CI_JOBS = [
  'quality',
  'sql',
  'e2e',
  'advisors',
] as const;

/** Money E2E domains that CI e2e job must keep green (Sigma=0 paths). */
export const P13_CLOSEOUT_MONEY_E2E_DOMAINS = [
  'wallet',
  'trade',
  'bet',
  'casino',
] as const;

/** Local lightweight gates that agent runs before claiming Implemented. */
export const P13_CLOSEOUT_LOCAL_GATE_COMMANDS = [
  'gate:ai-impl',
  'check:design-tokens --strict',
  'check:i18n',
  'check:release',
  'check:hygiene',
] as const;

/** Forbidden shadcn legacy utility classes after P13 strict promotion (§25.8.1). */
export const P13_CLOSEOUT_FORBIDDEN_LEGACY_CLASSES = [
  'text-primary',
  'text-muted-foreground',
  'bg-primary',
  'border-primary',
] as const;

/** Forbidden theme bridges — must be absent from theme.css. */
export const P13_CLOSEOUT_FORBIDDEN_LEGACY_BRIDGES = [
  '--color-primary',
  '--color-muted-foreground',
] as const;

/** Canonical replacements after legacy purge. */
export const P13_CLOSEOUT_CANONICAL_TOKEN_CLASSES = [
  'text-accent',
  'text-foreground-muted',
  'bg-accent',
  'border-accent',
] as const;

/** §82 / ACTIVE_WORK docs that must mention this closeout on DONE. */
export const P13_CLOSEOUT_DOC_SYNC_PATHS = [
  'docs/SSOT/ACTIVE_WORK_SSOT.md',
  'docs/CURRENT_STATUS.md',
  'docs/PRODUCT/REBUILD_PLAN_v1.md',
  'AGENTS.md',
  'docs/OPERATIONS/P13_LAUNCH_CLOSEOUT_BUNDLE.md',
] as const;

export const P13_CLOSEOUT_CANON_PATH =
  'docs/OPERATIONS/P13_LAUNCH_CLOSEOUT_BUNDLE.md' as const;

export const P13_CLOSEOUT_CI_AUTHORITY_PATH =
  'docs/SSOT/CI_GATE_AUTHORITY.md' as const;

export const P13_CLOSEOUT_ARTIFACT_PATHS = [
  P13_CLOSEOUT_CANON_PATH,
  P13_CLOSEOUT_CI_AUTHORITY_PATH,
  'apps/web/src/domain/p13-closeout-display-contract.ts',
  'apps/web/src/domain/__tests__/p13-closeout-display-contract.test.ts',
  'apps/web/src/domain/da-w7-enforcement-strict-tokens-display-contract.ts',
  'apps/web/src/product/tokens/theme.css',
  'scripts/check-design-tokens.ts',
] as const;

export const P13_CLOSEOUT_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p13-closeout-display-contract.test.ts',
  'apps/web/src/domain/__tests__/da-w7-enforcement-strict-tokens-display-contract.test.ts',
  'apps/web/src/product/tokens/__tests__/da-w7-strict-tokens.test.ts',
] as const;

/** Scan dirs for repo-wide legacy class 0 (strict · P13). */
export const P13_CLOSEOUT_LEGACY_SCAN_SAMPLE_PATHS = [
  'apps/web/src/routes/__root.tsx',
  'apps/web/src/product/surfaces/auth/auth-callback-page.tsx',
  'apps/web/src/product/surfaces/landing/landing-page.tsx',
  'apps/web/src/product/surfaces/login/auth-entry-layout.tsx',
  'apps/web/src/product/surfaces/trade/order-book-depth-chart.tsx',
  'apps/admin/src/product/layout/admin-nav.tsx',
] as const;

/** Non-waivable sync for Launch Closeout BUNDLE. */
export function assertP13CloseoutBundleSync(): void {
  if (P13_CLOSEOUT_BUNDLE_TODO !== 'p13-closeout-bundle') {
    throw new Error('p13-closeout: todo id drift');
  }
  if (P13_CLOSEOUT_PREREQUISITE_TODO !== 'da-w7-operator-visual-dae-signoff') {
    throw new Error('p13-closeout: prerequisite must be da-w7-operator-visual-dae-signoff');
  }
  if (P13_CLOSEOUT_NEXT_TODO !== 'launch-ramp-t1-feature-gates') {
    throw new Error('p13-closeout: next must be launch-ramp-t1-feature-gates');
  }
  if (P13_CLOSEOUT_ENGINE_MIGRATION_TOUCH !== false) {
    throw new Error('p13-closeout: engine migration touch must stay false');
  }
  if (P13_CLOSEOUT_ABSORBED_TODO_IDS.length !== 3) {
    throw new Error('p13-closeout: absorbed todos must be legacy + docs + ci');
  }
  if (P13_CLOSEOUT_CHECKLIST_SECTIONS.length !== 3) {
    throw new Error('p13-closeout: checklist must have 3 sections');
  }
  if (P13_CLOSEOUT_VISUAL_SIX_TODOS.length !== 6) {
    throw new Error('p13-closeout: VISUAL six required');
  }
  if (P13_CLOSEOUT_VISUAL_CONTRACT_PATHS.length !== 6) {
    throw new Error('p13-closeout: VISUAL contract paths must be 6');
  }
  if (P13_CLOSEOUT_REQUIRED_CI_JOBS.length !== 4) {
    throw new Error('p13-closeout: required CI jobs must be quality·sql·e2e·advisors');
  }
  for (const job of ['quality', 'sql', 'e2e', 'advisors'] as const) {
    if (!(P13_CLOSEOUT_REQUIRED_CI_JOBS as readonly string[]).includes(job)) {
      throw new Error(`p13-closeout: missing required CI job ${job}`);
    }
  }
  if (P13_CLOSEOUT_MONEY_E2E_DOMAINS.length !== 4) {
    throw new Error('p13-closeout: money E2E domains must be wallet·trade·bet·casino');
  }
  if (P13_CLOSEOUT_FORBIDDEN_LEGACY_CLASSES.length < 4) {
    throw new Error('p13-closeout: forbidden legacy class list incomplete');
  }
  if (P13_CLOSEOUT_FORBIDDEN_LEGACY_BRIDGES.length !== 2) {
    throw new Error('p13-closeout: forbidden bridges must be primary + muted-foreground');
  }
  if (P13_CLOSEOUT_DOC_SYNC_PATHS.length < 5) {
    throw new Error('p13-closeout: doc sync paths incomplete');
  }
}
