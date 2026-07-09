import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { translateError } from '@/lib/translate-error';

import {
  buildCryptoDepositTimelineSteps,
  canAcknowledgeCryptoDepositResult,
  canOpenCryptoDepositConfirm,
  canSubmitCryptoDepositRequest,
  cryptoDepositAmountGateKey,
  cryptoDepositChainHintKey,
  normalizeUsdtAmountInput,
  type CryptoDepositTimelineStepView,
} from './crypto-deposit-page-display';
import { CRYPTO_DEPOSIT_CHAINS, type CryptoDepositChain } from './crypto-deposit-status';
import {
  cryptoDepositKeys,
  useCryptoDepositAddress,
  useCryptoDepositRequest,
  type CryptoDepositRequestResult,
} from './use-crypto-deposit';

export type CryptoDepositControllerView = {
  loading: boolean;
  depositBlocked: boolean;
  chain: CryptoDepositChain;
  setChain: (chain: CryptoDepositChain) => void;
  chains: readonly CryptoDepositChain[];
  chainHintKey: MessageKey;
  amountUsdt: string;
  setAmountUsdt: (value: string) => void;
  address: string | null;
  addressLoading: boolean;
  addressErrorKey: MessageKey | null;
  refreshAddress: () => void;
  amountGateKey: MessageKey | null;
  canOpenConfirm: boolean;
  confirmOpen: boolean;
  openConfirm: () => void;
  closeConfirm: () => void;
  submitResult: CryptoDepositRequestResult | null;
  submitting: boolean;
  submitErrorKey: MessageKey | null;
  canSubmit: boolean;
  canAcknowledge: boolean;
  submitDeposit: () => Promise<void>;
  acknowledgeSubmitted: () => void;
  submitted: boolean;
  timelineSteps: CryptoDepositTimelineStepView[];
  copyAddress: (address: string) => Promise<boolean>;
  copyState: 'idle' | 'ok' | 'failed';
};

export function useCryptoDepositController(): CryptoDepositControllerView {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { depositBlocked, loading: gatesLoading } = usePlatformGates();
  const qc = useQueryClient();

  const [chain, setChainState] = useState<CryptoDepositChain>('TRC20');
  const [amountUsdt, setAmountRaw] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<CryptoDepositRequestResult | null>(null);
  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'failed'>('idle');

  const {
    address: addressRow,
    loading: addressLoading,
    error: addressErrorKey,
    refetch: refreshAddress,
  } = useCryptoDepositAddress('USDT', chain, !submitted);

  const { createCryptoDepositRequest, loading: submitting } = useCryptoDepositRequest();

  const address = addressRow?.address?.trim() ? addressRow.address.trim() : null;
  const addressReady = !!address && !addressRow?.needs_derivation;

  const amountGateKey = cryptoDepositAmountGateKey(amountUsdt);
  const canOpenConfirm = canOpenCryptoDepositConfirm({
    depositBlocked,
    amountUsdt,
    addressReady,
  });

  const setChain = useCallback((next: CryptoDepositChain) => {
    setChainState(next);
    setSubmitResult(null);
    setSubmitErrorKey(null);
    setCopyState('idle');
  }, []);

  const setAmountUsdt = useCallback((value: string) => {
    setAmountRaw(normalizeUsdtAmountInput(value));
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
    if (submitting) return;
    setConfirmOpen(false);
  }, [submitting]);

  const submitDeposit = useCallback(async () => {
    if (
      !canSubmitCryptoDepositRequest({
        depositBlocked,
        amountUsdt,
        addressReady,
        submitting,
      })
    ) {
      return;
    }
    setSubmitErrorKey(null);
    try {
      const created = await createCryptoDepositRequest({
        amount: normalizeUsdtAmountInput(amountUsdt),
        asset: 'USDT',
        chain,
        clientRequestId: crypto.randomUUID(),
      });
      setSubmitResult(created);
      void qc.invalidateQueries({ queryKey: ['deposit-hub-history', userId] });
      void qc.invalidateQueries({ queryKey: cryptoDepositKeys.address(userId, 'USDT', chain) });
    } catch (err) {
      setSubmitErrorKey(translateError(err, 'error.UNKNOWN'));
    }
  }, [
    amountUsdt,
    chain,
    addressReady,
    createCryptoDepositRequest,
    depositBlocked,
    qc,
    submitting,
    userId,
  ]);

  const acknowledgeSubmitted = useCallback(() => {
    if (!canAcknowledgeCryptoDepositResult(submitResult)) return;
    setConfirmOpen(false);
    setSubmitted(true);
  }, [submitResult]);

  const copyAddress = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState('ok');
      return true;
    } catch {
      setCopyState('failed');
      return false;
    }
  }, []);

  const timelineSteps = useMemo(
    () =>
      buildCryptoDepositTimelineSteps(
        submitResult?.confirmations_required,
        submitResult?.sla_hours?.toString(),
      ),
    [submitResult?.confirmations_required, submitResult?.sla_hours],
  );

  return {
    loading: authLoading || gatesLoading,
    depositBlocked,
    chain,
    setChain,
    chains: CRYPTO_DEPOSIT_CHAINS,
    chainHintKey: cryptoDepositChainHintKey(chain),
    amountUsdt,
    setAmountUsdt,
    address,
    addressLoading,
    addressErrorKey,
    refreshAddress: () => {
      void refreshAddress();
    },
    amountGateKey,
    canOpenConfirm,
    confirmOpen,
    openConfirm,
    closeConfirm,
    submitResult,
    submitting,
    submitErrorKey,
    canSubmit: canSubmitCryptoDepositRequest({
      depositBlocked,
      amountUsdt,
      addressReady,
      submitting,
    }),
    canAcknowledge: canAcknowledgeCryptoDepositResult(submitResult),
    submitDeposit,
    acknowledgeSubmitted,
    submitted,
    timelineSteps,
    copyAddress,
    copyState,
  };
}
