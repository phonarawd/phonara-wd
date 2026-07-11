import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  canSubmitP2pTransfer,
  resolveWalletTransferHubExposure,
  WALLET_TRANSFER_ROUTE,
  type WalletTransferExposureMode,
} from '@/domain/wallet-transfer-display-contract';
import {
  listP2pTransfers,
  transferToUser,
  type P2pTransferRow,
  type TransferToUserResult,
} from '@/domain/wallet';
import { translateError } from '@/lib/translate-error';
import { useT } from '@/product/i18n';

export type WalletTransferControllerView = {
  t: ReturnType<typeof useT>;
  route: typeof WALLET_TRANSFER_ROUTE;
  hubExposure: WalletTransferExposureMode;
  canSubmit: boolean;
  recipient: string;
  setRecipient: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  memo: string;
  setMemo: (value: string) => void;
  confirmOpen: boolean;
  openConfirm: () => void;
  closeConfirm: () => void;
  submitting: boolean;
  submitErrorKey: MessageKey | null;
  submitResult: TransferToUserResult | null;
  submitTransfer: () => Promise<void>;
  acknowledgeResult: () => void;
  history: P2pTransferRow[];
  historyLoading: boolean;
  refreshHistory: () => void;
};

function normalizeAmount(raw: string): string {
  const trimmed = raw.trim().replace(/,/g, '');
  if (!trimmed) return '';
  if (!/^\d+(\.\d{0,6})?$/.test(trimmed)) return raw.trim();
  return trimmed;
}

export function useWalletTransferController(): WalletTransferControllerView {
  const t = useT();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmountRaw] = useState('');
  const [memo, setMemo] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitErrorKey, setSubmitErrorKey] = useState<MessageKey | null>(null);
  const [submitResult, setSubmitResult] = useState<TransferToUserResult | null>(null);

  const setAmount = useCallback((value: string) => {
    setAmountRaw(normalizeAmount(value));
  }, []);

  const historyQuery = useQuery({
    queryKey: ['p2p-transfers', userId],
    enabled: Boolean(userId) && canSubmitP2pTransfer(),
    queryFn: () => listP2pTransfers(30),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const clientRequestId = crypto.randomUUID();
      return transferToUser({
        recipient: recipient.trim(),
        amount: amount.trim(),
        memo: memo.trim() || undefined,
        clientRequestId,
      });
    },
    onSuccess: (result) => {
      setSubmitResult(result);
      setConfirmOpen(false);
      setSubmitErrorKey(null);
      void qc.invalidateQueries({ queryKey: ['p2p-transfers', userId] });
      void qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err) => {
      setSubmitErrorKey(translateError(err));
    },
  });

  const canSubmit = useMemo(() => {
    if (!canSubmitP2pTransfer()) return false;
    if (!recipient.trim()) return false;
    if (!amount.trim() || !/^\d+(\.\d+)?$/.test(amount.trim())) return false;
    return Number(amount.trim()) > 0;
  }, [amount, recipient]);

  const openConfirm = useCallback(() => {
    if (!canSubmit) return;
    setSubmitErrorKey(null);
    setConfirmOpen(true);
  }, [canSubmit]);

  const closeConfirm = useCallback(() => {
    if (mutation.isPending) return;
    setConfirmOpen(false);
  }, [mutation.isPending]);

  const submitTransfer = useCallback(async () => {
    if (!canSubmit || mutation.isPending) return;
    setSubmitErrorKey(null);
    await mutation.mutateAsync();
  }, [canSubmit, mutation]);

  const acknowledgeResult = useCallback(() => {
    setSubmitResult(null);
    setRecipient('');
    setAmountRaw('');
    setMemo('');
  }, []);

  return {
    t,
    route: WALLET_TRANSFER_ROUTE,
    hubExposure: resolveWalletTransferHubExposure(),
    canSubmit,
    recipient,
    setRecipient,
    amount,
    setAmount,
    memo,
    setMemo,
    confirmOpen,
    openConfirm,
    closeConfirm,
    submitting: mutation.isPending,
    submitErrorKey,
    submitResult,
    submitTransfer,
    acknowledgeResult,
    history: historyQuery.data ?? [],
    historyLoading: historyQuery.isLoading,
    refreshHistory: () => {
      void historyQuery.refetch();
    },
  };
}
