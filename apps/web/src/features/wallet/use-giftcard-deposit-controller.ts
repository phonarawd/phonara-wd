import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  createGiftcardDepositRequest,
  type GiftcardDepositSnapshot,
  type GiftcardFeeMarketRow,
  type GiftcardKind,
} from '@/domain/wallet';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { translateError } from '@/lib/translate-error';

import {
  buildGiftcardDepositTimelineSteps,
  canAcknowledgeGiftcardDepositResult,
  canConfirmGiftcardDepositPreview,
  canLoadGiftcardDepositPreview,
  canOpenGiftcardDepositSubmit,
  canSubmitGiftcardDepositRequest,
  giftcardDepositFaceGateKey,
  giftcardDepositKindGateKey,
  giftcardDepositPinGateKey,
  mapGiftcardFeeMarketRow,
  normalizeGiftcardFaceValueInput,
  type GiftcardDepositTimelineStepView,
  type GiftcardFeeMarketRowView,
} from './giftcard-deposit-page-display';
import { useGiftcardDepositPreview, useGiftcardFeeMarket } from './use-giftcard-fee-market';

export type GiftcardDepositControllerView = {
  loading: boolean;
  depositBlocked: boolean;
  marketEmpty: boolean;
  marketRows: GiftcardFeeMarketRowView[];
  marketLoading: boolean;
  refreshMarket: () => void;
  kinds: GiftcardKind[];
  kind: GiftcardKind | null;
  setKind: (kind: GiftcardKind) => void;
  faceValueKrw: string;
  setFaceValueKrw: (value: string) => void;
  pin: string;
  setPin: (value: string) => void;
  pinEnabled: boolean;
  kindGateKey: MessageKey | null;
  faceGateKey: MessageKey | null;
  pinGateKey: MessageKey | null;
  previewGateKey: MessageKey | null;
  canLoadPreview: boolean;
  previewLoading: boolean;
  previewErrorKey: MessageKey | null;
  previewSnapshot: GiftcardDepositSnapshot | null;
  previewConfirmed: boolean;
  previewRequested: boolean;
  loadPreview: () => void;
  confirmPreview: () => void;
  canConfirmPreview: boolean;
  canOpenSubmit: boolean;
  confirmOpen: boolean;
  openConfirm: () => void;
  closeConfirm: () => void;
  submitResult: GiftcardDepositSnapshot | null;
  submitting: boolean;
  submitErrorKey: MessageKey | null;
  canSubmit: boolean;
  canAcknowledge: boolean;
  submitDeposit: () => Promise<void>;
  acknowledgeSubmitted: () => void;
  submitted: boolean;
  timelineSteps: GiftcardDepositTimelineStepView[];
};

function uniqueKinds(rows: GiftcardFeeMarketRow[]): GiftcardKind[] {
  const seen = new Set<GiftcardKind>();
  const kinds: GiftcardKind[] = [];
  for (const row of rows) {
    if (!seen.has(row.kind)) {
      seen.add(row.kind);
      kinds.push(row.kind);
    }
  }
  return kinds;
}

function formatKrwAmount(amount: string): string {
  const normalized = normalizeGiftcardFaceValueInput(amount);
  if (!normalized) return amount;
  return new Intl.NumberFormat('ko-KR').format(Number(normalized));
}

