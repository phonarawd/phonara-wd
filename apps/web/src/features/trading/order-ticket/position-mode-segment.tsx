import type { MessageKey } from '@phonara/i18n';

import {
  shouldHideHedgePositionModeToggle,
  type EffectivePositionMode,
} from '@/domain/margin-position-mode-display-contract';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import { Button } from '@/product/primitives/button';

export type PositionModeSegmentProps = {
  positionMode: EffectivePositionMode;
  setPositionMode: (mode: EffectivePositionMode) => void | Promise<unknown>;
  positionModeBusy: boolean;
  t: (key: MessageKey) => string;
  showBeginnerHelp?: boolean;
  className?: string;
};

/** Account-level one-way / hedge selector — E21 UI unlock (`tradeParityLive`). */
export function PositionModeSegment({
  positionMode,
  setPositionMode,
  positionModeBusy,
  t,
  showBeginnerHelp = true,
  className,
}: PositionModeSegmentProps) {
  if (shouldHideHedgePositionModeToggle()) {
    return null;
  }

  return (
    <div data-testid="hedge-position-mode-toggle" className={className ?? 'flex flex-col gap-2'}>
      <span className="text-foreground-muted flex items-center gap-1 text-xs">
        {t('trade.order.positionMode')}
        {showBeginnerHelp ? <TradeHelpTip termId="position_mode" className="text-xs" /> : null}
      </span>
      <div
        className="grid grid-cols-2 gap-2"
        role="group"
        aria-label={t('trade.order.positionMode')}
      >
        <Button
          type="button"
          size="sm"
          variant={positionMode === 'one_way' ? 'primary' : 'outline'}
          data-testid="position-mode-one-way"
          aria-pressed={positionMode === 'one_way'}
          onClick={() => void setPositionMode('one_way')}
          disabled={positionModeBusy}
        >
          {t('trade.order.positionMode.oneWay')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={positionMode === 'hedge' ? 'primary' : 'outline'}
          data-testid="position-mode-hedge"
          aria-pressed={positionMode === 'hedge'}
          onClick={() => void setPositionMode('hedge')}
          disabled={positionModeBusy}
        >
          {t('trade.order.positionMode.hedge')}
        </Button>
      </div>
    </div>
  );
}
