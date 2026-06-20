import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/components/admin/primitives';
import { supabase } from '../../lib/supabase';
import { runQueueAction } from '../../domain/queues';
import type {
  AdminKycRow,
  AdminRiskRgRow,
  AdminStrRow,
  KycFilters,
  KycStatus,
  KycTier,
  RiskFilters,
  RiskFlagType,
  StrCaseType,
  StrFilters,
  StrStatus,
} from './useAdminComplianceMock';

export type {
  AdminKycRow,
  AdminRiskRgRow,
  AdminStrRow,
  KycFilters,
  KycStatus,
  KycTier,
  RiskFilters,
  RiskFlagType,
  RiskStatus,
  StrCaseType,
  StrFilters,
  StrStatus,
} from './useAdminComplianceMock';

export { isKycOverdue } from './useAdminComplianceMock';

const MIN_REASON = 4;

type ReviewQueueRow = Tables<'admin_review_queue'>;
type KycSubmissionRow = Tables<'kyc_submissions'>;
type StrCaseRow = Tables<'str_cases'>;
type RiskFlagRow = Tables<'risk_flags'>;

function mapKycStatus(status: string): KycStatus {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'in_review') return 'in_review';
  if (status === 'submitted') return 'pending';
  return 'pending';
}

function mapKycTier(documentType: string | null | undefined): KycTier {
  if (documentType === 'PASSPORT') return 'tier3';
  if (documentType === 'ID') return 'tier2';
  return 'tier1';
}

function summarizePayload(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '—';
  const text = JSON.stringify(payload);
  return text.length > 48 ? `${text.slice(0, 45)}…` : text;
}

function mapKycRow(
  review: ReviewQueueRow,
  submission: KycSubmissionRow | undefined,
): AdminKycRow {
  return {
    id: review.entity_id,
    userId: `${(submission?.user_id ?? review.entity_id).slice(0, 8)}…`,
    tier: mapKycTier(submission?.document_type ?? null),
    status: mapKycStatus(submission?.status ?? review.status),
    submittedAt: submission?.submitted_at ?? review.created_at,
    slaDueAt: review.sla_due_at,
    documentSummary: submission
      ? `${submission.document_type} ${submission.country} · ${submission.document_last4}`
      : summarizePayload(review.payload),
  };
}

function mapStrRow(row: StrCaseRow): AdminStrRow {
  const caseType = (['structuring', 'rapid_movement', 'high_risk_geo', 'chip_dumping'] as const).includes(
    row.case_type as StrCaseType,
  )
    ? (row.case_type as StrCaseType)
    : 'structuring';
  const status = (['open', 'reviewing', 'filed', 'dismissed'] as const).includes(
    row.status as StrStatus,
  )
    ? (row.status as StrStatus)
    : 'open';
  return {
    id: row.id,
    userId: `${(row.user_id ?? row.id).slice(0, 8)}…`,
    caseType,
    status,
    triggerRef: row.trigger_ref ?? '—',
    createdAt: row.created_at,
    slaDueAt: row.created_at,
    detailsSummary: summarizePayload(row.details),
  };
}

function mapRiskRow(row: RiskFlagRow): AdminRiskRgRow {
  const flagType = (
    ['rg_self_exclusion', 'rg_cooldown', 'rg_deposit_limit', 'fraud_pattern', 'vpn_proxy'] as const
  ).includes(row.flag_type as RiskFlagType)
    ? (row.flag_type as RiskFlagType)
    : 'fraud_pattern';
  return {
    id: row.id,
    userId: `${(row.user_id ?? row.id).slice(0, 8)}…`,
    flagType,
    status: row.status === 'cleared' ? 'cleared' : 'active',
    createdAt: row.created_at,
    detailsSummary: summarizePayload(row.details),
  };
}

function filterKyc(rows: AdminKycRow[], f: KycFilters): AdminKycRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.tier.length > 0 && !f.tier.includes(r.tier)) return false;
    if (!q) return true;
    return (
      r.id.toLowerCase().includes(q) ||
      r.userId.toLowerCase().includes(q) ||
      r.documentSummary.toLowerCase().includes(q)
    );
  });
}

function filterStr(rows: AdminStrRow[], f: StrFilters): AdminStrRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.caseType.length > 0 && !f.caseType.includes(r.caseType)) return false;
    if (!q) return true;
    return (
      r.userId.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.detailsSummary.toLowerCase().includes(q)
    );
  });
}

function filterRisk(rows: AdminRiskRgRow[], f: RiskFilters): AdminRiskRgRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.flagType.length > 0 && !f.flagType.includes(r.flagType)) return false;
    if (!q) return true;
    return (
      r.userId.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.detailsSummary.toLowerCase().includes(q)
    );
  });
}

