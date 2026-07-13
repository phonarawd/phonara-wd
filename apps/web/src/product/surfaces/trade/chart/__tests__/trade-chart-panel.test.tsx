import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ORACLE_DISPLAY_INTERVALS } from '@/features/trading/display-chart/display-feed-contract';
import { I18nProvider } from '@/product/i18n';
import { TradeChartPanel } from '@/product/surfaces/trade/chart/trade-chart-panel';

const mockFitContent = vi.fn();
const mockSyncLayout = vi.fn();
const mockUseExchangeLiveCandles = vi.fn();

vi.mock('@/features/trading/display-chart/use-exchange-live-candles', () => ({
  useExchangeLiveCandles: (...args: unknown[]) => mockUseExchangeLiveCandles(...args),
}));

vi.mock('@/product/surfaces/trade/chart/trade-chart', () => ({
  TradeChart: ({
    onChartReady,
    seriesMode,
    overlays,
    oracleMarkPrice,
    liquidationPrice,
  }: {
    onChartReady?: (api: { fitContent: () => void; syncLayout: () => void }) => void;
    seriesMode?: string;
    overlays?: { ma7: boolean; ema21: boolean; rsi: boolean; bb: boolean; vol: boolean };
    oracleMarkPrice?: string | null;
    liquidationPrice?: string | null;
  }) => {
    onChartReady?.({ fitContent: mockFitContent, syncLayout: mockSyncLayout });
    return (
      <div
        data-testid="trade-lightweight-chart-mock"
        data-series-mode={seriesMode}
        data-ma7={String(overlays?.ma7)}
        data-ema21={String(overlays?.ema21)}
        data-oracle={oracleMarkPrice ?? ''}
        data-liq={liquidationPrice ?? ''}
      />
    );
  },
}));

const sampleCandles = [
  {
    time: 1_700_000_000,
    open: '100',
    high: '101',
    low: '99',
    close: '100.5',
    volume: '10',
  },
  {
    time: 1_700_000_060,
    open: '100.5',
    high: '102',
    low: '100',
    close: '101',
    volume: '8',
  },
];

