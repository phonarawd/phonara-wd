import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAUNCH_GATES } from '../../lib/launch-gates';
import { TRADE_FUTURES_UI_CAPABILITIES } from '../../features/trading/trade-rpc-capabilities';
import { TRADE_ORDER_UI_WIRE_STATUS } from '../trade-order-states-display-contract';
import { OKX_MARGIN_POSITION_UI_WIRE_STATUS } from '../margin-position-mode-display-contract';
import {
  assertEwE21UiTradeEngineUnlocksSync,
  EW_E21_UI_TRADE_ENGINE_UNLOCKS_ARTIFACT_PATHS,
  EW_E21_UI_TRADE_ENGINE_UNLOCKS_NEXT_TODO,
  EW_E21_UI_TRADE_ENGINE_UNLOCKS_PREREQUISITE_TODO,
  EW_E21_UI_TRADE_ENGINE_UNLOCKS_TEST_PATHS,
  EW_E21_UI_TRADE_ENGINE_UNLOCKS_TODO,
  isEwE21TradeUiParityUnlocked,
} from '../ew-e21-ui-trade-engine-unlocks-display-contract';
import { isEwE21TradeParityLiveUnlocked } from '../ew-e21-trade-parity-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

describe('ew-e21-ui-trade-engine-unlocks-display-contract (E21 UI)', () => {
  it('pins UI todo · GATE prerequisite · next E22 · unlock sync', () => {
    expect(EW_E21_UI_TRADE_ENGINE_UNLOCKS_TODO).toBe('ew-e21-ui-trade-engine-unlocks');
    expect(EW_E21_UI_TRADE_ENGINE_UNLOCKS_PREREQUISITE_TODO).toBe(
      'ew-e21-gate-trade-engine-parity',
    );
    expect(EW_E21_UI_TRADE_ENGINE_UNLOCKS_NEXT_TODO).toBe('ew-e22-sports-parity-wave');
    expect(() => assertEwE21UiTradeEngineUnlocksSync()).not.toThrow();
  });

  it('unlocks tradeParityLive · hedge · reduce-only · keeps EXISTS spot/TP-SL live', () => {
    expect(isEwE21TradeUiParityUnlocked()).toBe(true);
    expect(isEwE21TradeParityLiveUnlocked()).toBe(true);
    expect(LAUNCH_GATES.tradeParityLive).toBe(true);
    expect(LAUNCH_GATES.tradeHedgeReduceOnlyEngine).toBe(true);
    expect(TRADE_ORDER_UI_WIRE_STATUS.hedge_mode_toggle).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.reduce_only_toggle).toBe('live');
    expect(TRADE_FUTURES_UI_CAPABILITIES.reduceOnlyOrders).toBe(true);
    expect(OKX_MARGIN_POSITION_UI_WIRE_STATUS.position_mode_hedge_toggle).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.spot_limit_tab).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.position_tpsl_edit).toBe('live');
    expect(TRADE_FUTURES_UI_CAPABILITIES.positionTpSlEdit).toBe(true);
  });

  it('requires UI artifacts · ops evidence · ADR unlock section', () => {
    for (const rel of EW_E21_UI_TRADE_ENGINE_UNLOCKS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
      expect(readRepo(rel).length).toBeGreaterThan(40);
    }
    for (const rel of EW_E21_UI_TRADE_ENGINE_UNLOCKS_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const ops = readRepo('docs/OPERATIONS/ENGINE_GAP_E21_UI_TRADE_ENGINE_UNLOCKS.md');
    expect(ops).toContain(EW_E21_UI_TRADE_ENGINE_UNLOCKS_TODO);
    expect(ops).toContain('tradeParityLive');
    expect(ops).toContain('hedge');
    expect(ops).toContain('reduce-only');
    expect(ops).toContain('ew-e22-sports-parity-wave');

    const ticket = readRepo('apps/web/src/product/surfaces/trade/futures-order-ticket.tsx');
    expect(ticket).toContain('PositionModeSegment');
    expect(ticket).toContain('reduceOnly');
  });
});
