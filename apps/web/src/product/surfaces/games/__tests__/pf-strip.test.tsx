import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { I18nProvider } from '@/product/i18n';
import { PfStrip } from '@/product/surfaces/games/pf-strip';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: ReactNode;
    className?: string;
    'data-testid'?: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('PfStrip (phase1a-trust-layer)', () => {
  it('renders hash/seed and a verify link to /casino/fairness on every game route', () => {
    render(
      <I18nProvider>
        <PfStrip serverSeedHash="hash-abc" clientSeed="seed-xyz" verificationMatch={null} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('casino-pf-strip')).toBeInTheDocument();
    expect(screen.getByTestId('casino-pf-hash')).toHaveTextContent('hash-abc');
    expect(screen.getByTestId('casino-pf-client-seed')).toHaveTextContent('seed-xyz');

    const verifyLink = screen.getByTestId('casino-pf-verify-link');
    expect(verifyLink).toHaveAttribute('href', '/casino/fairness');
    expect(verifyLink).toHaveTextContent('공정성 검증');
  });

  it('shows the verify link regardless of hash/verification state', () => {
    render(
      <I18nProvider>
        <PfStrip serverSeedHash={null} clientSeed="" verificationMatch={false} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('casino-pf-hash-status')).toHaveTextContent('준비 필요');
    expect(screen.getByTestId('casino-pf-verify-status')).toHaveTextContent('검증 불일치');
    expect(screen.getByTestId('casino-pf-verify-link')).toHaveAttribute('href', '/casino/fairness');
  });
});
