import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { TradePhonBalanceBreakdown } from '@/product/surfaces/trade/trade-phon-balance-breakdown';

function renderBreakdown(props: Parameters<typeof TradePhonBalanceBreakdown>[0]) {
  return render(
    <I18nProvider>
      <TradePhonBalanceBreakdown {...props} />
    </I18nProvider>,
  );
}

describe('TradePhonBalanceBreakdown', () => {
  it('shows bonus/real split when breakdown display values exist', () => {
    renderBreakdown({
      phonBonusAvailableDisplay: '2345.000000',
      phonRealAvailableDisplay: '10000.000000',
      phonAvail: '12345.000000',
      t: (key) => String(key),
    });

    expect(screen.getByTestId('trade-phon-real-available')).toBeInTheDocument();
    expect(screen.getByTestId('trade-phon-bonus-available')).toBeInTheDocument();
    expect(screen.getByText('wallet.phon.realLabel')).toBeInTheDocument();
    expect(screen.getByText('wallet.phon.bonusLabel')).toBeInTheDocument();
  });

  it('falls back to aggregate PHON avail when breakdown is missing', () => {
    renderBreakdown({
      phonBonusAvailableDisplay: null,
      phonRealAvailableDisplay: null,
      phonAvail: '500.000000',
      t: (key) => String(key),
    });

    expect(screen.getByTestId('trade-phon-balance-breakdown')).toHaveTextContent('500');
    expect(screen.queryByTestId('trade-phon-bonus-available')).not.toBeInTheDocument();
  });
});