export function useGiftcardDepositController(): GiftcardDepositControllerView {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { depositBlocked, loading: gatesLoading } = usePlatformGates();
  const qc = useQueryClient();

  const [kind, setKindState] = useState<GiftcardKind | null>(null);
  const [faceValueKrw, setFaceValueRaw] = useState('');
  const [pin, setPinRaw] = useState('');
  const [previewRequested, setPreviewRequested] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<GiftcardDepositSnapshot | null>(null);
  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);

  const {
    data: feeMarket = [],
    isLoading: marketLoading,
    refetch: refreshMarket,
  } = useGiftcardFeeMarket();

  const marketEmpty = !marketLoading && feeMarket.length === 0;
  const kinds = useMemo(() => uniqueKinds(feeMarket), [feeMarket]);
  const marketRows = useMemo(
    () => feeMarket.map((row) => mapGiftcardFeeMarketRow(row, formatKrwAmount)),
    [feeMarket],
  );

  const normalizedFace = normalizeGiftcardFaceValueInput(faceValueKrw);

  const {
    data: previewSnapshot,
    isLoading: previewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = useGiftcardDepositPreview(kind, normalizedFace, previewRequested && !previewConfirmed);

  const previewErrorKey = previewError ? translateError(previewError, 'error.UNKNOWN') : null;

  const resetPreviewState = useCallback(() => {
    setPreviewRequested(false);
    setPreviewConfirmed(false);
    setSubmitResult(null);
    setSubmitErrorKey(null);
  }, []);

  const setKind = useCallback(
    (next: GiftcardKind) => {
      setKindState(next);
      resetPreviewState();
      setPinRaw('');
    },
    [resetPreviewState],
  );

  const setFaceValueKrw = useCallback(
    (value: string) => {
      setFaceValueRaw(normalizeGiftcardFaceValueInput(value));
      resetPreviewState();
    },
    [resetPreviewState],
  );

  const setPin = useCallback((value: string) => {
    setPinRaw(value);
    setSubmitErrorKey(null);
  }, []);

  const kindGateKey = giftcardDepositKindGateKey(kind);
  const faceGateKey = giftcardDepositFaceGateKey(faceValueKrw);
  const pinGateKey = giftcardDepositPinGateKey(pin);
  const previewGateKey =
    !previewConfirmed && previewRequested && previewLoading
      ? 'wallet.deposit.giftcard.gate.preview'
      : null;

  const canLoadPreview = canLoadGiftcardDepositPreview({
    depositBlocked,
    marketEmpty,
    kind,
    faceValueKrw,
    previewLoading,
  });

  const canConfirmPreview = canConfirmGiftcardDepositPreview({
    previewLoading,
    previewErrorKey,
    snapshot: previewSnapshot ?? null,
  });

  const pinEnabled = previewConfirmed;
  const canOpenSubmit = canOpenGiftcardDepositSubmit({
    depositBlocked,
    previewConfirmed,
    kind,
    faceValueKrw,
    pin,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!kind) throw new Error('invalid_kind');
      return createGiftcardDepositRequest({
        kind,
        pin: pin.trim(),
        faceValueKrw: normalizedFace,
        clientRequestId: crypto.randomUUID(),
      });
    },
    onSuccess: (result) => {
      setSubmitResult(result);
      setSubmitErrorKey(null);
      void qc.invalidateQueries({ queryKey: ['giftcard-fee-market'] });
      void qc.invalidateQueries({ queryKey: ['deposit-hub-history', userId] });
    },
    onError: (error) => {
      setSubmitErrorKey(translateError(error, 'error.UNKNOWN'));
    },
  });

  const loadPreview = useCallback(() => {
    if (!canLoadPreview) return;
    setPreviewRequested(true);
    setPreviewConfirmed(false);
    setSubmitResult(null);
    setSubmitErrorKey(null);
    void refetchPreview();
  }, [canLoadPreview, refetchPreview]);

  const confirmPreview = useCallback(() => {
    if (!canConfirmPreview || !previewSnapshot) return;
    setPreviewConfirmed(true);
    setSubmitErrorKey(null);
  }, [canConfirmPreview, previewSnapshot]);

  const openConfirm = useCallback(() => {
    if (!canOpenSubmit) return;
    setConfirmOpen(true);
    setSubmitResult(null);
    setSubmitErrorKey(null);
  }, [canOpenSubmit]);

  const closeConfirm = useCallback(() => {
    if (submitMutation.isPending) return;
    setConfirmOpen(false);
  }, [submitMutation.isPending]);

  const submitDeposit = useCallback(async () => {
    if (
      !canSubmitGiftcardDepositRequest({
        depositBlocked,
        previewConfirmed,
        snapshot: previewSnapshot ?? null,
        kind,
        faceValueKrw,
        pin,
        submitting: submitMutation.isPending,
      })
    ) {
      return;
    }
    await submitMutation.mutateAsync();
  }, [depositBlocked, faceValueKrw, kind, pin, previewConfirmed, previewSnapshot, submitMutation]);

  const acknowledgeSubmitted = useCallback(() => {
    if (!canAcknowledgeGiftcardDepositResult(submitResult)) return;
    setSubmitted(true);
    setConfirmOpen(false);
  }, [submitResult]);

  const timelineSteps = useMemo(
    () =>
      buildGiftcardDepositTimelineSteps(submitResult?.sla_minutes ?? previewSnapshot?.sla_minutes),
    [previewSnapshot?.sla_minutes, submitResult?.sla_minutes],
  );

  const loading = authLoading || gatesLoading || marketLoading;

  return {
    loading,
    depositBlocked,
    marketEmpty,
    marketRows,
    marketLoading,
    refreshMarket: () => void refreshMarket(),
    kinds,
    kind,
    setKind,
    faceValueKrw,
    setFaceValueKrw,
    pin,
    setPin,
    pinEnabled,
    kindGateKey,
    faceGateKey,
    pinGateKey,
    previewGateKey,
    canLoadPreview,
    previewLoading,
    previewErrorKey,
    previewSnapshot: previewSnapshot ?? null,
    previewConfirmed,
    previewRequested,
    loadPreview,
    confirmPreview,
    canConfirmPreview,
    canOpenSubmit,
    confirmOpen,
    openConfirm,
    closeConfirm,
    submitResult,
    submitting: submitMutation.isPending,
    submitErrorKey,
    canSubmit: canSubmitGiftcardDepositRequest({
      depositBlocked,
      previewConfirmed,
      snapshot: previewSnapshot ?? null,
      kind,
      faceValueKrw,
      pin,
      submitting: submitMutation.isPending,
    }),
    canAcknowledge: canAcknowledgeGiftcardDepositResult(submitResult),
    submitDeposit,
    acknowledgeSubmitted,
    submitted,
    timelineSteps,
  };
}
