import type { SubnavItem } from './earn-subnav';

/** Sportsbook-only chrome — §12.19. */
export const SPORTS_SUBNAV: readonly SubnavItem[] = [
  { labelKey: 'sports.subnav.home', to: '/sports', end: true },
  { labelKey: 'sports.subnav.prematch', to: '/sports/prematch' },
  { labelKey: 'sports.subnav.live', to: '/sports/live' },
  { labelKey: 'sports.subnav.myBets', to: '/sports/my-bets' },
  { labelKey: 'sports.subnav.rules', to: '/sports/rules' },
  { labelKey: 'sports.subnav.vip', to: '/sports/vip' },
] as const;
