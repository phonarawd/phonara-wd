import { useQuery } from '@tanstack/react-query';
import {
  listGiftcardFeeMarket,
  previewGiftcardDeposit,
  type GiftcardDepositSnapshot,
  type GiftcardFeeMarketRow,
  type GiftcardKind,
} from '@/domain/wallet';

export type { GiftcardDepositSnapshot, GiftcardFeeMarketRow, GiftcardKind };

export function useGiftcardFeeMarket() {
  return useQuery({
    queryKey: ['giftcard-fee-market'],
    queryFn: listGiftcardFeeMarket,
    staleTime: 60_000,
  });
}

export function useGiftcardDepositPreview(
  kind: GiftcardKind | null,
  faceValueKrw: string,
  enabled = true,
) {
  const trimmed = faceValueKrw.trim();
  const canPreview =
    enabled && kind != null && /^\d+(\.\d+)?$/.test(trimmed) && Number(trimmed) > 0;

  return useQuery({
    queryKey: ['giftcard-deposit-preview', kind, trimmed],
    queryFn: () => previewGiftcardDeposit(kind as GiftcardKind, trimmed),
    enabled: canPreview,
    staleTime: 30_000,
    retry: false,
  });
}
