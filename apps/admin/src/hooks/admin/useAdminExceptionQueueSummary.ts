import { useMemo } from 'react';
import { useAdminWalletDesk } from '@/hooks/admin/useAdminWalletDesk';
import { useAdminCompliance } from '@/hooks/admin/useAdminCompliance';
import { useAdminOverview } from '@/hooks/admin/useAdminOverview';
import { useAdminSupportDesk } from '@/hooks/admin/useAdminSupportDesk';
import { ADMIN_SUPPORT_QUEUES_CONVERGENCE } from '@/domain/admin-support-desk-display-contract';

export type ExceptionDisposition = 'auto_ok' | 'manual_required' | 'retry_failed' | 'on_hold';

export interface AdminExceptionQueueSummary {
  autoOk: string;
  manualRequired: string;
  retryFailed: string;
  onHold: string;
  totalExceptions: string;
  /** Open support tickets converging into queues (E9 · §29.5). */
  supportOpen: string;
}

/** Aggregates exception-queue automation posture across wallet · compliance · alerts · support. */
export function useAdminExceptionQueueSummary(): AdminExceptionQueueSummary {
  const { withdrawals, deposits } = useAdminWalletDesk();
  const { kyc, str } = useAdminCompliance();
  const { unresolvedAlerts } = useAdminOverview();
  const { openCount: supportOpenCount } = useAdminSupportDesk();

  return useMemo(() => {
    let autoOk = 0;
    let manualRequired = 0;
    let retryFailed = 0;
    let onHold = 0;

    for (const w of withdrawals) {
      if (w.status === 'pending') manualRequired += 1;
      else if (w.status === 'approved') onHold += 1;
      else if (w.status === 'sent') autoOk += 1;
      else if (w.status === 'rejected') retryFailed += 1;
    }

    for (const d of deposits) {
      if (d.status === 'pending_review') manualRequired += 1;
      else if (d.status === 'confirming') onHold += 1;
      else if (d.status === 'complete') autoOk += 1;
      else if (d.status === 'failed') retryFailed += 1;
    }

    for (const row of kyc) {
      if (row.status === 'pending' || row.status === 'in_review') manualRequired += 1;
      else if (row.status === 'approved') autoOk += 1;
      else if (row.status === 'rejected') retryFailed += 1;
    }

    for (const row of str) {
      if (row.status === 'open') manualRequired += 1;
      else if (row.status === 'reviewing') onHold += 1;
      else if (row.status === 'filed') autoOk += 1;
      else if (row.status === 'dismissed') autoOk += 1;
    }

    manualRequired += unresolvedAlerts;

    const supportOpen = ADMIN_SUPPORT_QUEUES_CONVERGENCE ? supportOpenCount : 0;
    manualRequired += supportOpen;

    const totalExceptions = manualRequired + retryFailed + onHold;

    return {
      autoOk: String(autoOk),
      manualRequired: String(manualRequired),
      retryFailed: String(retryFailed),
      onHold: String(onHold),
      totalExceptions: String(totalExceptions),
      supportOpen: String(supportOpen),
    };
  }, [withdrawals, deposits, kyc, str, unresolvedAlerts, supportOpenCount]);
}
