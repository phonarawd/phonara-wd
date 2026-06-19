import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@phonara/shared-types';
import type { AdminAuditEvent } from '@/components/admin/primitives';
import { supabase } from '../../lib/supabase';
import { runQueueAction } from '../../domain/queues';
import type {
  AdminDepositReconRow,
  AdminWithdrawRow,
  DepositFilters,
  DepositMethod,
  DepositStatus,
  WithdrawFilters,
  WithdrawMethod,
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
    method: 'crypto',
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
        .select('*')
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
      const { data, error } = await supabase
        .from('crypto_deposit_requests')
        .select('*, crypto_deposit_addresses(address)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((row) =>
        mapDepositRow(row as CryptoDepositRow),
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
    (id: string, reason: string): void => {
      if (reason.trim().length < MIN_REASON) return;
      void (async () => {
        const full = await supabase
          .from('crypto_deposit_requests')
          .select('*, crypto_deposit_addresses(address, chain)')
          .eq('id', id)
          .single();
        if (full.error || !full.data) return;
        const req = full.data as CryptoDepositRow & {
          crypto_deposit_addresses: { address: string; chain: string } | null;
        };
        const tx = req.tx_hash;
        const chain = req.chain;
        const address = req.crypto_deposit_addresses?.address;
        if (!tx || !chain || !address) return;
        try {
          await callRpc('rpc_admin_match_crypto_deposit', {
            p_tx_hash: tx,
            p_chain: chain,
            p_to_address: address,
            p_amount: req.amount,
            p_confirmations_seen: req.confirmations_seen ?? 1,
          });
          await invalidate();
        } catch {
          // no fake success
        }
      })();
    },
    [invalidate],
  );

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
    flagDeposit: (_id: string, _reason: string) => undefined,
    resetForTest: () => {
      setWithdrawFilters({ search: '', status: [], method: [] });
      setDepositFilters({ search: '', status: [], method: [] });
      setAudit([]);
    },
  };
}
