import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccountKycControllerView } from '@/features/account/use-account-kyc-controller';
import { I18nProvider } from '@/product/i18n';
import { AccountKycPage } from '@/product/surfaces/account/account-kyc-page';

const useAccountKycControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/account/use-account-kyc-controller', () => ({
  useAccountKycController: useAccountKycControllerMock,
}));

function emptyDocuments(): AccountKycControllerView['documents'] {
  return {
    'id-front': { fileName: null, path: null, uploading: false, errorKey: null },
    'id-back': { fileName: null, path: null, uploading: false, errorKey: null },
    selfie: { fileName: null, path: null, uploading: false, errorKey: null },
  };
}

function makeEngine(overrides: Partial<AccountKycControllerView> = {}): AccountKycControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    errorKey: null,
    statusBadgeState: 'pending',
    statusMessageKey: 'wallet.kyc.unverified',
    complianceSteps: [
      { key: 'account', done: false },
      { key: 'kyc_submit', done: false },
      { key: 'kyc_review', done: false },
      { key: 'sanctions', done: false },
      { key: 'withdraw', done: false },
    ],
    blocks: [],
    showSubmitForm: true,
    legalName: '',
    setLegalName: vi.fn(),
    documentLast4: '',
    setDocumentLast4: vi.fn(),
    country: 'KR',
    setCountry: vi.fn(),
    legalNameGateKey: null,
    documentLast4GateKey: null,
    countryGateKey: null,
    documents: emptyDocuments(),
    allDocumentsReady: false,
    submitBusy: false,
    refresh: vi.fn(),
    handleDocumentSelect: vi.fn(),
    handleSubmit: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: AccountKycControllerView) {
  useAccountKycControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <AccountKycPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useAccountKycControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('AccountKycPage', () => {
  it('renders page header and back link to account', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('account-kyc-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '본인 인증' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '계정으로' })).toHaveAttribute('href', '/account');
  });

  it('shows compliance steps and submit form', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('account-kyc-steps')).toBeInTheDocument();
    expect(screen.getByTestId('account-kyc-form')).toBeInTheDocument();
    expect(screen.getByTestId('account-kyc-doc-id-front')).toBeInTheDocument();
    expect(screen.getByTestId('account-kyc-submit')).toBeDisabled();
  });

  it('shows review status card when submit form is hidden', () => {
    renderPage(
      makeEngine({
        showSubmitForm: false,
        statusBadgeState: 'reviewing',
        statusMessageKey: 'wallet.kyc.pending',
      }),
    );

    expect(screen.queryByTestId('account-kyc-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('account-kyc-status-card')).toBeInTheDocument();
  });

  it('submits when form is valid and documents ready', () => {
    const handleSubmit = vi.fn();
    renderPage(
      makeEngine({
        legalName: 'Kim Minsoo',
        documentLast4: 'A123',
        allDocumentsReady: true,
        handleSubmit,
      }),
    );

    fireEvent.click(screen.getByTestId('account-kyc-submit'));
    expect(handleSubmit).toHaveBeenCalled();
  });
});
