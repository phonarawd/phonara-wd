import type { SubnavItem } from './earn-subnav';

/** Casino lobby chrome — §12.19. */
export const CASINO_SUBNAV: readonly SubnavItem[] = [
  { labelKey: 'casino.subnav.lobby', to: '/casino', end: true },
  { labelKey: 'casino.subnav.fairness', to: '/casino/fairness' },
  { labelKey: 'casino.subnav.tournaments', to: '/casino/tournaments' },
] as const;
