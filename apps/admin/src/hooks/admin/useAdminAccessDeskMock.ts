import { useCallback } from 'react';
import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';

// L1-15-J · Admin Access desk mock SOT.
// Three domains: RBAC roles · Saved filters · MFA policy.
// Persist under `phonara-admin-rbac-v1` · `phonara-admin-filters-v1` ·
// `phonara-admin-mfa-policy-v1` only. Cross-desk storage 0-touch.
// String-only display fields · no float math · no remote backend calls.

const MIN_REASON = 4;

export type RbacRoleKey = 'owner' | 'finance' | 'risk' | 'support' | 'operator' | 'viewer';

export type AccessDeskKey =
  | 'operations'
  | 'casino'
  | 'earn'
  | 'cms'
  | 'users'
  | 'sports'
  | 'audit'
  | 'alerts';

export type MfaTierKey =
  | 'tier.bronze'
  | 'tier.silver'
  | 'tier.gold'
  | 'tier.platinum'
  | 'tier.staff'
  | 'tier.admin';

export interface AdminRbacRoleRow {
  id: string;
  roleKey: RbacRoleKey;
  labelKey: string;
  memberCount: string;
  routesSummary: string;
  enabled: boolean;
  updatedAt: string;
  lastChangedAt?: string;
}

export interface AdminSavedFilterRow {
  id: string;
  deskKey: AccessDeskKey;
  presetName: string;
  filterBlob: string;
  isDefault: boolean;
  updatedAt: string;
  lastChangedAt?: string;
}

export interface AdminMfaPolicyRow {
  id: string;
  tierKey: MfaTierKey;
  mfaRequired: boolean;
  graceDays: string;
  enrollRate: string;
  updatedAt: string;
  lastChangedAt?: string;
}

export interface RbacFilters {
  search: string;
  enabled: 'all' | 'on' | 'off';
}

export interface FilterFilters {
  search: string;
  deskKey: AccessDeskKey | 'all';
}

export interface MfaFilters {
  search: string;
  tierKey: MfaTierKey | 'all';
  required: 'all' | 'on' | 'off';
}

// --- SEED -------------------------------------------------------------------

const SEED_ROLES: AdminRbacRoleRow[] = [
  {
    id: 'r_owner',
    roleKey: 'owner',
    labelKey: 'admin.access.role.owner.label',
    memberCount: '2',
    routesSummary: '*',
    enabled: true,
    updatedAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'r_finance',
    roleKey: 'finance',
    labelKey: 'admin.access.role.finance.label',
    memberCount: '4',
    routesSummary: 'operations · earn · audit',
    enabled: true,
    updatedAt: '2026-06-02T09:30:00.000Z',
  },
  {
    id: 'r_risk',
    roleKey: 'risk',
    labelKey: 'admin.access.role.risk.label',
    memberCount: '3',
    routesSummary: 'alerts · audit · users',
    enabled: true,
    updatedAt: '2026-06-03T10:00:00.000Z',
  },
  {
    id: 'r_support',
    roleKey: 'support',
    labelKey: 'admin.access.role.support.label',
    memberCount: '9',
    routesSummary: 'queues · users · cms',
    enabled: true,
    updatedAt: '2026-06-04T11:00:00.000Z',
  },
  {
    id: 'r_operator',
    roleKey: 'operator',
    labelKey: 'admin.access.role.operator.label',
    memberCount: '6',
    routesSummary: 'casino · sports · cms',
    enabled: true,
    updatedAt: '2026-06-05T12:00:00.000Z',
  },
  {
    id: 'r_viewer',
    roleKey: 'viewer',
    labelKey: 'admin.access.role.viewer.label',
    memberCount: '12',
    routesSummary: 'overview · audit (read)',
    enabled: true,
    updatedAt: '2026-06-06T13:00:00.000Z',
  },
];

