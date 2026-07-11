import { useMemo } from 'react';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  resolveRedeemRailDisabled,
  WALLET_REDEEM_RAILS,
  type WalletRedeemRailView,
} from '@/domain/wallet-redeem-display-contract';
import { useComplianceStatus } from '@/hooks/use-compliance-status';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useWallet } from '@/hooks/use-wallet';
import { useT } from '@/product/i18n';

import { usePhonBalanceBreakdown } from './use-phon-balance-breakdown';

export type WalletRedeemRailCardView = WalletRedeemRailView & {
  disabled: boolean;
};

export type WalletRedeemControllerView = {
  t: ReturnType<typeof useT>;
  loading: boolean;
  errorKey: MessageKey | null;
  phonAvailableDisplay: string;
  withdrawalBlocked: boolean;
  withdrawalReady: boolean;
  depositBlocked: boolean;
  rails: readonly WalletRedeemRailCardView[];
};

export function useWalletRedeemController(): WalletRedeemControllerView {
  const t = useT();
  const { loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading, error: walletError } = useWallet();
  const {
    breakdown,
    loading: breakdownLoading,
    error: breakdownError,
  } = usePhonBalanceBreakdown();
  const { data: compliance, isLoading: complianceLoading } = useComplianceStatus();
  const { depositBlocked, withdrawalBlocked, loading: gatesLoading } = usePlatformGates();

  const withdrawalReady = Boolean(compliance?.withdrawal_ready);

  const rails = useMemo(
    () =>
      WALLET_REDEEM_RAILS.map((rail) => ({
        ...rail,
        disabled: resolveRedeemRailDisabled({
          rail,
          withdrawalBlocked,
          withdrawalReady,
          depositBlocked,
        }),
      })),
    [depositBlocked, withdrawalBlocked, withdrawalReady],
  );

  return {
    t,
    loading: authLoading || walletLoading || breakdownLoading || complianceLoading || gatesLoading,
    errorKey: walletError ?? breakdownError,
    phonAvailableDisplay: wallet?.phon_available ?? breakdown?.phon_available ?? '0',
    withdrawalBlocked,
    withdrawalReady,
    depositBlocked,
    rails,
  };
}
