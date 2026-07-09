import { useCallback, useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';

import { requestPhonKrwWithdrawal, type KrwWithdrawalResult } from '@/domain/wallet';

import { useComplianceStatus } from '@/hooks/use-compliance-status';

import { usePlatformGates } from '@/hooks/use-platform-gates';
import { useClientGatePrechecks } from '@/hooks/use-client-gate-prechecks';

import { isPhonKrwRateStale, isPhonKrwRateUnavailable } from '@/lib/phon-krw-rate-stale';

import { translateError } from '@/lib/translate-error';

import { supabase } from '@/lib/supabase';

import {
  buildKrwWithdrawTimelineSteps,
  canAcknowledgeKrwWithdrawResult,
  canOpenKrwWithdrawConfirm,
  canSubmitKrwWithdrawRequest,
  formatPhonAmountForRpc,
  formatRateCapturedAt,
  krwWithdrawAccountGateKey,
  krwWithdrawAmountGateKey,
  krwWithdrawBalanceGateKey,
  krwWithdrawRateGateKey,
  normalizeBankAccountInput,
  normalizePhonWithdrawAmountInput,
  type KrwWithdrawTimelineStepView,
} from './krw-withdraw-page-display';

import { usePhonBalanceBreakdown } from './use-phon-balance-breakdown';
import { useWithdrawTierLimits } from './use-withdraw-tier-limits';
import type { WithdrawTierLimitsView } from '@/domain/wallet-money-policy-display';

import type { ExchangeRateSnapshot } from './use-wallet-data';

export type KrwWithdrawControllerView = {
  loading: boolean;

  withdrawalBlocked: boolean;

  withdrawalReady: boolean;

  phonRealAvailableDisplay: string | null;

  amountPhon: string;

  setAmountPhon: (value: string) => void;

  bankAccount: string;

  setBankAccount: (value: string) => void;

  phonKrwRate: ExchangeRateSnapshot | null;

  phonKrwRateStale: boolean;

  phonKrwRateUnavailable: boolean;

  phonKrwRateBlocked: boolean;

  phonKrwRateCapturedDisplay: string | null;

  amountGateKey: MessageKey | null;

  accountGateKey: MessageKey | null;

  balanceGateKey: MessageKey | null;

  rateGateKey: MessageKey | null;

  canOpenConfirm: boolean;

  confirmOpen: boolean;

  openConfirm: () => void;

  closeConfirm: () => void;

  confirmReview: boolean;

  submitResult: KrwWithdrawalResult | null;

  submitting: boolean;

  submitErrorKey: MessageKey | null;

  canSubmit: boolean;

  canAcknowledge: boolean;

  submitWithdraw: () => Promise<void>;

  acknowledgeSubmitted: () => void;

  submitted: boolean;

  timelineSteps: KrwWithdrawTimelineStepView[];

  tierLimits: WithdrawTierLimitsView;

  refreshRates: () => void;
};

async function fetchActivePhonKrwRate(): Promise<ExchangeRateSnapshot | null> {
  const { data, error } = await supabase

    .from('exchange_rate_snapshots')

    .select('id,base_currency,quote_currency,rate,captured_at,source,is_active,created_by')

    .eq('base_currency', 'PHON')

    .eq('quote_currency', 'KRW')

    .eq('is_active', true)

    .order('captured_at', { ascending: false })

    .limit(1)

    .maybeSingle();

  if (error) throw error;

  return data as ExchangeRateSnapshot | null;
}

export function useKrwWithdrawController(locale: string): KrwWithdrawControllerView {
  const { session, loading: authLoading } = useAuth();

  const userId = session?.user.id ?? null;

  const { withdrawalBlocked, loading: gatesLoading } = usePlatformGates();
  const {
    geoBlocked,
    withdrawalMfaRequired,
    loading: clientGateLoading,
  } = useClientGatePrechecks();

  const { data: compliance, isLoading: complianceLoading } = useComplianceStatus();

  const { breakdown, loading: breakdownLoading } = usePhonBalanceBreakdown();

  const { tierLimits, loading: tierLimitsLoading } = useWithdrawTierLimits();

  const qc = useQueryClient();

  const withdrawalReady = Boolean(compliance?.withdrawal_ready);

  const phonRealAvailableDisplay = breakdown?.phon_real_available ?? null;

  const [amountPhon, setAmountRaw] = useState('');

  const [bankAccount, setBankAccountRaw] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const [submitResult, setSubmitResult] = useState<KrwWithdrawalResult | null>(null);

  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);

  const {
    data: phonKrwRate = null,

    isError: phonRateError,

    refetch: refetchPhonKrw,
  } = useQuery({
    queryKey: ['exchange-rate', 'PHON', 'KRW', 'active', 'withdraw'],

    queryFn: fetchActivePhonKrwRate,

    staleTime: 30_000,

    refetchInterval: 60_000,
  });

  const phonKrwRateStale = isPhonKrwRateStale(phonKrwRate?.captured_at);

  const phonKrwRateUnavailable = isPhonKrwRateUnavailable(phonKrwRate?.rate, phonRateError);

  const phonKrwRateBlocked = phonKrwRateStale || phonKrwRateUnavailable;

  const amountGateKey = krwWithdrawAmountGateKey(amountPhon);

  const accountGateKey = krwWithdrawAccountGateKey(bankAccount);

  const balanceGateKey = krwWithdrawBalanceGateKey(amountPhon, phonRealAvailableDisplay);

  const rateGateKey = krwWithdrawRateGateKey(phonKrwRateStale, phonKrwRateUnavailable);

  const confirmInput = {
    withdrawalBlocked,

    withdrawalReady,

    withdrawalMfaRequired,

    geoBlocked,

    amountPhon,

    bankAccount,

    phonKrwRateStale,

    phonKrwRateUnavailable,

    phonRealAvailable: phonRealAvailableDisplay,
  };

  const canOpenConfirm = canOpenKrwWithdrawConfirm(confirmInput);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const normalizedAmount = formatPhonAmountForRpc(amountPhon);

      const normalizedAccount = normalizeBankAccountInput(bankAccount);

      const idempotencyKey = crypto.randomUUID();

      const clientRequestId = crypto.randomUUID();

      return requestPhonKrwWithdrawal({
        amountPhon: normalizedAmount,

        bankAccount: normalizedAccount,

        idempotencyKey,

        clientRequestId,
      });
    },

    onSuccess: (result) => {
      setSubmitResult(result);

      setSubmitErrorKey(null);

      void qc.invalidateQueries({ queryKey: ['withdraw-hub-history', userId] });

      void qc.invalidateQueries({ queryKey: ['phon-balance-breakdown', userId] });
    },

    onError: (error) => {
      setSubmitErrorKey(translateError(error, 'error.UNKNOWN'));
    },
  });

  const setAmountPhon = useCallback((value: string) => {
    setAmountRaw(normalizePhonWithdrawAmountInput(value));

    setSubmitResult(null);

    setSubmitErrorKey(null);
  }, []);

  const setBankAccount = useCallback((value: string) => {
    setBankAccountRaw(normalizeBankAccountInput(value));

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
      !canSubmitKrwWithdrawRequest({
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
    if (!canAcknowledgeKrwWithdrawResult(submitResult)) return;

    setConfirmOpen(false);

    setSubmitted(true);
  }, [submitResult]);

  const refreshRates = useCallback(() => {
    void refetchPhonKrw();
  }, [refetchPhonKrw]);

  const timelineSteps = useMemo(() => buildKrwWithdrawTimelineSteps(), []);

  const phonKrwRateCapturedDisplay = formatRateCapturedAt(phonKrwRate?.captured_at, locale);

  const confirmReview = confirmOpen && !submitResult;

  return {
    loading:
      authLoading ||
      gatesLoading ||
      clientGateLoading ||
      complianceLoading ||
      breakdownLoading ||
      tierLimitsLoading,

    withdrawalBlocked,

    withdrawalReady,

    phonRealAvailableDisplay,

    amountPhon,

    setAmountPhon,

    bankAccount,

    setBankAccount,

    phonKrwRate,

    phonKrwRateStale,

    phonKrwRateUnavailable,

    phonKrwRateBlocked,

    phonKrwRateCapturedDisplay,

    amountGateKey,

    accountGateKey,

    balanceGateKey,

    rateGateKey,

    canOpenConfirm,

    confirmOpen,

    openConfirm,

    closeConfirm,

    confirmReview,

    submitResult,

    submitting: submitMutation.isPending,

    submitErrorKey,

    canSubmit: canSubmitKrwWithdrawRequest({
      ...confirmInput,

      submitting: submitMutation.isPending,

      submitResult,
    }),

    canAcknowledge: canAcknowledgeKrwWithdrawResult(submitResult),

    submitWithdraw,

    acknowledgeSubmitted,

    submitted,

    timelineSteps,

    tierLimits,

    refreshRates,
  };
}
