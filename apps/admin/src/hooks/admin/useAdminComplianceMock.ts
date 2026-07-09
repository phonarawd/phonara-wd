import { useCallback } from 'react';
import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';

// L1-15-D D1 — admin compliance desk mock SOT.
// createAdminMockHook ×3 compose (kyc · str · risk/rg). mock/display-only. supabase/rpc 0.
// All mutating actions require reason.trim().length >= 4.

const MIN_REASON = 4;

// ── Row types ─────────────────────────────────────────────────────────
export type KycStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type KycTier = 'tier1' | 'tier2' | 'tier3';

export interface AdminKycRow {
  id: string;
  userId: string;
  tier: KycTier;
  status: KycStatus;
  submittedAt: string;
  slaDueAt: string;
  documentSummary: string;
  riskScore?: string;
  documentFrontPath?: string | null;
  documentBackPath?: string | null;
  selfiePath?: string | null;
}

export type StrStatus = 'open' | 'reviewing' | 'filed' | 'dismissed';
export type StrCaseType = 'structuring' | 'rapid_movement' | 'high_risk_geo' | 'chip_dumping';

export interface AdminStrRow {
  id: string;
  userId: string;
  caseType: StrCaseType;
  status: StrStatus;
  triggerRef: string;
  createdAt: string;
  slaDueAt: string;
  detailsSummary: string;
}

export type RiskStatus = 'active' | 'cleared';
export type RiskFlagType =
  | 'rg_self_exclusion'
  | 'rg_cooldown'
  | 'rg_deposit_limit'
  | 'fraud_pattern'
  | 'vpn_proxy';

export interface AdminRiskRgRow {
  id: string;
  userId: string;
  flagType: RiskFlagType;
  status: RiskStatus;
  rgLimit?: string;
  selfExclusionUntil?: string;
  createdAt: string;
  detailsSummary: string;
}

// ── Filters ───────────────────────────────────────────────────────────
export interface KycFilters {
  search: string;
  status: KycStatus[];
  tier: KycTier[];
}
export interface StrFilters {
  search: string;
  status: StrStatus[];
  caseType: StrCaseType[];
}
export interface RiskFilters {
  search: string;
  status: RiskStatus[];
  flagType: RiskFlagType[];
}

// ── SEED data (deterministic) ─────────────────────────────────────────
const KYC_SEED: AdminKycRow[] = [
  {
    id: 'KYC-2026-0617-001',
    userId: 'u_***c91',
    tier: 'tier2',
    status: 'pending',
    submittedAt: '2026-06-17T06:30:00.000Z',
    slaDueAt: '2026-06-17T06:00:00.000Z', // overdue
    documentSummary: 'PASSPORT KR · selfie',
    riskScore: '42',
  },
  {
    id: 'KYC-2026-0617-002',
    userId: 'u_***af2',
    tier: 'tier1',
    status: 'pending',
    submittedAt: '2026-06-17T07:10:00.000Z',
    slaDueAt: '2026-06-17T15:10:00.000Z',
    documentSummary: 'ID KR · address',
    riskScore: '18',
  },
  {
    id: 'KYC-2026-0617-003',
    userId: 'u_***b15',
    tier: 'tier3',
    status: 'pending',
    submittedAt: '2026-06-17T07:48:00.000Z',
    slaDueAt: '2026-06-17T19:48:00.000Z',
    documentSummary: 'PASSPORT · proof of funds',
    riskScore: '74',
  },
  {
    id: 'KYC-2026-0617-004',
    userId: 'u_***e08',
    tier: 'tier2',
    status: 'in_review',
    submittedAt: '2026-06-17T05:02:00.000Z',
    slaDueAt: '2026-06-17T13:02:00.000Z',
    documentSummary: 'ID JP · selfie',
    riskScore: '55',
  },
  {
    id: 'KYC-2026-0616-098',
    userId: 'u_***301',
    tier: 'tier1',
    status: 'approved',
    submittedAt: '2026-06-16T18:11:00.000Z',
    slaDueAt: '2026-06-17T02:11:00.000Z',
    documentSummary: 'ID KR · selfie',
  },
  {
    id: 'KYC-2026-0616-076',
    userId: 'u_***f87',
    tier: 'tier2',
    status: 'rejected',
    submittedAt: '2026-06-16T12:18:00.000Z',
    slaDueAt: '2026-06-16T20:18:00.000Z',
    documentSummary: 'PASSPORT · doc unreadable',
  },
];

