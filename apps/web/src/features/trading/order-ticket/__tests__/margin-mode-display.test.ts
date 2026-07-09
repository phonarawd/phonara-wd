import { describe, expect, it } from 'vitest';

import {
  CROSS_MARGIN_CANARY_WAVE,
  getCrossMarginDisabledReasonKey,
} from '@/domain/margin-position-mode-display-contract';

import {
  canSelectMarginMode,
  getCrossMarginButtonLabelKey,
  resolveEffectiveMarginMode,
  resolveMarginCrossSelectorWireStatus,
  shouldDisableCrossMarginSelector,
} from '../margin-mode-display';

describe('margin-mode-display · cross margin canary', () => {
  it('blocks cross selection until feature_cross_margin_enabled is on', () => {
    expect(shouldDisableCrossMarginSelector(false)).toBe(true);
    expect(shouldDisableCrossMarginSelector(true)).toBe(false);
    expect(canSelectMarginMode('cross', false)).toBe(false);
    expect(canSelectMarginMode('cross', true)).toBe(true);
    expect(canSelectMarginMode('isolated', false)).toBe(true);
  });

  it('masks account cross mode as isolated while canary flag is off', () => {
    expect(resolveEffectiveMarginMode('cross', false)).toBe('isolated');
    expect(resolveEffectiveMarginMode('cross', true)).toBe('cross');
  });

  it('exposes canary wave id and disabled reason key for MarginModeSegment', () => {
    expect(CROSS_MARGIN_CANARY_WAVE).toBe('phase4-trade-cross-margin');
    expect(getCrossMarginDisabledReasonKey()).toBe('trade.margin.crossDisabled');
    expect(resolveMarginCrossSelectorWireStatus(false)).toBe('built_disabled');
    expect(resolveMarginCrossSelectorWireStatus(true)).toBe('live');
    expect(getCrossMarginButtonLabelKey(false)).toBe('trade.order.crossDisabled');
    expect(getCrossMarginButtonLabelKey(true)).toBe('trade.order.margin.cross');
  });
});
