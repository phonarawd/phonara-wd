import { describe, expect, it } from 'vitest';

import {
  parseDecayPolicyRows,
  parseGoldenEarthLimits,
  parseTierDistribution,
} from '@/product/bridge/parse-admin-tiers-desk';

describe('parse-admin-tiers-desk', () => {
  it('aggregates user_earn_vip rows into tier counts', () => {
    const rows = parseTierDistribution([
      { tier: 'bronze', xp: 100, updated_at: '2026-07-01T00:00:00.000Z' },
      { tier: 'bronze', xp: 200, updated_at: '2026-07-02T00:00:00.000Z' },
      { tier: 'gold', xp: 50000, updated_at: '2026-07-03T00:00:00.000Z' },
    ]);

    expect(rows).toHaveLength(5);
    expect(rows.find((row) => row.tier === 'bronze')?.count).toBe(2);
    expect(rows.find((row) => row.tier === 'gold')?.count).toBe(1);
    expect(rows.find((row) => row.tier === 'diamond')?.count).toBe(0);
  });

  it('maps golden earth app_config keys per tier', () => {
    const rows = parseGoldenEarthLimits({
      golden_earth_cap_bronze: '1000',
      golden_earth_reward_bronze: '3.000000',
    });

    expect(rows[0]).toMatchObject({
      tier: 'bronze',
      dailyTapCap: '1000',
      phonPerTap: '3.000000',
    });
    expect(rows[4].dailyTapCap).toBe('—');
  });

  it('exposes decay policy rows for all earn vip tiers', () => {
    const rows = parseDecayPolicyRows();
    expect(rows).toHaveLength(5);
    expect(rows[0].downgradeTargetKey).toBeNull();
    expect(rows[1].downgradeTargetKey).toBe('admin.tiers.decay.target.bronze');
  });
});
