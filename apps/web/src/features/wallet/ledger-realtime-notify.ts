import type { LedgerRowView } from './ledger-entry-filters';

/** Dedup baseline for ledger realtime trust toasts — module scope avoids rerender churn. */
export const ledgerEntryIdsRef = { current: new Set<string>() };

export function shouldEmitLedgerEntryNotify(entryId: string): boolean {
  return !ledgerEntryIdsRef.current.has(entryId);
}

export function markLedgerEntrySeen(entryId: string): void {
  ledgerEntryIdsRef.current.add(entryId);
}

export function ledgerEntryNotificationId(entryId: string): string {
  return `ledger:${entryId}:posted`;
}

export function seedLedgerEntryIds(ids: ReadonlyArray<string>): void {
  ledgerEntryIdsRef.current = new Set(ids);
}

export function resetLedgerEntryIds(): void {
  ledgerEntryIdsRef.current.clear();
}

export function isLedgerCreditDirection(direction: string): boolean {
  return direction === 'credit' || direction === 'unlock';
}

export function ledgerEntryMoneyLine(row: Pick<LedgerRowView, 'amount' | 'currency'>): string {
  return `${row.amount} ${row.currency}`;
}
