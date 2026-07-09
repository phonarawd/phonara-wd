import type { Tables } from '@phonara/shared-types';

export type LedgerRowView = {
  id: string;
  createdAt: string;
  reasonCode: string;
  amount: string;
  currency: Tables<'wallet_ledger'>['currency'];
  direction: string;
  availableAfter: string;
  seq: number;
  relatedEntityId: string | null;
  rateSnapshotId: string | null;
};

export const LEDGER_FETCH_LIMIT = 100;
export const LEDGER_PAGE_SIZE = 20;

export type LedgerTypeFilter = 'all' | 'deposit' | 'withdraw' | 'bet' | 'reward';
export type LedgerCurrencyFilter = 'all' | Tables<'wallet_ledger'>['currency'];
export type LedgerPeriodFilter = 'all' | '7d' | '30d' | '90d';

const DEPOSIT_REASONS = new Set([
  'krw_deposit_credit',
  'crypto_deposit_credit',
  'giftcard_deposit_credit',
  'spot_buy_recv',
  'spot_sell_recv',
  'game_bet_refund',
  'staking_unlock',
  'futures_margin_unlock',
]);

const WITHDRAW_REASONS = new Set([
  'withdrawal_request_lock',
  'withdrawal_debit',
  'spot_buy_pay',
  'spot_sell_pay',
  'staking_lock',
]);

const BET_REASONS = new Set([
  'game_bet_lock',
  'roulette_spin',
  'futures_margin_lock',
  'futures_open_fee',
]);

const REWARD_REASONS = new Set([
  'staking_reward',
  'daily_claim',
  'welcome_bonus',
  'affiliate_commission_payout',
  'game_payout',
  'futures_pnl',
]);

export function ledgerEntryCategory(reasonCode: string, direction: string): LedgerTypeFilter {
  if (DEPOSIT_REASONS.has(reasonCode)) return 'deposit';
  if (WITHDRAW_REASONS.has(reasonCode)) return 'withdraw';
  if (BET_REASONS.has(reasonCode)) return 'bet';
  if (REWARD_REASONS.has(reasonCode)) return 'reward';
  if (direction === 'credit' || direction === 'unlock') return 'deposit';
  if (direction === 'debit' || direction === 'lock') return 'withdraw';
  return 'deposit';
}

function periodCutoff(period: LedgerPeriodFilter, nowMs: number): number | null {
  if (period === 'all') return null;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return nowMs - days * 24 * 60 * 60 * 1000;
}

export function filterLedgerRows(
  rows: LedgerRowView[],
  filters: {
    type: LedgerTypeFilter;
    currency: LedgerCurrencyFilter;
    period: LedgerPeriodFilter;
  },
  nowMs = Date.now(),
): LedgerRowView[] {
  const cutoff = periodCutoff(filters.period, nowMs);

  return rows.filter((row) => {
    if (
      filters.type !== 'all' &&
      ledgerEntryCategory(row.reasonCode, row.direction) !== filters.type
    ) {
      return false;
    }
    if (filters.currency !== 'all' && row.currency !== filters.currency) {
      return false;
    }
    if (cutoff !== null && new Date(row.createdAt).getTime() < cutoff) {
      return false;
    }
    return true;
  });
}

export function paginateLedgerRows<T>(rows: T[], page: number, pageSize = LEDGER_PAGE_SIZE): T[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function ledgerPageCount(rowCount: number, pageSize = LEDGER_PAGE_SIZE): number {
  if (rowCount <= 0) return 1;
  return Math.ceil(rowCount / pageSize);
}

export function clampLedgerPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages);
}
