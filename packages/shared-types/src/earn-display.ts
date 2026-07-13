/** Display-only earn/check-in row — engine hooks must not depend on UI components. */
export interface DailyCheckInDay {
  label: string;
  rewardLabel: string;
  claimed?: boolean;
  today?: boolean;
}

/** FOMO tier badge — display-only union. */
export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'prime_elite';

export type MissionStatus = 'todo' | 'claimable' | 'done';

export type MissionLane = 'daily' | 'growth' | 'viral' | 'weekly' | 'tier' | 'social';

/** Earn mission checklist row — display strings only, no client-side reward math. */
export interface MissionItem {
  id: string;
  /** i18n key for the row title, e.g. "mission.daily.todaySpin". */
  titleKey: string;
  /** "+1,000P" — display string only. */
  rewardLabel: string;
  /** Engine `reward_phon` RPC decimal — FiatHint input only; never client-recomputed. */
  rewardPhon?: string;
  /** Progress display string like "0 / 1" (no calculation). */
  progressLabel: string;
  status: MissionStatus;
  lane: MissionLane;
  /** @deprecated kept for signature compatibility. */
  demo?: boolean;
  /** Locked / coming soon — disables the button, shows locked label. */
  soon?: boolean;
}
