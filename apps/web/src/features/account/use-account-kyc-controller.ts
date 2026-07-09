import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import {
  uploadKycDocument,
  validateKycImageFile,
  type KycDocumentSlot,
} from '@/domain/kyc-storage';
import { submitKyc } from '@/domain/wallet';
import { useAuth } from '@/contexts/auth-context';
import { complianceKeys, useComplianceStatus } from '@/hooks/use-compliance-status';
import { useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

import {
  canSubmitKyc,
  COMPLIANCE_STEP_ORDER,
  kycCountryGateKey,
  kycDocumentLast4GateKey,
  kycLegalNameGateKey,
  kycStatusBadgeState,
  kycStatusMessageKey,
  kycUploadErrorKey,
  isKycTierVerified,
  parseKycSubmissionStatus,
  type ComplianceStepKey,
} from './kyc-display';

type DocumentSlotState = {
  fileName: string | null;
  path: string | null;
  uploading: boolean;
  errorKey: MessageKey | null;
};

function emptyDocumentState(): DocumentSlotState {
  return { fileName: null, path: null, uploading: false, errorKey: null };
}

export type AccountKycControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  errorKey: MessageKey | null;
  statusBadgeState: ReturnType<typeof kycStatusBadgeState>;
  statusMessageKey: MessageKey;
  complianceSteps: Array<{ key: ComplianceStepKey; done: boolean }>;
  blocks: Array<{ code: string; until?: string }>;
  showSubmitForm: boolean;
  legalName: string;
  setLegalName: (value: string) => void;
  documentLast4: string;
  setDocumentLast4: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  legalNameGateKey: MessageKey | null;
  documentLast4GateKey: MessageKey | null;
  countryGateKey: MessageKey | null;
  documents: Record<KycDocumentSlot, DocumentSlotState>;
  allDocumentsReady: boolean;
  submitBusy: boolean;
  refresh: () => Promise<void>;
  handleDocumentSelect: (
    slot: KycDocumentSlot,
    event: ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

/** Canonical `/account/kyc` — compliance status + document submission (P5). */
export function useAccountKycController(): AccountKycControllerView {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: compliance,
    isLoading: complianceLoading,
    isError: complianceError,
    refetch,
  } = useComplianceStatus();

  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [legalName, setLegalName] = useState('');
  const [documentLast4, setDocumentLast4Raw] = useState('');
  const [country, setCountryRaw] = useState('KR');
  const [submitBusy, setSubmitBusy] = useState(false);
  const [documents, setDocuments] = useState<Record<KycDocumentSlot, DocumentSlotState>>({
    'id-front': emptyDocumentState(),
    'id-back': emptyDocumentState(),
    selfie: emptyDocumentState(),
  });

  const setDocumentLast4 = useCallback((value: string) => {
    setDocumentLast4Raw(
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4),
    );
  }, []);

  const setCountry = useCallback((value: string) => {
    setCountryRaw(
      value
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 2),
    );
  }, []);

  const loading = authLoading || complianceLoading;
  const kycStatus = parseKycSubmissionStatus(compliance?.kyc_status);
  const tierVerified = isKycTierVerified(compliance?.kyc_tier);
  const statusBadgeState = kycStatusBadgeState(kycStatus, tierVerified);
  const statusMessageKey = kycStatusMessageKey(kycStatus, tierVerified);
  const showSubmitForm = canSubmitKyc(kycStatus, tierVerified);

  const legalNameGateKey = kycLegalNameGateKey(legalName);
  const documentLast4GateKey = kycDocumentLast4GateKey(documentLast4);
  const countryGateKey = kycCountryGateKey(country);

  const complianceSteps = useMemo(
    () =>
      COMPLIANCE_STEP_ORDER.map((key) => ({
        key,
        done: Boolean(compliance?.steps[key]),
      })),
    [compliance?.steps],
  );

  const allDocumentsReady = useMemo(
    () =>
      (['id-front', 'id-back', 'selfie'] as const).every(
        (slot) => documents[slot].path !== null && !documents[slot].uploading,
      ),
    [documents],
  );

  const refresh = useCallback(async () => {
    setErrorKey(null);
    try {
      await refetch();
    } catch {
      setErrorKey('common.error.generic');
    }
  }, [refetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      void navigate({ to: '/login', replace: true });
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (complianceError) {
      setErrorKey('common.error.generic');
    }
  }, [complianceError]);

  const updateDocumentSlot = useCallback(
    (slot: KycDocumentSlot, patch: Partial<DocumentSlotState>) => {
      setDocuments((current) => ({
        ...current,
        [slot]: { ...current[slot], ...patch },
      }));
    },
    [],
  );

  const handleDocumentSelect = useCallback(
    async (slot: KycDocumentSlot, event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || !session?.user.id) return;

      const validation = validateKycImageFile(file);
      if (validation) {
        updateDocumentSlot(slot, {
          errorKey: kycUploadErrorKey(validation),
          fileName: null,
          path: null,
        });
        return;
      }

      updateDocumentSlot(slot, {
        uploading: true,
        errorKey: null,
        fileName: file.name,
        path: null,
      });
      try {
        const path = await uploadKycDocument(session.user.id, slot, file);
        updateDocumentSlot(slot, { uploading: false, path, errorKey: null, fileName: file.name });
      } catch (error) {
        const code = error instanceof Error ? error.message : 'upload_failed';
        updateDocumentSlot(slot, {
          uploading: false,
          path: null,
          fileName: null,
          errorKey: kycUploadErrorKey(code),
        });
      }
    },
    [session?.user.id, updateDocumentSlot],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitBusy || !showSubmitForm) return;
    if (legalNameGateKey || documentLast4GateKey || countryGateKey || !allDocumentsReady) return;

    const frontPath = documents['id-front'].path;
    const backPath = documents['id-back'].path;
    const selfiePath = documents.selfie.path;
    if (!frontPath || !backPath || !selfiePath) return;

    setSubmitBusy(true);
    try {
      await submitKyc({
        legalName: legalName.trim(),
        documentLast4: documentLast4.trim().toUpperCase(),
        country: country.trim().toUpperCase(),
        documentFrontPath: frontPath,
        documentBackPath: backPath,
        selfiePath,
        idempotencyKey: crypto.randomUUID(),
      });
      await queryClient.invalidateQueries({
        queryKey: complianceKeys.status(session?.user.id ?? null),
      });
      productToast.show({ zone: 'strict', key: 'wallet.kyc.submitOk' });
    } catch {
      productToast.show({ zone: 'strict', key: 'kyc.submitError' });
    } finally {
      setSubmitBusy(false);
    }
  }

  return {
    t,
    loading,
    errorKey,
    statusBadgeState,
    statusMessageKey,
    complianceSteps,
    blocks: compliance?.blocks ?? [],
    showSubmitForm,
    legalName,
    setLegalName,
    documentLast4,
    setDocumentLast4,
    country,
    setCountry,
    legalNameGateKey,
    documentLast4GateKey,
    countryGateKey,
    documents,
    allDocumentsReady,
    submitBusy,
    refresh,
    handleDocumentSelect,
    handleSubmit,
  };
}
