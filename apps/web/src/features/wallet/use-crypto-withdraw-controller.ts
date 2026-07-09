import { useCallback, useMemo, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { requestUsdtWithdrawal, type CryptoWithdrawalResult } from '@/domain/wallet';
import { useComplianceStatus } from '@/hooks/use-compliance-status';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useClientGatePrechecks } from '@/hooks/use-client-gate-prechecks';
import { useWallet } from '@/hooks/use-wallet';
import { translateError } from '@/lib/translate-error';

import {
  buildCryptoWithdrawTimelineSteps,
  canAcknowledgeCryptoWithdrawResult,
  canOpenCryptoWithdrawConfirm,
  canSubmitCryptoWithdrawRequest,
  cryptoWithdrawAddressGateKey,
  cryptoWithdrawAmountGateKey,
  cryptoWithdrawBalanceGateKey,
  cryptoWithdrawChainHintKey,
  cryptoWithdrawFeeHintKey,
  cryptoWithdrawNetGateKey,
  cryptoWithdrawWhitelistGateKey,
  CRYPTO_WITHDRAW_CHAINS,
  CRYPTO_WITHDRAW_NETWORK_FEE_USDT,
  estimateCryptoWithdrawNetUsdt,
  formatUsdtAmountForRpc,
  isEarnVipPriorityWithdrawTier,
  normalizeCryptoWithdrawAddressInput,
  normalizeUsdtWithdrawAmountInput,
  type CryptoWithdrawTimelineStepView,
} from './crypto-withdraw-page-display';
import type { CryptoWithdrawChain } from './crypto-withdraw-status';
import { useWithdrawalWhitelist } from './use-crypto-withdraw';
import { useWithdrawTierLimits } from './use-withdraw-tier-limits';
import type { WithdrawTierLimitsView } from '@/domain/wallet-money-policy-display';

export type CryptoWithdrawControllerView = {
  loading: boolean;
  withdrawalBlocked: boolean;
  withdrawalReady: boolean;
  usdtAvailableDisplay: string | null;
  showPriorityCopy: boolean;
  tierLimits: WithdrawTierLimitsView;
  chain: CryptoWithdrawChain;
  setChain: (chain: CryptoWithdrawChain) => void;
  chains: readonly CryptoWithdrawChain[];
  chainHintKey: MessageKey;
  feeHintKey: MessageKey;
  amountUsdt: string;
  setAmountUsdt: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  whitelistEnabled: boolean;
  whitelistHintVisible: boolean;
  estimatedNetUsdt: string | null;
  estimatedFeeUsdt: string;
  amountGateKey: MessageKey | null;
  addressGateKey: MessageKey | null;
  balanceGateKey: MessageKey | null;
  netGateKey: MessageKey | null;
  whitelistGateKey: MessageKey | null;
  canOpenConfirm: boolean;
  confirmOpen: boolean;
  openConfirm: () => void;
  closeConfirm: () => void;
  submitResult: CryptoWithdrawalResult | null;
  submitting: boolean;
  submitErrorKey: MessageKey | null;
  canSubmit: boolean;
  canAcknowledge: boolean;
  submitWithdraw: () => Promise<void>;
  acknowledgeSubmitted: () => void;
  submitted: boolean;
  timelineSteps: CryptoWithdrawTimelineStepView[];
};

