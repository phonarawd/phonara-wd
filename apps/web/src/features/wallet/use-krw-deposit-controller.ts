import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  canAttachKrwDepositProof,
  isKrwDepositProofLive,
  krwDepositProofUploadErrorKey,
  resolveKrwDepositProofStatusKey,
  shouldShowKrwDepositProofUpload,
  validateKrwDepositProofFile,
  type KrwDepositProofStatus,
} from '@/domain/krw-deposit-proof-display-contract';
import { uploadKrwDepositProof } from '@/domain/krw-deposit-proof-storage';
import {
  attachKrwDepositProof,
  createKrwDepositRequest,
  type KrwDepositResult,
} from '@/domain/wallet';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { isPhonKrwRateStale, isPhonKrwRateUnavailable } from '@/lib/phon-krw-rate-stale';
import {
  fetchFiatReferenceRateQueryData,
  fiatReferenceRateQueryKey,
} from '@/features/money/use-fiat-reference-rates';
import { translateError } from '@/lib/translate-error';

import {
  addKrwChipAmount,
  buildKrwDepositTimelineSteps,
  canAcknowledgeKrwDepositResult,
  canOpenKrwDepositConfirm,
  canSubmitKrwDepositRequest,
  formatRateCapturedAt,
  krwDepositAmountGateKey,
  krwDepositRateGateKey,
  KRW_DEPOSIT_CHIP_AMOUNTS,
  normalizeKrwAmountInput,
  type KrwDepositTimelineStepView,
} from './krw-deposit-page-display';
import type { ExchangeRateSnapshot } from './use-wallet-data';

