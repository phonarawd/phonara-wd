import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { translate } from '@phonara/i18n';

import { I18nProvider } from '@/product/i18n';
import { BetFirstVisitEducationSheet } from '@/product/shell/bet-first-visit-education-sheet';

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
  };
});

describe('BetFirstVisitEducationSheet §32.5', () => {
  it('shows slip, RG, and fairness risk copy', () => {
    render(
      <I18nProvider>
        <BetFirstVisitEducationSheet open onDismiss={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('bet-first-visit-education-sheet')).toBeTruthy();
    expect(screen.getByText(translate('ko', 'bet.education.title'))).toBeTruthy();
    expect(screen.getByText(translate('ko', 'bet.education.slip.title'))).toBeTruthy();
    expect(screen.getByText(translate('ko', 'bet.education.rg.title'))).toBeTruthy();
    expect(screen.getByText(translate('ko', 'bet.education.fairness.title'))).toBeTruthy();
  });

  it('links to RG policy and fairness verifier', () => {
    render(
      <I18nProvider>
        <BetFirstVisitEducationSheet open onDismiss={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('bet-education-rg-link')).toHaveAttribute(
      'href',
      '/legal/responsible-gaming',
    );
    expect(screen.getByTestId('bet-education-fairness-link')).toHaveAttribute(
      'href',
      '/casino/fairness',
    );
  });

  it('calls onDismiss when acknowledge button is clicked', () => {
    const onDismiss = vi.fn();

    render(
      <I18nProvider>
        <BetFirstVisitEducationSheet open onDismiss={onDismiss} />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('bet-education-dismiss'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
