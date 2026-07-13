import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '@/lib/launch-gates';

import {
  assertKrwDepositProofWireSync,
  buildKrwDepositProofPath,
  canAttachKrwDepositProof,
  isKrwDepositProofLive,
  isKrwDepositProofPathOwned,
  KRW_DEPOSIT_PROOF_ATTACH_CREDITS_FORBIDDEN,
  KRW_DEPOSIT_PROOF_ATTACH_RPC,
  KRW_DEPOSIT_PROOF_FINDING,
  KRW_DEPOSIT_PROOF_MAX_BYTES,
  KRW_DEPOSIT_PROOF_ROUTE,
  KRW_DEPOSIT_PROOF_STORAGE_BUCKET,
  KRW_DEPOSIT_PROOF_TODO,
  krwDepositProofUploadErrorKey,
  resolveKrwDepositProofStatusKey,
  shouldShowKrwDepositProofUpload,
  validateKrwDepositProofFile,
} from '../krw-deposit-proof-display-contract';

describe('krw-deposit-proof-display-contract (M-21)', () => {
  it('pins todo · finding · RPC · bucket · ledger-0 · live gate', () => {
    assertKrwDepositProofWireSync();
    expect(KRW_DEPOSIT_PROOF_TODO).toBe('audit-r2d-krw-proof-wire');
    expect(KRW_DEPOSIT_PROOF_FINDING).toBe('M-21');
    expect(KRW_DEPOSIT_PROOF_ROUTE).toBe('/wallet/deposit/krw');
    expect(KRW_DEPOSIT_PROOF_ATTACH_RPC).toBe('rpc_attach_krw_deposit_proof');
    expect(KRW_DEPOSIT_PROOF_STORAGE_BUCKET).toBe('krw-deposit-proofs');
    expect(KRW_DEPOSIT_PROOF_ATTACH_CREDITS_FORBIDDEN).toBe(true);
    expect(LAUNCH_GATES.krwDepositProofLive).toBe(true);
    expect(isKrwDepositProofLive()).toBe(true);
  });

  it('builds owner path matching engine CHECK pattern', () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    const path = buildKrwDepositProofPath(userId, 'image/png');
    expect(path).toBe(`${userId}/proof.png`);
    expect(isKrwDepositProofPathOwned(userId, path)).toBe(true);
    expect(isKrwDepositProofPathOwned(userId, 'other/proof.png')).toBe(false);
    expect(isKrwDepositProofPathOwned(userId, `${userId}/selfie.jpg`)).toBe(false);
  });

  it('validates mime + size before storage upload', () => {
    expect(validateKrwDepositProofFile({ type: 'image/png', size: 100 })).toBeNull();
    expect(validateKrwDepositProofFile({ type: 'application/pdf', size: 100 })).toBe(
      'krw_deposit_proof_invalid_type',
    );
    expect(
      validateKrwDepositProofFile({ type: 'image/jpeg', size: KRW_DEPOSIT_PROOF_MAX_BYTES + 1 }),
    ).toBe('krw_deposit_proof_too_large');
    expect(krwDepositProofUploadErrorKey('krw_deposit_proof_invalid_type')).toBe(
      'wallet.deposit.krw.proof.invalidType',
    );
    expect(krwDepositProofUploadErrorKey('other')).toBe('wallet.deposit.krw.proof.error');
  });

  it('shows upload when gate live + deposit id; blocks attach after review', () => {
    expect(
      shouldShowKrwDepositProofUpload({
        proofLive: false,
        depositId: 'dep-1',
        proofStatus: 'none',
      }),
    ).toBe(false);
    expect(
      shouldShowKrwDepositProofUpload({
        proofLive: true,
        depositId: 'dep-1',
        proofStatus: 'none',
      }),
    ).toBe(true);
    expect(
      canAttachKrwDepositProof({
        proofLive: true,
        depositId: 'dep-1',
        proofStatus: 'pending',
        busy: false,
      }),
    ).toBe(true);
    expect(
      canAttachKrwDepositProof({
        proofLive: true,
        depositId: 'dep-1',
        proofStatus: 'approved',
        busy: false,
      }),
    ).toBe(false);
    expect(resolveKrwDepositProofStatusKey('pending')).toBe(
      'wallet.deposit.krw.proof.status.pending',
    );
  });
});
