import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertDaW3GateIaProgressiveSync,
  DA_W3_DEFAULT_COLLAPSED_TEST_IDS,
  DA_W3_DEFAULT_OPEN_TEST_IDS,
  DA_W3_GATE_IA_PROGRESSIVE_ARTIFACT_PATHS,
  DA_W3_GATE_IA_PROGRESSIVE_PREREQUISITE_TODOS,
  DA_W3_GATE_IA_PROGRESSIVE_TEST_PATHS,
  DA_W3_GATE_IA_PROGRESSIVE_TODO,
  DA_W3_GATE_VISUAL_ADVISORY_CHECKLIST,
  DA_W3_GATE_VISUAL_VIEWPORT_WIDTHS,
  DA_W3_IA_PROGRESSIVE_BUNDLE_TODO,
  EARN_HOME_ABOVE_FOLD_MODULE_MAX,
  EARN_HOME_ABOVE_FOLD_MODULES,
  EARN_HOME_PROGRESSIVE_FOLD_TEST_IDS,
} from '../da-w3-gate-ia-progressive-display-contract';
import { EARN_HOME_HUB_MISSION_PREVIEW_MAX } from '../earn-home-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w3-gate-ia-progressive-display-contract §34.12–34.14 · YAML #191', () => {
  it('registers GATE todo · prerequisite bundle · above-fold ≤3 modules', () => {
    expect(DA_W3_GATE_IA_PROGRESSIVE_TODO).toBe('da-w3-gate-ia-progressive');
    expect(DA_W3_IA_PROGRESSIVE_BUNDLE_TODO).toBe('da-w3-ia-progressive-bundle');
    expect(DA_W3_GATE_IA_PROGRESSIVE_PREREQUISITE_TODOS).toEqual([
      DA_W3_IA_PROGRESSIVE_BUNDLE_TODO,
    ]);
    expect(EARN_HOME_ABOVE_FOLD_MODULES).toEqual(['status', 'next_action', 'money']);
    expect(EARN_HOME_ABOVE_FOLD_MODULES).toHaveLength(EARN_HOME_ABOVE_FOLD_MODULE_MAX);
    expect(EARN_HOME_ABOVE_FOLD_MODULE_MAX).toBe(3);
    expect(EARN_HOME_HUB_MISSION_PREVIEW_MAX).toBe(3);
  });

  it('lists Fold1–5 test ids and default open/collapsed owners', () => {
    expect(EARN_HOME_PROGRESSIVE_FOLD_TEST_IDS).toEqual([
      'earn-home-fold1',
      'earn-home-fold2',
      'earn-home-fold3',
      'earn-home-fold4',
      'earn-home-fold5',
    ]);
    expect(DA_W3_DEFAULT_OPEN_TEST_IDS).toContain('earn-home-money-fold');
    expect(DA_W3_DEFAULT_COLLAPSED_TEST_IDS).toEqual([
      'earn-home-insights-fold',
      'wallet-hero-details',
      'trade-mobile-ticket-fold',
    ]);
  });

  it('requires operator VISUAL advisory viewports 390/768/1024', () => {
    expect(DA_W3_GATE_VISUAL_VIEWPORT_WIDTHS).toEqual([390, 768, 1024]);
    expect(DA_W3_GATE_VISUAL_ADVISORY_CHECKLIST).toContain('home-above-fold-three-modules');
    expect(DA_W3_GATE_VISUAL_ADVISORY_CHECKLIST).toContain('five-tab-ia-unchanged');
  });

  it('requires GATE artifacts and owner test paths on disk', () => {
    for (const rel of DA_W3_GATE_IA_PROGRESSIVE_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W3_GATE_IA_PROGRESSIVE_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('wires Fold3 collapsed · Fold2 open · wallet/trade collapse in surface sources', () => {
    const home = readFileSync(resolve(WEB_SRC, 'product/surfaces/home/earn-home-page.tsx'), 'utf8');
    expect(home).toContain('earn-home-fold1');
    expect(home).toContain('earn-home-fold2');
    expect(home).toContain('earn-home-fold3');
    expect(home).toContain('testId="earn-home-insights-fold"');
    expect(home).toContain('defaultOpen={false}');
    expect(home).toContain('testId="earn-home-money-fold"');
    expect(home).toMatch(/fold2\.label'\)\}\s*\r?\n\s*defaultOpen\b/);

    const wallet = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/wallet/wallet-balance-hero.tsx'),
      'utf8',
    );
    expect(wallet).toContain('wallet-hero-details');
    expect(wallet).toMatch(/defaultOpen=\{false\}/);

    const trade = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/trade/trade-desk-mobile-tabs.tsx'),
      'utf8',
    );
    expect(trade).toContain('trade-mobile-ticket-fold');
    // Phase 2 polish U4: ticket fold stays defaultOpen (cognitive load · sticky CTA).
    expect(trade).toMatch(/defaultOpen(?:\s|=)/);
    expect(trade).not.toContain('defaultOpen={false}');
  });

  it('passes assertDaW3GateIaProgressiveSync', () => {
    expect(() => assertDaW3GateIaProgressiveSync()).not.toThrow();
  });
});
