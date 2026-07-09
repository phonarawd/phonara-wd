import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { TradeMarketStatusBanner } from '@/product/surfaces/trade/trade-market-status-banner';

const usePlatformGatesMock = vi.hoisted(() => vi.fn());
const usePricesMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-platform-gates', () => ({
  usePlatformGates: usePlatformGatesMock,
}));

vi.mock('@/hooks/use-trading', () => ({
  usePrices: usePricesMock,
}));

describe('TradeMarketStatusBanner', () => {
  it('renders oracle-only banner for healthy PHON markets', () => {
    usePlatformGatesMock.mockReturnValue({
      systemHalted: false,
      spotBlocked: false,
      futuresBlocked: false,
    });
    usePricesMock.mockReturnValue({
      isMarketHalted: () => false,
    });

    render(
      <I18nProvider>
        <TradeMarketStatusBanner desk="spot" marketSymbol="PHON_USDT" symbolStale={false} />
      </I18nProvider>,
    );

    const banner = screen.getByTestId('trade-market-status-banner');
    expect(banner).toHaveAttribute('data-status-kind', 'oracleOnly');
    expect(screen.getByTestId('trade-market-status-banner-title')).toHaveTextContent(
      '오라클 전용 시세',
    );
  });

  it('renders nothing when non-PHON market status is healthy', () => {
    usePlatformGatesMock.mockReturnValue({
      systemHalted: false,
      spotBlocked: false,
      futuresBlocked: false,
    });
    usePricesMock.mockReturnValue({
      isMarketHalted: () => false,
    });

    render(
      <I18nProvider>
        <TradeMarketStatusBanner desk="spot" marketSymbol="BTC_USDT" symbolStale={false} />
      </I18nProvider>,
    );

    expect(screen.queryByTestId('trade-market-status-banner')).toBeNull();
  });

  it('renders stale banner below desk header contract mount', () => {
    usePlatformGatesMock.mockReturnValue({
      systemHalted: false,
      spotBlocked: false,
      futuresBlocked: false,
    });
    usePricesMock.mockReturnValue({
      isMarketHalted: () => false,
    });

    render(
      <I18nProvider>
        <TradeMarketStatusBanner desk="spot" marketSymbol="PHON_USDT" symbolStale />
      </I18nProvider>,
    );

    const banner = screen.getByTestId('trade-market-status-banner');
    expect(banner).toHaveAttribute('data-status-kind', 'stale');
    expect(screen.getByTestId('trade-market-status-banner-title')).toHaveTextContent('가격 지연');
  });

  it('renders kill-switch banner for futures maintenance', () => {
    usePlatformGatesMock.mockReturnValue({
      systemHalted: false,
      spotBlocked: false,
      futuresBlocked: true,
    });
    usePricesMock.mockReturnValue({
      isMarketHalted: () => false,
    });

    render(
      <I18nProvider>
        <TradeMarketStatusBanner desk="futures" marketSymbol="BTCUSDT-SIM" symbolStale={false} />
      </I18nProvider>,
    );

    const banner = screen.getByTestId('trade-market-status-banner');
    expect(banner).toHaveAttribute('data-status-kind', 'kill');
    expect(screen.getByTestId('trade-market-status-banner-description')).toHaveTextContent(
      '점검 중에는 선물 주문을 보낼 수 없습니다.',
    );
  });

  it('renders circuit halt banner for halted market symbol', () => {
    usePlatformGatesMock.mockReturnValue({
      systemHalted: false,
      spotBlocked: false,
      futuresBlocked: false,
    });
    usePricesMock.mockReturnValue({
      isMarketHalted: (symbol: string | null | undefined) => symbol === 'BTCUSDT-SIM',
    });

    render(
      <I18nProvider>
        <TradeMarketStatusBanner desk="futures" marketSymbol="BTCUSDT-SIM" symbolStale={false} />
      </I18nProvider>,
    );

    const banner = screen.getByTestId('trade-market-status-banner');
    expect(banner).toHaveAttribute('data-status-kind', 'circuit');
    expect(screen.getByTestId('trade-market-status-banner-title')).toHaveTextContent(
      '마켓 일시 중단',
    );
  });

  it('renders realtime disconnect banner when channel is lost', () => {
    usePlatformGatesMock.mockReturnValue({
      systemHalted: false,
      spotBlocked: false,
      futuresBlocked: false,
    });
    usePricesMock.mockReturnValue({
      isMarketHalted: () => false,
    });

    render(
      <I18nProvider>
        <TradeMarketStatusBanner
          desk="spot"
          marketSymbol="PHON_USDT"
          symbolStale={false}
          realtimeDisconnected
        />
      </I18nProvider>,
    );

    const banner = screen.getByTestId('trade-market-status-banner');
    expect(banner).toHaveAttribute('data-status-kind', 'realtimeDisconnected');
    expect(screen.getByTestId('trade-market-status-banner-title')).toHaveTextContent(
      '실시간 연결 끊김',
    );
  });
});
