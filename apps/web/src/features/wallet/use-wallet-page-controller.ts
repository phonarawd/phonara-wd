import { useCallback, useMemo } from 'react';
import type { Tables } from '@phonara/shared-types';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { useComplianceStatus } from '@/hooks/use-compliance-status';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useLedger, useWallet } from '@/hooks/use-wallet';
import { useT } from '@/product/i18n';

import { mapWalletLedgerRow } from './wallet-ledger-display';
import type { LedgerRowView } from './ledger-entry-filters';
import { usePhonBalanceBreakdown } from './use-phon-balance-breakdown';

const RECENT_ACTIVITY_LIMIT = 5;

export type WalletPageControllerView = {
  t: ReturnType<typeof useT>;
  loading: boolean;
  errorKey: MessageKey | null;
  wallet: Tables<'wallets'> | null;
  phonAvailableDisplay: string;
  phonLockedDisplay: string;
  phonRealAvailableDisplay: string | null;
  phonBonusAvailableDisplay: string | null;
  usdtAvailableDisplay: string;
  usdtLockedDisplay: string;
  recentActivity: LedgerRowView[];
  activityLoading: boolean;
  complianceLoading: boolean;
  withdrawalReady: boolean;
  kycStatusKey: MessageKey | null;
  depositBlocked: boolean;
  withdrawalBlocked: boolean;
  refresh: () => void;
};

export function useWalletPageController(): WalletPageControllerView {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;

  const { wallet, loading: walletLoading, error: walletError } = useWallet();
  const {
    entries,
    loading: ledgerLoading,
    refresh: refreshLedger,
  } = useLedger(RECENT_ACTIVITY_LIMIT);
  const {
    breakdown,
    loading: breakdownLoading,
    error: breakdownError,
    refetch: refetchBreakdown,
  } = usePhonBalanceBreakdown();
  const { data: compliance, isLoading: complianceLoading } = useComplianceStatus();
  const { depositBlocked, withdrawalBlocked, loading: gatesLoading } = usePlatformGates();

  const recentActivity = useMemo(
    () => entries.slice(0, RECENT_ACTIVITY_LIMIT).map(mapWalletLedgerRow),
    [entries],
  );

  const loading = authLoading || walletLoading || ledgerLoading || breakdownLoading || gatesLoading;

  const errorKey = walletError ?? breakdownError;

  const refresh = useCallback(() => {
    refreshLedger();
    void refetchBreakdown();
  }, [refreshLedger, refetchBreakdown]);

  const kycStatusKey: MessageKey | null = useMemo(() => {
    if (!userId || complianceLoading) return null;
    const status = compliance?.kyc_status;
    if (status === 'approved') return 'wallet.kyc.verified';
    if (status === 'pending' || status === 'in_review') return 'wallet.kyc.pending';
    return 'wallet.kyc.unverified';
  }, [compliance?.kyc_status, complianceLoading, userId]);

  return {
    t,
    loading,
    errorKey,
    wallet,
    phonAvailableDisplay: wallet?.phon_available ?? breakdown?.phon_available ?? '0',
    phonLockedDisplay: wallet?.phon_locked ?? breakdown?.phon_locked ?? '0',
    phonRealAvailableDisplay: breakdown?.phon_real_available ?? null,
    phonBonusAvailableDisplay: breakdown?.phon_bonus_available ?? null,
    usdtAvailableDisplay: wallet?.usdt_available ?? '0',
    usdtLockedDisplay: wallet?.usdt_locked ?? '0',
    recentActivity,
    activityLoading: ledgerLoading,
    complianceLoading,
    withdrawalReady: Boolean(compliance?.withdrawal_ready),
    kycStatusKey,
    depositBlocked,
    withdrawalBlocked,
    refresh,
  };
}
