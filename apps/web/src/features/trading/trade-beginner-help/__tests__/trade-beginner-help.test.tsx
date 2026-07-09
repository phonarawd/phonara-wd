import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import { TradeHowItWorksPanel } from '@/features/trading/trade-beginner-help/trade-how-it-works-panel';
import { I18nProvider } from '@/product/i18n';

function renderWithI18n(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('trade-beginner-help §13.1.3', () => {
  it('mounts spot HowItWorks from contract slot', () => {
    renderWithI18n(<TradeHowItWorksPanel slotId="spot-desk" />);
    expect(screen.getByTestId('trade-how-it-works-spot-desk')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '현물 거래, 이렇게 해요' })).toBeInTheDocument();
  });

  it('mounts HelpTip from contract term', () => {
    renderWithI18n(<TradeHelpTip termId="order_book" />);
    expect(screen.getByTestId('trade-help-tip-order_book')).toBeInTheDocument();
    expect(screen.getByText('호가창')).toBeInTheDocument();
  });
});
