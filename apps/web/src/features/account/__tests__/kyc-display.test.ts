import { describe, expect, it } from 'vitest';

import {
  canSubmitKyc,
  kycCountryGateKey,
  kycDocumentLast4GateKey,
  kycLegalNameGateKey,
  kycStatusBadgeState,
  kycStatusMessageKey,
  kycUploadErrorKey,
  parseKycSubmissionStatus,
} from '@/features/account/kyc-display';

describe('kyc-display', () => {
  it('parses known submission statuses', () => {
    expect(parseKycSubmissionStatus('submitted')).toBe('submitted');
    expect(parseKycSubmissionStatus('reviewing')).toBe('reviewing');
    expect(parseKycSubmissionStatus('approved')).toBe('approved');
    expect(parseKycSubmissionStatus('rejected')).toBe('rejected');
    expect(parseKycSubmissionStatus(null)).toBeNull();
    expect(parseKycSubmissionStatus('unknown')).toBeNull();
  });

  it('maps status to badge and message keys', () => {
    expect(kycStatusBadgeState('approved', false)).toBe('settled');
    expect(kycStatusBadgeState(null, true)).toBe('settled');
    expect(kycStatusBadgeState('reviewing', false)).toBe('reviewing');
    expect(kycStatusBadgeState('rejected', false)).toBe('rejected');

    expect(kycStatusMessageKey('approved', false)).toBe('wallet.kyc.verified');
    expect(kycStatusMessageKey('submitted', false)).toBe('wallet.kyc.pending');
    expect(kycStatusMessageKey('rejected', false)).toBe('kyc.status.rejected');
    expect(kycStatusMessageKey(null, false)).toBe('wallet.kyc.unverified');
  });

  it('gates submit by status', () => {
    expect(canSubmitKyc(null, false)).toBe(true);
    expect(canSubmitKyc('rejected', false)).toBe(true);
    expect(canSubmitKyc('submitted', false)).toBe(false);
    expect(canSubmitKyc('reviewing', false)).toBe(false);
    expect(canSubmitKyc('approved', false)).toBe(false);
    expect(canSubmitKyc(null, true)).toBe(false);
  });

  it('validates form fields', () => {
    expect(kycLegalNameGateKey('Kim')).toBeNull();
    expect(kycLegalNameGateKey('K')).toBe('kyc.gate.legalName');

    expect(kycDocumentLast4GateKey('A123')).toBeNull();
    expect(kycDocumentLast4GateKey('A12')).toBe('kyc.gate.documentLast4');

    expect(kycCountryGateKey('KR')).toBeNull();
    expect(kycCountryGateKey('K')).toBe('kyc.gate.country');
  });

  it('maps upload errors to i18n keys', () => {
    expect(kycUploadErrorKey('kyc_documents_invalid_type')).toBe('kyc.upload.invalidType');
    expect(kycUploadErrorKey('kyc_documents_too_large')).toBe('kyc.upload.tooLarge');
    expect(kycUploadErrorKey('other')).toBe('kyc.submitError');
  });
});
