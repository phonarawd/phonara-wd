import type { DepositRail } from './crypto-deposit-status';

export interface DepositRealtimeRow {
  id?: string;
  status?: string;
  expected_phon?: string | null;
  amount?: string | null;
  amount_krw?: string | null;
}

/** Dedup baselines for deposit status transitions — outside Zustand to avoid rerender churn. */
export const depositStatusRef = { current: new Map<string, string>() };

export function depositStatusKey(rail: DepositRail, depositId: string): string {
  return `${rail}:${depositId}`;
}

export function shouldEmitDepositCreditedNotify(
  previousStatus: string | undefined,
  nextStatus: string | undefined,
): boolean {
  return nextStatus === 'credited' && previousStatus !== undefined && previousStatus !== 'credited';
}

export function depositCreditedNotificationId(rail: DepositRail, depositId: string): string {
  return `deposit:${rail}:${depositId}:credited`;
}

export function depositCreditedAmountDisplay(
  rail: DepositRail,
  row: DepositRealtimeRow,
): { amount: string; currency: string } {
  if (rail === 'crypto') {
    return { amount: row.amount ?? '0', currency: 'USDT' };
  }
  if (rail === 'krw') {
    return { amount: row.expected_phon ?? row.amount_krw ?? '0', currency: 'PHON' };
  }
  return { amount: row.expected_phon ?? '0', currency: 'PHON' };
}

export function seedDepositStatusBaselines(
  rows: ReadonlyArray<{ rail: DepositRail; id: string; status: string }>,
): void {
  depositStatusRef.current.clear();
  for (const row of rows) {
    depositStatusRef.current.set(depositStatusKey(row.rail, row.id), row.status);
  }
}

export function resetDepositStatusBaselines(): void {
  depositStatusRef.current.clear();
}