const STR_SEED: AdminStrRow[] = [
  {
    id: 'STR-2026-0617-011',
    userId: 'u_***c91',
    caseType: 'structuring',
    status: 'open',
    triggerRef: 'WD-2026-0617-001',
    createdAt: '2026-06-17T07:10:00.000Z',
    slaDueAt: '2026-06-19T07:10:00.000Z',
    detailsSummary: '5×190k krw within 24h',
  },
  {
    id: 'STR-2026-0617-012',
    userId: 'u_***af2',
    caseType: 'rapid_movement',
    status: 'open',
    triggerRef: 'WD-2026-0617-002',
    createdAt: '2026-06-17T07:22:00.000Z',
    slaDueAt: '2026-06-19T07:22:00.000Z',
    detailsSummary: 'Deposit→withdraw 11m · no play',
  },
  {
    id: 'STR-2026-0617-013',
    userId: 'u_***b15',
    caseType: 'high_risk_geo',
    status: 'reviewing',
    triggerRef: 'session 0x9af1',
    createdAt: '2026-06-17T06:02:00.000Z',
    slaDueAt: '2026-06-19T06:02:00.000Z',
    detailsSummary: 'IP geo flag · sanction list near',
  },
  {
    id: 'STR-2026-0616-009',
    userId: 'u_***301',
    caseType: 'chip_dumping',
    status: 'filed',
    triggerRef: 'TBL-poker-882',
    createdAt: '2026-06-16T18:30:00.000Z',
    slaDueAt: '2026-06-18T18:30:00.000Z',
    detailsSummary: 'Coordinated loss 4 hands',
  },
  {
    id: 'STR-2026-0616-004',
    userId: 'u_***f87',
    caseType: 'structuring',
    status: 'dismissed',
    triggerRef: 'WD-2026-0616-052',
    createdAt: '2026-06-16T10:11:00.000Z',
    slaDueAt: '2026-06-18T10:11:00.000Z',
    detailsSummary: 'False positive · payroll',
  },
];

const RISK_SEED: AdminRiskRgRow[] = [
  {
    id: 'RG-2026-0617-101',
    userId: 'u_***c91',
    flagType: 'rg_self_exclusion',
    status: 'active',
    selfExclusionUntil: '2026-12-17T00:00:00.000Z',
    createdAt: '2026-06-17T05:11:00.000Z',
    detailsSummary: 'Self-exclusion 6 months',
  },
  {
    id: 'RG-2026-0617-102',
    userId: 'u_***af2',
    flagType: 'rg_self_exclusion',
    status: 'active',
    selfExclusionUntil: '2026-09-17T00:00:00.000Z',
    createdAt: '2026-06-17T05:20:00.000Z',
    detailsSummary: 'Self-exclusion 3 months',
  },
  {
    id: 'RG-2026-0617-103',
    userId: 'u_***b15',
    flagType: 'rg_deposit_limit',
    status: 'active',
    rgLimit: '500000',
    createdAt: '2026-06-17T04:02:00.000Z',
    detailsSummary: 'Daily deposit cap KRW',
  },
  {
    id: 'RG-2026-0617-104',
    userId: 'u_***e08',
    flagType: 'fraud_pattern',
    status: 'active',
    createdAt: '2026-06-17T03:48:00.000Z',
    detailsSummary: 'Multi-account device link',
  },
  {
    id: 'RG-2026-0616-091',
    userId: 'u_***301',
    flagType: 'vpn_proxy',
    status: 'cleared',
    createdAt: '2026-06-16T22:15:00.000Z',
    detailsSummary: 'Resolved · KR residence',
  },
  {
    id: 'RG-2026-0616-085',
    userId: 'u_***f87',
    flagType: 'rg_cooldown',
    status: 'cleared',
    createdAt: '2026-06-16T19:40:00.000Z',
    detailsSummary: '24h cooldown completed',
  },
];

