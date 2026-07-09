import type { MessageKey } from '@phonara/i18n';

import { Button } from '@/product/primitives/button';
import { Slider } from '@/product/primitives/slider';
import { cn } from '@/product/primitives/lib/cn';

import {
  buildVisibleLeverageChips,
  clampLeverageInt,
  isLeverageChipActive,
  isMaxLeverageChipActive,
  parseLeverageInt,
} from './leverage-control-display';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';

export type LeverageControlProps = {
  leverage: string;
  maxLeverage: number;
  onLeverageChange: (value: string) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  className?: string;
  showBeginnerHelp?: boolean;
};

export function LeverageControl({
  leverage,
  maxLeverage,
  onLeverageChange,
  t,
  className,
  showBeginnerHelp = false,
}: LeverageControlProps) {
  const max = clampLeverageInt(maxLeverage, maxLeverage);
  const sliderValue = clampLeverageInt(parseLeverageInt(leverage), max);
  const chips = buildVisibleLeverageChips(max);
  const maxChipActive = isMaxLeverageChipActive(leverage, max);

  return (
    <div data-testid="leverage-control" className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-foreground-muted flex items-center gap-1 text-xs">
          {t('trade.order.leverage')}
          {showBeginnerHelp ? <TradeHelpTip termId="leverage" className="text-xs" /> : null}
        </span>
        <span
          className="text-foreground text-sm font-semibold tabular-nums"
          data-testid="leverage-value"
        >
          {sliderValue}x
        </span>
      </div>

      <Slider
        data-testid="leverage-slider"
        min={1}
        max={max}
        step={1}
        value={[sliderValue]}
        onValueChange={(values) => {
          const next = values[0];
          if (next == null) return;
          onLeverageChange(String(clampLeverageInt(next, max)));
        }}
        aria-label={t('trade.order.leverage')}
      />

      <div className="flex flex-wrap gap-2" data-testid="leverage-presets">
        {chips.map((chip) => (
          <Button
            key={chip}
            type="button"
            size="sm"
            variant={isLeverageChipActive(leverage, chip) ? 'primary' : 'outline'}
            data-testid={`leverage-preset-${chip}`}
            aria-pressed={isLeverageChipActive(leverage, chip)}
            onClick={() => onLeverageChange(String(chip))}
          >
            {chip}x
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={maxChipActive ? 'primary' : 'outline'}
          data-testid="leverage-preset-max"
          aria-pressed={maxChipActive}
          onClick={() => onLeverageChange(String(max))}
        >
          {t('trade.order.leverageMax')}
        </Button>
      </div>

      <span className="text-foreground-muted text-xs">
        {t('trade.leverageWith', { value: sliderValue })} ·{' '}
        {t('trade.order.leverageMaxCap', { value: max })}
      </span>
    </div>
  );
}