export type KrwDepositControllerView = {
  loading: boolean;
  depositBlocked: boolean;
  amountKrw: string;
  setAmountKrw: (value: string) => void;
  addChip: (chipAmount: string) => void;
  chipAmounts: readonly string[];
  phonKrwRate: ExchangeRateSnapshot | null;
  usdtKrwRate: ExchangeRateSnapshot | null;
  phonKrwRateStale: boolean;
  phonKrwRateUnavailable: boolean;
  phonKrwRateBlocked: boolean;
  phonKrwRateCapturedDisplay: string | null;
  usdtKrwRateCapturedDisplay: string | null;
  amountGateKey: MessageKey | null;
  rateGateKey: MessageKey | null;
  canOpenConfirm: boolean;
  confirmOpen: boolean;
  openConfirm: () => void;
  closeConfirm: () => void;
  confirmReview: boolean;
  submitResult: KrwDepositResult | null;
  submitting: boolean;
  submitErrorKey: MessageKey | null;
  canSubmit: boolean;
  canAcknowledge: boolean;
  submitDeposit: () => Promise<void>;
  acknowledgeSubmitted: () => void;
  submitted: boolean;
  timelineSteps: KrwDepositTimelineStepView[];
  copyReference: (code: string) => Promise<boolean>;
  copyState: 'idle' | 'ok' | 'failed';
  refreshRates: () => void;
  /** M-21 — `LAUNCH_GATES.krwDepositProofLive`. */
  proofLive: boolean;
  showProofUpload: boolean;
  proofStatus: KrwDepositProofStatus | null;
  proofStatusKey: MessageKey | null;
  proofFileName: string | null;
  proofBusy: boolean;
  proofErrorKey: MessageKey | null;
  canAttachProof: boolean;
  handleProofSelect: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function useKrwDepositController(locale: string): KrwDepositControllerView {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { depositBlocked, loading: gatesLoading } = usePlatformGates();
  const qc = useQueryClient();

  const [amountKrw, setAmountRaw] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<KrwDepositResult | null>(null);
  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'failed'>('idle');
  const [proofStatus, setProofStatus] = useState<KrwDepositProofStatus | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofBusy, setProofBusy] = useState(false);
  const [proofErrorKey, setProofErrorKey] = useState<MessageKey | null>(null);

  const proofLive = isKrwDepositProofLive();

  const {
    data: phonKrwRate = null,
    isError: phonRateError,
    refetch: refetchPhonKrw,
  } = useQuery({
    queryKey: fiatReferenceRateQueryKey('PHON', 'KRW'),
    queryFn: () => fetchFiatReferenceRateQueryData({ base: 'PHON', quote: 'KRW' }),
    select: (data) => data.snapshot,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: usdtKrwRate = null, refetch: refetchUsdtKrw } = useQuery({
    queryKey: fiatReferenceRateQueryKey('USDT', 'KRW'),
    queryFn: () => fetchFiatReferenceRateQueryData({ base: 'USDT', quote: 'KRW' }),
    select: (data) => data.snapshot,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const phonKrwRateStale = isPhonKrwRateStale(phonKrwRate?.captured_at);
  const phonKrwRateUnavailable = isPhonKrwRateUnavailable(phonKrwRate?.rate, phonRateError);
  const phonKrwRateBlocked = phonKrwRateStale || phonKrwRateUnavailable;

  const amountGateKey = krwDepositAmountGateKey(amountKrw);
  const rateGateKey = krwDepositRateGateKey(phonKrwRateStale, phonKrwRateUnavailable);
  const canOpenConfirm = canOpenKrwDepositConfirm({
    depositBlocked,
    amountKrw,
    phonKrwRateStale,
    phonKrwRateUnavailable,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const normalized = normalizeKrwAmountInput(amountKrw);
      const clientRequestId = crypto.randomUUID();
      return createKrwDepositRequest({
        amountKrw: normalized,
        clientRequestId,
      });
    },
    onSuccess: (result) => {
      setSubmitResult(result);
      setSubmitErrorKey(null);
      void qc.invalidateQueries({ queryKey: ['krw-deposits', userId] });
      void qc.invalidateQueries({ queryKey: ['deposit-hub-history', userId] });
    },
    onError: (error) => {
      setSubmitErrorKey(translateError(error, 'error.UNKNOWN'));
    },
  });

  const setAmountKrw = useCallback((value: string) => {
    setAmountRaw(normalizeKrwAmountInput(value));
    setSubmitResult(null);
    setSubmitErrorKey(null);
    setProofStatus(null);
    setProofFileName(null);
    setProofErrorKey(null);
  }, []);

  const addChip = useCallback((chipAmount: string) => {
    setAmountRaw((current) => addKrwChipAmount(current, chipAmount));
    setSubmitResult(null);
    setSubmitErrorKey(null);
    setProofStatus(null);
    setProofFileName(null);
    setProofErrorKey(null);
  }, []);

  const openConfirm = useCallback(() => {
    if (!canOpenConfirm) return;
    setConfirmOpen(true);
    setSubmitResult(null);
    setSubmitErrorKey(null);
    setProofStatus(null);
    setProofFileName(null);
    setProofErrorKey(null);
  }, [canOpenConfirm]);

  const closeConfirm = useCallback(() => {
    if (submitMutation.isPending) return;
    setConfirmOpen(false);
  }, [submitMutation.isPending]);

  const submitDeposit = useCallback(async () => {
    if (
      !canSubmitKrwDepositRequest({
        depositBlocked,
        amountKrw,
        phonKrwRateStale,
        phonKrwRateUnavailable,
        submitting: submitMutation.isPending,
      })
    ) {
      return;
    }
    await submitMutation.mutateAsync();
  }, [amountKrw, depositBlocked, phonKrwRateStale, phonKrwRateUnavailable, submitMutation]);

  const acknowledgeSubmitted = useCallback(() => {
    if (!canAcknowledgeKrwDepositResult(submitResult)) return;
    setConfirmOpen(false);
    setSubmitted(true);
  }, [submitResult]);

  const copyReference = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('ok');
      return true;
    } catch {
      setCopyState('failed');
      return false;
    }
  }, []);

  const refreshRates = useCallback(() => {
    void refetchPhonKrw();
    void refetchUsdtKrw();
  }, [refetchPhonKrw, refetchUsdtKrw]);

  const showProofUpload = shouldShowKrwDepositProofUpload({
    proofLive,
    depositId: submitResult?.deposit_id,
    proofStatus,
  });

  const canAttachProof = canAttachKrwDepositProof({
    proofLive,
    depositId: submitResult?.deposit_id,
    proofStatus,
    busy: proofBusy,
  });

  const proofStatusKey = resolveKrwDepositProofStatusKey(proofStatus);

  const handleProofSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || !userId || !submitResult?.deposit_id) return;
      if (
        !canAttachKrwDepositProof({
          proofLive,
          depositId: submitResult.deposit_id,
          proofStatus,
          busy: proofBusy,
        })
      ) {
        return;
      }

      const validation = validateKrwDepositProofFile(file);
      if (validation) {
        setProofErrorKey(krwDepositProofUploadErrorKey(validation));
        return;
      }

      setProofBusy(true);
      setProofErrorKey(null);
      setProofFileName(file.name);
      try {
        const proofPath = await uploadKrwDepositProof(userId, file);
        const result = await attachKrwDepositProof({
          depositId: submitResult.deposit_id,
          proofPath,
          clientRequestId: crypto.randomUUID(),
        });
        const nextStatus =
          result.proof_status === 'pending' ||
          result.proof_status === 'approved' ||
          result.proof_status === 'rejected'
            ? result.proof_status
            : 'pending';
        setProofStatus(nextStatus);
        void qc.invalidateQueries({ queryKey: ['krw-deposits', userId] });
        void qc.invalidateQueries({ queryKey: ['deposit-hub-history', userId] });
      } catch (error) {
        const code = error instanceof Error ? error.message : 'upload_failed';
        setProofErrorKey(
          code.startsWith('krw_deposit_proof_')
            ? krwDepositProofUploadErrorKey(code)
            : translateError(error, 'wallet.deposit.krw.proof.error'),
        );
        setProofFileName(null);
      } finally {
        setProofBusy(false);
      }
    },
    [proofBusy, proofLive, proofStatus, qc, submitResult?.deposit_id, userId],
  );

  const timelineSteps = useMemo(
    () => buildKrwDepositTimelineSteps(submitResult?.sla_hours),
    [submitResult?.sla_hours],
  );

  const phonKrwRateCapturedDisplay = formatRateCapturedAt(phonKrwRate?.captured_at, locale);
  const usdtKrwRateCapturedDisplay = formatRateCapturedAt(usdtKrwRate?.captured_at, locale);

  const confirmReview = confirmOpen && !submitResult;

  return {
    loading: authLoading || gatesLoading,
    depositBlocked,
    amountKrw,
    setAmountKrw,
    addChip,
    chipAmounts: KRW_DEPOSIT_CHIP_AMOUNTS,
    phonKrwRate,
    usdtKrwRate,
    phonKrwRateStale,
    phonKrwRateUnavailable,
    phonKrwRateBlocked,
    phonKrwRateCapturedDisplay,
    usdtKrwRateCapturedDisplay,
    amountGateKey,
    rateGateKey,
    canOpenConfirm,
    confirmOpen,
    openConfirm,
    closeConfirm,
    confirmReview,
    submitResult,
    submitting: submitMutation.isPending,
    submitErrorKey,
    canSubmit: canSubmitKrwDepositRequest({
      depositBlocked,
      amountKrw,
      phonKrwRateStale,
      phonKrwRateUnavailable,
      submitting: submitMutation.isPending,
    }),
    canAcknowledge: canAcknowledgeKrwDepositResult(submitResult),
    submitDeposit,
    acknowledgeSubmitted,
    submitted,
    timelineSteps,
    copyReference,
    copyState,
    refreshRates,
    proofLive,
    showProofUpload,
    proofStatus,
    proofStatusKey,
    proofFileName,
    proofBusy,
    proofErrorKey,
    canAttachProof,
    handleProofSelect,
  };
}
