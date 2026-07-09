import { describe, expect, it } from 'vitest';

import {
  filterSettingsSections,
  parseAdminSettingsSections,
} from '@/product/bridge/parse-admin-settings-config';

describe('parse-admin-settings-config', () => {
  it('groups app_config keys into operator-facing sections', () => {
    const sections = parseAdminSettingsSections({
      system_halt: 'false',
      feature_spot_enabled: 'true',
      referral_velocity_max_24h: '50',
      house_exposure_alert_threshold: '0.85',
      custom_operator_key: '42',
    });

    const byId = Object.fromEntries(sections.map((section) => [section.id, section]));

    expect(byId.system?.rows.map((row) => row.key)).toEqual(['system_halt']);
    expect(byId.features?.rows.map((row) => row.key)).toEqual(['feature_spot_enabled']);
    expect(byId.missions?.rows.map((row) => row.key)).toEqual(['referral_velocity_max_24h']);
    expect(byId.alerts?.rows.map((row) => row.key)).toEqual(['house_exposure_alert_threshold']);
    expect(byId.other?.rows.map((row) => row.key)).toEqual(['custom_operator_key']);
  });

  it('filters rows by search without mutating source sections', () => {
    const sections = parseAdminSettingsSections({
      feature_spot_enabled: 'true',
      feature_game_enabled: 'false',
    });

    const filtered = filterSettingsSections(sections, 'spot');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.rows).toHaveLength(1);
    expect(filtered[0]?.rows[0]?.key).toBe('feature_spot_enabled');
    expect(sections[0]?.rows).toHaveLength(2);
  });
});
