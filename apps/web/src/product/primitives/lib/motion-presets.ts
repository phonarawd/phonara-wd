import type { Transition, Variants } from 'motion/react';

import { MOTION_MS, motionMsToSec, SPRING_GENTLE, SPRING_SNAPPY } from '@/product/tokens/motion';

/** §25.3 L-B — overlay enter/exit (Dialog · Sheet). */
export const overlayMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** §25.3 L-B — centered modal content. */
export const dialogContentMotionVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 4 },
};

/** §25.3 L-B — mobile bottom sheet. */
export const sheetContentMotionVariants: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};

export const overlayMotionTransition: Transition = {
  ...SPRING_GENTLE,
  duration: motionMsToSec(MOTION_MS.overlay),
};

export const dialogMotionTransition: Transition = {
  ...SPRING_GENTLE,
  duration: motionMsToSec(MOTION_MS.pageEnter),
};

export const sheetMotionTransition: Transition = {
  ...SPRING_GENTLE,
  duration: motionMsToSec(MOTION_MS.overlay),
};

/** §25.3 L-B — micro chip / counter (snappy). */
export const chipMotionTransition: Transition = SPRING_SNAPPY;

/** Reduced-motion: instant variants (no layout animation). */
export const instantMotionVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
  exit: { opacity: 1 },
};

export const instantMotionTransition: Transition = { duration: 0 };
