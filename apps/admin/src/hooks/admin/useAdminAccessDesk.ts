import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/shared-types';
import { supabase } from '../../lib/supabase';
import { useAuditLogs } from '../use-audit-logs';
import { useAdminMfaReady } from '../use-admin-mfa-ready';
import {
  useAdminAccessDeskMock,
  type AdminMfaPolicyRow,
  type AdminRbacRoleRow,
  type MfaTierKey,
  type RbacRoleKey,
  type UseAdminAccessDesk,
} from './useAdminAccessDeskMock';

export type {
  AdminMfaPolicyRow,
  AdminRbacRoleRow,
  AdminSavedFilterRow,
  AccessDeskKey,
  MfaTierKey,
  RbacFilters,
  FilterFilters,
  MfaFilters,
  RbacRoleKey,
  UseAdminAccessDesk,
} from './useAdminAccessDeskMock';

const MIN_REASON = 4;

const ROLE_META: Record<RbacRoleKey, { labelKey: string; routesSummary: string }> = {
  owner: { labelKey: 'admin.access.role.owner.label', routesSummary: '*' },
  finance: {
    labelKey: 'admin.access.role.finance.label',
    routesSummary: 'operations · earn · audit',
  },
  risk: { labelKey: 'admin.access.role.risk.label', routesSummary: 'alerts · audit · users' },
  support: { labelKey: 'admin.access.role.support.label', routesSummary: 'queues · users · cms' },
  operator: {
    labelKey: 'admin.access.role.operator.label',
    routesSummary: 'casino · sports · cms',
  },
  viewer: { labelKey: 'admin.access.role.viewer.label', routesSummary: 'overview · audit (read)' },
};

const ROLE_KEYS: RbacRoleKey[] = ['owner', 'finance', 'risk', 'support', 'operator', 'viewer'];