export function useCryptoWithdrawController(): CryptoWithdrawControllerView {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { withdrawalBlocked, loading: gatesLoading } = usePlatformGates();
  const {
    geoBlocked,
    withdrawalMfaRequired,
    loading: clientGateLoading,
  } = useClientGatePrechecks();
  const { data: compliance, isLoading: complianceLoading } = useComplianceStatus();
  const { wallet, loading: walletLoading } = useWallet();
  const {
    addresses: whitelistAddresses,
    whitelistEnabled,
    loading: whitelistLoading,
  } = useWithdrawalWhitelist();
  const qc = useQueryClient();

  const withdrawalReady = Boolean(compliance?.withdrawal_ready);
  const usdtAvailableDisplay = wallet?.usdt_available ?? null;

  const { tierLimits, loading: tierLimitsLoading } = useWithdrawTierLimits();

  const [chain, setChainState] = useState<CryptoWithdrawChain>('TRC20');
  const [amountUsdt, setAmountRaw] = useState('');
  const [address, setAddressRaw] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<CryptoWithdrawalResult | null>(null);
  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);

  const estimatedNetUsdt = estimateCryptoWithdrawNetUsdt(amountUsdt, chain);
  const estimatedFeeUsdt = CRYPTO_WITHDRAW_NETWORK_FEE_USDT[chain];

  const amountGateKey = cryptoWithdrawAmountGateKey(amountUsdt);
  const addressGateKey = cryptoWithdrawAddressGateKey(address, chain);
  const balanceGateKey = cryptoWithdrawBalanceGateKey(amountUsdt, usdtAvailableDisplay);
  const netGateKey = cryptoWithdrawNetGateKey(amountUsdt, chain);
  const whitelistGateKey = cryptoWithdrawWhitelistGateKey(
    address,
    chain,
    whitelistEnabled,
    whitelistAddresses,
  );

  const confirmInput = {
    withdrawalBlocked,
    withdrawalReady,
    withdrawalMfaRequired,
    geoBlocked,
    amountUsdt,
    address,
    chain,
    usdtAvailable: usdtAvailableDisplay,
    whitelistEnabled,
    whitelistAddresses,
  };

  const canOpenConfirm = canOpenCryptoWithdrawConfirm(confirmInput);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const normalizedAmount = formatUsdtAmountForRpc(amountUsdt);
      const normalizedAddress = normalizeCryptoWithdrawAddressInput(address);
      const net = estimateCryptoWithdrawNetUsdt(amountUsdt, chain);
      if (!net) throw new Error('invalid_amount');
      return requestUsdtWithdrawal({
        amountUsdt: normalizedAmount,
        chain,
        address: normalizedAddress,
        idempotencyKey: crypto.randomUUID(),
        clientRequestId: crypto.randomUUID(),
        estimatedNetUsdt: net,
      });
    },
    onSuccess: (result) => {
      setSubmitResult(result);
      setSubmitErrorKey(null);
      void qc.invalidateQueries({ queryKey: ['withdraw-hub-history', userId] });
      void qc.invalidateQueries({ queryKey: ['wallet', userId] });
    },
    onError: (error) => {
      setSubmitErrorKey(translateError(error, 'error.UNKNOWN'));
    },
  });

  const setChain = useCallback((next: CryptoWithdrawChain) => {
    setChainState(next);
    setSubmitResult(null);
    setSubmitErrorKey(null);
  }, []);

  const setAmountUsdt = useCallback((value: string) => {
    setAmountRaw(normalizeUsdtWithdrawAmountInput(value));
    setSubmitResult(null);
    setSubmitErrorKey(null);
  }, []);

  const setAddress = useCallback((value: string) => {
    setAddressRaw(value);
    setSubmitResult(null);
    setSubmitErrorKey(null);
  }, []);

  const openConfirm = useCallback(() => {
    if (!canOpenConfirm) return;
    setConfirmOpen(true);
    setSubmitResult(null);
    setSubmitErrorKey(null);
  }, [canOpenConfirm]);

  const closeConfirm = useCallback(() => {
    if (submitMutation.isPending) return;
    setConfirmOpen(false);
  }, [submitMutation.isPending]);

  const submitWithdraw = useCallback(async () => {
    if (
      !canSubmitCryptoWithdrawRequest({
        ...confirmInput,
        submitting: submitMutation.isPending,
        submitResult,
      })
    ) {
      return;
    }
    await submitMutation.mutateAsync();
  }, [confirmInput, submitMutation, submitResult]);

  const acknowledgeSubmitted = useCallback(() => {
    if (!canAcknowledgeCryptoWithdrawResult(submitResult)) return;
    setConfirmOpen(false);
    setSubmitted(true);
  }, [submitResult]);

  const timelineSteps = useMemo(() => buildCryptoWithdrawTimelineSteps(), []);

  return {
    loading:
      authLoading ||
      gatesLoading ||
      clientGateLoading ||
      complianceLoading ||
      walletLoading ||
      whitelistLoading ||
      tierLimitsLoading,
    withdrawalBlocked,
    withdrawalReady,
    usdtAvailableDisplay,
    showPriorityCopy: isEarnVipPriorityWithdrawTier(tierLimits.currentTier),
    tierLimits,
    chain,
    setChain,
    chains: CRYPTO_WITHDRAW_CHAINS,
    chainHintKey: cryptoWithdrawChainHintKey(chain),
    feeHintKey: cryptoWithdrawFeeHintKey(chain),
    amountUsdt,
    setAmountUsdt,
    address,
    setAddress,
    whitelistEnabled,
    whitelistHintVisible: whitelistEnabled,
    estimatedNetUsdt,
    estimatedFeeUsdt,
    amountGateKey,
    addressGateKey,
    balanceGateKey,
    netGateKey,
    whitelistGateKey,
    canOpenConfirm,
    confirmOpen,
    openConfirm,
    closeConfirm,
    submitResult,
    submitting: submitMutation.isPending,
    submitErrorKey,
    canSubmit: canSubmitCryptoWithdrawRequest({
      ...confirmInput,
      submitting: submitMutation.isPending,
      submitResult,
    }),
    canAcknowledge: canAcknowledgeCryptoWithdrawResult(submitResult),
    submitWithdraw,
    acknowledgeSubmitted,
    submitted,
    timelineSteps,
  };
}
