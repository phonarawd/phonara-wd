import { useCallback } from 'react';
import { createAdminMockHook } from '@/hooks/admin/createAdminMockHook';
import type { AdminAuditEvent } from '@/shared-types';

// L1-15-B B1 — admin wallet desk mock SOT.
// createAdminMockHook 첫 실사용. mock/display-only. supabase/rpc 0.
// Composes two factory hooks (withdrawals + deposits) under one facade.
// F9 contract: withdraw method ∈ {crypto, krw} · deposit method ∈ {crypto, krw, giftcard}.

export type WithdrawStatus = 'pending' | 'approved' | 'sent' | 'rejected';
export type WithdrawMethod = 'crypto' | 'krw';

export interface AdminWithdrawRow {
  id: string;
  userId: string; // masked display
  amount: string; // string only
  currency: string;
  method: WithdrawMethod;
  status: WithdrawStatus;
  createdAt: string;
  slaDueAt: string;
  destinationSummary: string;
  fee?: string;
  net?: string;
}

export type DepositMethod = 'crypto' | 'krw' | 'giftcard';
export type DepositStatus = 'pending' | 'confirming' | 'pending_review' | 'complete' | 'failed';
export type DepositProofStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface AdminDepositReconRow {
  id: string;
  userId: string;
  amount: string;
  method: DepositMethod;
  status: DepositStatus;
  createdAt: string;
  reference?: string;
  /** KRW proof only — E10 `rpc_admin_review_krw_deposit_proof`. */
  proofStatus?: DepositProofStatus;
  proofPath?: string | null;
}

export interface WithdrawFilters {
  search: string;
  status: WithdrawStatus[];
  method: WithdrawMethod[];
}
export interface DepositFilters {
  search: string;
  status: DepositStatus[];
  method: DepositMethod[];
}

const MIN_REASON = 4;

// Deterministic SEED — 8 withdrawals (≥3 pending · ≥1 SLA overdue).
const WITHDRAW_SEED: AdminWithdrawRow[] = [
  {
    id: 'WD-2026-0617-001',
    userId: 'u_***c91',
    amount: '120000',
    currency: 'KRW',
    method: 'krw',
    status: 'pending',
    createdAt: '2026-06-17T07:00:00.000Z',
    slaDueAt: '2026-06-17T08:00:00.000Z', // overdue vs late kickoff data
    destinationSummary: '신한 110-***-4421',
    fee: '1000',
    net: '119000',
  },
  {
    id: 'WD-2026-0617-002',
    userId: 'u_***af2',
    amount: '350',
    currency: 'USDT',
    method: 'crypto',
    status: 'pending',
    createdAt: '2026-06-17T07:18:00.000Z',
    slaDueAt: '2026-06-17T09:18:00.000Z',
    destinationSummary: 'TRC20 T***k7Yp',
    fee: '1',
    net: '349',
  },
  {
    id: 'WD-2026-0617-003',
    userId: 'u_***b15',
    amount: '84000',
    currency: 'KRW',
    method: 'krw',
    status: 'pending',
    createdAt: '2026-06-17T08:02:00.000Z',
    slaDueAt: '2026-06-17T10:02:00.000Z',
    destinationSummary: '국민 884-***-1182',
    fee: '1000',
    net: '83000',
  },
  {
    id: 'WD-2026-0616-094',
    userId: 'u_***e08',
    amount: '1500000',
    currency: 'KRW',
    method: 'krw',
    status: 'approved',
    createdAt: '2026-06-16T22:11:00.000Z',
    slaDueAt: '2026-06-17T00:11:00.000Z',
    destinationSummary: '우리 1002-***-7755',
    fee: '1000',
    net: '1499000',
  },
  {
    id: 'WD-2026-0616-088',
    userId: 'u_***12c',
    amount: '920',
    currency: 'USDT',
    method: 'crypto',
    status: 'approved',
    createdAt: '2026-06-16T19:40:00.000Z',
    slaDueAt: '2026-06-16T21:40:00.000Z',
    destinationSummary: 'TRC20 T***mQwL',
  },
  {
    id: 'WD-2026-0616-071',
    userId: 'u_***301',
    amount: '245000',
    currency: 'KRW',
    method: 'krw',
    status: 'sent',
    createdAt: '2026-06-16T14:02:00.000Z',
    slaDueAt: '2026-06-16T16:02:00.000Z',
    destinationSummary: '카카오 3333-***-0099',
  },
  {
    id: 'WD-2026-0616-052',
    userId: 'u_***f87',
    amount: '75000',
    currency: 'KRW',
    method: 'krw',
    status: 'rejected',
    createdAt: '2026-06-16T11:18:00.000Z',
    slaDueAt: '2026-06-16T13:18:00.000Z',
    destinationSummary: '신한 110-***-9912',
  },
  {
    id: 'WD-2026-0616-031',
    userId: 'u_***a40',
    amount: '180',
    currency: 'USDT',
    method: 'crypto',
    status: 'sent',
    createdAt: '2026-06-16T08:55:00.000Z',
    slaDueAt: '2026-06-16T10:55:00.000Z',
    destinationSummary: 'TRC20 T***pZ8R',
  },
];

