import type { MessageKey } from '@phonara/i18n';

import type { MoneyStatusState } from '@/product/primitives/status-badge';

import { cryptoDepositStatusLabelKey, type DepositRail } from './crypto-deposit-status';
import { giftcardDepositStatusLabelKeyFromRow } from './giftcard-deposit-status';
import { krwDepositStatusLabelKey } from './krw-deposit-display';
import type {
  CryptoDepositRequest,
  DepositRequest,
  GiftcardDepositRequest,
} from './use-wallet-data';

export type { DepositRail };

export type DepositHubRailId = DepositRail;

export type DepositHistoryRowView = {
  id: string;
  rail: DepositRail;
  createdAt: string;
  amountDisplay: string;
  currency: 'KRW' | 'USDT';
  status: MoneyStatusState;
  statusLabelKey: MessageKey;
  methodLabelKey: MessageKey;
};

export type DepositHubRailView = {
  id: DepositHubRailId;
  href: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  metaKey: MessageKey;
};

export const DEPOSIT_HUB_RAILS: readonly DepositHubRailView[] = [
  {
    id: 'krw',
    href: '/wallet/deposit/krw',
    titleKey: 'wallet.deposit.rail.krw',
    descriptionKey: 'wallet.deposit.rail.krw.desc',
    metaKey: 'wallet.deposit.krw.sla',
  },
  {
    id: 'crypto',
    href: '/wallet/deposit/crypto',
    titleKey: 'wallet.deposit.rail.crypto',
    descriptionKey: 'wallet.deposit.rail.crypto.desc',
    metaKey: 'wallet.deposit.crypto.min',
  },
  {
    id: 'giftcard',
    href: '/wallet/deposit/giftcard',
    titleKey: 'wallet.deposit.rail.giftcard',
    descriptionKey: 'wallet.deposit.rail.giftcard.desc',
    metaKey: 'wallet.deposit.giftcard.eta',
  },
] as const;

const METHOD_LABEL: Record<DepositRail, MessageKey> = {
  krw: 'wallet.tx.method.krw',
  crypto: 'wallet.tx.method.crypto',
  giftcard: 'wallet.tx.method.giftcard',
};

export function krwDepositStatusToMoneyState(status: DepositRequest['status']): MoneyStatusState {
  switch (status) {
    case 'credited':
      return 'settled';
    case 'failed':
    case 'expired':
      return 'failed';
    case 'admin_rejected':
      return 'rejected';
    case 'matched':
    case 'unmatched':
    case 'disputed':
      return 'reviewing';
    case 'pending':
    default:
      return 'pending';
  }
}

export function cryptoDepositStatusToMoneyState(
  status: CryptoDepositRequest['status'],
): MoneyStatusState {
  switch (status) {
    case 'credited':
      return 'settled';
    case 'failed':
    case 'expired':
      return 'failed';
    case 'matched':
      return 'reviewing';
    case 'pending':
    default:
      return 'pending';
  }
}

export function giftcardDepositStatusToMoneyState(
  status: GiftcardDepositRequest['status'],
): MoneyStatusState {
  switch (status) {
    case 'credited':
      return 'settled';
    case 'rejected':
      return 'rejected';
    case 'approved':
      return 'reviewing';
    case 'pending':
    default:
      return 'reviewing';
  }
}

export function mapKrwDepositHistoryRow(row: DepositRequest): DepositHistoryRowView {
  return {
    id: `krw:${row.id}`,
    rail: 'krw',
    createdAt: row.created_at,
    amountDisplay: row.amount_krw,
    currency: 'KRW',
    status: krwDepositStatusToMoneyState(row.status),
    statusLabelKey: krwDepositStatusLabelKey(row.status),
    methodLabelKey: METHOD_LABEL.krw,
  };
}

export function mapCryptoDepositHistoryRow(row: CryptoDepositRequest): DepositHistoryRowView {
  return {
    id: `crypto:${row.id}`,
    rail: 'crypto',
    createdAt: row.created_at,
    amountDisplay: row.amount,
    currency: 'USDT',
    status: cryptoDepositStatusToMoneyState(row.status),
    statusLabelKey: cryptoDepositStatusLabelKey(row.status),
    methodLabelKey: METHOD_LABEL.crypto,
  };
}

export function mapGiftcardDepositHistoryRow(row: GiftcardDepositRequest): DepositHistoryRowView {
  return {
    id: `giftcard:${row.id}`,
    rail: 'giftcard',
    createdAt: row.created_at,
    amountDisplay: row.face_value_krw,
    currency: 'KRW',
    status: giftcardDepositStatusToMoneyState(row.status),
    statusLabelKey: giftcardDepositStatusLabelKeyFromRow(row.status),
    methodLabelKey: METHOD_LABEL.giftcard,
  };
}

export function mergeDepositHistoryRows(
  krw: DepositRequest[],
  crypto: CryptoDepositRequest[],
  giftcard: GiftcardDepositRequest[],
): DepositHistoryRowView[] {
  return [
    ...krw.map(mapKrwDepositHistoryRow),
    ...crypto.map(mapCryptoDepositHistoryRow),
    ...giftcard.map(mapGiftcardDepositHistoryRow),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
