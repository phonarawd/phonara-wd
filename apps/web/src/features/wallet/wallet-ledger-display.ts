import type { Tables } from '@phonara/shared-types';

import type { LedgerRowView } from './ledger-entry-filters';

/** Maps PostgREST wallet_ledger row to ledger UI view — display fields only. */
export function mapWalletLedgerRow(entry: Tables<'wallet_ledger'>): LedgerRowView {
  return {
    id: entry.id,
    createdAt: entry.created_at,
    reasonCode: entry.reason_code,
    amount: entry.amount,
    currency: entry.currency,
    direction: entry.direction,
    availableAfter: entry.available_after,
    seq: entry.seq,
    relatedEntityId: entry.related_entity_id,
    rateSnapshotId: entry.rate_snapshot_id,
  };
}
