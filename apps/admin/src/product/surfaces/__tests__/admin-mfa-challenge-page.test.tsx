import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminMfaChallengePageControllerView } from '@/hooks/use-admin-mfa-challenge-page-controller';
import { I18nProvider } from '@/product/i18n';
import { AdminMfaChallengePage } from '@/product/surfaces/admin-mfa-challenge-page';

const useAdminMfaChallengePageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-admin-mfa-challenge-page-controller', () => ({
  useAdminMfaChallengePageController: useAdminMfaChallengePageControllerMock,
}));

function makeEngine(
  overrides: Partial<AdminMfaChallengePageControllerView> = {},
): AdminMfaChallengePageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    forbidden: false,
    setupError: false,
    missingFactor: false,
    code: '123456',
    setCode: vi.fn(),
    isBusy: false,
    verifyError: false,
    handleVerifyChallenge: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderPage(engine: AdminMfaChallengePageControllerView) {
  useAdminMfaChallengePageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <AdminMfaChallengePage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useAdminMfaChallengePageControllerMock.mockReset();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('AdminMfaChallengePage', () => {
  it('renders canonical MFA challenge form with code input', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('admin-mfa-challenge-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-mfa-challenge-form')).toBeInTheDocument();
    expect(screen.getByTestId('admin-mfa-challenge-code')).toHaveAccessibleName('인증 코드');
    expect(screen.getByTestId('admin-mfa-challenge-submit')).toHaveTextContent('확인');
  });

  it('wires verify submit to controller handler', () => {
    const engine = makeEngine();
    renderPage(engine);

    fireEvent.submit(screen.getByTestId('admin-mfa-challenge-form'));
    expect(engine.handleVerifyChallenge).toHaveBeenCalledTimes(1);
  });

  it('shows verify error when controller reports verifyError', () => {
    renderPage(makeEngine({ verifyError: true }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      '인증 코드가 올바르지 않습니다. 다시 시도하세요.',
    );
  });

  it('renders setup error when MFA status cannot load', () => {
    renderPage(makeEngine({ setupError: true }));

    expect(
      screen.getByText('2단계 인증 상태를 확인할 수 없습니다. 다시 로그인하세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('admin-mfa-challenge-form')).not.toBeInTheDocument();
  });

  it('renders missing-factor guidance when no enrolled factor', () => {
    renderPage(makeEngine({ missingFactor: true }));

    expect(
      screen.getByText('등록된 2단계 인증이 없습니다. 등록 화면으로 이동하세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('admin-mfa-challenge-form')).not.toBeInTheDocument();
  });

  it('renders forbidden state for non-admin sessions', () => {
    renderPage(makeEngine({ forbidden: true }));

    expect(screen.getByTestId('admin-forbidden')).toBeInTheDocument();
    expect(screen.getByText('관리자 권한이 없습니다.')).toBeInTheDocument();
  });

  it('disables submit until a 6-digit code is entered', () => {
    renderPage(makeEngine({ code: '' }));

    expect(screen.getByTestId('admin-mfa-challenge-submit')).toBeDisabled();
  });

  it('renders loading shell while challenge initializes', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('admin-mfa-challenge-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-mfa-challenge-form')).not.toBeInTheDocument();
  });
});
