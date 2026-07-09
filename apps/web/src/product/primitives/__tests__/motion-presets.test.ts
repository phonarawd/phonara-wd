import { describe, expect, it } from 'vitest';

import {
  overlayMotionTransition,
  sheetMotionTransition,
} from '@/product/primitives/lib/motion-presets';
import { MOTION_MS, motionMsToSec, SPRING_GENTLE, SPRING_SNAPPY } from '@/product/tokens/motion';

describe('motion tokens §25.3', () => {
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
    });
  });

  it('uses overlay cap for sheet and overlay L-B transitions', () => {
    expect(overlayMotionTransition.duration).toBe(motionMsToSec(MOTION_MS.overlay));
    expect(sheetMotionTransition.duration).toBe(motionMsToSec(MOTION_MS.overlay));
  });
});
