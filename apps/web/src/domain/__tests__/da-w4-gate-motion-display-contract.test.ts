import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertDaW4GateMotionSync,
  DA_W4_GATE_MOTION_ARTIFACT_PATHS,
  DA_W4_GATE_MOTION_PREREQUISITE_TODOS,
  DA_W4_GATE_MOTION_TEST_PATHS,
  DA_W4_GATE_MOTION_TODO,
  DA_W4_GATE_MOTION_VISUAL_ADVISORY_CHECKLIST,
  DA_W4_REDUCED_MOTION_MEDIA_QUERY,
  DA_W4_REDUCED_MOTION_OWNER_PATHS,
} from '../da-w4-gate-motion-display-contract';
import { DA_W4_MOTION_SYSTEM_BUNDLE_TODO } from '../da-w4-motion-system-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w4-gate-motion-display-contract §34.15–34.16 · YAML #193', () => {
  it('registers GATE todo · prerequisite BUNDLE · reduced-motion query', () => {
    expect(DA_W4_GATE_MOTION_TODO).toBe('da-w4-gate-motion');
    expect(DA_W4_MOTION_SYSTEM_BUNDLE_TODO).toBe('da-w4-motion-system-bundle');
    expect(DA_W4_GATE_MOTION_PREREQUISITE_TODOS).toEqual([DA_W4_MOTION_SYSTEM_BUNDLE_TODO]);
    expect(DA_W4_REDUCED_MOTION_MEDIA_QUERY).toBe('(prefers-reduced-motion: reduce)');
    expect(() => assertDaW4GateMotionSync()).not.toThrow();
  });

  it('lists VISUAL advisory checklist for reduced-motion + L2 instant', () => {
    expect(DA_W4_GATE_MOTION_VISUAL_ADVISORY_CHECKLIST).toContain(
      'reduced-motion-count-up-instant',
    );
    expect(DA_W4_GATE_MOTION_VISUAL_ADVISORY_CHECKLIST).toContain('reduced-motion-aurora-static');
    expect(DA_W4_GATE_MOTION_VISUAL_ADVISORY_CHECKLIST).toContain(
      'instant-motion-variants-duration-0',
    );
    expect(DA_W4_GATE_MOTION_VISUAL_ADVISORY_CHECKLIST).toContain('l2-financial-submit-instant');
  });

  it('requires GATE artifacts and owner test paths on disk', () => {
    for (const rel of DA_W4_GATE_MOTION_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W4_GATE_MOTION_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('wires usePrefersReducedMotion + instant presets + CSS 0ms in owners', () => {
    for (const rel of DA_W4_REDUCED_MOTION_OWNER_PATHS) {
      const src = readFileSync(resolve(WEB_SRC, rel), 'utf8');
      if (rel.endsWith('use-prefers-reduced-motion.ts')) {
        expect(src).toContain('DA_W4_REDUCED_MOTION_MEDIA_QUERY');
        expect(src).toContain('usePrefersReducedMotion');
        continue;
      }
      if (rel.endsWith('motion-presets.ts')) {
        expect(src).toContain('instantMotionVariants');
        expect(src).toContain('instantMotionTransition');
        expect(src).toContain('duration: 0');
        continue;
      }
      if (rel.endsWith('motion.css')) {
        expect(src).toContain('@media (prefers-reduced-motion: reduce)');
        expect(src).toContain('--ds-motion-count-up: 0ms');
        expect(src).toContain('--ds-motion-overlay: 0ms');
        continue;
      }
      if (rel.endsWith('aurora-background.tsx')) {
        expect(src).toContain('usePrefersReducedMotion');
        expect(src).toContain('data-static');
        continue;
      }
      if (rel.endsWith('dialog.tsx') || rel.endsWith('sheet.tsx')) {
        expect(src).toContain('usePrefersReducedMotion');
        continue;
      }
      if (rel.endsWith('use-count-up.ts') || rel.endsWith('motion-tier.ts')) {
        expect(src).toMatch(/prefersReduced|prefersReducedMotion|allowsCountUpMotion/);
      }
    }
  });
});
