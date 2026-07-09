import {
  shouldHideHedgePositionModeToggle,
  shouldShowOneWayPositionModeLabel,
} from '@/domain/margin-position-mode-display-contract';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import type { MessageKey } from '@phonara/i18n';

export type PositionModeFixedLabelProps = {
  t: (key: MessageKey) => string;
  showBeginnerHelp?: boolean;
  className?: string;
};

/** E21 honest UX — one-way fixed label only; hedge toggle must never render. */
export function PositionModeFixedLabel({
  t,
  showBeginnerHelp = true,
  className,
}: PositionModeFixedLabelProps) {
  if (!shouldShowOneWayPositionModeLabel() || !shouldHideHedgePositionModeToggle()) {
    return null;
  }

  return (
    <div data-testid="position-mode-fixed-label" className={className ?? 'flex flex-col gap-1'}>
      <span className="text-foreground-muted flex items-center gap-1 text-xs">
        {t('trade.order.positionMode')}
        {showBeginnerHelp ? <TradeHelpTip termId="position_mode" className="text-xs" /> : null}
      </span>
      <span className="text-foreground text-sm font-medium" data-testid="position-mode-value">
        {t('trade.order.positionMode.oneWayFixed')}
      </span>
    </div>
  );
}
