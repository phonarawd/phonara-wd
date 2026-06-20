import {
  getCurrencyTotals,
  getWalletSnapshot,
  type CurrencyTotals,
  type WalletSnapshot,
} from '../../pentest/lib/verify.ts';
import { sqlExec } from './sql-claims.ts';

export interface DbSnapshot {
  readonly capturedAt: string;
  readonly userAId: string;
  readonly wallet: WalletSnapshot | null;
  readonly sigma: CurrencyTotals | null;
  readonly gameBetsCount: number;
  readonly ledgerEntriesCount: number;
}

export function captureSnapshot(userAId: string): DbSnapshot {
  const counts = sqlExec(`
    SELECT
      (SELECT count(*)::int FROM game_bets),
      (SELECT count(*)::int FROM wallet_ledger);
  `);
  let gameBetsCount = -1;
  let ledgerEntriesCount = -1;
  if (counts.ok) {
    const [gb, le] = counts.stdout.trim().split('|');
    gameBetsCount = Number(gb ?? -1);
    ledgerEntriesCount = Number(le ?? -1);
  }

  return {
    capturedAt: new Date().toISOString(),
    userAId,
    wallet: getWalletSnapshot(userAId),
    sigma: getCurrencyTotals(),
    gameBetsCount,
    ledgerEntriesCount,
  };
}

export function snapshotsMatch(a: DbSnapshot, b: DbSnapshot): { match: boolean; diffs: string[] } {
  const diffs: string[] = [];
  if (!a.wallet || !b.wallet) {
    diffs.push('wallet snapshot missing');
    return { match: false, diffs };
  }
  const fields: Array<keyof WalletSnapshot> = [
    'phon_available',
    'phon_locked',
    'usdt_available',
    'usdt_locked',
    'krw_available',
    'krw_locked',
  ];
  for (const f of fields) {
    if (a.wallet[f] !== b.wallet[f]) {
      diffs.push(`wallet.${f}: ${a.wallet[f]} → ${b.wallet[f]}`);
    }
  }
  if (a.sigma && b.sigma) {
    for (const c of ['PHON', 'USDT', 'KRW'] as const) {
      if (a.sigma[c] !== b.sigma[c]) {
        diffs.push(`sigma.${c}: ${a.sigma[c]} → ${b.sigma[c]}`);
      }
    }
  } else {
    diffs.push('sigma snapshot missing');
  }
  if (a.gameBetsCount !== b.gameBetsCount) {
    diffs.push(`game_bets count: ${a.gameBetsCount} → ${b.gameBetsCount}`);
  }
  if (a.ledgerEntriesCount !== b.ledgerEntriesCount) {
    diffs.push(`ledger_entries count: ${a.ledgerEntriesCount} → ${b.ledgerEntriesCount}`);
  }
  return { match: diffs.length === 0, diffs };
}
