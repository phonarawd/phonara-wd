import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { translate } from '@phonara/i18n';

import { I18nProvider } from '@/product/i18n';
import { TradeFirstVisitEducationSheet } from '@/product/surfaces/trade/trade-first-visit-education-sheet';

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

describe('TradeFirstVisitEducationSheet §32.5', () => {
  it('shows fee, liquidation, and RG risk copy', () => {
    render(
      <I18nProvider>
        <TradeFirstVisitEducationSheet open onDismiss={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-first-visit-education-sheet')).toBeTruthy();
    expect(screen.getByText(translate('ko', 'trade.education.title'))).toBeTruthy();
    expect(screen.getByText(translate('ko', 'trade.education.fee.title'))).toBeTruthy();
    expect(screen.getByText(translate('ko', 'trade.education.liquidation.title'))).toBeTruthy();
    expect(screen.getByText(translate('ko', 'trade.education.rg.title'))).toBeTruthy();
  });

  it('links to risk disclosure and RG policy', () => {
    render(
      <I18nProvider>
        <TradeFirstVisitEducationSheet open onDismiss={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-education-risk-link')).toHaveAttribute(
      'href',
      '/legal/risk-disclosure',
    );
    expect(screen.getByTestId('trade-education-rg-link')).toHaveAttribute(
      'href',
      '/legal/responsible-gaming',
    );
  });

  it('calls onDismiss when acknowledge button is clicked', () => {
    const onDismiss = vi.fn();

    render(
      <I18nProvider>
        <TradeFirstVisitEducationSheet open onDismiss={onDismiss} />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('trade-education-dismiss'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
