/**
 * E10 UI — `/admin/deposits` KRW deposit proof review (§29.2 · §29.5).
 * Authority: `ew-e10-page-admin-krw-proof-review` · ENGINE:ew-e10 proof RPC
 * Engine: `rpc_admin_review_krw_deposit_proof` (AAL2 · reason · no ledger credit).
 */

import { ADMIN_BEGINNER_SECTION_29_2_EXTRA_ROWS } from './admin-beginner-language-display-contract';

export const EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_TODO =
  'ew-e10-page-admin-krw-proof-review' as const;
export const EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_PREREQUISITE_TODO =
  'ew-e10-platform-engine-wave' as const;
export const EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_NEXT_TODO = 'ew-e10-wallet-settings-ui' as const;

export const ADMIN_KRW_PROOF_REVIEW_DESK_ROUTE = '/deposits' as const;
export const ADMIN_KRW_PROOF_REVIEW_DESK_FULL_PATH = '/admin/deposits' as const;

export const ADMIN_KRW_PROOF_REVIEW_RPC = 'rpc_admin_review_krw_deposit_proof' as const;

export const ADMIN_KRW_PROOF_STORAGE_BUCKET = 'krw-deposit-proofs' as const;

export const ADMIN_KRW_PROOF_STATUSES = ['none', 'pending', 'approved', 'rejected'] as const;

export type AdminKrwProofStatus = (typeof ADMIN_KRW_PROOF_STATUSES)[number];

export const ADMIN_KRW_PROOF_REVIEW_DECISIONS = ['approved', 'rejected'] as const;

export type AdminKrwProofReviewDecision = (typeof ADMIN_KRW_PROOF_REVIEW_DECISIONS)[number];

/** §29.2 round-33 — view photo · mark proof matched (approve). Reject via same RPC. */
export const ADMIN_KRW_PROOF_BUTTON_INTENTS = ['viewDepositProof', 'markProofMatched'] as const;

/** Proof approve must never credit wallet — match RPC only. */
export const ADMIN_KRW_PROOF_REVIEW_CREDITS_FORBIDDEN = true as const;

export const ADMIN_KRW_PROOF_REVIEW_SURFACE_PATH =
  'apps/admin/src/product/surfaces/admin-deposits-page.tsx' as const;

export const ADMIN_KRW_PROOF_REVIEW_ROUTE_PATH = 'apps/admin/src/routes/deposits.tsx' as const;

export const ADMIN_KRW_PROOF_REVIEW_HOOK_PATH =
  'apps/admin/src/hooks/admin/useAdminWalletDesk.ts' as const;

export const EW_E10_ADMIN_KRW_PROOF_ARTIFACT_PATHS = [
  ADMIN_KRW_PROOF_REVIEW_SURFACE_PATH,
  ADMIN_KRW_PROOF_REVIEW_ROUTE_PATH,
  ADMIN_KRW_PROOF_REVIEW_HOOK_PATH,
  'apps/admin/src/domain/admin-krw-proof-review-display-contract.ts',
  'apps/admin/src/domain/__tests__/admin-krw-proof-review-display-contract.test.ts',
  'apps/admin/src/product/surfaces/__tests__/admin-deposits-page.test.tsx',
  'docs/OPERATIONS/ENGINE_GAP_E10_ADMIN_KRW_PROOF.md',
] as const;

export const EW_E10_ADMIN_KRW_PROOF_TEST_PATHS = [
  'apps/admin/src/domain/__tests__/admin-krw-proof-review-display-contract.test.ts',
  'apps/admin/src/product/surfaces/__tests__/admin-deposits-page.test.tsx',
] as const;

export function isAdminKrwProofPending(status: string | null | undefined): boolean {
  return status === 'pending';
}

export function isAdminKrwProofViewable(
  status: string | null | undefined,
  proofPath: string | null | undefined,
): boolean {
  return Boolean(proofPath) && status !== undefined && status !== null && status !== 'none';
}

export function assertEwE10AdminKrwProofReviewSync(): void {
  if (EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_TODO !== 'ew-e10-page-admin-krw-proof-review') {
    throw new Error('admin krw proof todo id drift');
  }
  if (EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_PREREQUISITE_TODO !== 'ew-e10-platform-engine-wave') {
    throw new Error('admin krw proof prerequisite must be E10 platform wave');
  }
  if (EW_E10_PAGE_ADMIN_KRW_PROOF_REVIEW_NEXT_TODO !== 'ew-e10-wallet-settings-ui') {
    throw new Error('admin krw proof next must be ew-e10-wallet-settings-ui');
  }
  if (ADMIN_KRW_PROOF_REVIEW_RPC !== 'rpc_admin_review_krw_deposit_proof') {
    throw new Error('admin krw proof RPC drift');
  }
  if (ADMIN_KRW_PROOF_REVIEW_CREDITS_FORBIDDEN !== true) {
    throw new Error('proof review must not credit wallet');
  }
  const depositsRow = ADMIN_BEGINNER_SECTION_29_2_EXTRA_ROWS.find(
    (row) => row.desk === ADMIN_KRW_PROOF_REVIEW_DESK_FULL_PATH,
  );
  if (!depositsRow) {
    throw new Error('§29.2 must pin /admin/deposits proof row');
  }
  if (!depositsRow.rpcs.includes(ADMIN_KRW_PROOF_REVIEW_RPC)) {
    throw new Error('§29.2 deposits must pin rpc_admin_review_krw_deposit_proof');
  }
  for (const intent of ADMIN_KRW_PROOF_BUTTON_INTENTS) {
    if (!(depositsRow.buttonIntents as readonly string[]).includes(intent)) {
      throw new Error(`§29.2 deposits missing button intent ${intent}`);
    }
  }
}
