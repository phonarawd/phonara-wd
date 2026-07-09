import type { MessageKey } from '@phonara/i18n';

export type AdminSettingsSectionId =
  | 'system'
  | 'features'
  | 'limits'
  | 'missions'
  | 'alerts'
  | 'other';

export type AdminSettingsRowKind = 'boolean' | 'numeric' | 'text';

export type AdminSettingsRow = {
  key: string;
  value: string;
  displayValue: string;
  labelKey: MessageKey;
  kind: AdminSettingsRowKind;
};

export type AdminSettingsSection = {
  id: AdminSettingsSectionId;
  titleKey: MessageKey;
  descKey: MessageKey;
  rows: AdminSettingsRow[];
};

const SECTION_META: Record<AdminSettingsSectionId, { titleKey: MessageKey; descKey: MessageKey }> =
  {
    system: {
      titleKey: 'admin.settings.section.system',
      descKey: 'admin.settings.cron.desc',
    },
    features: {
      titleKey: 'admin.settings.flags.title',
      descKey: 'admin.settings.flags.desc',
    },
    limits: {
      titleKey: 'admin.settings.limits.title',
      descKey: 'admin.settings.limits.desc',
    },
    missions: {
      titleKey: 'admin.settings.mission.title',
      descKey: 'admin.settings.mission.desc',
    },
    alerts: {
      titleKey: 'admin.settings.section.alerts',
      descKey: 'admin.settings.section.alertsDesc',
    },
    other: {
      titleKey: 'admin.settings.section.other',
      descKey: 'admin.settings.section.otherDesc',
    },
  };

const SECTION_ORDER: AdminSettingsSectionId[] = [
  'system',
  'features',
  'limits',
  'missions',
  'alerts',
  'other',
];

const LABEL_KEYS: Record<string, MessageKey> = {
  system_halt: 'admin.operations.kill.label.system_halt',
  system_readonly: 'admin.operations.kill.label.system_readonly',
  consent_gate_enabled: 'admin.settings.key.consentGate',
  feature_spot_enabled: 'admin.operations.kill.label.feature_spot',
  feature_futures_enabled: 'admin.operations.kill.label.feature_futures',
  feature_staking_enabled: 'admin.operations.kill.label.feature_staking',
  feature_game_enabled: 'admin.operations.kill.label.feature_game',
  feature_referral_enabled: 'admin.operations.kill.label.feature_referral',
  feature_deposit_enabled: 'admin.operations.kill.label.feature_deposit',
  feature_withdrawal_enabled: 'admin.operations.kill.label.feature_withdrawal',
  feature_sports_enabled: 'admin.operations.kill.label.feature_sports',
  feature_casino_enabled: 'admin.operations.kill.label.feature_casino',
  referral_qualified_reward_phon: 'admin.missions.earn.referralQualified',
  referral_pending_reward_phon: 'admin.missions.earn.referralPending',
  referral_velocity_max_24h: 'admin.missions.earn.referralVelocity',
  earn_phon_to_usdt_rate: 'admin.missions.earn.phonToUsdtRate',
  earn_season_global_xp: 'admin.missions.earn.seasonGlobalXp',
  launch_slots_total: 'admin.missions.earn.launchSlots',
};

function classifyKey(key: string): AdminSettingsSectionId {
  if (key.startsWith('feature_')) return 'features';
  if (key.startsWith('system_') || key === 'consent_gate_enabled') return 'system';
  if (key.includes('alert') || key.includes('threshold')) return 'alerts';
  if (
    key.startsWith('referral_') ||
    key.startsWith('earn_') ||
    key.startsWith('viral_') ||
    key.includes('mission')
  ) {
    return 'missions';
  }
  if (
    key.includes('limit') ||
    key.includes('cap') ||
    key.includes('max') ||
    key.includes('min') ||
    key.includes('sla') ||
    key.includes('fee') ||
    key.includes('withdrawal') ||
    key.includes('deposit') ||
    key.includes('rate') ||
    key.includes('wagering')
  ) {
    return 'limits';
  }
  return 'other';
}

function rowKind(value: string): AdminSettingsRowKind {
  if (value === 'true' || value === 'false') return 'boolean';
  if (/^-?\d+(\.\d+)?$/.test(value)) return 'numeric';
  return 'text';
}

function formatDisplayValue(value: string, kind: AdminSettingsRowKind): string {
  if (kind === 'boolean') {
    return value === 'true' ? 'on' : 'off';
  }
  return value;
}

function labelKeyFor(key: string): MessageKey {
  return LABEL_KEYS[key] ?? 'admin.settings.key.fallback';
}

export function parseAdminSettingsSections(config: Record<string, string>): AdminSettingsSection[] {
  const buckets = new Map<AdminSettingsSectionId, AdminSettingsRow[]>();
  for (const sectionId of SECTION_ORDER) {
    buckets.set(sectionId, []);
  }

  for (const [key, value] of Object.entries(config)) {
    const sectionId = classifyKey(key);
    const kind = rowKind(value);
    buckets.get(sectionId)?.push({
      key,
      value,
      displayValue: formatDisplayValue(value, kind),
      labelKey: labelKeyFor(key),
      kind,
    });
  }

  return SECTION_ORDER.map((id) => ({
    id,
    ...SECTION_META[id],
    rows: (buckets.get(id) ?? []).sort((a, b) => a.key.localeCompare(b.key)),
  })).filter((section) => section.rows.length > 0);
}

export function filterSettingsSections(
  sections: AdminSettingsSection[],
  search: string,
): AdminSettingsSection[] {
  const q = search.trim().toLowerCase();
  if (!q) return sections;

  return sections
    .map((section) => ({
      ...section,
      rows: section.rows.filter(
        (row) => row.key.toLowerCase().includes(q) || row.value.toLowerCase().includes(q),
      ),
    }))
    .filter((section) => section.rows.length > 0);
}
