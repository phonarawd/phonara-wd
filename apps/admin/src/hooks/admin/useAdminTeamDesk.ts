import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/shared-types';

import {
  ADMIN_TEAM_GRANTABLE_ROLES,
  type AdminTeamGrantableRole,
} from '@/domain/admin-team-desk-display-contract';
import { isAdminRbacRole, type AdminRbacRole } from '@/domain/admin-rbac';
import { callRpc } from '../../lib/rpc';
import { useAuditLogs } from '../use-audit-logs';
import { useAdminMfaReady } from '../use-admin-mfa-ready';

const MIN_REASON = 4;

export type AdminTeamGrantRow = {
  id: string;
  userId: string;
  email: string;
  role: AdminRbacRole;
  enabled: boolean;
  updatedAt: string;
};

export type TeamDeskFilters = {
  search: string;
  role: AdminTeamGrantableRole | 'all';
  enabled: 'all' | 'on' | 'off';
};

export type UseAdminTeamDesk = {
  grants: AdminTeamGrantRow[];
  filteredGrants: AdminTeamGrantRow[];
  filters: TeamDeskFilters;
  setFilters: (next: TeamDeskFilters | ((prev: TeamDeskFilters) => TeamDeskFilters)) => void;
  grantableRoles: readonly AdminTeamGrantableRole[];
  loading: boolean;
  isError: boolean;
  busy: boolean;
  auditEvents: AdminAuditEvent[];
  refresh: () => Promise<void>;
  setRoleGrant: (args: {
    userId: string;
    role: AdminTeamGrantableRole;
    enabled: boolean;
    reason: string;
  }) => Promise<void>;
  canRevoke: (row: AdminTeamGrantRow) => boolean;
  canChangeRole: (row: AdminTeamGrantRow) => boolean;
};

function isRecord(value: unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapGrantRow(row: Json): AdminTeamGrantRow | null {
  if (!isRecord(row)) return null;
  const userId = typeof row['user_id'] === 'string' ? row['user_id'] : null;
  const roleRaw = typeof row['role'] === 'string' ? row['role'] : null;
  if (!userId || !roleRaw || !isAdminRbacRole(roleRaw)) return null;
  const email =
    typeof row['email'] === 'string' && row['email'].trim().length > 0
      ? row['email']
      : userId.slice(0, 8);
  return {
    id: `${userId}:${roleRaw}`,
    userId,
    email,
    role: roleRaw,
    enabled: row['enabled'] !== false,
    updatedAt: String(row['updated_at'] ?? new Date().toISOString()),
  };
}

function filterGrants(rows: AdminTeamGrantRow[], filters: TeamDeskFilters): AdminTeamGrantRow[] {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.role !== 'all' && row.role !== filters.role) return false;
    if (filters.enabled === 'on' && !row.enabled) return false;
    if (filters.enabled === 'off' && row.enabled) return false;
    if (!query) return true;
    return (
      row.email.toLowerCase().includes(query) ||
      row.role.toLowerCase().includes(query) ||
      row.userId.toLowerCase().includes(query)
    );
  });
}

function mapAudit(row: {
  id: string;
  created_at: string;
  action: string;
  entity_id: string | null;
  payload: unknown;
}): AdminAuditEvent | null {
  if (row.action !== 'admin.role_grant.set') return null;
  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  const enabled = payload['enabled'] !== false;
  return {
    id: row.id,
    at: row.created_at,
    actorKey: 'admin.primitive.audit.actor.operator',
    actionKey: enabled ? 'admin.team.audit.grant' : 'admin.team.audit.revoke',
    subject: typeof payload['role'] === 'string' ? payload['role'] : (row.entity_id ?? ''),
    reason: typeof payload['reason'] === 'string' ? payload['reason'] : undefined,
  };
}

/** Staff access desk — `rpc_admin_list_role_grants` · `rpc_admin_set_role_grant` (§29.2 R3 · owner). */
export function useAdminTeamDesk(): UseAdminTeamDesk {
  const qc = useQueryClient();
  const mfaReady = useAdminMfaReady();
  const { data: auditLogs = [] } = useAuditLogs(30);
  const [filters, setFilters] = useState<TeamDeskFilters>({
    search: '',
    role: 'all',
    enabled: 'all',
  });
  const [busy, setBusy] = useState(false);

  const grantsQuery = useQuery({
    queryKey: ['admin', 'team', 'role-grants'],
    queryFn: async () => {
      const data = await callRpc('rpc_admin_list_role_grants');
      return isRecord(data) && Array.isArray(data['grants']) ? (data['grants'] as Json[]) : [];
    },
    enabled: mfaReady,
  });

  const grants = useMemo(
    () =>
      (grantsQuery.data ?? [])
        .map(mapGrantRow)
        .filter((row): row is AdminTeamGrantRow => row != null),
    [grantsQuery.data],
  );

  const filteredGrants = useMemo(() => filterGrants(grants, filters), [grants, filters]);

  const auditEvents = useMemo(
    () =>
      auditLogs
        .map(mapAudit)
        .filter((event): event is AdminAuditEvent => event != null)
        .slice(0, 10),
    [auditLogs],
  );

  const invalidate = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['admin', 'team', 'role-grants'] }),
      qc.invalidateQueries({ queryKey: ['admin', 'operator-rbac', 'role-grants'] }),
      qc.invalidateQueries({ queryKey: ['admin', 'access', 'role-grants'] }),
    ]);
  }, [qc]);

  const setGrantMutation = useMutation({
    mutationFn: async (args: {
      userId: string;
      role: AdminTeamGrantableRole;
      enabled: boolean;
      reason: string;
    }) => {
      await callRpc('rpc_admin_set_role_grant', {
        p_user_id: args.userId,
        p_role: args.role,
        p_enabled: args.enabled,
        p_reason: args.reason,
      });
    },
    onSuccess: invalidate,
  });

  const refresh = useCallback(async () => {
    await grantsQuery.refetch();
  }, [grantsQuery]);

  const setRoleGrant = useCallback(
    async (args: {
      userId: string;
      role: AdminTeamGrantableRole;
      enabled: boolean;
      reason: string;
    }) => {
      if (args.reason.trim().length < MIN_REASON) throw new Error('reason_required');
      setBusy(true);
      try {
        await setGrantMutation.mutateAsync({
          ...args,
          reason: args.reason.trim(),
        });
      } finally {
        setBusy(false);
      }
    },
    [setGrantMutation],
  );

  const canRevoke = useCallback(
    (row: AdminTeamGrantRow) => row.enabled && row.role !== 'owner',
    [],
  );

  const canChangeRole = useCallback((row: AdminTeamGrantRow) => row.role !== 'owner', []);

  return {
    grants,
    filteredGrants,
    filters,
    setFilters,
    grantableRoles: ADMIN_TEAM_GRANTABLE_ROLES,
    loading: grantsQuery.isLoading,
    isError: grantsQuery.isError,
    busy: busy || setGrantMutation.isPending,
    auditEvents,
    refresh,
    setRoleGrant,
    canRevoke,
    canChangeRole,
  };
}
