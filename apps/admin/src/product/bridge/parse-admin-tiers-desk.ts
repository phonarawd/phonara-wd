import type { MessageKey } from '@phonara/i18n';

/** Earn VIP ladder — matches `earn_vip_tier` enum order (display-only). */
export const ADMIN_EARN_VIP_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;

export type AdminEarnVipTier = (typeof ADMIN_EARN_VIP_TIERS)[number];

export type AdminTierDistributionRow = {
  tier: AdminEarnVipTier;
  labelKey: MessageKey;
  count: number;
};

export type AdminGoldenEarthLimitRow = {
  tier: AdminEarnVipTier;
  labelKey: MessageKey;
  dailyTapCap: string;
  phonPerTap: string;
};

export type AdminEarnMissionLimitRow = {
  tier: AdminEarnVipTier;
  labelKey: MessageKey;
  attendance: string;
  roulette: string;
  referralPayout: string;
  viralShare: string;
  dailyQuiz: string;
  referralMultiplier: string;
};

export type AdminDecayPolicyRow = {
  tier: AdminEarnVipTier;
  labelKey: MessageKey;
  keepConditionKey: MessageKey;
  downgradeTargetKey: MessageKey | null;
};

export type DecayMonitorPhase = 'deferred';

const TIER_LABEL_KEYS: Record<AdminEarnVipTier, MessageKey> = {
  bronze: 'admin.tiers.tier.bronze',
  silver: 'admin.tiers.tier.silver',
  gold: 'admin.tiers.tier.gold',
  platinum: 'admin.tiers.tier.platinum',
  diamond: 'admin.tiers.tier.diamond',
};

/** Engine `_earn_limit_*` snapshot — display-only (§29.2 R0 · no client recompute). */
const EARN_MISSION_LIMITS: Record<
  AdminEarnVipTier,
  Omit<AdminEarnMissionLimitRow, 'tier' | 'labelKey'>
> = {
  bronze: {
    attendance: '1',
    roulette: '1',
    referralPayout: '3',
    viralShare: '3',
    dailyQuiz: '1',
    referralMultiplier: '1.0',
  },
  silver: {
    attendance: '1',
    roulette: '1',
    referralPayout: '5',
    viralShare: '4',
    dailyQuiz: '1',
    referralMultiplier: '1.1',
  },
  gold: {
    attendance: '1',
    roulette: '2',
    referralPayout: '8',
    viralShare: '5',
    dailyQuiz: '2',
    referralMultiplier: '1.25',
  },
  platinum: {
    attendance: '1',
    roulette: '2',
    referralPayout: '12',
    viralShare: '6',
    dailyQuiz: '2',
    referralMultiplier: '1.5',
  },
  diamond: {
    attendance: '1',
    roulette: '3',
    referralPayout: '20',
    viralShare: '8',
    dailyQuiz: '3',
    referralMultiplier: '2.0',
  },
};

const DECAY_POLICY_ROWS: ReadonlyArray<{
  tier: AdminEarnVipTier;
  keepConditionKey: MessageKey;
  downgradeTargetKey: MessageKey | null;
}> = [
  {
    tier: 'bronze',
    keepConditionKey: 'admin.tiers.decay.keep.bronze',
    downgradeTargetKey: null,
  },
  {
    tier: 'silver',
    keepConditionKey: 'admin.tiers.decay.keep.silver',
    downgradeTargetKey: 'admin.tiers.decay.target.bronze',
  },
  {
    tier: 'gold',
    keepConditionKey: 'admin.tiers.decay.keep.gold',
    downgradeTargetKey: 'admin.tiers.decay.target.silver',
  },
  {
    tier: 'platinum',
    keepConditionKey: 'admin.tiers.decay.keep.platinum',
    downgradeTargetKey: 'admin.tiers.decay.target.gold',
  },
  {
    tier: 'diamond',
    keepConditionKey: 'admin.tiers.decay.keep.diamond',
    downgradeTargetKey: 'admin.tiers.decay.target.platinum',
  },
];

export const ADMIN_TIERS_GOLDEN_EARTH_CAP_KEYS = ADMIN_EARN_VIP_TIERS.map(
  (tier) => `golden_earth_cap_${tier}` as const,
);

export const ADMIN_TIERS_GOLDEN_EARTH_REWARD_KEYS = ADMIN_EARN_VIP_TIERS.map(
  (tier) => `golden_earth_reward_${tier}` as const,
);

function readConfigValue(config: Record<string, string>, key: string, fallback = '—'): string {
  const value = config[key];
  if (value === undefined || value === '') return fallback;
  return value;
}

export type UserEarnVipReadRow = {
  tier: string;
  xp: number;
  updated_at: string;
};

/** Aggregates `user_earn_vip` rows into per-tier counts (§29.2 R0 read). */
export function parseTierDistribution(rows: UserEarnVipReadRow[]): AdminTierDistributionRow[] {
  const counts = new Map<AdminEarnVipTier, number>();
  for (const tier of ADMIN_EARN_VIP_TIERS) {
    counts.set(tier, 0);
  }

  for (const row of rows) {
    const normalized = row.tier?.toLowerCase() as AdminEarnVipTier;
    if (!ADMIN_EARN_VIP_TIERS.includes(normalized)) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return ADMIN_EARN_VIP_TIERS.map((tier) => ({
    tier,
    labelKey: TIER_LABEL_KEYS[tier],
    count: counts.get(tier) ?? 0,
  }));
}

/** Maps Golden Earth `app_config` cap/reward keys into admin desk rows. */
export function parseGoldenEarthLimits(config: Record<string, string>): AdminGoldenEarthLimitRow[] {
  return ADMIN_EARN_VIP_TIERS.map((tier) => ({
    tier,
    labelKey: TIER_LABEL_KEYS[tier],
    dailyTapCap: readConfigValue(config, `golden_earth_cap_${tier}`),
    phonPerTap: readConfigValue(config, `golden_earth_reward_${tier}`),
  }));
}

/** Static earn mission limit matrix aligned with engine helpers (display-only). */
export function parseEarnMissionLimits(): AdminEarnMissionLimitRow[] {
  return ADMIN_EARN_VIP_TIERS.map((tier) => ({
    tier,
    labelKey: TIER_LABEL_KEYS[tier],
    ...EARN_MISSION_LIMITS[tier],
  }));
}

/** Operator decay policy reference — enforcement deferred until E1 E-Wave. */
export function parseDecayPolicyRows(): AdminDecayPolicyRow[] {
  return DECAY_POLICY_ROWS.map((row) => ({
    tier: row.tier,
    labelKey: TIER_LABEL_KEYS[row.tier],
    keepConditionKey: row.keepConditionKey,
    downgradeTargetKey: row.downgradeTargetKey,
  }));
}

export function sumTierDistribution(rows: AdminTierDistributionRow[]): number {
  return rows.reduce((sum, row) => sum + row.count, 0);
}
