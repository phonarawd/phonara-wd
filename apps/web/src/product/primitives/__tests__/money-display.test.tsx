import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { resolveMoneyDisplayParts } from '@/product/primitives/lib/money-display-parts';

const FONTS_CSS = readFileSync(
  resolve(process.cwd(), 'apps/web/src/product/tokens/fonts.css'),
  'utf8',
);

function renderWithI18n(ui: ReactElement, locale: 'ko' | 'en' = 'ko') {
  window.localStorage.setItem('phonara.locale', locale);
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('fonts.css §25.1-bis locale typography', () => {
  it('defines ko/en html[lang] line-height, tracking, and heading weight tokens', () => {
    expect(FONTS_CSS).toContain("html[lang='ko']");
    expect(FONTS_CSS).toContain('--ds-line-height-body: var(--ds-line-height-body-ko)');
    expect(FONTS_CSS).toContain('--ds-line-height-body-ko: 1.625');
    expect(FONTS_CSS).toContain("html[lang='en']");
    expect(FONTS_CSS).toContain('--ds-tracking-heading: -0.005em');
    expect(FONTS_CSS).toContain('--ds-weight-heading-ko: 600');
    expect(FONTS_CSS).toContain('--ds-weight-heading-en: 700');
    expect(FONTS_CSS).toContain('font-weight: var(--ds-weight-heading)');
  });

  it('defines MoneyDisplay suffix group grammar', () => {
    expect(FONTS_CSS).toContain('.money-display__group');
    expect(FONTS_CSS).toContain('align-items: baseline');
    expect(FONTS_CSS).toContain('gap: 0.25em');
    expect(FONTS_CSS).toContain('white-space: nowrap');
  });
});

describe('resolveMoneyDisplayParts', () => {
  it('keeps currency suffix out of the amount string', () => {
    const parts = resolveMoneyDisplayParts('12345', 'KRW', { showCurrency: true });
    expect(parts.amountText).toBe('12,345');
    expect(parts.suffixKey).toBe('money.display.suffix.krw');
  });

  it('omits suffix key when showCurrency is false', () => {
    const parts = resolveMoneyDisplayParts('100.000000', 'PHON');
    expect(parts.amountText).toBe('100');
    expect(parts.suffixKey).toBeNull();
  });

  it('applies signed prefix without inline currency concat', () => {
    const parts = resolveMoneyDisplayParts('-50.000000', 'PHON', {
      signed: true,
      showCurrency: true,
    });
    expect(parts.amountText).toBe('-50');
    expect(parts.suffixKey).toBe('wallet.currency.phon');
  });
});

describe('MoneyDisplay', () => {
  it('renders ko KRW amount and suffix in separate spans', () => {
    const { container } = renderWithI18n(
      <MoneyDisplay amount="12345" currency="KRW" showCurrency />,
    );

    expect(screen.getByText('12,345')).toBeInTheDocument();
    expect(screen.getByText('원')).toBeInTheDocument();
    expect(container.querySelector('.money-display__group')).not.toBeNull();
    expect(container.querySelector('.money-display__suffix')).not.toBeNull();
    expect(container.querySelector('.money-display__amount')?.textContent).toBe('12,345');
  });

  it('renders en KRW suffix from i18n catalog', () => {
    renderWithI18n(<MoneyDisplay amount="12345" currency="KRW" showCurrency />, 'en');
    expect(screen.getByText('KRW')).toBeInTheDocument();
  });

  it('uses tabular-nums on the amount group and omits suffix when showCurrency is false', () => {
    const { container } = renderWithI18n(<MoneyDisplay amount="99.000000" currency="PHON" />);

    expect(container.querySelector('.money-display__group')).toBeNull();
    expect(container.querySelector('[data-money-display]')).toHaveClass('tabular-nums');
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('applies hero and signed market colors', () => {
    const { container } = renderWithI18n(
      <MoneyDisplay amount="10.000000" currency="PHON" signed size="hero" />,
    );

    const root = container.querySelector('[data-money-display]');
    expect(root).toHaveAttribute('data-sign', 'up');
    expect(root).toHaveClass('font-display');
    expect(root).toHaveClass('text-market-up');
  });

  it('marks Signal Pulse count-up when enabled (§34.15)', () => {
    const { container } = renderWithI18n(
      <MoneyDisplay amount="12345.000000" currency="PHON" showCurrency countUp />,
    );
    expect(container.querySelector('[data-money-display]')).toHaveAttribute(
      'data-count-up',
      'true',
    );
    expect(screen.getByText('12,345')).toBeInTheDocument();
  });
});
