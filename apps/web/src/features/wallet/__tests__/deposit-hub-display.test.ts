import { describe, expect, it } from 'vitest';

import {
  cryptoDepositStatusToMoneyState,
  DEPOSIT_HUB_RAILS,
  giftcardDepositStatusToMoneyState,
  krwDepositStatusToMoneyState,
  mapGiftcardDepositHistoryRow,
  mergeDepositHistoryRows,
  resolveDepositHubRails,
} from '../deposit-hub-display';

describe('deposit-hub-display', () => {
  it('keeps a three-rail catalog and filters by capability (H-03 · H-11)', () => {
    expect(DEPOSIT_HUB_RAILS.map((rail) => rail.id)).toEqual(['krw', 'crypto', 'giftcard']);
    expect(DEPOSIT_HUB_RAILS.map((rail) => rail.href)).toEqual([
      '/wallet/deposit/krw',
      '/wallet/deposit/crypto',
      '/wallet/deposit/giftcard',
    ]);
    expect(
      resolveDepositHubRails({
        cryptoRails: false,
        giftcardMarketAvailable: false,
      }).map((rail) => rail.id),
    ).toEqual(['krw']);
    expect(
      resolveDepositHubRails({
        cryptoRails: false,
        giftcardMarketAvailable: true,
      }).map((rail) => rail.id),
    ).toEqual(['krw', 'giftcard']);
  });

  it('maps KRW deposit statuses to money grammar states', () => {
    expect(krwDepositStatusToMoneyState('pending')).toBe('pending');
    expect(krwDepositStatusToMoneyState('matched')).toBe('reviewing');
    expect(krwDepositStatusToMoneyState('credited')).toBe('settled');
    expect(krwDepositStatusToMoneyState('admin_rejected')).toBe('rejected');
  });

  it('maps crypto and giftcard statuses to money grammar states', () => {
    expect(cryptoDepositStatusToMoneyState('matched')).toBe('reviewing');
    expect(cryptoDepositStatusToMoneyState('credited')).toBe('settled');
    expect(giftcardDepositStatusToMoneyState('pending')).toBe('reviewing');
    expect(giftcardDepositStatusToMoneyState('credited')).toBe('settled');
  });

  it('merges deposit requests newest-first across rails', () => {
    const rows = mergeDepositHistoryRows(
      [
        {
          id: 'k1',
          user_id: 'u',
          wallet_id: 'w',
          amount_krw: '10000',
          expected_phon: '10',
          reference_code: 'REF',
          status: 'pending',
          rate_snapshot_id: null,
          expires_at: null,
          matched_at: null,
          credited_at: null,
          admin_note: null,
          created_at: '2026-07-04T10:00:00.000Z',
          updated_at: '2026-07-04T10:00:00.000Z',
        },
      ],
      [
        {
          id: 'c1',
          user_id: 'u',
          wallet_id: 'w',
          address_id: 'a',
          asset: 'USDT',
          chain: 'TRC20',
          amount: '50.000000',
          tx_hash: null,
          confirmations_required: 12,
          confirmations_seen: 0,
          status: 'pending',
          expires_at: null,
          matched_at: null,
          credited_at: null,
          created_at: '2026-07-04T12:00:00.000Z',
          updated_at: '2026-07-04T12:00:00.000Z',
        },
      ],
      [],
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe('crypto:c1');
    expect(rows[1]?.id).toBe('krw:k1');
  });

  it('maps row display fields from RPC columns only', () => {
    const row = mapGiftcardDepositHistoryRow({
      id: 'g1',
      user_id: 'u',
      wallet_id: 'w',
      kind: 'culture',
      face_value_krw: '50000',
      net_krw: '47000',
      expected_phon: '47',
      fee_rate_bps: 300,
      fixed_fee_krw: '0',
      payout_rate_bps: 10000,
      fee_market_id: 'm1',
      pin_last4: '1234',
      status: 'pending',
      rate_snapshot_id: null,
      credited_at: null,
      reviewed_at: null,
      reviewed_by: null,
      admin_note: null,
      created_at: '2026-07-04T08:00:00.000Z',
      updated_at: '2026-07-04T08:00:00.000Z',
    });

    expect(row.amountDisplay).toBe('50000');
    expect(row.currency).toBe('KRW');
    expect(row.methodLabelKey).toBe('wallet.tx.method.giftcard');
  });
});