// ── Filter fns ────────────────────────────────────────────────────────
const filterKyc = (rows: AdminKycRow[], f: KycFilters): AdminKycRow[] => {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.tier.length > 0 && !f.tier.includes(r.tier)) return false;
    if (!q) return true;
    return (
      r.userId.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.documentSummary.toLowerCase().includes(q)
    );
  });
};

const filterStr = (rows: AdminStrRow[], f: StrFilters): AdminStrRow[] => {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.caseType.length > 0 && !f.caseType.includes(r.caseType)) return false;
    if (!q) return true;
    return (
      r.userId.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.triggerRef.toLowerCase().includes(q)
    );
  });
};

const filterRisk = (rows: AdminRiskRgRow[], f: RiskFilters): AdminRiskRgRow[] => {
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
};

// ── Factory instances ─────────────────────────────────────────────────
const useKycMock = createAdminMockHook<AdminKycRow, KycFilters>({
  storageKey: 'admin:compliance:kyc:v1',
  seedRows: KYC_SEED,
  seedFilters: { search: '', status: [], tier: [] },
  filterFn: filterKyc,
});

const useStrMock = createAdminMockHook<AdminStrRow, StrFilters>({
  storageKey: 'admin:compliance:str:v1',
  seedRows: STR_SEED,
  seedFilters: { search: '', status: [], caseType: [] },
  filterFn: filterStr,
});

const useRiskMock = createAdminMockHook<AdminRiskRgRow, RiskFilters>({
  storageKey: 'admin:compliance:risk:v1',
  seedRows: RISK_SEED,
  seedFilters: { search: '', status: [], flagType: [] },
  filterFn: filterRisk,
});

// ── Facade ────────────────────────────────────────────────────────────
export interface UseAdminCompliance {
  kyc: AdminKycRow[];
  filteredKyc: AdminKycRow[];
  kycFilters: KycFilters;
  setKycFilters: (f: KycFilters | ((p: KycFilters) => KycFilters)) => void;

  str: AdminStrRow[];
  filteredStr: AdminStrRow[];
  strFilters: StrFilters;
  setStrFilters: (f: StrFilters | ((p: StrFilters) => StrFilters)) => void;

  risk: AdminRiskRgRow[];
  filteredRisk: AdminRiskRgRow[];
  riskFilters: RiskFilters;
  setRiskFilters: (f: RiskFilters | ((p: RiskFilters) => RiskFilters)) => void;

  audit: AdminAuditEvent[];

  approveKyc: (id: string, reason: string) => void;
  rejectKyc: (id: string, reason: string) => void;

  flagStr: (id: string, reason: string) => void;
  escalateStr: (id: string, reason: string) => void;
  fileStr: (id: string, reason: string) => void;
  dismissStr: (id: string, reason: string) => void;

  clearRiskFlag: (id: string, reason: string) => void;
  applyRgCooldown: (id: string, reason: string) => void;
  limitOverride: (id: string, reason: string) => void;

  resetForTest: () => void;
}

const nowIso = () => new Date().toISOString();
const validReason = (r: string) => r.trim().length >= MIN_REASON;

const audit = (
  appendAudit: (e: AdminAuditEvent) => void,
  id: string,
  actionKey: string,
  reason: string,
  suffix: string,
) =>
  appendAudit({
    id: `${id}-${suffix}-${nowIso()}`,
    at: nowIso(),
    actorKey: 'admin.primitive.audit.actor.system',
    actionKey,
    subject: id,
    reason: reason.trim(),
  });