async function fetchComplianceData() {
  const [reviewQueue, submissions, strCases, riskFlags] = await Promise.all([
    supabase
      .from('admin_review_queue')
      .select('*')
      .eq('entity_type', 'kyc_submission')
      .in('status', ['pending', 'in_review'])
      .order('sla_due_at', { ascending: true })
      .limit(100),
    supabase.from('kyc_submissions').select('*').order('created_at', { ascending: false }).limit(200),
    supabase
      .from('str_cases')
      .select('*')
      .in('status', ['open', 'reviewing'])
      .order('created_at', { ascending: true })
      .limit(100),
    supabase
      .from('risk_flags')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(100),
  ]);

  for (const result of [reviewQueue, submissions, strCases, riskFlags]) {
    if (result.error) throw result.error;
  }

  const submissionById = new Map(
    ((submissions.data ?? []) as KycSubmissionRow[]).map((row) => [row.id, row]),
  );

  const kyc = ((reviewQueue.data ?? []) as ReviewQueueRow[]).map((row) =>
    mapKycRow(row, submissionById.get(row.entity_id)),
  );

  return {
    kyc,
    str: ((strCases.data ?? []) as StrCaseRow[]).map(mapStrRow),
    risk: ((riskFlags.data ?? []) as RiskFlagRow[]).map(mapRiskRow),
  };
}

/** Engine-backed compliance queues (KYC / STR / risk) for admin desk + E2E. */
export function useAdminCompliance() {
  const qc = useQueryClient();
  const [kycFilters, setKycFilters] = useState<KycFilters>({
    search: '',
    status: [],
    tier: [],
  });
  const [strFilters, setStrFilters] = useState<StrFilters>({
    search: '',
    status: [],
    caseType: [],
  });
  const [riskFilters, setRiskFilters] = useState<RiskFilters>({
    search: '',
    status: [],
    flagType: [],
  });
  const [audit, setAudit] = useState<AdminAuditEvent[]>([]);

  const { data, refetch } = useQuery({
    queryKey: ['admin-compliance-queues'],
    queryFn: fetchComplianceData,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15_000,
  });

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const kyc = data?.kyc ?? [];
  const str = data?.str ?? [];
  const risk = data?.risk ?? [];

  const filteredKyc = useMemo(() => filterKyc(kyc, kycFilters), [kyc, kycFilters]);
  const filteredStr = useMemo(() => filterStr(str, strFilters), [str, strFilters]);
  const filteredRisk = useMemo(() => filterRisk(risk, riskFilters), [risk, riskFilters]);

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin-compliance-queues'] });
    await qc.invalidateQueries({ queryKey: ['audit-logs'] });
    await refetch();
  }, [qc, refetch]);

  const appendAudit = useCallback((event: AdminAuditEvent) => {
    setAudit((prev) => [event, ...prev].slice(0, 50));
  }, []);

  const approveKyc = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'approveKyc', id }, reason.trim());
        appendAudit({
          id: `kyc-approve-${id}-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: 'admin.compliance.kyc.audit.approve',
          subject: id,
          reason: reason.trim(),
        });
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [appendAudit, invalidate],
  );

  const rejectKyc = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'rejectKyc', id }, reason.trim());
        appendAudit({
          id: `kyc-reject-${id}-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: 'admin.compliance.kyc.audit.reject',
          subject: id,
          reason: reason.trim(),
        });
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [appendAudit, invalidate],
  );

  const reviewStr = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'reviewStr', id }, reason.trim());
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const fileStr = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'fileStr', id }, reason.trim());
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const dismissStr = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'dismissStr', id }, reason.trim());
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const clearRiskFlag = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'clearRiskFlag', id }, reason.trim());
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const noopMutation = useCallback(async () => false, []);

  return {
    kyc,
    filteredKyc,
    kycFilters,
    setKycFilters,
    str,
    filteredStr,
    strFilters,
    setStrFilters,
    risk,
    filteredRisk,
    riskFilters,
    setRiskFilters,
    audit,
    approveKyc,
    rejectKyc,
    flagStr: reviewStr,
    escalateStr: reviewStr,
    fileStr,
    dismissStr,
    clearRiskFlag,
    applyRgCooldown: noopMutation,
    limitOverride: noopMutation,
    resetForTest: () => {
      setKycFilters({ search: '', status: [], tier: [] });
      setStrFilters({ search: '', status: [], caseType: [] });
      setRiskFilters({ search: '', status: [], flagType: [] });
      setAudit([]);
    },
  };
}