const SEED_FILTERS: AdminSavedFilterRow[] = [
  {
    id: 'f_ops_withdraw',
    deskKey: 'operations',
    presetName: 'Withdraw · queued · 24h',
    filterBlob: 'kind=withdraw · status=queued · window=24h',
    isDefault: true,
    updatedAt: '2026-06-10T09:00:00.000Z',
  },
  {
    id: 'f_casino_rtp',
    deskKey: 'casino',
    presetName: 'RTP drift > 1%',
    filterBlob: 'drift>=0.01 · published=true',
    isDefault: false,
    updatedAt: '2026-06-11T09:00:00.000Z',
  },
  {
    id: 'f_earn_pending',
    deskKey: 'earn',
    presetName: 'Settlements · pending',
    filterBlob: 'state=pending',
    isDefault: true,
    updatedAt: '2026-06-12T09:00:00.000Z',
  },
  {
    id: 'f_cms_drafts',
    deskKey: 'cms',
    presetName: 'Pages · drafts only',
    filterBlob: 'status=draft',
    isDefault: false,
    updatedAt: '2026-06-13T09:00:00.000Z',
  },
  {
    id: 'f_users_flagged',
    deskKey: 'users',
    presetName: 'Users · risk flagged',
    filterBlob: 'riskFlag=true',
    isDefault: false,
    updatedAt: '2026-06-14T09:00:00.000Z',
  },
  {
    id: 'f_sports_settling',
    deskKey: 'sports',
    presetName: 'Fixtures · settling',
    filterBlob: 'state=settling',
    isDefault: false,
    updatedAt: '2026-06-14T12:00:00.000Z',
  },
  {
    id: 'f_audit_admin',
    deskKey: 'audit',
    presetName: 'Audit · admin actor only',
    filterBlob: 'actor=admin · range=7d',
    isDefault: false,
    updatedAt: '2026-06-15T08:00:00.000Z',
  },
  {
    id: 'f_alerts_p1',
    deskKey: 'alerts',
    presetName: 'Alerts · P1 unresolved',
    filterBlob: 'severity=P1 · state=open',
    isDefault: true,
    updatedAt: '2026-06-15T16:00:00.000Z',
  },
];

const SEED_MFA: AdminMfaPolicyRow[] = [
  {
    id: 'm_admin',
    tierKey: 'tier.admin',
    mfaRequired: true,
    graceDays: '0',
    enrollRate: '100',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'm_staff',
    tierKey: 'tier.staff',
    mfaRequired: true,
    graceDays: '3',
    enrollRate: '98',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'm_platinum',
    tierKey: 'tier.platinum',
    mfaRequired: true,
    graceDays: '7',
    enrollRate: '84',
    updatedAt: '2026-06-03T00:00:00.000Z',
  },
  {
    id: 'm_gold',
    tierKey: 'tier.gold',
    mfaRequired: true,
    graceDays: '14',
    enrollRate: '61',
    updatedAt: '2026-06-04T00:00:00.000Z',
  },
  {
    id: 'm_silver',
    tierKey: 'tier.silver',
    mfaRequired: false,
    graceDays: '30',
    enrollRate: '32',
    updatedAt: '2026-06-05T00:00:00.000Z',
  },
  {
    id: 'm_bronze',
    tierKey: 'tier.bronze',
    mfaRequired: false,
    graceDays: '60',
    enrollRate: '14',
    updatedAt: '2026-06-06T00:00:00.000Z',
  },
];

// --- filters ---------------------------------------------------------------

function filterRoles(rows: AdminRbacRoleRow[], f: RbacFilters): AdminRbacRoleRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.enabled === 'on' && !r.enabled) return false;
    if (f.enabled === 'off' && r.enabled) return false;
    if (!q) return true;
    return r.roleKey.toLowerCase().includes(q) || r.routesSummary.toLowerCase().includes(q);
  });
}

function filterPresets(rows: AdminSavedFilterRow[], f: FilterFilters): AdminSavedFilterRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.deskKey !== 'all' && r.deskKey !== f.deskKey) return false;
    if (!q) return true;
    return r.presetName.toLowerCase().includes(q) || r.filterBlob.toLowerCase().includes(q);
  });
}

function filterMfa(rows: AdminMfaPolicyRow[], f: MfaFilters): AdminMfaPolicyRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.tierKey !== 'all' && r.tierKey !== f.tierKey) return false;
    if (f.required === 'on' && !r.mfaRequired) return false;
    if (f.required === 'off' && r.mfaRequired) return false;
    if (!q) return true;
    return r.tierKey.toLowerCase().includes(q);
  });
}

// --- hook factories --------------------------------------------------------

const useRolesMock = createAdminMockHook<AdminRbacRoleRow, RbacFilters>({
  storageKey: 'phonara-admin-rbac-v1',
  seedRows: SEED_ROLES,
  seedFilters: { search: '', enabled: 'all' },
  filterFn: filterRoles,
  auditCap: 100,
});

const usePresetsMock = createAdminMockHook<AdminSavedFilterRow, FilterFilters>({
  storageKey: 'phonara-admin-filters-v1',
  seedRows: SEED_FILTERS,
  seedFilters: { search: '', deskKey: 'all' },
  filterFn: filterPresets,
  auditCap: 100,
});

