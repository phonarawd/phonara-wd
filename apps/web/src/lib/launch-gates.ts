/**
 * Launch exposure gates for Phase B3.
 *
 * These flags only control browser exposure. Engine/RPC paths remain intact for
 * CI, admin review, and post-launch verification.
 */
export const LAUNCH_GATES = {
  cryptoRails: false,
  sportsBetting: false,
  sportsComboBetting: false,
  sportsSystemBetting: false,
  sportsCashout: false,
  notificationsCenter: false,
  tierGuide: false,
  /** E1 — tier auto-decay engine + tier_decay_warning pref exposure on `/settings/notifications`. */
  tierDecayEngine: false,
} as const;
