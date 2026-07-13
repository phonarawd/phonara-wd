import axe from 'axe-core';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LoginPageControllerView } from '@/features/auth/use-login-page-controller';
import type { SignupPageControllerView } from '@/features/auth/use-signup-page-controller';
import { AUTH_LANDING_VISUAL_VIEWPORT_WIDTHS } from '@/domain/auth-landing-visual-signoff-display-contract';
import { I18nProvider } from '@/product/i18n';
import { AuthEntryLayout } from '@/product/surfaces/login/auth-entry-layout';
import { LoginForm } from '@/product/surfaces/login/login-form';
import { SignupForm } from '@/product/surfaces/signup/signup-form';
import { LandingPage } from '@/product/surfaces/landing/landing-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useSearch: () => ({}),
  useLocation: () => ({ pathname: '/', searchStr: '' }),
}));

vi.mock('@/features/landing/use-landing-live-proof', () => ({
  useLandingLiveProof: () => ({
    proofMode: 'presentation',
    proof: {
      testimonials: 'hidden',
      stats: 'hidden',
      walletPreview: 'presentation',
      withdrawalMomentum: 'hidden',
      withdrawalProof: 'hidden',
      ambientSocial: 'hidden',
    },
    withdrawalMomentumCount: null,
    liveMemberCount: null,
    isLoading: false,
    isLive: false,
  }),
}));

vi.mock('@/features/earn/use-earn-fiat-hint', () => ({
  useEarnFiatHint: () => ({
    targetFiat: 'KRW',
    hintFor: () => ({
      displayOnly: true,
      disabled: true,
      formattedHint: '',
      targetFiat: 'KRW',
      asOf: '',
      stale: false,
      sourceCurrency: 'PHON',
    }),
    showDisclaimer: false,
  }),
}));

vi.mock('motion/react', () => ({
  motion: {
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
}));

function makeLoginEngine(
  overrides: Partial<LoginPageControllerView> = {},
): LoginPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    email: 'user@example.com',
    password: 'password-1',
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    isBusy: false,
    errorKey: null,
    magicSent: false,
    handlePasswordLogin: vi.fn(async () => undefined),
    handleMagicLink: vi.fn(async () => undefined),
    handlePasskeyLogin: vi.fn(async () => undefined),
    ...overrides,
  };
}

function makeSignupEngine(
  overrides: Partial<SignupPageControllerView> = {},
): SignupPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    email: 'user@example.com',
    password: 'Aa123456!',
    confirm: 'Aa123456!',
    referralCode: '',
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    setConfirm: vi.fn(),
    setReferralCode: vi.fn(),
    isBusy: false,
    verifySent: false,
    pendingEmail: '',
    resendSent: false,
    resendBusy: false,
    resendErrorKey: null,
    resendVerificationEmail: vi.fn(async () => undefined),
    errorKey: null,
    handleSubmit: vi.fn(async () => undefined),
    ...overrides,
  };
}

async function expectAxeCriticalZero(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('auth-landing visual sign-off §20.12', () => {
  it.each(AUTH_LANDING_VISUAL_VIEWPORT_WIDTHS)(
    'renders landing at %ipx viewport without layout crash',
    (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      render(
        <I18nProvider>
          <LandingPage />
        </I18nProvider>,
      );

      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.getByTestId('landing-hero-cta')).toBeInTheDocument();
      expect(screen.queryByTestId('landing-hero-mockup')).not.toBeInTheDocument();
    },
  );

  it('landing has axe critical 0', async () => {
    const { container } = render(
      <I18nProvider>
        <LandingPage />
      </I18nProvider>,
    );

    await expectAxeCriticalZero(container);
  });

  it('auth entry layout has axe critical 0', async () => {
    const { container } = render(
      <I18nProvider>
        <AuthEntryLayout title="Login" subtitle="Sign in to continue">
          <LoginForm
            engine={makeLoginEngine()}
            onSubmit={vi.fn()}
            rememberMe={false}
            onRememberMeChange={vi.fn()}
          />
        </AuthEntryLayout>
      </I18nProvider>,
    );

    await expectAxeCriticalZero(container);
  });

  it('login dead controls wire engine handlers', () => {
    const engine = makeLoginEngine();
    const onSubmit = vi.fn();

    render(
      <I18nProvider>
        <LoginForm
          engine={engine}
          onSubmit={onSubmit}
          rememberMe={false}
          onRememberMeChange={vi.fn()}
        />
      </I18nProvider>,
    );

    fireEvent.submit(screen.getByTestId('login-submit').closest('form') as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('login-passkey'));
    expect(engine.handlePasskeyLogin).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('login-magic-link'));
    expect(engine.handleMagicLink).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('link', { name: '비밀번호를 잊으셨나요?' })).toHaveAttribute(
      'href',
      '/reset-password',
    );
  });

  it('signup dead controls wire engine handlers', () => {
    const engine = makeSignupEngine();
    const onSubmit = vi.fn();

    render(
      <I18nProvider>
        <SignupForm engine={engine} onSubmit={onSubmit} />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('switch', { name: '전체 동의' }));
    fireEvent.submit(screen.getByTestId('signup-submit').closest('form') as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
