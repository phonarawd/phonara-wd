import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminMfaEnrollPageControllerView } from '@/hooks/use-admin-mfa-enroll-page-controller';
import { I18nProvider } from '@/product/i18n';
import { AdminMfaEnrollPage } from '@/product/surfaces/admin-mfa-enroll-page';

const useAdminMfaEnrollPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-admin-mfa-enroll-page-controller', () => ({
  useAdminMfaEnrollPageController: useAdminMfaEnrollPageControllerMock,
}));

const enrollPayload = {
  factorId: 'factor-1',
  qrCode: 'data:image/svg+xml;base64,abc',
  secret: 'SECRET123',
};

function makeEngine(
  overrides: Partial<AdminMfaEnrollPageControllerView> = {},
): AdminMfaEnrollPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    forbidden: false,
    setupError: false,
    enroll: enrollPayload,
    code: '123456',
    setCode: vi.fn(),
    isBusy: false,
    verifyError: false,
    handleVerifyEnroll: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderPage(engine: AdminMfaEnrollPageControllerView) {
  useAdminMfaEnrollPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <AdminMfaEnrollPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useAdminMfaEnrollPageControllerMock.mockReset();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('AdminMfaEnrollPage', () => {
  it('renders canonical MFA enroll form with QR and code input', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('admin-mfa-enroll-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-mfa-enroll-form')).toBeInTheDocument();
    expect(screen.getByTestId('admin-mfa-enroll-qr')).toHaveAttribute('alt', 'TOTP QR 코드');
    expect(screen.getByTestId('admin-mfa-enroll-secret')).toHaveValue('SECRET123');
    expect(screen.getByTestId('admin-mfa-enroll-code')).toHaveAccessibleName('인증 코드');
    expect(screen.getByTestId('admin-mfa-enroll-submit')).toHaveTextContent('등록 완료');
  });

  it('wires verify submit to controller handler', () => {
    const engine = makeEngine();
    renderPage(engine);

    fireEvent.submit(screen.getByTestId('admin-mfa-enroll-form'));
    expect(engine.handleVerifyEnroll).toHaveBeenCalledTimes(1);
  });

  it('shows verify error when controller reports verifyError', () => {
    renderPage(makeEngine({ verifyError: true }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      '인증 코드가 올바르지 않습니다. 다시 시도하세요.',
    );
  });

  it('renders setup error when enrollment cannot start', () => {
    renderPage(makeEngine({ setupError: true, enroll: null }));

    expect(
      screen.getByText('2단계 인증 등록을 시작할 수 없습니다. 다시 로그인하세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('admin-mfa-enroll-form')).not.toBeInTheDocument();
  });

  it('renders forbidden state for non-admin sessions', () => {
    renderPage(makeEngine({ forbidden: true, enroll: null }));

    expect(screen.getByTestId('admin-forbidden')).toBeInTheDocument();
    expect(screen.getByText('관리자 권한이 없습니다.')).toBeInTheDocument();
  });

  it('disables submit until a 6-digit code is entered', () => {
    renderPage(makeEngine({ code: '' }));

    expect(screen.getByTestId('admin-mfa-enroll-submit')).toBeDisabled();
  });

  it('renders loading shell while enrollment initializes', () => {
    renderPage(makeEngine({ loading: true, enroll: null }));

    expect(screen.getByTestId('admin-mfa-enroll-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-mfa-enroll-form')).not.toBeInTheDocument();
  });
});
