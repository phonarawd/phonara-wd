import type { SubnavItem } from './earn-subnav';

/** Casino lobby chrome — §12.19. M-09: tournaments row removed (no registered route). */
export const CASINO_SUBNAV: readonly SubnavItem[] = [
  { labelKey: 'casino.subnav.lobby', to: '/casino', end: true },
  { labelKey: 'casino.subnav.fairness', to: '/casino/fairness' },
] as const;
