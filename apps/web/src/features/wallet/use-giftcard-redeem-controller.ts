import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  hasAvailableGiftcardMarket,
  shouldRedirectGiftcardRedeemRoute,
} from '@/domain/wallet-capability-rails-display-contract';
import {
  isGiftcardRedeemReverseLive,
  WALLET_REDEEM_GIFTCARD_ROUTE,
} from '@/domain/wallet-redeem-display-contract';
import {
  createGiftcardRedeemRequest,
  previewGiftcardRedeem,
  type GiftcardKind,
  type GiftcardRedeemQuote,
  type GiftcardRedeemRequestResult,
} from '@/domain/wallet';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { translateError } from '@/lib/translate-error';
import { useGiftcardFeeMarket } from '@/features/wallet/use-giftcard-fee-market';
import { normalizeGiftcardFaceValueInput } from '@/features/wallet/giftcard-deposit-page-display';
import { useT } from '@/product/i18n';

export type GiftcardRedeemControllerView = {
  t: ReturnType<typeof useT>;
  route: typeof WALLET_REDEEM_GIFTCARD_ROUTE;
  live: boolean;
  loading: boolean;
  marketEmpty: boolean;
  giftcardMarketAvailable: boolean;
  shouldRedirect: boolean;
  withdrawalBlocked: boolean;
  kinds: GiftcardKind[];
  kind: GiftcardKind | null;
  setKind: (kind: GiftcardKind) => void;
  faceValueKrw: string;
  setFaceValueKrw: (value: string) => void;
  canLoadPreview: boolean;
  previewLoading: boolean;
  previewErrorKey: MessageKey | null;
  preview: GiftcardRedeemQuote | null;
  loadPreview: () => void;
  confirmOpen: boolean;
  openConfirm: () => void;
  closeConfirm: () => void;
  submitting: boolean;
  submitErrorKey: MessageKey | null;
  submitResult: GiftcardRedeemRequestResult | null;
  submitRedeem: () => Promise<void>;
  acknowledge: () => void;
};

export function useGiftcardRedeemController(): GiftcardRedeemControllerView {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;
  const { withdrawalBlocked, loading: gatesLoading } = usePlatformGates();
  const qc = useQueryClient();
  const live = isGiftcardRedeemReverseLive();

  const [kind, setKind] = useState<GiftcardKind | null>(null);
  const [faceValueKrw, setFaceValueRaw] = useState('');
  const [preview, setPreview] = useState<GiftcardRedeemQuote | null>(null);
  const [previewErrorKey, setPreviewErrorKey] = useState<MessageKey | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);
  const [submitResult, setSubmitResult] = useState<GiftcardRedeemRequestResult | null>(null);

  const { data: feeMarket = [], isLoading: marketLoading } = useGiftcardFeeMarket();

  const kinds = useMemo(() => {
    const seen = new Set<GiftcardKind>();
    const out: GiftcardKind[] = [];
    for (const row of feeMarket) {
      if (!seen.has(row.kind)) {
        seen.add(row.kind);
        out.push(row.kind);
      }
    }
    return out;
  }, [feeMarket]);

  const giftcardMarketAvailable = hasAvailableGiftcardMarket(feeMarket.length);
  const marketEmpty = !marketLoading && !giftcardMarketAvailable;
  const shouldRedirect = !marketLoading && shouldRedirectGiftcardRedeemRoute(giftcardMarketAvailable);

  const setFaceValueKrw = useCallback((value: string) => {
    setFaceValueRaw(normalizeGiftcardFaceValueInput(value));
    setPreview(null);
  }, []);

  const canLoadPreview = Boolean(
    live && giftcardMarketAvailable && kind && faceValueKrw && !withdrawalBlocked,
  );

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!kind) throw new Error('invalid_kind');
      return previewGiftcardRedeem(kind, faceValueKrw);
    },
    onSuccess: (quote) => {
      setPreview(quote);
      setPreviewErrorKey(null);
    },
    onError: (err) => {
      setPreview(null);
      setPreviewErrorKey(translateError(err));
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!kind) throw new Error('invalid_kind');
      return createGiftcardRedeemRequest({
        kind,
        faceValueKrw,
        clientRequestId: crypto.randomUUID(),
      });
    },
    onSuccess: (result) => {
      setSubmitResult(result);
      setConfirmOpen(false);
      setSubmitErrorKey(null);
      void qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err) => {
      setSubmitErrorKey(translateError(err));
    },
  });

  return {
    t,
    route: WALLET_REDEEM_GIFTCARD_ROUTE,
    live,
    loading: authLoading || gatesLoading || marketLoading,
    marketEmpty,
    giftcardMarketAvailable,
    shouldRedirect,
    withdrawalBlocked,
    kinds,
    kind,
    setKind: (next) => {
      setKind(next);
      setPreview(null);
    },
    faceValueKrw,
    setFaceValueKrw,
    canLoadPreview,
    previewLoading: previewMutation.isPending,
    previewErrorKey,
    preview,
    loadPreview: () => {
      if (!canLoadPreview || previewMutation.isPending) return;
      setPreviewErrorKey(null);
      void previewMutation.mutateAsync();
    },
    confirmOpen,
    openConfirm: () => {
      if (!preview || withdrawalBlocked) return;
      setSubmitErrorKey(null);
      setConfirmOpen(true);
    },
    closeConfirm: () => {
      if (submitMutation.isPending) return;
      setConfirmOpen(false);
    },
    submitting: submitMutation.isPending,
    submitErrorKey,
    submitResult,
    submitRedeem: async () => {
      if (!preview || !userId || submitMutation.isPending) return;
      setSubmitErrorKey(null);
      await submitMutation.mutateAsync();
    },
    acknowledge: () => {
      setSubmitResult(null);
      setPreview(null);
      setFaceValueRaw('');
      setKind(null);
    },
  };
}
