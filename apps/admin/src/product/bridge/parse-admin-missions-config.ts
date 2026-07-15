import type { MessageKey } from '@phonara/i18n';
import type { Json } from '@phonara/shared-types';

export type MissionExposure = 'live' | 'hidden';
export type MissionCatalogFamily = 'viral' | 'earn_limit';

export type AdminEarnLimitRow = {
  key: string;
  catalogKey: string;
  labelKey: MessageKey;
  value: string;
  description: string | null;
};

export type AdminViralMissionRow = {
  id: string;
  catalogKey: string;
  labelKey: MessageKey;
  rewardPhon: string;
  quota: string;
  quotaPeriodKey: MessageKey;
  extraValue: string | null;
  extraLabelKey: MessageKey | null;
  exposure: MissionExposure;
  enabled: boolean;
};

export type AdminMissionCatalogUpsertInput = {
  catalogKey: string;
  reason: string;
  value?: string;
  quotaValue?: string;
  extraValue?: string;
  exposure?: MissionExposure;
  enabled?: boolean;
};

type CatalogEngineRow = {
  catalog_key: string;
  family: string;
  mission_code: string | null;
  config_key: string;
  quota_config_key: string | null;
  extra_config_key: string | null;
  exposure: string;
  enabled: boolean;
  title_i18n_key: string;
  value: string | null;
  quota_value: string | null;
  extra_value: string | null;
  description: string | null;
};

const EARN_LIMIT_DEFINITIONS = [
  { key: 'referral_qualified_reward_phon', labelKey: 'admin.missions.earn.referralQualified' },
  { key: 'referral_pending_reward_phon', labelKey: 'admin.missions.earn.referralPending' },
  { key: 'referral_velocity_max_24h', labelKey: 'admin.missions.earn.referralVelocity' },
  { key: 'earn_phon_to_usdt_rate', labelKey: 'admin.missions.earn.phonToUsdtRate' },
  { key: 'earn_season_global_xp', labelKey: 'admin.missions.earn.seasonGlobalXp' },
  { key: 'launch_slots_total', labelKey: 'admin.missions.earn.launchSlots' },
] as const satisfies ReadonlyArray<{ key: string; labelKey: MessageKey }>;

const VIRAL_MISSION_DEFINITIONS = [
  {
    id: 'share_referral_link',
    labelKey: 'admin.missions.viral.shareReferralLink',
    rewardKey: 'viral_share_referral_link_reward_phon',
    quotaKey: 'viral_share_referral_link_max_per_day',
    quotaPeriodKey: 'admin.missions.quota.perDay',
    exposure: 'live',
  },
  {
    id: 'share_story_template',
    labelKey: 'admin.missions.viral.shareStoryTemplate',
    rewardKey: 'viral_share_story_template_reward_phon',
    quotaKey: 'viral_share_story_template_max_per_week',
    quotaPeriodKey: 'admin.missions.quota.perWeek',
    exposure: 'hidden',
  },
  {
    id: 'invite_friend_signup',
    labelKey: 'admin.missions.viral.inviteFriendSignup',
    rewardKey: 'viral_invite_friend_signup_reward_phon',
    quotaKey: 'viral_invite_friend_signup_max_per_day',
    quotaPeriodKey: 'admin.missions.quota.perDay',
    exposure: 'live',
  },
  {
    id: 'affiliate_content_post',
    labelKey: 'admin.missions.viral.affiliateContentPost',
    rewardKey: 'viral_affiliate_content_post_reward_phon',
    quotaKey: 'viral_affiliate_content_post_max_per_month',
    quotaPeriodKey: 'admin.missions.quota.perMonth',
    exposure: 'live',
  },
  {
    id: 'viral_streak_share',
    labelKey: 'admin.missions.viral.streakShare',
    rewardKey: 'viral_streak_share_reward_phon',
    quotaKey: 'viral_streak_share_max_per_day',
    quotaPeriodKey: 'admin.missions.quota.perDay',
    extraKey: 'viral_streak_share_min_days',
    extraLabelKey: 'admin.missions.col.minStreakDays',
    exposure: 'live',
  },
] as const satisfies ReadonlyArray<{
  id: string;
  labelKey: MessageKey;
  rewardKey: string;
  quotaKey: string;
  quotaPeriodKey: MessageKey;
  extraKey?: string;
  extraLabelKey?: MessageKey;
  exposure: MissionExposure;
}>;

function readConfigValue(config: Record<string, string>, key: string, fallback = '—'): string {
  const value = config[key];
  if (value === undefined || value === '') return fallback;
  return value;
}