const DEPOSIT_SEED: AdminDepositReconRow[] = [
  {
    id: 'DP-2026-0617-201',
    userId: 'u_***c91',
    amount: '30000',
    method: 'giftcard',
    status: 'pending_review',
    createdAt: '2026-06-17T07:25:00.000Z',
    reference: 'CULTURE PIN ***2241',
  },
  {
    id: 'DP-2026-0617-198',
    userId: 'u_***b15',
    amount: '50000',
    method: 'giftcard',
    status: 'pending_review',
    createdAt: '2026-06-17T07:11:00.000Z',
    reference: 'HAPPY PIN ***8810',
  },
  {
    id: 'DP-2026-0617-195',
    userId: 'u_***af2',
    amount: '200',
    method: 'crypto',
    status: 'confirming',
    createdAt: '2026-06-17T07:02:00.000Z',
    reference: 'TRC20 tx 0x***f1e',
  },
  {
    id: 'DP-2026-0617-188',
    userId: 'u_***e08',
    amount: '100000',
    method: 'krw',
    status: 'pending',
    createdAt: '2026-06-17T06:48:00.000Z',
    reference: '이체 홍길동',
    proofStatus: 'pending',
    proofPath: '00000000-0000-4000-8000-000000000001/proof.jpg',
  },
  {
    id: 'DP-2026-0616-180',
    userId: 'u_***301',
    amount: '500000',
    method: 'krw',
    status: 'complete',
    createdAt: '2026-06-16T22:30:00.000Z',
    reference: '이체 김철수',
  },
  {
    id: 'DP-2026-0616-172',
    userId: 'u_***f87',
    amount: '20000',
    method: 'giftcard',
    status: 'failed',
    createdAt: '2026-06-16T20:10:00.000Z',
    reference: 'BOOK PIN invalid',
  },
];

const filterWithdraw = (rows: AdminWithdrawRow[], f: WithdrawFilters): AdminWithdrawRow[] => {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.method.length > 0 && !f.method.includes(r.method)) return false;
    if (!q) return true;
    return (
      r.userId.toLowerCase().includes(q) ||
      r.destinationSummary.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });
};

const filterDeposit = (rows: AdminDepositReconRow[], f: DepositFilters): AdminDepositReconRow[] => {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.method.length > 0 && !f.method.includes(r.method)) return false;
    if (!q) return true;
    return (
      r.userId.toLowerCase().includes(q) ||
      (r.reference ?? '').toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });
};

const useWithdrawalsMock = createAdminMockHook<AdminWithdrawRow, WithdrawFilters>({
  storageKey: 'admin:wallet:withdraw:v1',
  seedRows: WITHDRAW_SEED,
  seedFilters: { search: '', status: [], method: [] },
  filterFn: filterWithdraw,
});

const useDepositsMock = createAdminMockHook<AdminDepositReconRow, DepositFilters>({
  storageKey: 'admin:wallet:deposit:v1',
  seedRows: DEPOSIT_SEED,
  seedFilters: { search: '', status: [], method: [] },
  filterFn: filterDeposit,
});

export interface UseAdminWalletDesk {
  withdrawals: AdminWithdrawRow[];
  filteredWithdrawals: AdminWithdrawRow[];
  withdrawFilters: WithdrawFilters;
  setWithdrawFilters: (f: WithdrawFilters | ((p: WithdrawFilters) => WithdrawFilters)) => void;

  deposits: AdminDepositReconRow[];
  filteredDeposits: AdminDepositReconRow[];
  depositFilters: DepositFilters;
  setDepositFilters: (f: DepositFilters | ((p: DepositFilters) => DepositFilters)) => void;

  audit: AdminAuditEvent[];

  approveWithdraw: (id: string, reason: string) => void;
  rejectWithdraw: (id: string, reason: string) => void;
  markSent: (id: string, reason: string) => void;
  matchDeposit: (id: string, reason: string) => Promise<boolean>;
  flagDeposit: (id: string, reason: string) => Promise<boolean>;
  reviewKrwDepositProof: (
    id: string,
    decision: 'approved' | 'rejected',
    reason: string,
  ) => Promise<boolean>;
  getKrwDepositProofUrl: (proofPath: string) => Promise<string | null>;

  resetForTest: () => void;
}

const nowIso = () => new Date().toISOString();

