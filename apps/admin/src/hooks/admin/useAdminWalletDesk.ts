import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@phonara/shared-types';
import {
  CRYPTO_DEPOSIT_ADMIN_ROW,
  KRW_DEPOSIT_REQUESTS_ROW,
  WITHDRAWAL_REQUESTS_ROW,
} from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/shared-types';
import { supabase } from '../../lib/supabase';
import { runQueueAction } from '../../domain/queues';
import type {
  AdminDepositReconRow,
  AdminWithdrawRow,
  DepositFilters,
  DepositMethod,
  DepositStatus,
  WithdrawFilters,
  WithdrawStatus,
} from './useAdminWalletDeskMock';
import { callRpc } from '../../lib/rpc';

export type {
  AdminDepositReconRow,
  AdminWithdrawRow,
  DepositFilters,
  DepositMethod,
  DepositStatus,
  WithdrawFilters,
  WithdrawMethod,
  WithdrawStatus,
} from './useAdminWalletDeskMock';

export { formatAmountString, isOverdueSla } from './useAdminWalletDeskMock';

const MIN_REASON = 4;

type WithdrawalRow = Tables<'withdrawal_requests'>;
type CryptoDepositRow = Tables<'crypto_deposit_requests'> & {
  crypto_deposit_addresses: Pick<Tables<'crypto_deposit_addresses'>, 'address'> | null;
};
type KrwDepositRow = Tables<'krw_deposit_requests'>;
type GiftcardDepositRow = {
  id: string;
  user_id: string;
  face_value_krw: string;
  status: string;
  created_at: string;
  kind: string;
};

function mapGiftcardDepositRow(row: GiftcardDepositRow): AdminDepositReconRow {
  return {
    id: row.id,
    userId: `${row.user_id.slice(0, 8)}…`,
    amount: row.face_value_krw,
    method: 'giftcard' as DepositMethod,
    status: row.status === 'pending' ? 'pending_review' : mapDepositStatus(row.status),
    createdAt: row.created_at,
    reference: row.kind,
  };
}

function mapDepositStatus(status: string): DepositStatus {
  if (status === 'unmatched' || status === 'disputed') return 'pending_review';
  if (status === 'credited' || status === 'matched') return 'complete';
  if (status === 'failed' || status === 'expired' || status === 'admin_rejected') return 'failed';
  if (status === 'pending') return 'confirming';
  return 'pending';
}

function mapDepositRow(row: CryptoDepositRow): AdminDepositReconRow {
  return {
    id: row.id,
    userId: `${row.user_id.slice(0, 8)}…`,
    amount: row.amount,
    method: 'crypto' as DepositMethod,
    status: mapDepositStatus(row.status),
    createdAt: row.created_at,
    reference: row.tx_hash ?? row.crypto_deposit_addresses?.address ?? '—',
  };
}

function mapKrwDepositRow(row: KrwDepositRow): AdminDepositReconRow {
  return {
    id: row.id,
    userId: `${row.user_id.slice(0, 8)}…`,
    amount: row.amount_krw,
    method: 'krw' as DepositMethod,
    status: mapDepositStatus(row.status),
    createdAt: row.created_at,
    reference: row.reference_code,
  };
}

function filterDeposits(rows: AdminDepositReconRow[], f: DepositFilters): AdminDepositReconRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.method.length > 0 && !f.method.includes(r.method)) return false;
    if (!q) return true;
    return (
      r.id.toLowerCase().includes(q) ||
      r.userId.toLowerCase().includes(q) ||
      (r.reference ?? '').toLowerCase().includes(q)
    );
  });
}

function mapStatus(status: string): WithdrawStatus {
  if (status === 'approved' || status === 'sent' || status === 'rejected') return status;
  return 'pending';
}

function inferWithdrawMethod(row: WithdrawalRow): 'crypto' | 'krw' {
  if (row.currency === 'KRW') return 'krw';
  const dest =
    typeof row.destination === 'object' && row.destination !== null
      ? (row.destination as Record<string, unknown>)
      : null;
  if (dest?.['rail'] === 'krw' || dest?.['method'] === 'krw' || dest?.['bank_account']) {
    return 'krw';
  }
  return 'crypto';
}

function mapWithdrawRow(row: WithdrawalRow): AdminWithdrawRow {
  const destination =
    typeof row.destination === 'object' && row.destination !== null
      ? JSON.stringify(row.destination)
      : String(row.destination ?? '—');
  return {
    id: row.id,
    userId: row.user_id.slice(0, 8) + '…',
    amount: row.amount,
    currency: row.currency,
    method: inferWithdrawMethod(row),
    status: mapStatus(row.status),
    createdAt: row.created_at,
    slaDueAt: row.created_at,
    destinationSummary: destination,
  };
}

function filterWithdrawals(rows: AdminWithdrawRow[], f: WithdrawFilters): AdminWithdrawRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status.length > 0 && !f.status.includes(r.status)) return false;
    if (f.method.length > 0 && !f.method.includes(r.method)) return false;
    if (!q) return true;
    return (
      r.id.toLowerCase().includes(q) ||
      r.userId.toLowerCase().includes(q) ||
      r.destinationSummary.toLowerCase().includes(q)
    );
  });
}

