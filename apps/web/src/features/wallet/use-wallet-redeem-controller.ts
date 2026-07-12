import { useMemo } from 'react';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { hasAvailableGiftcardMarket } from '@/domain/wallet-capability-rails-display-contract';
import {
  resolveRedeemRailDisabled,
  resolveWalletRedeemRails,
  type WalletRedeemRailView,
} from '@/domain/wallet-redeem-display-contract';
import { useComplianceStatus } from '@/hooks/use-compliance-status';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useWallet } from '@/hooks/use-wallet';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { useT } from '@/product/i18n';

import { useGiftcardFeeMarket } from './use-giftcard-fee-market';
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
  const { breakdown, loading: breakdownLoading, error: breakdownError } = usePhonBalanceBreakdown();
  const { data: compliance, isLoading: complianceLoading } = useComplianceStatus();
  const { depositBlocked, withdrawalBlocked, loading: gatesLoading } = usePlatformGates();
  const { data: feeMarket = [], isLoading: marketLoading } = useGiftcardFeeMarket();

  const withdrawalReady = Boolean(compliance?.withdrawal_ready);
  const giftcardMarketAvailable = hasAvailableGiftcardMarket(feeMarket.length);

  const rails = useMemo(
    () =>
      resolveWalletRedeemRails({
        cryptoRails: LAUNCH_GATES.cryptoRails,
        giftcardMarketAvailable,
      }).map((rail) => ({
        ...rail,
        disabled: resolveRedeemRailDisabled({
          rail,
          withdrawalBlocked,
          withdrawalReady,
          depositBlocked,
        }),
      })),
    [depositBlocked, giftcardMarketAvailable, withdrawalBlocked, withdrawalReady],
  );

  return {
    t,
    loading:
      authLoading ||
      walletLoading ||
      breakdownLoading ||
      complianceLoading ||
      gatesLoading ||
      marketLoading,
    errorKey: walletError ?? breakdownError,
    phonAvailableDisplay: wallet?.phon_available ?? breakdown?.phon_available ?? '0',
    withdrawalBlocked,
    withdrawalReady,
    depositBlocked,
    rails,
  };
}
