import { describe, expect, it } from 'vitest';

import {
  inferWithdrawRail,
  mergeWithdrawHistoryRows,
  resolveWithdrawHubRails,
  withdrawStatusToMoneyState,
  WITHDRAW_HUB_RAILS,
} from '../withdraw-hub-display';

describe('withdraw-hub-display', () => {
  it('keeps a two-rail catalog and omits crypto while gate is false (H-03)', () => {
    expect(WITHDRAW_HUB_RAILS.map((rail) => rail.id)).toEqual(['krw', 'crypto']);
    expect(WITHDRAW_HUB_RAILS.map((rail) => rail.href)).toEqual([
      '/wallet/withdraw/krw',
      '/wallet/withdraw/crypto',
    ]);
    expect(resolveWithdrawHubRails({ cryptoRails: false }).map((rail) => rail.id)).toEqual(['krw']);
    expect(resolveWithdrawHubRails({ cryptoRails: true }).map((rail) => rail.id)).toEqual([
      'krw',
      'crypto',
    ]);
  });

  it('maps withdrawal statuses to money grammar states', () => {
    expect(withdrawStatusToMoneyState('pending')).toBe('pending');
    expect(withdrawStatusToMoneyState('approved')).toBe('reviewing');
    expect(withdrawStatusToMoneyState('sent')).toBe('reviewing');
    expect(withdrawStatusToMoneyState('completed')).toBe('settled');
    expect(withdrawStatusToMoneyState('rejected')).toBe('rejected');
    expect(withdrawStatusToMoneyState('cancelled')).toBe('failed');
  });

  it('infers krw vs crypto rail from withdrawal_requests rows', () => {
    expect(
      inferWithdrawRail({
        currency: 'PHON',
        destination: { type: 'bank', chain: 'BANK', account: '110123456789' },
      } as never),
    ).toBe('krw');
    expect(
      inferWithdrawRail({
        currency: 'USDT',
        destination: { address: 'TExample123', chain: 'TRC20' },
      } as never),
    ).toBe('crypto');
  });

  it('merges withdrawal requests newest-first', () => {
    const rows = mergeWithdrawHistoryRows([
      {
        id: 'w1',
        user_id: 'u',
        wallet_id: 'w',
        currency: 'PHON',
        amount: '100',
        destination: { type: 'bank', chain: 'BANK', account: '110' },
        status: 'pending',
        idempotency_key: 'k1',
        client_request_id: null,
        rate_snapshot_id: null,
        expected_krw: '130000',
        ledger_lock_id: null,
        ledger_debit_id: null,
        ledger_approve_debit_id: null,
        ledger_reject_unlock_id: null,
        system_payout_transfer_id: null,
        on_chain_tx_hash: null,
        approved_at: null,
        approved_by: null,
        rejected_at: null,
        rejected_by: null,
        sent_at: null,
        sent_by: null,
        admin_note: null,
        created_at: '2026-07-04T10:00:00.000Z',
        updated_at: '2026-07-04T10:00:00.000Z',
      },
      {
        id: 'w2',
        user_id: 'u',
        wallet_id: 'w',
        currency: 'USDT',
        amount: '50.000000',
        destination: { address: 'TExample', chain: 'TRC20' },
        status: 'completed',
        idempotency_key: 'k2',
        client_request_id: null,
        rate_snapshot_id: null,
        expected_krw: null,
        ledger_lock_id: null,
        ledger_debit_id: null,
        ledger_approve_debit_id: null,
        ledger_reject_unlock_id: null,
        system_payout_transfer_id: null,
        on_chain_tx_hash: null,
        approved_at: null,
        approved_by: null,
        rejected_at: null,
        rejected_by: null,
        sent_at: null,
        sent_by: null,
        admin_note: null,
        created_at: '2026-07-04T12:00:00.000Z',
        updated_at: '2026-07-04T12:00:00.000Z',
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe('crypto:w2');
    expect(rows[1]?.id).toBe('krw:w1');
    expect(rows[0]?.amountDisplay).toBe('50.000000');
    expect(rows[0]?.currency).toBe('USDT');
  });
});
