import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dismissBetFirstVisitEducation } from '@/features/responsible-gaming/bet-first-visit-education';
import { I18nProvider } from '@/product/i18n';

import { BetFirstVisitEducationGate } from '../bet-first-visit-education-gate';

let mockPathname = '/sports';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      className?: string;
      'data-testid'?: string;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useRouterState: (opts?: { select?: (s: { location: { pathname: string } }) => unknown }) =>
      opts?.select?.({ location: { pathname: mockPathname } }) ?? {
        location: { pathname: mockPathname },
      },
  };
});

describe('BetFirstVisitEducationGate §32.5', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockPathname = '/sports';
  });

  it('shows sheet on sports routes when not dismissed', () => {
    render(
      <I18nProvider>
        <BetFirstVisitEducationGate />
      </I18nProvider>,
    );
    expect(screen.getByTestId('bet-first-visit-education-sheet')).toBeTruthy();
  });

  it('shows sheet on casino and games routes', () => {
    mockPathname = '/casino';
    const { rerender } = render(
      <I18nProvider>
        <BetFirstVisitEducationGate />
      </I18nProvider>,
    );
    expect(screen.getByTestId('bet-first-visit-education-sheet')).toBeTruthy();

    mockPathname = '/games/crash';
    rerender(
      <I18nProvider>
        <BetFirstVisitEducationGate />
      </I18nProvider>,
    );
    expect(screen.getByTestId('bet-first-visit-education-sheet')).toBeTruthy();
  });

  it('hides on non-bet routes', () => {
    mockPathname = '/trade';
    render(
      <I18nProvider>
        <BetFirstVisitEducationGate />
      </I18nProvider>,
    );
    expect(screen.queryByTestId('bet-first-visit-education-sheet')).toBeNull();
  });

  it('hides after localStorage dismiss', () => {
    dismissBetFirstVisitEducation();
    render(
      <I18nProvider>
        <BetFirstVisitEducationGate />
      </I18nProvider>,
    );
    expect(screen.queryByTestId('bet-first-visit-education-sheet')).toBeNull();
  });
});
