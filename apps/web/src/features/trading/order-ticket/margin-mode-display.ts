import type { MessageKey } from '@phonara/i18n';

import {
  CROSS_MARGIN_CANARY_WAVE,
  getCrossMarginDisabledReasonKey,
  resolveMarginCrossSelectorWireStatus,
  shouldDisableCrossMarginSelector,
} from '@/domain/margin-position-mode-display-contract';

import type { MarginMode } from './order-ticket-types';

export {
  CROSS_MARGIN_CANARY_WAVE,
  getCrossMarginDisabledReasonKey,
  resolveMarginCrossSelectorWireStatus,
  shouldDisableCrossMarginSelector,
};

/** Cross button label — live label when canary flag on, compact disabled label when off. */
export function getCrossMarginButtonLabelKey(crossMarginEnabled: boolean): MessageKey {
  return crossMarginEnabled ? 'trade.order.margin.cross' : 'trade.order.crossDisabled';
}

/** UI/RPC display mode — cross is never shown as active when the launch flag is off. */
export function resolveEffectiveMarginMode(
  accountMode: MarginMode,
  crossEnabled: boolean,
): MarginMode {
  if (!crossEnabled && accountMode === 'cross') {
    return 'isolated';
  }
  return accountMode;
}

/** Client guard before rpc_set_margin_mode — avoids half-open cross exposure. */
export function canSelectMarginMode(mode: MarginMode, crossEnabled: boolean): boolean {
  if (mode === 'cross' && !crossEnabled) {
    return false;
  }
  return mode === 'isolated' || mode === 'cross';
}
