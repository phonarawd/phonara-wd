import { describe, expect, it } from 'vitest';

import { mapWalletLedgerRow } from '../wallet-ledger-display';

describe('mapWalletLedgerRow', () => {
  it('maps wallet_ledger PostgREST row to LedgerRowView', () => {
    const row = mapWalletLedgerRow({
      id: 'id-1',
      user_id: 'user-1',
      wallet_id: 'wallet-1',
      seq: 7,
      amount: '50.000000',
      currency: 'PHON',
      direction: 'credit',
      available_before: '0',
      available_after: '50.000000',
      locked_before: '0',
      locked_after: '0',
      reason_code: 'daily_claim',
      idempotency_key: 'key-1',
      related_entity_id: null,
      transfer_id: null,
      rate_snapshot_id: null,
      prev_hash: 'prev',
      row_hash: 'hash',
      created_at: '2026-07-04T10:00:00.000Z',
    });

    expect(row).toEqual({
      id: 'id-1',
      createdAt: '2026-07-04T10:00:00.000Z',
      reasonCode: 'daily_claim',
      amount: '50.000000',
      currency: 'PHON',
      direction: 'credit',
      availableAfter: '50.000000',
      seq: 7,
      relatedEntityId: null,
      rateSnapshotId: null,
    });
  });
});
