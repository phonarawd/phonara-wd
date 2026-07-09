import { describe, expect, it } from 'vitest';
import {
  normalizePgBankTransferItem,
  parsePgBankIngestBody,
} from '../supabase/functions/_shared/pg-bank-transfer.ts';

describe('pg-bank-transfer payload (E1b)', () => {
  it('normalizes a single transfer item', () => {
    expect(
      normalizePgBankTransferItem({
        transfer_id: ' TX-1 ',
        amount_krw: '10000',
        depositor_name: 'Kim Minsoo',
        reference_code: 'REFABC123',
      }),
    ).toEqual({
      transfer_id: 'TX-1',
      amount_krw: '10000',
      depositor_name: 'Kim Minsoo',
      reference_code: 'REFABC123',
    });
  });

  it('rejects incomplete items', () => {
    expect(
      normalizePgBankTransferItem({
        transfer_id: 'TX-1',
        amount_krw: '',
        depositor_name: 'Kim',
        reference_code: 'REF',
      }),
    ).toBeNull();
  });

  it('parses single webhook body', () => {
    expect(
      parsePgBankIngestBody({
        transfer_id: 'TX-1',
        amount_krw: '5000',
        depositor_name: 'Lee',
        reference_code: 'REF001',
      }),
    ).toEqual({
      items: [
        {
          transfer_id: 'TX-1',
          amount_krw: '5000',
          depositor_name: 'Lee',
          reference_code: 'REF001',
        },
      ],
      source: 'pg_webhook',
    });
  });

  it('parses batch body with pg_batch source', () => {
    const parsed = parsePgBankIngestBody({
      source: 'pg_batch',
      transfers: [
        {
          transfer_id: 'A',
          amount_krw: '1',
          depositor_name: 'A',
          reference_code: 'R1',
        },
        {
          transfer_id: 'B',
          amount_krw: '2',
          depositor_name: 'B',
          reference_code: 'R2',
        },
      ],
    });
    expect(parsed).toEqual({
      items: [
        { transfer_id: 'A', amount_krw: '1', depositor_name: 'A', reference_code: 'R1' },
        { transfer_id: 'B', amount_krw: '2', depositor_name: 'B', reference_code: 'R2' },
      ],
      source: 'pg_batch',
    });
  });

  it('rejects empty batch', () => {
    expect(parsePgBankIngestBody({ transfers: [] })).toEqual({ error: 'invalid_batch_size' });
  });
});
