import { describe, expect, it } from 'vitest';

import {
  buildTierDecayPanelView,
  buildTierProgressView,
  computeTierXpProgressPercent,
  isDecayPanelEligible,
  parseEarnHubLimitsToday,
  parseEarnHubTierSnapshot,
  parseTierDecayStatusSnapshot,
  resolveDecayMaintenanceWindowDays,
  TIER_DECAY_MAINTENANCE_WINDOW_DAYS,
  TIER_DECAY_STATUS_RPC,
  TIER_KEEP_STATUS_RPC,
  TIER_ME_ROUTE,
  tierMeUsesDecayStatusRpc,
  tierMeUsesEngineRpc,
} from '../tier-me-display-contract';

describe('tier-me-display-contract', () => {
  it('locks canonical route and engine RPC', () => {
    expect(TIER_ME_ROUTE).toBe('/tier/me');
    expect(TIER_KEEP_STATUS_RPC).toBe('tier_keep_status');
    expect(tierMeUsesEngineRpc()).toBe('rpc_get_earn_hub_status');
    expect(tierMeUsesDecayStatusRpc()).toBe(TIER_DECAY_STATUS_RPC);
  });

  it('parses earn hub tier snapshot from RPC payload', () => {
    expect(
      parseEarnHubTierSnapshot({
        tier: 'silver',
        xp: 12000,
        next_tier_xp: 25000,
      }),
    ).toEqual({
      tier: 'silver',
      xp: 12000,
      nextTierXp: 25000,
    });
  });

  it('parses limits_today rows with label keys', () => {
    const rows = parseEarnHubLimitsToday({
      limits_today: [
        {
          action: 'attendance',
          label_key: 'earn.limits.action.attendance',
          used: 1,
          max: 2,
          remaining: 1,
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.labelKey).toBe('earn.limits.action.attendance');
    expect(rows[0]?.remaining).toBe(1);
  });

  it('computes XP progress within current tier band', () => {
    const snapshot = parseEarnHubTierSnapshot({
      tier: 'bronze',
      xp: 2500,
      next_tier_xp: 5000,
    })!;
    expect(computeTierXpProgressPercent(snapshot)).toBe(50);
    expect(buildTierProgressView(snapshot).nextTier).toBe('silver');
  });

  it('builds decay panel for silver+ only with policy window', () => {
    expect(isDecayPanelEligible('bronze')).toBe(false);
    expect(buildTierDecayPanelView('bronze').eligible).toBe(false);
    expect(buildTierDecayPanelView('bronze').engineLive).toBe(false);

    const silverPanel = buildTierDecayPanelView('silver');
    expect(silverPanel.eligible).toBe(true);
    expect(silverPanel.lowerTier).toBe('bronze');
    expect(silverPanel.maintenanceWindowDays).toBe(TIER_DECAY_MAINTENANCE_WINDOW_DAYS);
    expect(silverPanel.impactRows).toHaveLength(2);
    expect(silverPanel.daysLeft).toBeNull();
  });

  it('merges live decay status into panel view', () => {
    const status = parseTierDecayStatusSnapshot({
      tier: 'silver',
      eligible: true,
      grace_days: 45,
      days_left: 9,
      meets_maintenance: true,
      lower_tier: 'bronze',
    });
    const panel = buildTierDecayPanelView('silver', status);
    expect(panel.engineLive).toBe(true);
    expect(panel.daysLeft).toBe(9);
    expect(panel.meetsMaintenance).toBe(true);
  });

  it('uses extended grace window for diamond', () => {
    expect(resolveDecayMaintenanceWindowDays('diamond')).toBe(60);
    expect(resolveDecayMaintenanceWindowDays('gold')).toBe(45);
  });
});