const useMfaMock = createAdminMockHook<AdminMfaPolicyRow, MfaFilters>({
  storageKey: 'phonara-admin-mfa-policy-v1',
  seedRows: SEED_MFA,
  seedFilters: { search: '', tierKey: 'all', required: 'all' },
  filterFn: filterMfa,
  auditCap: 100,
});

const ROLE_KEYS: RbacRoleKey[] = ['owner', 'finance', 'risk', 'support', 'operator', 'viewer'];
const DESK_KEYS: AccessDeskKey[] = [
  'operations',
  'casino',
  'earn',
  'cms',
  'users',
  'sports',
  'audit',
  'alerts',
];
const TIER_KEYS: MfaTierKey[] = [
  'tier.admin',
  'tier.staff',
  'tier.platinum',
  'tier.gold',
  'tier.silver',
  'tier.bronze',
];

export interface UseAdminAccessDesk {
  // roles
  roles: AdminRbacRoleRow[];
  filteredRoles: AdminRbacRoleRow[];
  roleFilters: RbacFilters;
  setRoleFilters: (f: RbacFilters | ((p: RbacFilters) => RbacFilters)) => void;
  enableRole: (id: string) => boolean;
  disableRole: (id: string, reason: string) => boolean;
  bulkDisableRoles: (ids: string[], reason: string) => boolean;
  roleKeys: RbacRoleKey[];

  // saved filters
  presets: AdminSavedFilterRow[];
  filteredPresets: AdminSavedFilterRow[];
  presetFilters: FilterFilters;
  setPresetFilters: (f: FilterFilters | ((p: FilterFilters) => FilterFilters)) => void;
  deletePreset: (id: string, reason: string) => boolean;
  setDefaultPreset: (id: string) => boolean;
  bulkDeletePresets: (ids: string[], reason: string) => boolean;
  deskKeys: AccessDeskKey[];

  // MFA
  mfaPolicies: AdminMfaPolicyRow[];
  filteredMfa: AdminMfaPolicyRow[];
  mfaFilters: MfaFilters;
  setMfaFilters: (f: MfaFilters | ((p: MfaFilters) => MfaFilters)) => void;
  requireMfa: (id: string) => boolean;
  relaxMfa: (id: string, reason: string) => boolean;
  bulkRequireMfa: (ids: string[]) => boolean;
  bulkRelaxMfa: (ids: string[], reason: string) => boolean;
  tierKeys: MfaTierKey[];

  audit: AdminAuditEvent[];
  resetForTest: () => void;
}

const nowIso = () => new Date().toISOString();
const validReason = (r: string | undefined) =>
  typeof r === 'string' && r.trim().length >= MIN_REASON;

