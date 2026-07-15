import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertP13CloseoutBundleSync,
  P13_CLOSEOUT_ABSORBED_TODO_IDS,
  P13_CLOSEOUT_ARTIFACT_PATHS,
  P13_CLOSEOUT_BUNDLE_TODO,
  P13_CLOSEOUT_CANON_PATH,
  P13_CLOSEOUT_CANONICAL_TOKEN_CLASSES,
  P13_CLOSEOUT_CHECKLIST_SECTIONS,
  P13_CLOSEOUT_CI_AUTHORITY_PATH,
  P13_CLOSEOUT_DOC_SYNC_PATHS,
  P13_CLOSEOUT_ENGINE_MIGRATION_TOUCH,
  P13_CLOSEOUT_FORBIDDEN_LEGACY_BRIDGES,
  P13_CLOSEOUT_FORBIDDEN_LEGACY_CLASSES,
  P13_CLOSEOUT_LEGACY_SCAN_SAMPLE_PATHS,
  P13_CLOSEOUT_LOCAL_GATE_COMMANDS,
  P13_CLOSEOUT_MONEY_E2E_DOMAINS,
  P13_CLOSEOUT_NEXT_TODO,
  P13_CLOSEOUT_PREREQUISITE_TODO,
  P13_CLOSEOUT_REQUIRED_CI_JOBS,
  P13_CLOSEOUT_T2_SCALE_TODO,
  P13_CLOSEOUT_TEST_PATHS,
  P13_CLOSEOUT_VISUAL_CONTRACT_PATHS,
  P13_CLOSEOUT_VISUAL_SIX_TODOS,
} from '../p13-closeout-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('p13-closeout-display-contract · YAML #236 Launch Closeout BUNDLE', () => {
  it('registers BUNDLE todo · prerequisite da-w7 VISUAL · next T1 ramp · engine touch 0', () => {
    expect(P13_CLOSEOUT_BUNDLE_TODO).toBe('p13-closeout-bundle');
    expect(P13_CLOSEOUT_PREREQUISITE_TODO).toBe('da-w7-operator-visual-dae-signoff');
    expect(P13_CLOSEOUT_NEXT_TODO).toBe('launch-ramp-t1-feature-gates');
    expect(P13_CLOSEOUT_T2_SCALE_TODO).toBe('launch-scale-t2-triggers');
    expect(P13_CLOSEOUT_ENGINE_MIGRATION_TOUCH).toBe(false);
    expect(() => assertP13CloseoutBundleSync()).not.toThrow();
  });

  it('absorbs 51st-merge pillars · 3 checklist sections', () => {
    expect(P13_CLOSEOUT_ABSORBED_TODO_IDS).toEqual([
      'p13-closeout-legacy-class-purge',
      'p13-closeout-docs',
      'p13-closeout-ci',
    ]);
    expect(P13_CLOSEOUT_CHECKLIST_SECTIONS).toEqual(['legacy_class_purge', 'docs_sync', 'ci_gate']);
  });

  it('pins VISUAL six + companion contracts on disk', () => {
    expect(P13_CLOSEOUT_VISUAL_SIX_TODOS).toEqual([
      'p3-operator-visual-signoff',
      'p4-operator-visual-signoff',
      'p6-operator-visual-signoff',
      'p8-operator-visual-signoff',
      'p9-operator-visual-signoff',
      'p10-operator-visual-signoff',
    ]);
    expect(P13_CLOSEOUT_VISUAL_CONTRACT_PATHS).toHaveLength(6);
    for (const rel of P13_CLOSEOUT_VISUAL_CONTRACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('pins required CI jobs · money E2E domains · local gate commands', () => {
    expect(P13_CLOSEOUT_REQUIRED_CI_JOBS).toEqual(['quality', 'sql', 'e2e', 'advisors']);
    expect(P13_CLOSEOUT_MONEY_E2E_DOMAINS).toEqual(['wallet', 'trade', 'bet', 'casino']);
    expect(P13_CLOSEOUT_LOCAL_GATE_COMMANDS).toContain('gate:ai-impl');
    expect(P13_CLOSEOUT_LOCAL_GATE_COMMANDS).toContain('check:design-tokens --strict');

    const ciAuthority = readFileSync(resolve(REPO_ROOT, P13_CLOSEOUT_CI_AUTHORITY_PATH), 'utf8');
    for (const job of P13_CLOSEOUT_REQUIRED_CI_JOBS) {
      expect(ciAuthority.toLowerCase()).toContain(job);
    }
  });

  it('requires closeout artifacts and owner test paths on disk', () => {
    for (const rel of P13_CLOSEOUT_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
    for (const rel of P13_CLOSEOUT_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
    expect(existsSync(resolve(REPO_ROOT, P13_CLOSEOUT_CANON_PATH))).toBe(true);
  });

  it('proves theme.css legacy bridges purged · gate script enforces --strict', () => {
    const theme = readFileSync(resolve(WEB_SRC, 'product/tokens/theme.css'), 'utf8');
    const gateScript = readFileSync(resolve(REPO_ROOT, 'scripts/check-design-tokens.ts'), 'utf8');

    for (const bridge of P13_CLOSEOUT_FORBIDDEN_LEGACY_BRIDGES) {
      expect(theme).not.toMatch(new RegExp(`${bridge}\\s*:`));
    }
    expect(theme).toContain('--color-accent');
    expect(theme).toContain('--color-foreground-muted');

    expect(gateScript).toContain('--strict');
    expect(gateScript).toContain('legacy-class-p13');
    expect(gateScript).toContain('legacy-bridge-present');
  });

  it('forbids shadcn legacy class residues in closeout scan samples', () => {
    for (const rel of P13_CLOSEOUT_LEGACY_SCAN_SAMPLE_PATHS) {
      const source = readFileSync(resolve(REPO_ROOT, rel), 'utf8');
      for (const legacy of P13_CLOSEOUT_FORBIDDEN_LEGACY_CLASSES) {
        expect(source).not.toMatch(new RegExp(`\\b${legacy}\\b`));
      }
    }

    const adminNav = readFileSync(
      resolve(REPO_ROOT, 'apps/admin/src/product/layout/admin-nav.tsx'),
      'utf8',
    );
    expect(adminNav).toContain(P13_CLOSEOUT_CANONICAL_TOKEN_CLASSES[0]);
  });

  it('lists §82 doc sync paths that exist', () => {
    for (const rel of P13_CLOSEOUT_DOC_SYNC_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });
});
