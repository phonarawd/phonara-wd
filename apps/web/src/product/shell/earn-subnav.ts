import type { MessageKey } from '@phonara/i18n';

export type SubnavItem = {
  labelKey: MessageKey;
  to: string;
  end?: boolean;
  /** One-line beginner help under chip label (§13.1.3 · trade subnav). */
  helpKey?: MessageKey;
};

/** §12.19.4 earnSubnav — 9 chips pre-P9 · staking = 10th at P9 (`p9-page-staking`). */
export const EARN_SUBNAV_CORE: readonly SubnavItem[] = [
  { labelKey: 'earn.subnav.home', to: '/home', end: true },
  { labelKey: 'earn.subnav.missions', to: '/home/missions' },
  { labelKey: 'earn.subnav.attendance', to: '/home/attendance' },
  { labelKey: 'earn.subnav.referral', to: '/referral' },
  { labelKey: 'earn.subnav.tier', to: '/tier/me' },
  { labelKey: 'earn.subnav.benefits', to: '/tier/benefits' },
  { labelKey: 'earn.subnav.cashback', to: '/earn/cashback' },
  { labelKey: 'earn.subnav.play', to: '/earn/play' },
  { labelKey: 'earn.subnav.share', to: '/share/earnings' },
] as const;

export const EARN_SUBNAV_STAKING_ITEM: SubnavItem = {
  labelKey: 'earn.subnav.staking',
  to: '/staking',
};

/** Full registry (filter via §12.19.6 manifest before render). */
export const EARN_SUBNAV: readonly SubnavItem[] = [
  ...EARN_SUBNAV_CORE,
  EARN_SUBNAV_STAKING_ITEM,
] as const;
