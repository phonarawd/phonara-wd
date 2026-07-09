import type { RecentBet } from './types';

/** Dedup baseline for casino history trust toasts. */
export const casinoBetIdsRef = { current: new Set<string>() };

export function shouldEmitCasinoBetNotify(betId: string): boolean {
  return !casinoBetIdsRef.current.has(betId);
}

export function markCasinoBetSeen(betId: string): void {
  casinoBetIdsRef.current.add(betId);
}

export function seedCasinoBetIds(ids: ReadonlyArray<string>): void {
  casinoBetIdsRef.current = new Set(ids);
}

export function resetCasinoBetIds(): void {
  casinoBetIdsRef.current.clear();
}

export function casinoBetMoneyLine(bet: Pick<RecentBet, 'stake' | 'currency'>): string {
  return `${bet.stake} ${bet.currency}`;
}

export function isCasinoBetSettled(status: string): boolean {
  return status === 'won' || status === 'lost';
}
