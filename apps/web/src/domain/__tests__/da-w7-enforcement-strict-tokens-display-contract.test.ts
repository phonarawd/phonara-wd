import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertDaW7EnforcementStrictTokensSync,
  DA_W7_ENFORCEMENT_ARTIFACT_PATHS,
  DA_W7_ENFORCEMENT_DISTINGUISH_MARKERS,
  DA_W7_ENFORCEMENT_NEXT_TODO,
  DA_W7_ENFORCEMENT_PREREQUISITE_TODOS,
  DA_W7_ENFORCEMENT_SCAN_CUES,
  DA_W7_ENFORCEMENT_STRICT_TOKENS_TODO,
  DA_W7_ENFORCEMENT_TEST_PATHS,
  DA_W7_ENFORCEMENT_VISUAL_ADVISORY_CHECKLIST,
  DA_W7_FORBIDDEN_LEGACY_BRIDGES,
  DA_W7_FORBIDDEN_LEGACY_CLASSES,
} from '../da-w7-enforcement-strict-tokens-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w7-enforcement-strict-tokens-display-contract §34.28 · YAML #234', () => {
  it('registers GATE todo · prerequisite · next visual · unique scan cues', () => {
    expect(DA_W7_ENFORCEMENT_STRICT_TOKENS_TODO).toBe('da-w7-enforcement-strict-tokens');
    expect(DA_W7_ENFORCEMENT_PREREQUISITE_TODOS).toEqual(['da-w6-gate-brand-elevation']);
    expect(DA_W7_ENFORCEMENT_NEXT_TODO).toBe('da-w7-operator-visual-dae-signoff');
    expect(Object.keys(DA_W7_ENFORCEMENT_SCAN_CUES)).toHaveLength(5);
    expect(new Set(Object.values(DA_W7_ENFORCEMENT_SCAN_CUES)).size).toBe(5);
    expect(() => assertDaW7EnforcementStrictTokensSync()).not.toThrow();
  });

  it('lists VISUAL advisory checklist for strict tokens', () => {
    expect(DA_W7_ENFORCEMENT_VISUAL_ADVISORY_CHECKLIST).toContain(
      'check-design-tokens-strict-green',
    );
    expect(DA_W7_ENFORCEMENT_VISUAL_ADVISORY_CHECKLIST).toContain('text-tiny-trade-book-labels');
    expect(DA_W7_ENFORCEMENT_VISUAL_ADVISORY_CHECKLIST).toContain('legacy-bridge-absent');
  });

  it('requires GATE artifacts and owner test paths on disk', () => {
    for (const rel of DA_W7_ENFORCEMENT_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W7_ENFORCEMENT_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('proves text-tiny token + Text variant + legacy bridge purge', () => {
    const fonts = readFileSync(resolve(WEB_SRC, 'product/tokens/fonts.css'), 'utf8');
    const theme = readFileSync(resolve(WEB_SRC, 'product/tokens/theme.css'), 'utf8');
    const text = readFileSync(resolve(WEB_SRC, 'product/primitives/text.tsx'), 'utf8');
    const gateScript = readFileSync(resolve(REPO_ROOT, 'scripts/check-design-tokens.ts'), 'utf8');

    for (const marker of DA_W7_ENFORCEMENT_DISTINGUISH_MARKERS.text_tiny_utility) {
      if (marker === '--ds-text-tiny') expect(fonts).toContain(`${marker}:`);
      if (marker === '--text-tiny') expect(theme).toContain(`${marker}:`);
    }

    expect(text).toContain('text-tiny');
    expect(text).not.toMatch(/tiny:\s*'text-xs/);

    for (const bridge of DA_W7_FORBIDDEN_LEGACY_BRIDGES) {
      expect(theme).not.toMatch(new RegExp(`${bridge}\\s*:`));
    }

    expect(gateScript).toContain('--strict');
    expect(gateScript).toContain('text-tiny');
    expect(gateScript).toContain('text-[10px]');
  });

  it('forbids shadcn legacy class residues in purged surfaces', () => {
    const samples = [
      'routes/__root.tsx',
      'product/surfaces/auth/auth-callback-page.tsx',
      'product/surfaces/landing/landing-page.tsx',
      'product/surfaces/login/auth-entry-layout.tsx',
      'product/surfaces/trade/order-book-depth-chart.tsx',
    ];

    for (const rel of samples) {
      const source = readFileSync(resolve(WEB_SRC, rel), 'utf8');
      for (const legacy of DA_W7_FORBIDDEN_LEGACY_CLASSES) {
        expect(source).not.toMatch(new RegExp(`\\b${legacy}\\b`));
      }
      expect(source).not.toContain('text-[10px]');
      expect(source).not.toMatch(/text-\[#[0-9a-fA-F]+\]/);
    }

    const adminNav = readFileSync(
      resolve(REPO_ROOT, 'apps/admin/src/product/layout/admin-nav.tsx'),
      'utf8',
    );
    expect(adminNav).toContain('text-accent');
    expect(adminNav).not.toMatch(/\btext-primary\b/);
    expect(adminNav).not.toMatch(/\bbg-primary\b/);
  });
});
