import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TradeTierFeeBadge } from '@/features/trading/order-ticket/trade-tier-fee-badge';
import { I18nProvider } from '@/product/i18n';

describe('TradeTierFeeBadge', () => {
  it('renders VIP badge label and tier fee HelpTip without numeric fee row', () => {
    render(
      <I18nProvider>
        <TradeTierFeeBadge tier="gold" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-tier-fee-badge')).toBeInTheDocument();
    expect(screen.getByTestId('trade-tier-fee-badge-label')).toHaveTextContent('Gold');
    expect(screen.getByTestId('trade-help-tip-tier_fee')).toBeInTheDocument();
    expect(screen.queryByTestId('spot-ticket-est-fee')).not.toBeInTheDocument();
    expect(screen.queryByTestId('futures-ticket-est-fee')).not.toBeInTheDocument();
  });
});
