import { act, renderHook, waitFor, type ChangeEvent, type FormEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountKycController } from '@/features/account/use-account-kyc-controller';

const navigateMock = vi.hoisted(() => vi.fn());
const refetchMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());
const submitKycMock = vi.hoisted(() => vi.fn());
const uploadKycDocumentMock = vi.hoisted(() => vi.fn());
const productToastShowMock = vi.hoisted(() => vi.fn());

const complianceState = vi.hoisted(() => ({
  data: {
    ok: true,
    kyc_tier: 'email_verified',
    kyc_status: null as string | null,
    sanctions_status: null,
    activity_frozen: false,
    withdrawal_ready: false,
    steps: {
      account: false,
      kyc_submit: false,
      kyc_review: false,
      sanctions: false,
      withdraw: false,
    },
    blocks: [] as Array<{ code: string; until?: string }>,
  },
  isLoading: false,
  isError: false,
}));

const authState = vi.hoisted(() => ({
  session: { user: { id: 'user-1' } } as { user: { id: string } } | null,
  loading: false,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => authState,
}));

vi.mock('@/hooks/use-compliance-status', () => ({
  complianceKeys: { status: (userId: string | null) => ['compliance-status', userId] },
  useComplianceStatus: () => ({
    data: complianceState.data,
    isLoading: complianceState.isLoading,
    isError: complianceState.isError,
    refetch: refetchMock,
  }),
}));

vi.mock('@/domain/wallet', () => ({
  submitKyc: submitKycMock,
}));

vi.mock('@/domain/kyc-storage', () => ({
  validateKycImageFile: () => null,
  uploadKycDocument: uploadKycDocumentMock,
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShowMock },
}));

beforeEach(() => {
  navigateMock.mockReset();
  refetchMock.mockReset();
  invalidateQueriesMock.mockReset();
  submitKycMock.mockReset();
  uploadKycDocumentMock.mockReset();
  productToastShowMock.mockReset();
  authState.session = { user: { id: 'user-1' } };
  authState.loading = false;
  complianceState.isLoading = false;
  complianceState.isError = false;
  complianceState.data = {
    ok: true,
    kyc_tier: 'email_verified',
    kyc_status: null,
    sanctions_status: null,
    activity_frozen: false,
    withdrawal_ready: false,
    steps: {
      account: false,
      kyc_submit: false,
      kyc_review: false,
      sanctions: false,
      withdraw: false,
    },
    blocks: [],
  };
  refetchMock.mockResolvedValue({ data: complianceState.data });
  submitKycMock.mockResolvedValue(undefined);
  uploadKycDocumentMock.mockResolvedValue('user-1/id-front.jpg');
});

describe('useAccountKycController', () => {
  it('redirects unauthenticated users to login', async () => {
    authState.session = null;
    renderHook(() => useAccountKycController());
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/login', replace: true });
    });
  });

  it('shows submit form when KYC not yet submitted', () => {
    const { result } = renderHook(() => useAccountKycController());
    expect(result.current.showSubmitForm).toBe(true);
    expect(result.current.statusMessageKey).toBe('wallet.kyc.unverified');
  });

  it('hides submit form when submission is in review', () => {
    complianceState.data.kyc_status = 'reviewing';
    const { result } = renderHook(() => useAccountKycController());
    expect(result.current.showSubmitForm).toBe(false);
    expect(result.current.statusBadgeState).toBe('reviewing');
  });

  it('submits KYC after documents upload and valid fields', async () => {
    uploadKycDocumentMock
      .mockResolvedValueOnce('user-1/id-front.jpg')
      .mockResolvedValueOnce('user-1/id-back.jpg')
      .mockResolvedValueOnce('user-1/selfie.jpg');

    const { result } = renderHook(() => useAccountKycController());

    act(() => {
      result.current.setLegalName('Kim Minsoo');
      result.current.setDocumentLast4('A123');
      result.current.setCountry('KR');
    });

    const file = new File(['img'], 'front.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.handleDocumentSelect('id-front', {
        target: { files: [file], value: '' },
      } as unknown as ChangeEvent<HTMLInputElement>);
      await result.current.handleDocumentSelect('id-back', {
        target: { files: [file], value: '' },
      } as unknown as ChangeEvent<HTMLInputElement>);
      await result.current.handleDocumentSelect('selfie', {
        target: { files: [file], value: '' },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => {
      expect(result.current.allDocumentsReady).toBe(true);
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(submitKycMock).toHaveBeenCalledWith(
      expect.objectContaining({
        legalName: 'Kim Minsoo',
        documentLast4: 'A123',
        country: 'KR',
        documentFrontPath: 'user-1/id-front.jpg',
        documentBackPath: 'user-1/id-back.jpg',
        selfiePath: 'user-1/selfie.jpg',
      }),
    );
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'strict',
      key: 'wallet.kyc.submitOk',
    });
  });
});
