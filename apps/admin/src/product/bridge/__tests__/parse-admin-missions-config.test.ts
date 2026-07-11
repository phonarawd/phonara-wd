import { describe, expect, it } from 'vitest';

import {
  buildMissionCatalogUpsertPayload,
  parseEarnLimits,
  parseMissionCatalogRows,
  parseViralMissions,
} from '@/product/bridge/parse-admin-missions-config';

describe('parse-admin-missions-config', () => {
  const sampleConfig: Record<string, string> = {
    referral_qualified_reward_phon: '10000',
    referral_pending_reward_phon: '500',
    referral_velocity_max_24h: '50',
    earn_phon_to_usdt_rate: '0.164',
    earn_season_global_xp: '62000',
    launch_slots_total: '1000',
    viral_share_referral_link_reward_phon: '300',
    viral_share_referral_link_max_per_day: '3',
    viral_invite_friend_signup_reward_phon: '10000',
    viral_invite_friend_signup_max_per_day: '5',
    viral_streak_share_reward_phon: '75',
    viral_streak_share_min_days: '7',
    viral_streak_share_max_per_day: '1',
  };

  it('maps earn limit keys into labeled rows', () => {
    const rows = parseEarnLimits(sampleConfig, {
      referral_qualified_reward_phon: 'Qualified referral reward',
    });

    expect(rows).toHaveLength(6);
    expect(rows[0]).toMatchObject({
      key: 'referral_qualified_reward_phon',
      catalogKey: 'earn:referral_qualified_reward_phon',
      value: '10000',
      description: 'Qualified referral reward',
    });
  });

  it('maps viral mission reward and quota keys', () => {
    const rows = parseViralMissions(sampleConfig);

    expect(rows).toHaveLength(5);
    expect(rows.find((row) => row.id === 'share_referral_link')).toMatchObject({
      catalogKey: 'viral:share_referral_link',
      rewardPhon: '300',
      quota: '3',
      exposure: 'live',
      enabled: true,
    });
    expect(rows.find((row) => row.id === 'viral_streak_share')).toMatchObject({
      extraValue: '7',
      extraLabelKey: 'admin.missions.col.minStreakDays',
    });
    expect(rows.find((row) => row.id === 'share_story_template')?.exposure).toBe('hidden');
  });

  it('parses catalog RPC rows and builds upsert payload', () => {
    const { earnLimits, viralMissions } = parseMissionCatalogRows([
      {
        catalog_key: 'earn:referral_qualified_reward_phon',
        family: 'earn_limit',
        mission_code: null,
        config_key: 'referral_qualified_reward_phon',
        quota_config_key: null,
        extra_config_key: null,
        exposure: 'live',
        enabled: true,
        title_i18n_key: 'admin.missions.earn.referralQualified',
        value: '10000',
        quota_value: null,
        extra_value: null,
        description: 'Qualified',
      },
      {
        catalog_key: 'viral:share_referral_link',
        family: 'viral',
        mission_code: 'share_referral_link',
        config_key: 'viral_share_referral_link_reward_phon',
        quota_config_key: 'viral_share_referral_link_max_per_day',
        extra_config_key: null,
        exposure: 'live',
        enabled: true,
        title_i18n_key: 'admin.missions.viral.shareReferralLink',
        value: '300',
        quota_value: '3',
        extra_value: null,
        description: null,
      },
    ]);

    expect(earnLimits).toHaveLength(1);
    expect(viralMissions[0]).toMatchObject({
      id: 'share_referral_link',
      rewardPhon: '300',
      quota: '3',
    });
    expect(
      buildMissionCatalogUpsertPayload({
        catalogKey: 'viral:share_referral_link',
        reason: 'closed beta tune',
        value: '42',
        exposure: 'hidden',
      }),
    ).toEqual({
      catalog_key: 'viral:share_referral_link',
      reason: 'closed beta tune',
      value: '42',
      exposure: 'hidden',
    });
  });

  it('uses em dash when config value is missing', () => {
    const rows = parseEarnLimits({});
    expect(rows.every((row) => row.value === '—')).toBe(true);
  });
});
