import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/shared-types';

import { supabase } from '../../lib/supabase';
import { useAuditLogs } from '../use-audit-logs';
import { useAdminMfaReady } from '../use-admin-mfa-ready';

export type MfaTierKey =
  | 'tier.bronze'
  | 'tier.silver'
  | 'tier.gold'
  | 'tier.platinum'
  | 'tier.staff'
  | 'tier.admin';

export type AdminMfaPolicyDeskRow = {
  id: string;
  tierKey: MfaTierKey;
  mfaRequired: boolean;
  graceDays: string;
  enrollRate: string;
  updatedAt: string;
};

export type MfaPolicyFilters = {
  search: string;
  tierKey: MfaTierKey | 'all';
  required: 'all' | 'on' | 'off';
};

export type UseAdminMfaPolicyDesk = {
  policies: AdminMfaPolicyDeskRow[];
  filteredPolicies: AdminMfaPolicyDeskRow[];
  filters: MfaPolicyFilters;
  setFilters: (next: MfaPolicyFilters | ((prev: MfaPolicyFilters) => MfaPolicyFilters)) => void;
  tierKeys: MfaTierKey[];
  loading: boolean;
  isError: boolean;
  busy: boolean;
  auditEvents: AdminAuditEvent[];
  refresh: () => Promise<void>;
  setMfaRequired: (tierKey: MfaTierKey, required: boolean, reason: string) => Promise<void>;
  canRelaxTier: (tierKey: MfaTierKey) => boolean;
};

const TIER_KEYS: MfaTierKey[] = [
  'tier.admin',
  'tier.staff',
  'tier.platinum',
  'tier.gold',
  'tier.silver',
  'tier.bronze',
];

function isRecord(value: unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapPolicyRow(row: Json): AdminMfaPolicyDeskRow | null {
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

function filterPolicies(
  rows: AdminMfaPolicyDeskRow[],
  filters: MfaPolicyFilters,
): AdminMfaPolicyDeskRow[] {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.tierKey !== 'all' && row.tierKey !== filters.tierKey) return false;
    if (filters.required === 'on' && !row.mfaRequired) return false;
    if (filters.required === 'off' && row.mfaRequired) return false;
    if (!query) return true;
    return row.tierKey.toLowerCase().includes(query);
  });
}

function mapAudit(row: {
  id: string;
  created_at: string;
  action: string;
  payload: unknown;
}): AdminAuditEvent | null {
  if (row.action !== 'admin.mfa_policy.set') return null;
  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    at: row.created_at,
    actorKey: 'admin.primitive.audit.actor.operator',
    actionKey: 'admin.access.mfa.audit.require',
    subject: typeof payload['tier_key'] === 'string' ? payload['tier_key'] : '',
    reason: typeof payload['reason'] === 'string' ? payload['reason'] : undefined,
  };
}

/** Team MFA policy desk — `rpc_admin_list_mfa_policy` · `rpc_admin_set_mfa_policy` (§29.2 R3). */
export function useAdminMfaPolicyDesk(): UseAdminMfaPolicyDesk {
  const qc = useQueryClient();
  const mfaReady = useAdminMfaReady();
  const { data: auditLogs = [] } = useAuditLogs(30);
  const [filters, setFilters] = useState<MfaPolicyFilters>({
    search: '',
    tierKey: 'all',
    required: 'all',
  });
  const [busy, setBusy] = useState(false);

  const policiesQuery = useQuery({
    queryKey: ['admin', 'mfa-policy', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'rpc_admin_list_mfa_policy' as 'rpc_admin_list_casino_catalog',
      );
      if (error) throw error;
      return isRecord(data) && Array.isArray(data['policies']) ? (data['policies'] as Json[]) : [];
    },
    enabled: mfaReady,
  });

  const policies = useMemo(
    () =>
      (policiesQuery.data ?? [])
        .map(mapPolicyRow)
        .filter((row): row is AdminMfaPolicyDeskRow => row != null),
    [policiesQuery.data],
  );

  const filteredPolicies = useMemo(() => filterPolicies(policies, filters), [policies, filters]);

  const auditEvents = useMemo(
    () =>
      auditLogs
        .map(mapAudit)
        .filter((event): event is AdminAuditEvent => event != null)
        .slice(0, 10),
    [auditLogs],
  );

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin', 'mfa-policy', 'list'] });
  }, [qc]);

  const setPolicyMutation = useMutation({
    mutationFn: async (args: {
      tierKey: MfaTierKey;
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

  const refresh = useCallback(async () => {
    await policiesQuery.refetch();
  }, [policiesQuery]);

  const setMfaRequired = useCallback(
    async (tierKey: MfaTierKey, required: boolean, reason: string) => {
      const row = policies.find((policy) => policy.tierKey === tierKey);
      if (!row) throw new Error('policy_not_found');
      if (required === row.mfaRequired) return;
      if (!required && tierKey === 'tier.admin') throw new Error('protected_tier');

      setBusy(true);
      try {
        await setPolicyMutation.mutateAsync({
          tierKey,
          mfaRequired: required,
          graceDays: Number.parseInt(row.graceDays, 10) || 0,
          enrollRate: Number.parseInt(row.enrollRate, 10) || 0,
          reason: reason.trim(),
        });
      } finally {
        setBusy(false);
      }
    },
    [policies, setPolicyMutation],
  );

  const canRelaxTier = useCallback((tierKey: MfaTierKey) => tierKey !== 'tier.admin', []);

  return {
    policies,
    filteredPolicies,
    filters,
    setFilters,
    tierKeys: TIER_KEYS,
    loading: policiesQuery.isLoading,
    isError: policiesQuery.isError,
    busy: busy || setPolicyMutation.isPending,
    auditEvents,
    refresh,
    setMfaRequired,
    canRelaxTier,
  };
}
