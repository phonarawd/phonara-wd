import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  instantMotionTransition,
  instantMotionVariants,
  overlayMotionTransition,
  sheetMotionTransition,
} from '@/product/primitives/lib/motion-presets';
import { MOTION_MS, motionMsToSec, SPRING_GENTLE, SPRING_SNAPPY } from '@/product/tokens/motion';

const MOTION_CSS = resolve(import.meta.dirname, '../../tokens/motion.css');

describe('motion tokens §25.3 · DA W4 GATE motion-presets', () => {
  it('exposes exactly two spring presets', () => {
    expect(SPRING_SNAPPY).toEqual({ type: 'spring', stiffness: 420, damping: 32 });
    expect(SPRING_GENTLE).toEqual({ type: 'spring', stiffness: 260, damping: 30 });
  });

  it('mirrors semantic role durations from motion.css', () => {
    expect(MOTION_MS).toEqual({
      press: 120,
      field: 150,
      toggle: 150,
      surface: 200,
      overlay: 320,
      pageEnter: 250,
      countUp: 400,
    });
  });

  it('uses overlay cap for sheet and overlay L-B transitions', () => {
    expect(overlayMotionTransition.duration).toBe(motionMsToSec(MOTION_MS.overlay));
    expect(sheetMotionTransition.duration).toBe(motionMsToSec(MOTION_MS.overlay));
  });

  it('provides instant variants for prefers-reduced-motion collapse', () => {
    expect(instantMotionTransition).toEqual({ duration: 0 });
    expect(instantMotionVariants).toEqual({
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
      exit: { opacity: 1 },
    });
  });

  it('zeros CSS motion tokens under prefers-reduced-motion: reduce', () => {
    const css = readFileSync(MOTION_CSS, 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('--ds-motion-press: 0ms');
    expect(css).toContain('--ds-motion-surface: 0ms');
    expect(css).toContain('--ds-motion-overlay: 0ms');
    expect(css).toContain('--ds-motion-count-up: 0ms');
  });
});