const validReason = (r: string) => r.trim().length >= MIN_REASON;

export function useAdminWalletDeskMock(): UseAdminWalletDesk {
  const w = useWithdrawalsMock();
  const d = useDepositsMock();

  const approveWithdraw = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = w.allRows.find((r) => r.id === id);
      if (!row || row.status !== 'pending') return;
      w.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'approved' }),
      );
      w.appendAudit({
        id: `${id}-approve-${nowIso()}`,
        at: nowIso(),
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.wallet.withdraw.audit.approve',
        subject: id,
        reason: reason.trim(),
      });
    },
    [w],
  );

  const rejectWithdraw = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = w.allRows.find((r) => r.id === id);
      if (!row || row.status !== 'pending') return;
      w.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'rejected' }),
      );
      w.appendAudit({
        id: `${id}-reject-${nowIso()}`,
        at: nowIso(),
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.wallet.withdraw.audit.reject',
        subject: id,
        reason: reason.trim(),
      });
    },
    [w],
  );

  const markSent = useCallback(
    (id: string, reason: string) => {
      if (!validReason(reason)) return;
      const row = w.allRows.find((r) => r.id === id);
      if (!row || row.status !== 'approved') return;
      w.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'sent' }),
      );
      w.appendAudit({
        id: `${id}-sent-${nowIso()}`,
        at: nowIso(),
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.wallet.withdraw.audit.sent',
        subject: id,
        reason: reason.trim(),
      });
    },
    [w],
  );

  const matchDeposit = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = d.allRows.find((r) => r.id === id);
      if (!row || row.status === 'complete' || row.status === 'failed') return false;
      d.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'complete' }),
      );
      d.appendAudit({
        id: `${id}-match-${nowIso()}`,
        at: nowIso(),
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.wallet.depositRecon.audit.match',
        subject: id,
        reason: reason.trim(),
      });
      return true;
    },
    [d],
  );

  const flagDeposit = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = d.allRows.find((r) => r.id === id);
      if (!row || row.status === 'complete' || row.status === 'failed') return false;
      d.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, status: 'failed' }),
      );
      d.appendAudit({
        id: `${id}-flag-${nowIso()}`,
        at: nowIso(),
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.wallet.depositRecon.audit.flag',
        subject: id,
        reason: reason.trim(),
      });
      return true;
    },
    [d],
  );

  const reviewKrwDepositProof = useCallback(
    async (
      id: string,
      decision: 'approved' | 'rejected',
      reason: string,
    ): Promise<boolean> => {
      if (!validReason(reason)) return false;
      const row = d.allRows.find((r) => r.id === id);
      if (!row || row.method !== 'krw' || row.proofStatus !== 'pending') return false;
      d.patchRow(
        id,
        (r) => r.id,
        (r) => ({ ...r, proofStatus: decision }),
      );
      d.appendAudit({
        id: `${id}-proof-${decision}-${nowIso()}`,
        at: nowIso(),
        actorKey: 'admin.primitive.audit.actor.system',
        actionKey: 'admin.deposits.audit.proofReview',
        subject: id,
        reason: reason.trim(),
      });
      return true;
    },
    [d],
  );

  const getKrwDepositProofUrl = useCallback(async (proofPath: string): Promise<string | null> => {
    if (!proofPath.trim()) return null;
    return `https://example.invalid/krw-deposit-proofs/${encodeURIComponent(proofPath)}`;
  }, []);

  const resetForTest = useCallback(() => {
    w.resetForTest();
    d.resetForTest();
  }, [w, d]);

  // Merge audit; sort by at desc.
  const audit: AdminAuditEvent[] = [...w.audit, ...d.audit].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
  );

  return {
    withdrawals: w.allRows,
    filteredWithdrawals: w.rows,
    withdrawFilters: w.filters,
    setWithdrawFilters: w.setFilters,
    deposits: d.allRows,
    filteredDeposits: d.rows,
    depositFilters: d.filters,
    setDepositFilters: d.setFilters,
    audit,
    approveWithdraw,
    rejectWithdraw,
    markSent,
    matchDeposit,
    flagDeposit,
    reviewKrwDepositProof,
    getKrwDepositProofUrl,
    resetForTest,
  };
}

// ── display helpers ───────────────────────────────────────────────────
export function formatAmountString(amount: string, currency: string): string {
  if (currency === 'KRW') {
    const neg = amount.startsWith('-');
    const body = neg ? amount.slice(1) : amount;
    return `${neg ? '-' : ''}₩${body.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
  return `${amount} ${currency}`;
}

export function isOverdueSla(slaDueAt: string, now: number = Date.now()): boolean {
  return new Date(slaDueAt).getTime() < now;
}

export function maskUser(userId: string): string {
  return userId;
}