export function useAdminComplianceMock(): UseAdminCompliance {
  const k = useKycMock();
  const s = useStrMock();
  const r = useRiskMock();

  const approveKyc = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = k.allRows.find((x) => x.id === id);
      if (!row || (row.status !== 'pending' && row.status !== 'in_review')) return;
      k.patchRow(
        id,
        (x) => x.id,
        (x) => ({ ...x, status: 'approved' }),
      );
      audit(k.appendAudit, id, 'admin.compliance.kyc.audit.approve', reason, 'approve');
    },
    [k],
  );

  const rejectKyc = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = k.allRows.find((x) => x.id === id);
      if (!row || (row.status !== 'pending' && row.status !== 'in_review')) return;
      k.patchRow(
        id,
        (x) => x.id,
        (x) => ({ ...x, status: 'rejected' }),
      );
      audit(k.appendAudit, id, 'admin.compliance.kyc.audit.reject', reason, 'reject');
    },
    [k],
  );

  const flagStr = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = s.allRows.find((x) => x.id === id);
      if (!row || row.status !== 'open') return;
      // flag keeps status open + audit event (no transition)
      audit(s.appendAudit, id, 'admin.compliance.str.audit.flag', reason, 'flag');
    },
    [s],
  );

  const escalateStr = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = s.allRows.find((x) => x.id === id);
      if (!row || row.status !== 'open') return;
      s.patchRow(
        id,
        (x) => x.id,
        (x) => ({ ...x, status: 'reviewing' }),
      );
      audit(s.appendAudit, id, 'admin.compliance.str.audit.escalate', reason, 'escalate');
    },
    [s],
  );

  const fileStr = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = s.allRows.find((x) => x.id === id);
      if (!row || row.status !== 'reviewing') return;
      s.patchRow(
        id,
        (x) => x.id,
        (x) => ({ ...x, status: 'filed' }),
      );
      audit(s.appendAudit, id, 'admin.compliance.str.audit.file', reason, 'file');
    },
    [s],
  );

  const dismissStr = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = s.allRows.find((x) => x.id === id);
      if (!row || row.status !== 'reviewing') return;
      s.patchRow(
        id,
        (x) => x.id,
        (x) => ({ ...x, status: 'dismissed' }),
      );
      audit(s.appendAudit, id, 'admin.compliance.str.audit.dismiss', reason, 'dismiss');
    },
    [s],
  );

  const clearRiskFlag = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = r.allRows.find((x) => x.id === id);
      if (!row || row.status !== 'active') return;
      r.patchRow(
        id,
        (x) => x.id,
        (x) => ({ ...x, status: 'cleared' }),
      );
      audit(r.appendAudit, id, 'admin.compliance.rg.audit.clear', reason, 'clear');
    },
    [r],
  );

  const applyRgCooldown = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = r.allRows.find((x) => x.id === id);
      if (!row || row.status !== 'active') return;
      audit(r.appendAudit, id, 'admin.compliance.rg.audit.cooldown', reason, 'cooldown');
    },
    [r],
  );

  const limitOverride = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = r.allRows.find((x) => x.id === id);
      if (!row || row.status !== 'active') return;
      audit(r.appendAudit, id, 'admin.compliance.rg.audit.limitOverride', reason, 'override');
    },
    [r],
  );

  const resetForTest = useCallback(() => {
    k.resetForTest();
    s.resetForTest();
    r.resetForTest();
  }, [k, s, r]);

  const mergedAudit: AdminAuditEvent[] = [...k.audit, ...s.audit, ...r.audit]
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, 150);

  return {
    kyc: k.allRows,
    filteredKyc: k.rows,
    kycFilters: k.filters,
    setKycFilters: k.setFilters,

    str: s.allRows,
    filteredStr: s.rows,
    strFilters: s.filters,
    setStrFilters: s.setFilters,

    risk: r.allRows,
    filteredRisk: r.rows,
    riskFilters: r.filters,
    setRiskFilters: r.setFilters,

    audit: mergedAudit,

    approveKyc,
    rejectKyc,
    flagStr,
    escalateStr,
    fileStr,
    dismissStr,
    clearRiskFlag,
    applyRgCooldown,
    limitOverride,
    resetForTest,
  };
}

// ── helpers ───────────────────────────────────────────────────────────
export function isKycOverdue(slaDueAt: string, now: number = Date.now()): boolean {
  return new Date(slaDueAt).getTime() < now;
}
