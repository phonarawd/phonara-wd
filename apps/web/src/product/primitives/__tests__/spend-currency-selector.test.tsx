import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { SpendCurrencySelector } from '@/product/primitives/spend-currency-selector';

describe('SpendCurrencySelector', () => {
  it('renders unified spend currency label and toggles value', () => {
    const onChange = vi.fn();
    render(
      <I18nProvider>
        <SpendCurrencySelector
          value="USDT"
          onChange={onChange}
          testId="spend-currency-selector"
          currencyTestIdPrefix="spend-currency"
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('spend-currency-selector')).toBeInTheDocument();
    expect(screen.getByText('사용 코인')).toBeInTheDocument();
    expect(screen.getByTestId('spend-currency-usdt')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByTestId('spend-currency-phon'));
    expect(onChange).toHaveBeenCalledWith('PHON');
  });

  it('disables specific currencies', () => {
    render(
      <I18nProvider>
        <SpendCurrencySelector
          value="USDT"
          onChange={vi.fn()}
          currencyTestIdPrefix="margin-currency"
          disabledCurrencies={{ PHON: true }}
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('margin-currency-phon')).toBeDisabled();
    expect(screen.getByTestId('margin-currency-usdt')).not.toBeDisabled();
  });
});
