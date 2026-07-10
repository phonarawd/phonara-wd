import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  WALLET_LEDGER_REALTIME_DROPPED_TABLES,
  WALLET_LEDGER_REALTIME_HOOK,
  WALLET_LEDGER_REALTIME_OWNERS,
  WALLET_LEDGER_REALTIME_SOURCE_TABLE,
  WALLET_LEDGER_REALTIME_TODO,
  walletLedgerQueryKeyPrefix,
} from '../wallet-ledger-realtime-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

function readSrc(relativePath: string): string {
  return readFileSync(resolve(WEB_SRC, relativePath), 'utf8');
}

function readRepo(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('wallet-ledger-realtime-display-contract · PIR E2', () => {
  it('pins pir-e2 todo · wallets source · dropped high-churn tables', () => {
    expect(WALLET_LEDGER_REALTIME_TODO).toBe('pir-e2-realtime-narrow');
    expect(WALLET_LEDGER_REALTIME_SOURCE_TABLE).toBe('wallets');
    expect(WALLET_LEDGER_REALTIME_DROPPED_TABLES).toEqual([
      'wallet_ledger',
      'spot_order_fills',
      'trading_order_fills',
    ]);
    expect(walletLedgerQueryKeyPrefix('u1')).toEqual(['ledger', 'u1']);
  });

  it('wires use-wallet: wallets realtime invalidates wallet + ledger (no wallet_ledger sub)', () => {
    const wallet = readSrc(WALLET_LEDGER_REALTIME_HOOK);

    expect(wallet).toContain("table: 'wallets'");
    expect(wallet).toContain('walletLedgerQueryKeyPrefix(userId)');
    expect(wallet).not.toMatch(/table:\s*'wallet_ledger'/);

    // useLedger also listens to wallets (dual belt when ledger page alone)
    expect(wallet).toMatch(/function useLedger[\s\S]*table:\s*'wallets'/);
  });

  it('owners exist and migration drops high-churn publication tables', () => {
    for (const owner of WALLET_LEDGER_REALTIME_OWNERS) {
      expect(() => readSrc(owner)).not.toThrow();
    }

    const migration = readRepo('supabase/migrations/20260727000001_pir_realtime_narrow.sql');
    expect(migration).toContain('ledger_user_created_idx');
    for (const table of WALLET_LEDGER_REALTIME_DROPPED_TABLES) {
      expect(migration).toContain(`'${table}'`);
      expect(migration).toContain('DROP TABLE');
    }
  });
});
