import { fireEvent, render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { LandingPage } from '@/product/surfaces/landing/landing-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useSearch: () => ({
    utm_source: 'meta',
    utm_campaign: 'launch',
  }),
  useLocation: () => ({
    pathname: '/',
    searchStr: '?utm_source=meta&utm_campaign=launch',
  }),
}));

vi.mock('@/features/landing/use-landing-live-proof', () => ({
  useLandingLiveProof: () => ({
    proofMode: 'presentation',
    proof: {
      testimonials: 'presentation',
      stats: 'presentation',
      walletPreview: 'presentation',
      withdrawalMomentum: 'hidden',
    },
    withdrawalMomentumCount: null,
    liveMemberCount: null,
    isLoading: false,
    isLive: false,
  }),
}));

vi.mock('@/product/primitives/lib/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
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
}));

function renderLandingPage() {
  return render(
    <I18nProvider>
      <LandingPage />
    </I18nProvider>,
  );
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

describe('LandingPage', () => {
  it('renders hero with single primary CTA to signup preserving utm params', () => {
    renderLandingPage();

    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    expect(screen.getByTestId('landing-hero-cta')).toHaveAttribute(
      'href',
      '/signup?utm_source=meta&utm_campaign=launch',
    );
    expect(screen.getByTestId('landing-hero-cta')).toHaveTextContent('지금 시작하기');
    expect(screen.getByText('가입은 무료 · 30초면 시작')).toBeInTheDocument();
    expect(screen.queryByTestId('landing-hero-mockup')).not.toBeInTheDocument();
  });

  it('renders CVR fold modules below hero before proof stats', () => {
    renderLandingPage();

    expect(screen.getByTestId('landing-why-strip')).toBeInTheDocument();
    expect(screen.getByText('가입 → 미션 → 적립 → 출금')).toBeInTheDocument();
    expect(screen.getByText('복잡한 투자 없이 시작할 수 있습니다.')).toBeInTheDocument();

    expect(screen.getByTestId('landing-differentiators')).toBeInTheDocument();
    expect(screen.getByText('출석')).toBeInTheDocument();
    expect(screen.getByText('퀴즈')).toBeInTheDocument();
    expect(screen.getByText('언제든 출금')).toBeInTheDocument();

    expect(screen.getByTestId('landing-mission-preview')).toBeInTheDocument();
    expect(screen.getByTestId('landing-mission-preview-featured')).toBeInTheDocument();
    expect(screen.getByText('3분')).toBeInTheDocument();
    expect(screen.getByTestId('landing-mission-preview-cta')).toHaveAttribute(
      'href',
      '/signup?utm_source=meta&utm_campaign=launch',
    );

    expect(screen.getByTestId('landing-wallet-preview')).toBeInTheDocument();
    expect(screen.getByText('내 PHON')).toBeInTheDocument();
    expect(screen.getByTestId('landing-cumulative-stats')).toBeInTheDocument();
  });

  it('renders header lockup with mono mark and lowercase wordmark', () => {
    renderLandingPage();

    expect(screen.getByTestId('landing-header-brand-mark')).toHaveAttribute(
      'data-brand-asset',
      '/brand/logo-mono.svg',
    );
    expect(screen.getByTestId('landing-header-wordmark')).toHaveTextContent('phonara');
  });

  it('renders §25.9 sculpted 3D brand hero slot instead of CSS fake-phone mockup', () => {
    renderLandingPage();

    const heroBrand = screen.getByTestId('landing-hero-brand');
    expect(heroBrand).toBeInTheDocument();
    expect(heroBrand).toHaveAttribute('data-brand-asset', '/brand/logo.svg');
    expect(heroBrand).toHaveAttribute('src', '/brand/logo.svg');
  });

  it('shows cold-start proof without zero-state counters', () => {
    renderLandingPage();

    expect(screen.getByTestId('landing-proof')).toBeInTheDocument();
    expect(screen.getByText(/2,900 PHON/)).toBeInTheDocument();
    expect(screen.getByTestId('landing-cumulative-stats')).toHaveTextContent(/1,0\d{2},\d{3}명/);
    expect(screen.getByTestId('landing-signup-momentum')).toBeInTheDocument();
    expect(screen.getByText(/가입을 진행 중/)).toBeInTheDocument();
    expect(screen.getByTestId('landing-activity-ticker-static')).toBeInTheDocument();
    expect(screen.queryByText('누적 가입자 0')).not.toBeInTheDocument();
    expect(screen.queryByText(/^0명$/)).not.toBeInTheDocument();
  });

  it('includes working legal footer links and age notice', () => {
    renderLandingPage();

    expect(screen.getByTestId('landing-footer-terms')).toHaveAttribute('href', '/legal/terms');
    expect(screen.getByTestId('landing-footer-privacy')).toHaveAttribute('href', '/legal/privacy');
    expect(screen.getByTestId('landing-footer-rg')).toHaveAttribute(
      'href',
      '/legal/responsible-gaming',
    );
    expect(screen.getByTestId('landing-footer-affiliate')).toHaveAttribute(
      'href',
      '/legal/affiliate',
    );
    expect(screen.getByTestId('landing-footer-cookies')).toHaveAttribute('href', '/legal/cookies');
    expect(screen.getByTestId('landing-footer-faq')).toHaveAttribute('href', '/support/faq');
    expect(screen.getByTestId('landing-footer-feedback')).toHaveAttribute('href', '/feedback');
    expect(screen.getByTestId('landing-footer-support')).toHaveAttribute('href', '/support');
    expect(screen.getByText('만 19세 이상만 가입할 수 있습니다.')).toBeInTheDocument();
  });

  it('renders side-hustle how-it-works and FAQ without casino copy in hero', () => {
    renderLandingPage();

    expect(screen.getByTestId('landing-how')).toBeInTheDocument();
    expect(screen.getByText('1. Earn')).toBeInTheDocument();
    expect(screen.getByTestId('landing-faq')).toBeInTheDocument();
    expect(screen.getByText('💰 정말 돈을 받을 수 있나요?')).toBeInTheDocument();
    expect(screen.queryByText('언제 출금할 수 있나요?')).not.toBeInTheDocument();
    expect(screen.getByTestId('landing-withdrawal-proof')).toBeInTheDocument();
    expect(screen.getByTestId('landing-testimonials')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '💰 정말 돈을 받을 수 있나요?' }));
    expect(screen.getByText(/미션을 완료하고 조건을 충족하면 보상이 적립되며/)).toBeInTheDocument();

    expect(screen.getByTestId('landing-final-cta-button')).toHaveAttribute(
      'href',
      '/signup?utm_source=meta&utm_campaign=launch',
    );
    expect(screen.getByTestId('landing-final-cta-button')).toHaveTextContent('무료로 시작하기');
    expect(screen.queryByText(/카지노|베팅/i)).not.toBeInTheDocument();
  });
});
