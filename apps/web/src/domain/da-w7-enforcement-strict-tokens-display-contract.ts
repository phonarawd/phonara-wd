/**
 * DA W7 Enforcement GATE (§34.28 · YAML #234).
 * Authority: `da-w7-enforcement-strict-tokens` · DESIGN_PRINCIPLES · PRODUCT_EXPERIENCE_CANON.
 * DoD: check:design-tokens --strict green · text-tiny utility · P3 legacy purge.
 */

export const DA_W7_ENFORCEMENT_STRICT_TOKENS_TODO = 'da-w7-enforcement-strict-tokens' as const;

/** Prerequisite GATE must be closed before this GATE. */
export const DA_W7_ENFORCEMENT_PREREQUISITE_TODOS = ['da-w6-gate-brand-elevation'] as const;

/** Next VISUAL todo after this GATE (operator §20.12). */
export const DA_W7_ENFORCEMENT_NEXT_TODO = 'da-w7-operator-visual-dae-signoff' as const;

/**
 * §34.28 GATE scan cues — strict tokens · text-tiny · legacy purge.
 * Each cue must be distinguishable without pixel visual gate.
 */
export const DA_W7_ENFORCEMENT_SCAN_CUES = {
  design_tokens_strict: 'check-design-tokens-strict-zero-hard',
  text_tiny_utility: 'ds-text-tiny-theme-bridge',
  text_10px_absorbed: 'no-text-10px-escape',
  legacy_class_purge: 'no-shadcn-primary-muted',
  legacy_bridge_purge: 'no-color-primary-bridge',
} as const;

export type DaW7EnforcementScanCue = keyof typeof DA_W7_ENFORCEMENT_SCAN_CUES;

/** Structural markers that prove strict-token enforcement artifacts. */
export const DA_W7_ENFORCEMENT_DISTINGUISH_MARKERS = {
  design_tokens_strict: ['--strict', 'text-tiny', 'legacy'],
  text_tiny_utility: ['--ds-text-tiny', '--text-tiny'],
  text_10px_absorbed: ['text-tiny', 'text-[10px]'],
  legacy_class_purge: ['text-accent', 'text-foreground-muted'],
  legacy_bridge_purge: ['--color-primary', '--color-muted-foreground'],
} as const satisfies Record<DaW7EnforcementScanCue, readonly string[]>;

/** On-disk artifacts required for W7 strict tokens GATE. */
export const DA_W7_ENFORCEMENT_ARTIFACT_PATHS = [
  'domain/da-w7-enforcement-strict-tokens-display-contract.ts',
  'product/tokens/fonts.css',
  'product/tokens/theme.css',
  'product/primitives/text.tsx',
] as const;

/** gate:ai-impl owner paths. */
export const DA_W7_ENFORCEMENT_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w7-enforcement-strict-tokens-display-contract.test.ts',
  'apps/web/src/product/tokens/__tests__/da-w7-strict-tokens.test.ts',
  'apps/web/src/product/primitives/__tests__/text-variants.test.ts',
] as const;

/** Operator VISUAL advisory checklist (full §20.12 = da-w7-operator-visual-dae-signoff). */
export const DA_W7_ENFORCEMENT_VISUAL_ADVISORY_CHECKLIST = [
  'check-design-tokens-strict-green',
  'text-tiny-trade-book-labels',
  'brand-mark-text-accent-no-hex',
  'auth-links-text-accent',
  'admin-nav-accent-active',
  'legacy-bridge-absent',
  'spacing-ratchet-advisory-only',
] as const;

/** Forbidden residues after da-w7 purge. */
export const DA_W7_FORBIDDEN_LEGACY_CLASSES = [
  'text-primary',
  'text-muted-foreground',
  'bg-primary',
  'border-primary',
] as const;

export const DA_W7_FORBIDDEN_LEGACY_BRIDGES = [
  '--color-primary',
  '--color-muted-foreground',
] as const;

/** Non-waivable sync for DA W7 GATE closeout. */
export function assertDaW7EnforcementStrictTokensSync(): void {
  if (!DA_W7_ENFORCEMENT_PREREQUISITE_TODOS.includes('da-w6-gate-brand-elevation')) {
    throw new Error('da-w7-enforcement-strict-tokens: missing prerequisite da-w6-gate-brand-elevation');
  }

  if (DA_W7_ENFORCEMENT_STRICT_TOKENS_TODO !== 'da-w7-enforcement-strict-tokens') {
    throw new Error('da-w7-enforcement-strict-tokens: todo id mismatch');
  }

  if (DA_W7_ENFORCEMENT_NEXT_TODO !== 'da-w7-operator-visual-dae-signoff') {
    throw new Error('da-w7-enforcement-strict-tokens: next todo must be visual signoff');
  }

  const cues = Object.values(DA_W7_ENFORCEMENT_SCAN_CUES);
  if (new Set(cues).size !== cues.length) {
    throw new Error('da-w7-enforcement-strict-tokens: scan cues must be unique');
  }

  if (cues.length !== 5) {
    throw new Error('da-w7-enforcement-strict-tokens: expected 5 scan cues');
  }

  if (DA_W7_ENFORCEMENT_TEST_PATHS.length < 3) {
    throw new Error('da-w7-enforcement-strict-tokens: owner test paths incomplete');
  }

  if (DA_W7_ENFORCEMENT_VISUAL_ADVISORY_CHECKLIST.length < 5) {
    throw new Error('da-w7-enforcement-strict-tokens: VISUAL advisory checklist incomplete');
  }

  if (DA_W7_FORBIDDEN_LEGACY_CLASSES.length < 4) {
    throw new Error('da-w7-enforcement-strict-tokens: forbidden legacy class list incomplete');
  }
}
