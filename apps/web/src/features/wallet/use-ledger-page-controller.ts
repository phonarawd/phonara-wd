import { useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { formatMoney } from '@/hooks/use-money';
import { useAuth } from '../../contexts/auth-context';
import { useLedger } from '../../hooks/use-wallet';
import { useT } from '../../lib/i18n';
import { ledgerReasonLabelKey } from '../wallet/ledger-labels';

export type LedgerRowView = {
  id: string;
  dateDisplay: string;
  typeDisplay: string;
  amountDisplay: string;
  statusDisplay: string;
};

export function useLedgerPageController() {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { entries, loading } = useLedger();

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  const rows = useMemo((): LedgerRowView[] => {
    return entries.map((row) => ({
      id: row.id,
      dateDisplay: new Date(row.created_at).toLocaleString(),
      typeDisplay: t(ledgerReasonLabelKey(row.reason_code)),
      amountDisplay: `${formatMoney(row.amount, row.currency)} ${row.currency}`,
      statusDisplay: '—',
    }));
  }, [entries, t]);

  return {
    t,
    authLoading,
    loading,
    rows,
    empty: rows.length === 0,
  };
}
