import type { MessageKey } from '@phonara/i18n';
import type { Currency } from '@phonara/shared-types';

import type { MoneyStatusState } from '@/product/primitives/status-badge';

import {
  cryptoWithdrawStatusLabelKey,
  isPhonKrwWithdraw,
  type WithdrawRail,
  type WithdrawalRequest,
} from './crypto-withdraw-status';

export type { WithdrawRail };

export type WithdrawHistoryRowView = {
  id: string;
  rail: WithdrawRail;
  createdAt: string;
  amountDisplay: string;
  currency: Currency;
  status: MoneyStatusState;
  statusLabelKey: MessageKey;
  methodLabelKey: MessageKey;
};

export type WithdrawHubRailView = {
  id: WithdrawRail;
  href: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  metaKey: MessageKey;
};

export const WITHDRAW_HUB_RAILS: readonly WithdrawHubRailView[] = [
  {
    id: 'krw',
    href: '/wallet/withdraw/krw',
    titleKey: 'wallet.withdraw.rail.krw',
    descriptionKey: 'wallet.withdraw.rail.krw.desc',
    metaKey: 'wallet.withdraw.rail.krw.meta',
  },
  {
    id: 'crypto',
    href: '/wallet/withdraw/crypto',
    titleKey: 'wallet.withdraw.rail.crypto',
    descriptionKey: 'wallet.withdraw.rail.crypto.desc',
    metaKey: 'wallet.withdraw.rail.crypto.meta',
  },
] as const;

const METHOD_LABEL: Record<WithdrawRail, MessageKey> = {
  krw: 'wallet.tx.method.krw',
  crypto: 'wallet.tx.method.crypto',
};

export function inferWithdrawRail(row: WithdrawalRequest): WithdrawRail {
  return isPhonKrwWithdraw(row) ? 'krw' : 'crypto';
}

export function withdrawStatusToMoneyState(status: WithdrawalRequest['status']): MoneyStatusState {
  switch (status) {
    case 'completed':
      return 'settled';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'failed';
    case 'approved':
    case 'processing':
    case 'sent':
      return 'reviewing';
    case 'pending':
    default:
      return 'pending';
  }
}

export function mapWithdrawHistoryRow(row: WithdrawalRequest): WithdrawHistoryRowView {
  const rail = inferWithdrawRail(row);

  return {
    id: `${rail}:${row.id}`,
    rail,
    createdAt: row.created_at,
    amountDisplay: row.amount,
    currency: row.currency as Currency,
    status: withdrawStatusToMoneyState(row.status),
    statusLabelKey: cryptoWithdrawStatusLabelKey(row.status),
    methodLabelKey: METHOD_LABEL[rail],
  };
}

export function mergeWithdrawHistoryRows(rows: WithdrawalRequest[]): WithdrawHistoryRowView[] {
  return rows.map(mapWithdrawHistoryRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
