import type { MessageKey } from '@phonara/i18n';

import type { KycDocumentSlot } from '@/domain/kyc-storage';
import type { ComplianceStatus } from '@/hooks/use-compliance-status';
import type { MoneyStatusState } from '@/product/primitives/status-badge';

export type KycSubmissionStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | null;

export const KYC_DOCUMENT_SLOTS: readonly KycDocumentSlot[] = [
  'id-front',
  'id-back',
  'selfie',
] as const;

export const COMPLIANCE_STEP_ORDER = [
  'account',
  'kyc_submit',
  'kyc_review',
  'sanctions',
  'withdraw',
] as const satisfies readonly (keyof ComplianceStatus['steps'])[];

export type ComplianceStepKey = (typeof COMPLIANCE_STEP_ORDER)[number];

export function parseKycSubmissionStatus(raw: string | null | undefined): KycSubmissionStatus {
  if (!raw) return null;
  if (raw === 'submitted' || raw === 'reviewing' || raw === 'approved' || raw === 'rejected') {
    return raw;
  }
  return null;
}

export function isKycTierVerified(tier: string | null | undefined): boolean {
  return tier === 'id_verified';
}

export function kycStatusBadgeState(
  status: KycSubmissionStatus,
  tierVerified: boolean,
): MoneyStatusState {
  if (tierVerified || status === 'approved') return 'settled';
  if (status === 'reviewing') return 'reviewing';
  if (status === 'rejected') return 'rejected';
  if (status === 'submitted') return 'pending';
  return 'pending';
}

export function kycStatusMessageKey(
  status: KycSubmissionStatus,
  tierVerified: boolean,
): MessageKey {
  if (tierVerified || status === 'approved') return 'wallet.kyc.verified';
  if (status === 'reviewing' || status === 'submitted') return 'wallet.kyc.pending';
  if (status === 'rejected') return 'kyc.status.rejected';
  return 'wallet.kyc.unverified';
}

export function canSubmitKyc(status: KycSubmissionStatus, tierVerified: boolean): boolean {
  if (tierVerified) return false;
  if (status === 'submitted' || status === 'reviewing' || status === 'approved') return false;
  return true;
}

export function kycLegalNameGateKey(name: string): MessageKey | null {
  if (name.trim().length >= 2) return null;
  return 'kyc.gate.legalName';
}

export function kycDocumentLast4GateKey(raw: string): MessageKey | null {
  const normalized = raw.trim().toUpperCase();
  if (/^[A-Z0-9]{4}$/.test(normalized)) return null;
  return 'kyc.gate.documentLast4';
}

export function kycCountryGateKey(raw: string): MessageKey | null {
  const normalized = raw.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(normalized)) return null;
  return 'kyc.gate.country';
}

export function complianceStepMessageKey(step: ComplianceStepKey): MessageKey {
  return `wallet.compliance.step.${step}` as MessageKey;
}

export function complianceStepHintKey(step: ComplianceStepKey): MessageKey {
  return `wallet.compliance.stepHint.${step}` as MessageKey;
}

export function kycDocumentLabelKey(slot: KycDocumentSlot): MessageKey {
  if (slot === 'id-front') return 'wallet.kyc.doc.front';
  if (slot === 'id-back') return 'wallet.kyc.doc.back';
  return 'wallet.kyc.doc.selfie';
}

export function kycDocumentHintKey(slot: KycDocumentSlot): MessageKey {
  if (slot === 'id-front') return 'wallet.kyc.doc.frontHint';
  if (slot === 'id-back') return 'wallet.kyc.doc.backHint';
  return 'wallet.kyc.doc.selfieHint';
}

export function kycUploadErrorKey(code: string): MessageKey {
  if (code === 'kyc_documents_invalid_type') return 'kyc.upload.invalidType';
  if (code === 'kyc_documents_too_large') return 'kyc.upload.tooLarge';
  return 'kyc.submitError';
}