describe('TradeChartPanel', () => {
  beforeEach(() => {
    mockFitContent.mockClear();
    mockSyncLayout.mockClear();
    mockUseExchangeLiveCandles.mockReturnValue({
      candles: sampleCandles,
      loading: false,
      error: false,
      refetch: vi.fn(),
      connected: true,
    });
  });

  it('renders interval controls for oracle display intervals', () => {
    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="BTCUSDT-SIM" />
      </I18nProvider>,
    );

    for (const interval of ORACLE_DISPLAY_INTERVALS) {
      expect(screen.getByRole('button', { name: interval })).toBeInTheDocument();
    }
  });

  it('wires live candles hook with selected interval', () => {
    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="BTCUSDT-SIM" />
      </I18nProvider>,
    );

    expect(mockUseExchangeLiveCandles).toHaveBeenCalledWith('BTCUSDT-SIM', '1m');
    fireEvent.click(screen.getByRole('button', { name: '1h' }));
    expect(mockUseExchangeLiveCandles).toHaveBeenLastCalledWith('BTCUSDT-SIM', '1h');
  });

  it('shows display-only settlement disclosure', () => {
    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="PHON_USDT" />
      </I18nProvider>,
    );

    expect(
      screen.getByText(
        '차트는 표시용 실시간 피드입니다. 주문·정산은 서버 오라클 가격을 사용합니다.',
      ),
    ).toBeInTheDocument();
  });

  it('shows oracle mark, retry, and oracle disclosure in empty state (PR-1A)', () => {
    mockUseExchangeLiveCandles.mockReturnValue({
      candles: [],
      loading: false,
      error: false,
      refetch: vi.fn(),
      connected: false,
    });

    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="PHON_USDT" oracleMarkPrice="0.012345" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-chart-empty')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-empty-oracle-mark')).toHaveTextContent('0.012345');
    expect(screen.getByTestId('trade-chart-empty-retry')).toBeInTheDocument();
    expect(screen.getByText('서버 오라클 기준 현재가 라인입니다.')).toBeInTheDocument();
  });

  it('ZA-12: PHON empty copy names oracle-seed-wait, not a generic feed message', () => {
    mockUseExchangeLiveCandles.mockReturnValue({
      candles: [],
      loading: false,
      error: false,
      refetch: vi.fn(),
      connected: false,
    });

    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="PHON_USDT" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-chart-empty')).toHaveAttribute(
      'data-empty-reason',
      'oracle-awaiting-seed',
    );
    expect(screen.getByText('오라클 캔들 대기 중')).toBeInTheDocument();
  });

  it('ZA-12: exchange-pair empty copy names the feed outage, distinct from PHON copy', () => {
    mockUseExchangeLiveCandles.mockReturnValue({
      candles: [],
      loading: false,
      error: false,
      refetch: vi.fn(),
      connected: false,
    });

    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="BTC_USDT" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-chart-empty')).toHaveAttribute(
      'data-empty-reason',
      'feed-unavailable',
    );
    expect(screen.getByText('시세 피드가 일시적으로 안 보여요')).toBeInTheDocument();
  });

  it('calls syncLayout when reset layout is clicked', () => {
    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="BTCUSDT-SIM" />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('trade-chart-reset-layout'));
    expect(mockSyncLayout).toHaveBeenCalledTimes(1);
  });

  it('renders overlay controls and toggles candle/line mode', () => {
    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="BTCUSDT-SIM" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-chart-type-candles')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-type-line')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-overlay-vol')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-advanced-overlays-toggle')).toBeInTheDocument();
    expect(screen.queryByTestId('trade-chart-overlay-ma7')).not.toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-draw-horizontal')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-draw-trend')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-fullscreen')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('trade-chart-type-line'));
    expect(screen.getByTestId('trade-lightweight-chart-mock')).toHaveAttribute(
      'data-series-mode',
      'line',
    );
  });

  it('defaults MA7/EMA21 overlays off and exposes them in advanced section', () => {
    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="BTCUSDT-SIM" />
      </I18nProvider>,
    );

    expect(screen.getByTestId('trade-lightweight-chart-mock')).toHaveAttribute('data-ma7', 'false');
    expect(screen.getByTestId('trade-lightweight-chart-mock')).toHaveAttribute(
      'data-ema21',
      'false',
    );

    fireEvent.click(screen.getByTestId('trade-chart-advanced-overlays-toggle'));
    expect(screen.getByTestId('trade-chart-advanced-overlays')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-overlay-ma7')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-overlay-ema21')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-overlay-rsi')).toBeInTheDocument();
    expect(screen.getByTestId('trade-chart-overlay-bb')).toBeInTheDocument();
  });

  it('passes oracle and liquidation display prices to chart renderer', () => {
    render(
      <I18nProvider>
        <TradeChartPanel
          marketSymbol="BTCUSDT-SIM"
          oracleMarkPrice="65000.12"
          liquidationPrice="58000.00"
        />
      </I18nProvider>,
    );

    const chart = screen.getByTestId('trade-lightweight-chart-mock');
    expect(chart).toHaveAttribute('data-oracle', '65000.12');
    expect(chart).toHaveAttribute('data-liq', '58000.00');
  });

  it('shows trend drawing hint when trend tool is active', () => {
    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="BTCUSDT-SIM" />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('trade-chart-draw-trend'));
    expect(screen.getByTestId('trade-chart-draw-trend-hint')).toHaveTextContent(
      '시작점을 클릭하세요',
    );
  });

  it('toggles MA7 overlay on from advanced section', () => {
    render(
      <I18nProvider>
        <TradeChartPanel marketSymbol="BTCUSDT-SIM" />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId('trade-chart-advanced-overlays-toggle'));
    fireEvent.click(screen.getByTestId('trade-chart-overlay-ma7'));
    expect(screen.getByTestId('trade-lightweight-chart-mock')).toHaveAttribute('data-ma7', 'true');
  });

  describe('PR-1B · spot chart mount verify (T0-e)', () => {
    it('PHON_USDT mounts chart when oracle RPC returns >= 2 candles', () => {
      mockUseExchangeLiveCandles.mockReturnValue({
        candles: sampleCandles,
        loading: false,
        error: false,
        refetch: vi.fn(),
        connected: false,
      });

      render(
        <I18nProvider>
          <TradeChartPanel marketSymbol="PHON_USDT" oracleMarkPrice="0.012345" />
        </I18nProvider>,
      );

      expect(screen.getByTestId('trade-lightweight-chart-mock')).toBeInTheDocument();
      expect(screen.queryByTestId('trade-chart-empty')).not.toBeInTheDocument();
    });

    it('BTC_USDT mounts chart when live or oracle fallback has >= 2 candles', () => {
      mockUseExchangeLiveCandles.mockReturnValue({
        candles: sampleCandles,
        loading: false,
        error: false,
        refetch: vi.fn(),
        connected: true,
      });

      render(
        <I18nProvider>
          <TradeChartPanel marketSymbol="BTC_USDT" oracleMarkPrice="68000.00" />
        </I18nProvider>,
      );

      expect(screen.getByTestId('trade-lightweight-chart-mock')).toBeInTheDocument();
      expect(screen.queryByTestId('trade-chart-empty')).not.toBeInTheDocument();
    });

    it('shows trade-chart-empty when PHON/BTC have fewer than 2 candles (pre-T0 baseline)', () => {
      mockUseExchangeLiveCandles.mockReturnValue({
        candles: [sampleCandles[0]],
        loading: false,
        error: false,
        refetch: vi.fn(),
        connected: false,
      });

      render(
        <I18nProvider>
          <TradeChartPanel marketSymbol="BTC_USDT" />
        </I18nProvider>,
      );

      expect(screen.getByTestId('trade-chart-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('trade-lightweight-chart-mock')).not.toBeInTheDocument();
    });
  });
});