/** Engine-backed wallet withdraw queue for admin E2E + desk. */
export function useAdminWalletDesk() {
  const qc = useQueryClient();
  const [withdrawFilters, setWithdrawFilters] = useState<WithdrawFilters>({
    search: '',
    status: [],
    method: [],
  });
  const [depositFilters, setDepositFilters] = useState<DepositFilters>({
    search: '',
    status: [],
    method: [],
  });
  const [audit, setAudit] = useState<AdminAuditEvent[]>([]);

  const { data: withdrawals = [], refetch } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(WITHDRAWAL_REQUESTS_ROW)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map(mapWithdrawRow);
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const { data: deposits = [], refetch: refetchDeposits } = useQuery({
    queryKey: ['admin-deposits'],
    queryFn: async () => {
      const [cryptoRes, krwRes, giftRes] = await Promise.all([
        supabase
          .from('crypto_deposit_requests')
          .select(CRYPTO_DEPOSIT_ADMIN_ROW)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('krw_deposit_requests')
          .select(KRW_DEPOSIT_REQUESTS_ROW)
          .order('created_at', { ascending: false })
          .limit(200),
        (supabase as { from: (rel: string) => ReturnType<typeof supabase.from> })
          .from('giftcard_deposit_requests')
          .select('id, user_id, face_value_krw, status, created_at, kind')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);
      if (cryptoRes.error) throw cryptoRes.error;
      if (krwRes.error) throw krwRes.error;
      if (giftRes.error) throw giftRes.error;
      const cryptoRows = (cryptoRes.data ?? []).map((row) =>
        mapDepositRow(row as CryptoDepositRow),
      );
      const krwRows = (krwRes.data ?? []).map((row) => mapKrwDepositRow(row as KrwDepositRow));
      const giftRows = (giftRes.data ?? []).map((row) =>
        mapGiftcardDepositRow(row as unknown as GiftcardDepositRow),
      );
      return [...cryptoRows, ...krwRows, ...giftRows].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    void refetchDeposits();
  }, [refetchDeposits]);

  const filteredDeposits = useMemo(
    () => filterDeposits(deposits, depositFilters),
    [deposits, depositFilters],
  );

  const filteredWithdrawals = useMemo(
    () => filterWithdrawals(withdrawals, withdrawFilters),
    [withdrawals, withdrawFilters],
  );

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    await qc.invalidateQueries({ queryKey: ['admin-deposits'] });
    await qc.invalidateQueries({ queryKey: ['audit-logs'] });
    await refetch();
    await refetchDeposits();
  }, [qc, refetch, refetchDeposits]);

  const appendAudit = useCallback((event: AdminAuditEvent) => {
    setAudit((prev) => [event, ...prev].slice(0, 50));
  }, []);

  const rejectWithdraw = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'rejectWithdrawal', id }, reason.trim());
        appendAudit({
          id: `wd-reject-${id}-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: 'admin.wallet.withdraw.audit.reject',
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

  const approveWithdraw = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'approveWithdrawal', id }, reason.trim());
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const markSent = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await runQueueAction({ kind: 'markWithdrawalSent', id }, reason.trim());
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [invalidate],
  );

  const matchDeposit = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      const row = deposits.find((d) => d.id === id);
      if (!row) return false;
      try {
        if (row.method === 'giftcard') {
          await (
            supabase as {
              rpc: (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>;
            }
          ).rpc('rpc_admin_approve_giftcard_deposit', {
            p_deposit_id: id,
            p_reason: reason.trim(),
          });
        } else if (row.method === 'krw') {
          const transferId = `admin-${id.slice(0, 8)}-${Date.now()}`;
          await (
            supabase as {
              rpc: (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>;
            }
          ).rpc('rpc_admin_match_krw_deposit', {
            p_deposit_id: id,
            p_transfer_id: transferId,
            p_reason: reason.trim(),
          });
        } else {
          const full = await supabase
            .from('crypto_deposit_requests')
            .select('*, crypto_deposit_addresses(address, chain)')
            .eq('id', id)
            .single();
          if (full.error || !full.data) return false;
          const req = full.data as CryptoDepositRow & {
            crypto_deposit_addresses: { address: string; chain: string } | null;
          };
          const tx = req.tx_hash ?? `admin-match-${transferSuffix()}`;
          const chain = req.chain;
          const address = req.crypto_deposit_addresses?.address;
          if (!chain || !address) return false;
          await callRpc('rpc_admin_match_crypto_deposit', {
            p_tx_hash: tx,
            p_chain: chain,
            p_to_address: address,
            p_amount: req.amount,
            p_confirmations_seen: req.confirmations_seen ?? 1,
          });
        }
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    [deposits, invalidate],
  );

  function transferSuffix(): string {
    return `${Date.now().toString(36)}`;
  }

  return {
    withdrawals,
    filteredWithdrawals,
    withdrawFilters,
    setWithdrawFilters,
    deposits,
    filteredDeposits,
    depositFilters,
    setDepositFilters,
    audit,
    approveWithdraw,
    rejectWithdraw,
    markSent,
    matchDeposit,
    flagDeposit: async (id: string, reason: string): Promise<boolean> => {
      if (reason.trim().length < MIN_REASON) return false;
      try {
        await (
          supabase as {
            rpc: (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>;
          }
        ).rpc('rpc_admin_flag_deposit', {
          p_deposit_id: id,
          p_reason: reason.trim(),
        });
        appendAudit({
          id: `dep-flag-${id}-${Date.now()}`,
          at: new Date().toISOString(),
          actorKey: 'admin.primitive.audit.actor.system',
          actionKey: 'admin.wallet.depositRecon.audit.flag',
          subject: id,
          reason: reason.trim(),
        });
        await invalidate();
        return true;
      } catch {
        return false;
      }
    },
    resetForTest: () => {
      setWithdrawFilters({ search: '', status: [], method: [] });
      setDepositFilters({ search: '', status: [], method: [] });
      setAudit([]);
    },
  };
}
