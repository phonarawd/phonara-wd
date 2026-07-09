import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { TradeDeskFetchErrorBanner } from '@/product/surfaces/trade/trade-desk-fetch-error-banner';

describe('TradeDeskFetchErrorBanner', () => {
  it('renders nothing when all fetch flags are clear', () => {
    render(
      <I18nProvider>
        <TradeDeskFetchErrorBanner
          pricesError={false}
          marketsError={false}
          spotMarketsError={false}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.queryByTestId('trade-desk-fetch-error')).toBeNull();
  });

  it('shows load error copy and retry when prices fetch fails', () => {
    const onRetry = vi.fn();
    render(
      <I18nProvider>
        <TradeDeskFetchErrorBanner
          pricesError
          marketsError={false}
          spotMarketsError={false}
          onRetry={onRetry}
        />
      </I18nProvider>,
    );

    const banner = screen.getByTestId('trade-desk-fetch-error');
    expect(banner).toHaveTextContent('시장 데이터를 불러오지 못했습니다. 다시 시도해 주세요.');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
