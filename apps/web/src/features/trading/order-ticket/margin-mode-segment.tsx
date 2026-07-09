import type { MessageKey } from '@phonara/i18n';

import { isMarginModeAccountScoped } from '@/domain/margin-position-mode-display-contract';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import { Button } from '@/product/primitives/button';

import {
  CROSS_MARGIN_CANARY_WAVE,
  canSelectMarginMode,
  getCrossMarginButtonLabelKey,
  getCrossMarginDisabledReasonKey,
  shouldDisableCrossMarginSelector,
} from './margin-mode-display';
import type { MarginMode } from './order-ticket-types';

const CROSS_MARGIN_DISABLED_REASON_ID = 'cross-margin-disabled-reason';

export type MarginModeSegmentProps = {
  marginMode: MarginMode;
  setMarginMode: (mode: MarginMode) => void | Promise<unknown>;
  marginModeBusy: boolean;
  crossMarginEnabled: boolean;
  t: (key: MessageKey) => string;
  showBeginnerHelp?: boolean;
  className?: string;
};

/** Account-level isolated/cross selector — hedge dual-side toggle stays built_hidden (E21). */
export function MarginModeSegment({
  marginMode,
  setMarginMode,
  marginModeBusy,
  crossMarginEnabled,
  t,
  showBeginnerHelp = true,
  className,
}: MarginModeSegmentProps) {
  const crossDisabled = shouldDisableCrossMarginSelector(crossMarginEnabled);
  const crossDisabledReasonKey = getCrossMarginDisabledReasonKey();

  return (
    <div data-testid="margin-mode-segment" className={className ?? 'flex flex-col gap-2'}>
      <span className="text-foreground-muted flex items-center gap-1 text-xs">
        {t('trade.order.marginMode')}
        {showBeginnerHelp ? <TradeHelpTip termId="margin_mode" className="text-xs" /> : null}
      </span>
      {isMarginModeAccountScoped() ? (
        <p
          className="text-foreground-muted m-0 text-xs"
          data-testid="margin-mode-account-scoped-hint"
        >
          {t('trade.order.marginMode.accountScoped')}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('trade.order.marginMode')}>
        <Button
          type="button"
          size="sm"
          variant={marginMode === 'isolated' ? 'primary' : 'outline'}
          data-testid="margin-mode-isolated"
          aria-pressed={marginMode === 'isolated'}
          onClick={() => void setMarginMode('isolated')}
          disabled={marginModeBusy}
        >
          {t('trade.order.margin.isolated')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={marginMode === 'cross' ? 'primary' : 'outline'}
          data-testid="margin-mode-cross"
          aria-pressed={marginMode === 'cross'}
          aria-describedby={crossDisabled ? CROSS_MARGIN_DISABLED_REASON_ID : undefined}
          onClick={() => {
            if (canSelectMarginMode('cross', crossMarginEnabled)) {
              void setMarginMode('cross');
            }
          }}
          disabled={marginModeBusy || crossDisabled}
        >
          {t(getCrossMarginButtonLabelKey(crossMarginEnabled))}
        </Button>
      </div>
      {crossDisabled ? (
        <p
          id={CROSS_MARGIN_DISABLED_REASON_ID}
          className="text-foreground-muted m-0 text-xs"
          data-testid="cross-margin-disabled-reason"
          data-canary-wave={CROSS_MARGIN_CANARY_WAVE}
        >
          {t(crossDisabledReasonKey)}
        </p>
      ) : null}
    </div>
  );
}
