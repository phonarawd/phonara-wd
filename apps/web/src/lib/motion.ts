import type { Transition, Variants } from 'framer-motion';

export const easeOutQuart: Transition['ease'] = [0.25, 1, 0.5, 1];

export const durFast = 0.16;
export const durMed = 0.26;
export const durSlow = 0.42;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: durMed, ease: easeOutQuart },
  },
};

export const staggerChildren: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const pressTap = {
  whileTap: { scale: 0.97 },
  transition: { duration: durFast, ease: easeOutQuart },
};

export const glowPulse: Variants = {
  initial: { boxShadow: '0 0 0 0 color-mix(in srgb, var(--color-primary) 0%, transparent)' },
  animate: {
    boxShadow: [
      '0 0 0 0 color-mix(in srgb, var(--color-primary) 35%, transparent)',
      '0 0 24px 4px color-mix(in srgb, var(--color-primary) 18%, transparent)',
      '0 0 0 0 color-mix(in srgb, var(--color-primary) 0%, transparent)',
    ],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const floatY: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-6, 6, -6],
    transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const marquee: Variants = {
  initial: { x: '0%' },
  animate: {
    x: ['0%', '-50%'],
    transition: { duration: 26, repeat: Infinity, ease: 'linear' },
  },
};

export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: durFast, ease: easeOutQuart },
  },
};

export const pageEnter: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: durSlow, ease: easeOutQuart },
  },
};
