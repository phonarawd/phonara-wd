import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ADMIN_KRW_PROOF_BUTTON_INTENTS,
  ADMIN_KRW_PROOF_REVIEW_CREDITS_FORBIDDEN,
  ADMIN_KRW_PROOF_REVIEW_DESK_FULL_PATH,
  ADMIN_KRW_PROOF_REVIEW_DESK_ROUTE,
  ADMIN_KRW_PROOF_REVIEW_RPC,
  ADMIN_KRW_PROOF_STORAGE_BUCKET,
  assertEwE10AdminKrwProofReviewSync,
  EW_E10_ADMIN_KRW_PROOF_ARTIFACT_PATHS,
  EW_E10_ADMIN_KRW_PROOF_TEST_PATHS,
  EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_NEXT_TODO,
  EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_PREREQUISITE_TODO,
  EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_TODO,
  isAdminKrwProofPending,
  isAdminKrwProofViewable,
} from '../admin-krw-proof-review-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

describe('admin-krw-proof-review-display-contract (E10 · ew-e10-page-admin-krw-proof-review)', () => {
  it('pins todo · prerequisite WAVE · next wallet settings', () => {
    expect(EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_TODO).toBe('ew-e10-page-admin-krw-proof-review');
    expect(EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_PREREQUISITE_TODO).toBe(
      'ew-e10-platform-engine-wave',
    );
    expect(EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_NEXT_TODO).toBe('ew-e10-wallet-settings-ui');
    expect(() => assertEwE10AdminKrwProofReviewSync()).not.toThrow();
  });

  it('wires deposits desk · review RPC · storage · no credit', () => {
    expect(ADMIN_KRW_PROOF_REVIEW_DESK_ROUTE).toBe('/deposits');
    expect(ADMIN_KRW_PROOF_REVIEW_DESK_FULL_PATH).toBe('/admin/deposits');
    expect(ADMIN_KRW_PROOF_REVIEW_RPC).toBe('rpc_admin_review_krw_deposit_proof');
    expect(ADMIN_KRW_PROOF_STORAGE_BUCKET).toBe('krw-deposit-proofs');
    expect(ADMIN_KRW_PROOF_REVIEW_CREDITS_FORBIDDEN).toBe(true);
    expect([...ADMIN_KRW_PROOF_BUTTON_INTENTS]).toEqual(['viewDepositProof', 'markProofMatched']);
    expect(isAdminKrwProofPending('pending')).toBe(true);
    expect(isAdminKrwProofPending('approved')).toBe(false);
    expect(isAdminKrwProofViewable('pending', 'u/proof.jpg')).toBe(true);
    expect(isAdminKrwProofViewable('none', null)).toBe(false);
  });

  it('requires artifacts on disk', () => {
    for (const rel of EW_E10_ADMIN_KRW_PROOF_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of EW_E10_ADMIN_KRW_PROOF_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('ops doc pins todo · RPC · no ledger credit · deposits', () => {
    const ops = readFileSync(
      resolve(REPO_ROOT, 'docs/OPERATIONS/ENGINE_GAP_E10_ADMIN_KRW_PROOF.md'),
      'utf8',
    );
    expect(ops).toContain('ew-e10-page-admin-krw-proof-review');
    expect(ops).toContain('rpc_admin_review_krw_deposit_proof');
    expect(ops).toContain('/admin/deposits');
    expect(ops).toContain('원장');
    expect(ops).toContain('ew-e10-wallet-settings-ui');
  });
});
