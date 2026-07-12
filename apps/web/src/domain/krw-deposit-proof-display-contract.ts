/**
 * M-21 — KRW deposit proof upload wire on `/wallet/deposit/krw`.
 *
 * Flow: validate image → owner storage path → `rpc_attach_krw_deposit_proof`
 * → `proof_status=pending`. Attach is idempotent and **ledger credit 0**
 * (credit remains match RPC only). Admin review = existing `/admin/deposits`.
 *
 * Finding: M-21 · Plan todo `audit-r2d-krw-proof-wire`
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '@/lib/launch-gates';

export const KRW_DEPOSIT_PROOF_TODO = 'audit-r2d-krw-proof-wire' as const;
export const KRW_DEPOSIT_PROOF_FINDING = 'M-21' as const;
export const KRW_DEPOSIT_PROOF_ROUTE = '/wallet/deposit/krw' as const;

export const KRW_DEPOSIT_PROOF_ATTACH_RPC = 'rpc_attach_krw_deposit_proof' as const;
export const KRW_DEPOSIT_PROOF_STORAGE_BUCKET = 'krw-deposit-proofs' as const;

/** Engine CHECK: `{uuid}/proof.(jpg|jpeg|png|webp)`. */
export const KRW_DEPOSIT_PROOF_PATH_PATTERN =
  /^[0-9a-f-]{36}\/proof\.(jpg|jpeg|png|webp)$/i;

export const KRW_DEPOSIT_PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const KRW_DEPOSIT_PROOF_ALLOWED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export type KrwDepositProofStatus = 'none' | 'pending' | 'approved' | 'rejected';

export const KRW_DEPOSIT_PROOF_STATUSES = [
  'none',
  'pending',
  'approved',
  'rejected',
] as const satisfies readonly KrwDepositProofStatus[];

/** Attach never credits wallet — match RPC only. */
export const KRW_DEPOSIT_PROOF_ATTACH_CREDITS_FORBIDDEN = true as const;

export const KRW_DEPOSIT_PROOF_TITLE_KEY =
  'wallet.deposit.krw.proof.title' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_DESC_KEY =
  'wallet.deposit.krw.proof.desc' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_LEDGER_NOTICE_KEY =
  'wallet.deposit.krw.proof.ledgerNotice' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_CHOOSE_KEY =
  'wallet.deposit.krw.proof.choose' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_UPLOADING_KEY =
  'wallet.deposit.krw.proof.uploading' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_PENDING_KEY =
  'wallet.deposit.krw.proof.status.pending' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_APPROVED_KEY =
  'wallet.deposit.krw.proof.status.approved' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_REJECTED_KEY =
  'wallet.deposit.krw.proof.status.rejected' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_INVALID_TYPE_KEY =
  'wallet.deposit.krw.proof.invalidType' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_TOO_LARGE_KEY =
  'wallet.deposit.krw.proof.tooLarge' as const satisfies MessageKey;
export const KRW_DEPOSIT_PROOF_GENERIC_ERROR_KEY =
  'wallet.deposit.krw.proof.error' as const satisfies MessageKey;

export function isKrwDepositProofLive(): boolean {
  return LAUNCH_GATES.krwDepositProofLive === true;
}

export function extensionForKrwDepositProofMime(mime: string): 'jpg' | 'jpeg' | 'png' | 'webp' {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/jpeg') return 'jpeg';
  return 'jpg';
}

/** Owner path pinned by storage RLS + attach RPC ownership assert. */
export function buildKrwDepositProofPath(userId: string, mime: string): string {
  const ext = extensionForKrwDepositProofMime(mime);
  return `${userId}/proof.${ext}`;
}

export function isKrwDepositProofPathOwned(userId: string, path: string): boolean {
  if (!KRW_DEPOSIT_PROOF_PATH_PATTERN.test(path)) return false;
  return path.toLowerCase().startsWith(`${userId.toLowerCase()}/proof.`);
}

export function validateKrwDepositProofFile(file: {
  type: string;
  size: number;
}): 'krw_deposit_proof_invalid_type' | 'krw_deposit_proof_too_large' | null {
  if (!(KRW_DEPOSIT_PROOF_ALLOWED_MIME as readonly string[]).includes(file.type)) {
    return 'krw_deposit_proof_invalid_type';
  }
  if (file.size > KRW_DEPOSIT_PROOF_MAX_BYTES) {
    return 'krw_deposit_proof_too_large';
  }
  return null;
}

export function krwDepositProofUploadErrorKey(code: string): MessageKey {
  if (code === 'krw_deposit_proof_invalid_type') return KRW_DEPOSIT_PROOF_INVALID_TYPE_KEY;
  if (code === 'krw_deposit_proof_too_large') return KRW_DEPOSIT_PROOF_TOO_LARGE_KEY;
  return KRW_DEPOSIT_PROOF_GENERIC_ERROR_KEY;
}

export function resolveKrwDepositProofStatusKey(
  status: KrwDepositProofStatus | null | undefined,
): MessageKey | null {
  if (status === 'pending') return KRW_DEPOSIT_PROOF_PENDING_KEY;
  if (status === 'approved') return KRW_DEPOSIT_PROOF_APPROVED_KEY;
  if (status === 'rejected') return KRW_DEPOSIT_PROOF_REJECTED_KEY;
  return null;
}

/**
 * Upload UI only after a pending deposit exists and the launch gate is live.
 * Reviewed proofs stay visible (status) but attach is blocked separately.
 */
export function shouldShowKrwDepositProofUpload(input: {
  proofLive: boolean;
  depositId: string | null | undefined;
  proofStatus?: KrwDepositProofStatus | null | undefined;
}): boolean {
  void input.proofStatus;
  if (!input.proofLive) return false;
  return Boolean(input.depositId?.trim());
}

/** Network attach allowed only for own pending deposit while not yet reviewed. */
export function canAttachKrwDepositProof(input: {
  proofLive: boolean;
  depositId: string | null | undefined;
  proofStatus: KrwDepositProofStatus | null | undefined;
  busy: boolean;
}): boolean {
  if (!input.proofLive) return false;
  if (input.busy) return false;
  if (!input.depositId?.trim()) return false;
  if (input.proofStatus === 'approved' || input.proofStatus === 'rejected') return false;
  return true;
}

export function assertKrwDepositProofWireSync(): void {
  if (KRW_DEPOSIT_PROOF_TODO !== 'audit-r2d-krw-proof-wire') {
    throw new Error('M-21 todo id drift');
  }
  if (KRW_DEPOSIT_PROOF_FINDING !== 'M-21') {
    throw new Error('M-21 finding id drift');
  }
  if (KRW_DEPOSIT_PROOF_ATTACH_RPC !== 'rpc_attach_krw_deposit_proof') {
    throw new Error('M-21 attach RPC drift');
  }
  if (KRW_DEPOSIT_PROOF_STORAGE_BUCKET !== 'krw-deposit-proofs') {
    throw new Error('M-21 storage bucket drift');
  }
  if (KRW_DEPOSIT_PROOF_ATTACH_CREDITS_FORBIDDEN !== true) {
    throw new Error('M-21 attach must not credit wallet');
  }
  if (LAUNCH_GATES.krwDepositProofLive !== true) {
    throw new Error('M-21 unlock requires krwDepositProofLive=true');
  }
}