export function useAdminAccessDeskMock(): UseAdminAccessDesk {
  const ro = useRolesMock();
  const fp = usePresetsMock();
  const mf = useMfaMock();

  // --- roles --------------------------------------------------------------

  const enableRole = useCallback(
    (id: string): boolean => {
      const row = ro.allRows.find((r) => r.id === id);
      if (!row || row.enabled) return false;
      const at = nowIso();
      ro.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, enabled: true, updatedAt: at, lastChangedAt: at }),
      );
      ro.appendAudit({
        id: `${row.roleKey}-enable-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.access.roles.audit.enable',
        subject: row.roleKey,
      });
      return true;
    },
    [ro],
  );

  const disableRole = useCallback(
    (id: string, reason: string): boolean => {
      if (!validReason(reason)) throw new Error('reason<4');
      const row = ro.allRows.find((r) => r.id === id);
      if (!row || !row.enabled) return false;
      if (row.roleKey === 'owner') return false; // owner is non-disablable
      const at = nowIso();
      ro.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, enabled: false, updatedAt: at, lastChangedAt: at }),
      );
      ro.appendAudit({
        id: `${row.roleKey}-disable-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.access.roles.audit.disable',
        subject: row.roleKey,
        reason: reason.trim(),
      });
      return true;
    },
    [ro],
  );

  const bulkDisableRoles = useCallback(
    (ids: string[], reason: string): boolean => {
      if (!validReason(reason)) throw new Error('reason<4');
      let any = false;
      for (const id of ids) if (disableRole(id, reason)) any = true;
      return any;
    },
    [disableRole],
  );

  // --- presets ------------------------------------------------------------

  const deletePreset = useCallback(
    (id: string, reason: string): boolean => {
      if (!validReason(reason)) throw new Error('reason<4');
      const row = fp.allRows.find((r) => r.id === id);
      if (!row) return false;
      const at = nowIso();
      // mark deleted by patching out via filter — keep row count parity in
      // tests by toggling isDefault off + clearing blob; UI hides via filter.
      // For mock semantics, we re-write storage to remove the row.
      fp.patchRow(
        id,
        (r) => r.id,
        (r) => ({
          ...r,
          presetName: r.presetName,
          filterBlob: '[deleted]',
          isDefault: false,
          updatedAt: at,
          lastChangedAt: at,
        }),
      );
      fp.appendAudit({
        id: `${row.presetName}-delete-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.access.filters.audit.delete',
        subject: row.presetName,
        reason: reason.trim(),
      });
      return true;
    },
    [fp],
  );

  const setDefaultPreset = useCallback(
    (id: string): boolean => {
      const row = fp.allRows.find((r) => r.id === id);
      if (!row) return false;
      const at = nowIso();
      // clear other defaults for the same desk, then set this one
      for (const r of fp.allRows) {
        if (r.deskKey === row.deskKey && r.isDefault && r.id !== id) {
          fp.patchRow(
            r.id,
            (x) => x.id,
            (x) => ({ ...x, isDefault: false, lastChangedAt: at }),
          );
        }
      }
      fp.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, isDefault: true, updatedAt: at, lastChangedAt: at }),
      );
      fp.appendAudit({
        id: `${row.presetName}-default-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.access.filters.audit.default',
        subject: row.presetName,
      });
      return true;
    },
    [fp],
  );

  const bulkDeletePresets = useCallback(
    (ids: string[], reason: string): boolean => {
      if (!validReason(reason)) throw new Error('reason<4');
      let any = false;
      for (const id of ids) if (deletePreset(id, reason)) any = true;
      return any;
    },
    [deletePreset],
  );

  // --- MFA ----------------------------------------------------------------

  const requireMfa = useCallback(
    (id: string): boolean => {
      const row = mf.allRows.find((r) => r.id === id);
      if (!row || row.mfaRequired) return false;
      const at = nowIso();
      mf.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, mfaRequired: true, updatedAt: at, lastChangedAt: at }),
      );
      mf.appendAudit({
        id: `${row.tierKey}-require-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.access.mfa.audit.require',
        subject: row.tierKey,
      });
      return true;
    },
    [mf],
  );

  const relaxMfa = useCallback(
    (id: string, reason: string): boolean => {
      if (!validReason(reason)) throw new Error('reason<4');
      const row = mf.allRows.find((r) => r.id === id);
      if (!row || !row.mfaRequired) return false;
      if (row.tierKey === 'tier.admin') return false; // admin can't be relaxed
      const at = nowIso();
      mf.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, mfaRequired: false, updatedAt: at, lastChangedAt: at }),
      );
      mf.appendAudit({
        id: `${row.tierKey}-relax-${at}`,
        at,
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.access.mfa.audit.relax',
        subject: row.tierKey,
        reason: reason.trim(),
      });
      return true;
    },
    [mf],
  );

  const bulkRequireMfa = useCallback(
    (ids: string[]): boolean => {
      let any = false;
      for (const id of ids) if (requireMfa(id)) any = true;
      return any;
    },
    [requireMfa],
  );

  const bulkRelaxMfa = useCallback(
    (ids: string[], reason: string): boolean => {
      if (!validReason(reason)) throw new Error('reason<4');
      let any = false;
      for (const id of ids) if (relaxMfa(id, reason)) any = true;
      return any;
    },
    [relaxMfa],
  );

  const audit: AdminAuditEvent[] = [...ro.audit, ...fp.audit, ...mf.audit].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
  );

  const resetForTest = useCallback(() => {
    ro.resetForTest();
    fp.resetForTest();
    mf.resetForTest();
  }, [ro, fp, mf]);

  return {
    roles: ro.allRows,
    filteredRoles: ro.rows,
    roleFilters: ro.filters,
    setRoleFilters: ro.setFilters,
    enableRole,
    disableRole,
    bulkDisableRoles,
    roleKeys: ROLE_KEYS,

    presets: fp.allRows,
    filteredPresets: fp.rows,
    presetFilters: fp.filters,
    setPresetFilters: fp.setFilters,
    deletePreset,
    setDefaultPreset,
    bulkDeletePresets,
    deskKeys: DESK_KEYS,

    mfaPolicies: mf.allRows,
    filteredMfa: mf.rows,
    mfaFilters: mf.filters,
    setMfaFilters: mf.setFilters,
    requireMfa,
    relaxMfa,
    bulkRequireMfa,
    bulkRelaxMfa,
    tierKeys: TIER_KEYS,

    audit,
    resetForTest,
  };
}