function isRecord(value: unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapMfaRow(row: Json): AdminMfaPolicyRow | null {
  if (!isRecord(row)) return null;
  const tierKey = typeof row['tier_key'] === 'string' ? row['tier_key'] : null;
  if (!tierKey) return null;
  return {
    id: tierKey,
    tierKey: tierKey as MfaTierKey,
    mfaRequired: row['mfa_required'] === true,
    graceDays: String(row['grace_days'] ?? '0'),
    enrollRate: String(row['enroll_rate'] ?? '0'),
    updatedAt: String(row['updated_at'] ?? new Date().toISOString()),
  };
}

function aggregateRoles(grants: Json[]): AdminRbacRoleRow[] {
  const counts = new Map<RbacRoleKey, number>();
  const enabled = new Map<RbacRoleKey, boolean>();
  for (const g of grants) {
    if (!isRecord(g)) continue;
    const role = g['role'] as RbacRoleKey;
    if (!ROLE_META[role]) continue;
    counts.set(role, (counts.get(role) ?? 0) + 1);
    if (g['enabled'] !== false) enabled.set(role, true);
  }
  return ROLE_KEYS.map((roleKey) => ({
    id: `role_${roleKey}`,
    roleKey,
    labelKey: ROLE_META[roleKey].labelKey,
    memberCount: String(counts.get(roleKey) ?? 0),
    routesSummary: ROLE_META[roleKey].routesSummary,
    enabled: enabled.get(roleKey) ?? counts.get(roleKey) === 0,
    updatedAt: new Date().toISOString(),
  }));
}

/** Engine-backed Access desk — RBAC grants + MFA policy via admin RPCs. */
export function useAdminAccessDesk(): UseAdminAccessDesk {
  const mock = useAdminAccessDeskMock();
  const mfaReady = useAdminMfaReady();
  const qc = useQueryClient();
  const { data: auditLogs = [] } = useAuditLogs(20);

  const grantsQuery = useQuery({
    queryKey: ['admin', 'access', 'role-grants'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'rpc_admin_list_role_grants' as 'rpc_admin_list_casino_catalog',
      );
      if (error) throw error;
      return isRecord(data) && Array.isArray(data['grants']) ? (data['grants'] as Json[]) : [];
    },
    enabled: mfaReady,
  });

  const mfaQuery = useQuery({
    queryKey: ['admin', 'access', 'mfa-policy'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'rpc_admin_list_mfa_policy' as 'rpc_admin_list_casino_catalog',
      );
      if (error) throw error;
      return isRecord(data) && Array.isArray(data['policies']) ? (data['policies'] as Json[]) : [];
    },
    enabled: mfaReady,
  });

  const roles = useMemo(() => aggregateRoles(grantsQuery.data ?? []), [grantsQuery.data]);

  const mfaPolicies = useMemo(
    () => (mfaQuery.data ?? []).map(mapMfaRow).filter((r): r is AdminMfaPolicyRow => r != null),
    [mfaQuery.data],
  );

  const [roleFilters, setRoleFilters] = useState(mock.roleFilters);
  const [mfaFilters, setMfaFilters] = useState(mock.mfaFilters);

  const filteredRoles = useMemo(() => {
    let rows = roles;
    if (roleFilters.search.trim()) {
      const q = roleFilters.search.toLowerCase();
      rows = rows.filter((r) => r.roleKey.includes(q) || r.routesSummary.toLowerCase().includes(q));
    }
    if (roleFilters.enabled === 'on') rows = rows.filter((r) => r.enabled);
    if (roleFilters.enabled === 'off') rows = rows.filter((r) => !r.enabled);
    return rows;
  }, [roles, roleFilters]);

  const filteredMfa = useMemo(() => {
    let rows = mfaPolicies;
    if (mfaFilters.search.trim()) {
      const q = mfaFilters.search.toLowerCase();
      rows = rows.filter((r) => r.tierKey.toLowerCase().includes(q));
    }
    if (mfaFilters.tierKey !== 'all') rows = rows.filter((r) => r.tierKey === mfaFilters.tierKey);
    if (mfaFilters.required === 'on') rows = rows.filter((r) => r.mfaRequired);
    if (mfaFilters.required === 'off') rows = rows.filter((r) => !r.mfaRequired);
    return rows;
  }, [mfaPolicies, mfaFilters]);

  const invalidate = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['admin', 'access', 'role-grants'] }),
      qc.invalidateQueries({ queryKey: ['admin', 'access', 'mfa-policy'] }),
    ]);
  }, [qc]);

  const setMfaMutation = useMutation({
    mutationFn: async (args: {
      tierKey: string;
      mfaRequired: boolean;
      graceDays: number;
      enrollRate: number;
      reason: string;
    }) => {
      const { error } = await supabase.rpc(
        'rpc_admin_set_mfa_policy' as 'rpc_admin_set_casino_game_status',
        {
          p_tier_key: args.tierKey,
          p_mfa_required: args.mfaRequired,
          p_grace_days: args.graceDays,
          p_enroll_rate: args.enrollRate,
          p_reason: args.reason,
        } as never,
      );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const requireMfa = useCallback(
    (id: string): boolean => {
      const row = mfaPolicies.find((m) => m.id === id);
      if (!row || row.mfaRequired) return false;
      void setMfaMutation.mutateAsync({
        tierKey: row.tierKey,
        mfaRequired: true,
        graceDays: Number.parseInt(row.graceDays, 10) || 0,
        enrollRate: Number.parseInt(row.enrollRate, 10) || 0,
        reason: 'require mfa tier policy',
      });
      return true;
    },
    [mfaPolicies, setMfaMutation],
  );

  const relaxMfa = useCallback(
    (id: string, reason: string): boolean => {
      if (reason.trim().length < MIN_REASON) throw new Error('reason<4');
      const row = mfaPolicies.find((m) => m.id === id);
      if (!row || !row.mfaRequired) return false;
      void setMfaMutation.mutateAsync({
        tierKey: row.tierKey,
        mfaRequired: false,
        graceDays: Number.parseInt(row.graceDays, 10) || 0,
        enrollRate: Number.parseInt(row.enrollRate, 10) || 0,
        reason: reason.trim(),
      });
      return true;
    },
    [mfaPolicies, setMfaMutation],
  );

  const bulkRequireMfa = useCallback(
    (ids: string[]) => ids.some((id) => requireMfa(id)),
    [requireMfa],
  );

  const bulkRelaxMfa = useCallback(
    (ids: string[], reason: string) => ids.some((id) => relaxMfa(id, reason)),
    [relaxMfa],
  );

  const setRoleGrantMutation = useMutation({
    mutationFn: async (args: {
      userId: string;
      role: string;
      enabled: boolean;
      reason: string;
    }) => {
      const { error } = await supabase.rpc(
        'rpc_admin_set_role_grant' as 'rpc_admin_set_casino_game_status',
        {
          p_user_id: args.userId,
          p_role: args.role,
          p_enabled: args.enabled,
          p_reason: args.reason,
        } as never,
      );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const grantsForRole = useCallback(
    (roleKey: RbacRoleKey, enabledOnly?: boolean) =>
      (grantsQuery.data ?? []).filter((g) => {
        if (!isRecord(g)) return false;
        if (g['role'] !== roleKey) return false;
        const en = g['enabled'] !== false;
        return enabledOnly === undefined ? true : enabledOnly ? en : !en;
      }),
    [grantsQuery.data],
  );

  const enableRole = useCallback(
    (id: string): boolean => {
      const row = roles.find((r) => r.id === id);
      if (!row || row.enabled) return false;
      const targets = grantsForRole(row.roleKey, false);
      if (!targets.length) return false;
      for (const g of targets) {
        if (!isRecord(g) || typeof g['user_id'] !== 'string') continue;
        void setRoleGrantMutation.mutateAsync({
          userId: g['user_id'],
          role: row.roleKey,
          enabled: true,
          reason: 'enable role grant',
        });
      }
      return true;
    },
    [grantsForRole, roles, setRoleGrantMutation],
  );

  const disableRole = useCallback(
    (id: string, reason: string): boolean => {
      if (reason.trim().length < MIN_REASON) throw new Error('reason<4');
      const row = roles.find((r) => r.id === id);
      if (!row || !row.enabled || row.roleKey === 'owner') return false;
      const targets = grantsForRole(row.roleKey, true);
      if (!targets.length) return false;
      for (const g of targets) {
        if (!isRecord(g) || typeof g['user_id'] !== 'string') continue;
        void setRoleGrantMutation.mutateAsync({
          userId: g['user_id'],
          role: row.roleKey,
          enabled: false,
          reason: reason.trim(),
        });
      }
      return true;
    },
    [grantsForRole, roles, setRoleGrantMutation],
  );

  const bulkDisableRoles = useCallback(
    (ids: string[], reason: string): boolean => {
      if (reason.trim().length < MIN_REASON) throw new Error('reason<4');
      let any = false;
      for (const id of ids) if (disableRole(id, reason)) any = true;
      return any;
    },
    [disableRole],
  );

  const audit: AdminAuditEvent[] = useMemo(
    () =>
      auditLogs
        .filter((e) => e.action.startsWith('admin.'))
        .map((e) => ({
          id: e.id,
          at: e.created_at,
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: e.action,
          subject: e.entity_type ?? '',
          reason:
            e.payload &&
            typeof e.payload === 'object' &&
            e.payload !== null &&
            'reason' in e.payload
              ? String((e.payload as { reason?: string }).reason ?? '')
              : undefined,
        })),
    [auditLogs],
  );

  return {
    roles,
    filteredRoles,
    roleFilters,
    setRoleFilters,
    enableRole,
    disableRole,
    bulkDisableRoles,
    roleKeys: ROLE_KEYS,
    presets: mock.presets,
    filteredPresets: mock.filteredPresets,
    presetFilters: mock.presetFilters,
    setPresetFilters: mock.setPresetFilters,
    deletePreset: mock.deletePreset,
    setDefaultPreset: mock.setDefaultPreset,
    bulkDeletePresets: mock.bulkDeletePresets,
    deskKeys: mock.deskKeys,
    mfaPolicies,
    filteredMfa,
    mfaFilters,
    setMfaFilters,
    requireMfa,
    relaxMfa,
    bulkRequireMfa,
    bulkRelaxMfa,
    tierKeys: mock.tierKeys,
    audit: audit.length ? audit : mock.audit,
    resetForTest: mock.resetForTest,
  };
}
