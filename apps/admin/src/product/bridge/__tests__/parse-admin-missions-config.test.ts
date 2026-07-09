import { describe, expect, it } from 'vitest';

import { parseEarnLimits, parseViralMissions } from '@/product/bridge/parse-admin-missions-config';

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
      value: '10000',
      description: 'Qualified referral reward',
    });
  });

  it('maps viral mission reward and quota keys', () => {
    const rows = parseViralMissions(sampleConfig);

    expect(rows).toHaveLength(5);
    expect(rows.find((row) => row.id === 'share_referral_link')).toMatchObject({
      rewardPhon: '300',
      quota: '3',
      exposure: 'live',
    });
    expect(rows.find((row) => row.id === 'viral_streak_share')).toMatchObject({
      extraValue: '7',
      extraLabelKey: 'admin.missions.col.minStreakDays',
    });
    expect(rows.find((row) => row.id === 'share_story_template')?.exposure).toBe('hidden');
  });

  it('uses em dash when config value is missing', () => {
    const rows = parseEarnLimits({});
    expect(rows.every((row) => row.value === '—')).toBe(true);
  });
});
