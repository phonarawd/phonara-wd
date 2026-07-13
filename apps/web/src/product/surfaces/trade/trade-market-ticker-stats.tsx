import type { MessageKey } from '@phonara/i18n';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { resolveMarketHeatTone } from '@/domain/da-w8-signature-surfaces-display-contract';
import type { MarketTickerDisplay } from '@/features/trading/market-store/use-market-ticker-display';
import { cn } from '@/product/primitives/lib/cn';

type TFn = (key: MessageKey) => string;

export type TradeMarketTickerStatsProps = {
  display: MarketTickerDisplay;
  mode: 'spot' | 'futures';
  t: TFn;
  className?: string;
};

function StatCell({
  label,
  value,
  testId,
  tone,
  volumePulse,
}: {
  label: string;
  value: string;
  testId: string;
  tone?: 'up' | 'down' | 'neutral';
  volumePulse?: boolean;
}) {
  return (
    <div className="min-w-18 shrink-0">
      <p className="text-foreground-muted m-0 text-xs">{label}</p>
      <p
        data-testid={testId}
        data-volume-pulse={volumePulse ? 'true' : undefined}
        className={cn(
          'text-foreground m-0 text-sm tabular-nums',
          tone === 'up' && 'text-market-up',
          tone === 'down' && 'text-market-down',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function AdvancedStats({
  display,
  mode,
  t,
  className,
  'data-testid': dataTestId = 'trade-ticker-advanced-row',
}: TradeMarketTickerStatsProps & { className?: string; 'data-testid'?: string }) {
  const volumeLabel = mode === 'futures' ? t('trade.openInterest') : t('trade.vol24');
  const volumeValue = mode === 'futures' ? display.openInterest : display.vol24;
  const volumeTestId = mode === 'futures' ? 'trade-ticker-open-interest' : 'trade-ticker-vol24';
  const pulse = display.hasFeed && volumeValue !== '—';

  return (
    <div data-testid={dataTestId} className={cn('flex flex-wrap items-end gap-4', className)}>
      <StatCell label={t('trade.high24')} value={display.high24} testId="trade-ticker-high24" />
      <StatCell label={t('trade.low24')} value={display.low24} testId="trade-ticker-low24" />
      <StatCell label={volumeLabel} value={volumeValue} testId={volumeTestId} volumePulse={pulse} />
    </div>
  );
}

/** 24h ticker stats — change always visible · high/low/vol(OI) collapsible on mobile. */
export function TradeMarketTickerStats({
  display,
  mode,
  t,
  className,
}: TradeMarketTickerStatsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const heat = resolveMarketHeatTone(display.change24.tone);

  return (
    <div
      className={cn('flex min-w-0 flex-col gap-2', className)}
      data-signature="market-heat-volume-pulse"
      data-market-heat={heat}
      data-testid="trade-ticker-signature"
    >
      <div className="flex flex-wrap items-end gap-4">
        <StatCell
          label={t('trade.change24')}
          value={display.change24.text}
          testId="trade-ticker-change24"
          tone={display.change24.tone}
        />
        <AdvancedStats display={display} mode={mode} t={t} className="hidden md:flex" />
      </div>

      <div className="md:hidden">
        <button
          type="button"
          data-testid="trade-ticker-advanced-toggle"
          className={cn(
            'text-accent flex items-center gap-1 text-xs font-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-sm',
          )}
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          {advancedOpen ? t('trade.ticker.advancedHide') : t('trade.ticker.advanced')}
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform duration-(--ds-motion-surface)',
              advancedOpen && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
        {advancedOpen ? (
          <AdvancedStats
            display={display}
            mode={mode}
            t={t}
            className="mt-2"
            data-testid="trade-ticker-advanced-row-mobile"
          />
        ) : null}
      </div>
    </div>
  );
}