function asExposure(value: string | null | undefined): MissionExposure {
  return value === 'live' ? 'live' : 'hidden';
}

function asMessageKey(value: string): MessageKey {
  return value as MessageKey;
}

/** Maps `app_config` earn-limit keys into admin desk rows (display-only · no client recompute). */
export function parseEarnLimits(
  config: Record<string, string>,
  descriptions: Record<string, string | null> = {},
): AdminEarnLimitRow[] {
  return EARN_LIMIT_DEFINITIONS.map((def) => ({
    key: def.key,
    catalogKey: `earn:${def.key}`,
    labelKey: def.labelKey,
    value: readConfigValue(config, def.key),
    description: descriptions[def.key] ?? null,
  }));
}

/** Maps viral mission `app_config` reward/quota keys into admin desk rows (§29.2 R0 read). */
export function parseViralMissions(config: Record<string, string>): AdminViralMissionRow[] {
  return VIRAL_MISSION_DEFINITIONS.map((def) => ({
    id: def.id,
    catalogKey: `viral:${def.id}`,
    labelKey: def.labelKey,
    rewardPhon: readConfigValue(config, def.rewardKey),
    quota: readConfigValue(config, def.quotaKey),
    quotaPeriodKey: def.quotaPeriodKey,
    extraValue: 'extraKey' in def && def.extraKey ? readConfigValue(config, def.extraKey) : null,
    extraLabelKey: 'extraLabelKey' in def ? (def.extraLabelKey ?? null) : null,
    exposure: def.exposure,
    enabled: true,
  }));
}

function quotaPeriodForMission(missionCode: string | null): MessageKey {
  switch (missionCode) {
    case 'share_story_template':
      return 'admin.missions.quota.perWeek';
    case 'affiliate_content_post':
      return 'admin.missions.quota.perMonth';
    default:
      return 'admin.missions.quota.perDay';
  }
}

/** Maps `rpc_admin_list_mission_catalog` JSON rows into viral + earn desk rows (E2). */
export function parseMissionCatalogRows(raw: unknown): {
  earnLimits: AdminEarnLimitRow[];
  viralMissions: AdminViralMissionRow[];
} {
  if (!Array.isArray(raw)) {
    return { earnLimits: [], viralMissions: [] };
  }

  const rows = raw.map((item) => item as CatalogEngineRow);
  const earnLimits: AdminEarnLimitRow[] = [];
  const viralMissions: AdminViralMissionRow[] = [];

  for (const row of rows) {
    if (row.family === 'earn_limit') {
      earnLimits.push({
        key: row.config_key,
        catalogKey: row.catalog_key,
        labelKey: asMessageKey(row.title_i18n_key),
        value: row.value ?? '—',
        description: row.description,
      });
      continue;
    }

    if (row.family === 'viral') {
      viralMissions.push({
        id: row.mission_code ?? row.catalog_key,
        catalogKey: row.catalog_key,
        labelKey: asMessageKey(row.title_i18n_key),
        rewardPhon: row.value ?? '—',
        quota: row.quota_value ?? '—',
        quotaPeriodKey: quotaPeriodForMission(row.mission_code),
        extraValue: row.extra_value,
        extraLabelKey: row.extra_config_key ? 'admin.missions.col.minStreakDays' : null,
        exposure: asExposure(row.exposure),
        enabled: Boolean(row.enabled),
      });
    }
  }

  earnLimits.sort((a, b) => a.catalogKey.localeCompare(b.catalogKey));
  viralMissions.sort((a, b) => a.catalogKey.localeCompare(b.catalogKey));
  return { earnLimits, viralMissions };
}

/** Builds upsert payload for `rpc_admin_upsert_mission_catalog` (no client money math). */
export function buildMissionCatalogUpsertPayload(input: AdminMissionCatalogUpsertInput): Json {
  const payload: Record<string, Json | undefined> = {
    catalog_key: input.catalogKey,
    reason: input.reason,
  };
  if (input.value !== undefined) payload['value'] = input.value;
  if (input.quotaValue !== undefined) payload['quota_value'] = input.quotaValue;
  if (input.extraValue !== undefined) payload['extra_value'] = input.extraValue;
  if (input.exposure !== undefined) payload['exposure'] = input.exposure;
  if (input.enabled !== undefined) payload['enabled'] = input.enabled;
  return payload;
}

export const ADMIN_MISSIONS_EARN_LIMIT_KEYS = EARN_LIMIT_DEFINITIONS.map((row) => row.key);
export const ADMIN_MISSIONS_VIRAL_REWARD_KEYS = VIRAL_MISSION_DEFINITIONS.map(
  (row) => row.rewardKey,
);
