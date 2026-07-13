import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertDaW7OperatorVisualDaeSignoffSync,
  DA_W7_DAE_DEAD_CONTROL_TEST_IDS,
  DA_W7_DAE_DESIGNER_CHECKLIST,
  DA_W7_DAE_SPOT_CHECK_SURFACES,
  DA_W7_DAE_VISUAL_APPROVED_PHRASE,
  DA_W7_DAE_VISUAL_PREVIEW_DEPLOY_SCRIPT,
  DA_W7_DAE_VISUAL_PREVIEW_URL,
  DA_W7_DAE_VISUAL_ROUTES,
  DA_W7_DAE_VISUAL_TEST_PATHS,
  DA_W7_DAE_VISUAL_VIEWPORT_WIDTHS,
  DA_W7_OPERATOR_VISUAL_DAE_SIGNOFF_TODO,
  DA_W7_VISUAL_PREREQUISITE_TODO,
} from '../da-w7-operator-visual-dae-signoff-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

describe('da-w7-operator-visual-dae-signoff-display-contract §20.12 · §34.28 · YAML #235', () => {
  it('binds VISUAL todo id and W7 strict prerequisite', () => {
    expect(DA_W7_OPERATOR_VISUAL_DAE_SIGNOFF_TODO).toBe('da-w7-operator-visual-dae-signoff');
    expect(DA_W7_VISUAL_PREREQUISITE_TODO).toBe('da-w7-enforcement-strict-tokens');
  });

  it('requires 4-tier viewport smoke (390/768/1024/2560)', () => {
    expect(DA_W7_DAE_VISUAL_VIEWPORT_WIDTHS).toEqual([390, 768, 1024, 2560]);
  });

  it('covers Home + Shell hubs + Trade desk', () => {
    expect(DA_W7_DAE_VISUAL_ROUTES).toContain('/home');
    expect(DA_W7_DAE_VISUAL_ROUTES).toContain('/wallet');
    expect(DA_W7_DAE_VISUAL_ROUTES).toContain('/trade');
    expect(DA_W7_DAE_VISUAL_ROUTES).toContain('/trade/futures');
    expect(DA_W7_DAE_VISUAL_ROUTES).toContain('/sports');
    expect(DA_W7_DAE_VISUAL_ROUTES).toContain('/casino');
    expect(DA_W7_DAE_SPOT_CHECK_SURFACES).toEqual([
      'earn-home-page',
      'app-shell-chrome',
      'spot-desk-page',
    ]);
  });

  it('lists DAE designer checklist + approved phrase + preview', () => {
    expect(DA_W7_DAE_DESIGNER_CHECKLIST.length).toBeGreaterThanOrEqual(10);
    expect(DA_W7_DAE_DESIGNER_CHECKLIST).toContain('shell-aurora-backdrop');
    expect(DA_W7_DAE_DESIGNER_CHECKLIST).toContain('trade-text-tiny-book-labels');
    expect(DA_W7_DAE_DESIGNER_CHECKLIST).toContain('responsive-4-tier-390-768-1024-2560');
    expect(DA_W7_DAE_VISUAL_APPROVED_PHRASE).toBe('VISUAL APPROVED: da-w7');
    expect(DA_W7_DAE_VISUAL_PREVIEW_DEPLOY_SCRIPT).toBe('deploy:pages:web:preview');
    expect(DA_W7_DAE_VISUAL_PREVIEW_URL).toMatch(/^https:\/\/preview\./);
  });

  it('declares dead-control test ids and owner test paths on disk', () => {
    expect(DA_W7_DAE_DEAD_CONTROL_TEST_IDS).toContain('earn-home-next-action-cta');
    expect(DA_W7_DAE_DEAD_CONTROL_TEST_IDS).toContain('bottom-nav');
    expect(DA_W7_DAE_DEAD_CONTROL_TEST_IDS).toContain('spot-submit');
    expect(DA_W7_DAE_VISUAL_TEST_PATHS.length).toBe(2);
    for (const rel of DA_W7_DAE_VISUAL_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('assertDaW7OperatorVisualDaeSignoffSync passes', () => {
    expect(() => assertDaW7OperatorVisualDaeSignoffSync()).not.toThrow();
  });
});
