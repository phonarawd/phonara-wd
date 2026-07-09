import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FUTURES_CANCEL_ORDER_RPC,
  FUTURES_CLOSE_POSITION_RPC,
  findTradeActionPath,
  TRADE_ACTION_PATH_REGISTRY,
  TRADE_ORDERS_ROUTE,
  TRADE_POSITIONS_ROUTE,
} from '../trade-exchange-parity-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const FEATURES_TRADING = resolve(WEB_SRC, 'features/trading');
const FEATURES_EARN = resolve(WEB_SRC, 'features/earn');
const TRADE_SURFACES = resolve(WEB_SRC, 'product/surfaces/trade');

function readSrc(relativePath: string): string {
  return readFileSync(resolve(WEB_SRC, relativePath), 'utf8');
}

function readFeature(filename: string): string {
  return readFileSync(resolve(FEATURES_TRADING, filename), 'utf8');
}

function readEarnFeature(filename: string): string {
  return readFileSync(resolve(FEATURES_EARN, filename), 'utf8');
}

function readTradeSurface(filename: string): string {
  return readFileSync(resolve(TRADE_SURFACES, filename), 'utf8');
}

describe('trade-action-path-contract §32.7 H2', () => {
  it('registers TRADE_ACTION_PATH_REGISTRY for dock · positions · orders intents', () => {
    expect(TRADE_ACTION_PATH_REGISTRY.length).toBeGreaterThanOrEqual(7);
    expect(findTradeActionPath('full-close-position')?.secondarySurface).toBe(
      TRADE_POSITIONS_ROUTE,
    );
    expect(findTradeActionPath('cancel-open-order')?.secondarySurface).toBe(TRADE_ORDERS_ROUTE);
    expect(findTradeActionPath('view-fills')?.sharedHookModule).toBe('hooks/use-trading.ts');
  });

  it('registers cancel-spot-open-order through use-spot-desk-wire (§32.7 H2 spot isolation)', () => {
    const row = findTradeActionPath('cancel-spot-open-order');
    expect(row?.sharedHookModule).toBe('features/trading/use-spot-desk-wire.ts');
    expect(row?.secondarySurface).toBeNull();
    expect(row?.canonicalSurface).toContain('Spot desk mobile history stack');

    const spotWire = readFeature('use-spot-desk-wire.ts');
    expect(spotWire).toContain('useCancelSpotOrder');
    expect(spotWire).toContain('submitCancelOrder');
    expect(spotWire).toContain('filterSpotDeskOpenOrders');
    expect(spotWire).toContain('cancelOrder: submitCancelOrder');

    const spotDesk = readTradeSurface('spot-desk-page.tsx');
    expect(spotDesk).toContain('orders={wire.spotOpenOrders}');
    expect(spotDesk).toContain('onCancelOrder={wire.cancelOrder}');
    expect(spotDesk).toContain('cancellingOrderId={wire.cancellingOrderId}');
    expect(spotDesk).toContain('cancelBusy={wire.actionBusy}');
    expect(spotDesk).not.toContain('rpc_cancel');
  });

  it('routes position close/cancel/partial/margin intents through hooks/use-trading.ts', () => {
    const positionIntents = [
      'full-close-position',
      'partial-close-position',
      'adjust-isolated-margin',
      'cancel-open-order',
      'view-fills',
    ] as const;

    for (const intent of positionIntents) {
      const row = findTradeActionPath(intent);
      expect(row?.sharedHookModule).toBe('hooks/use-trading.ts');
    }

    const tradingHook = readSrc('hooks/use-trading.ts');
    expect(tradingHook).toContain(FUTURES_CLOSE_POSITION_RPC);
    expect(tradingHook).toContain(FUTURES_CANCEL_ORDER_RPC);
    expect(tradingHook).toContain('useFuturesActions');
  });

  it('wires desk dock and secondary pages through controller hooks (dual-write UI 0)', () => {
    const deskWire = readFeature('use-futures-desk-wire.ts');
    const positionsController = readFeature('use-futures-positions-page-controller.ts');
    const ordersController = readFeature('use-futures-orders-page-controller.ts');

    for (const source of [deskWire, positionsController, ordersController]) {
      expect(source).toContain("from '@/hooks/use-trading'");
      expect(source).toContain('useFuturesActions');
    }

    expect(deskWire).toContain('submitClosePosition');
    expect(deskWire).toContain('submitCancelOrder');
    expect(positionsController).toContain('closePositionRpc');
    expect(ordersController).toContain('cancelOrderRpc');
  });

  it('passes close/cancel handlers from wire/controller into surfaces (no direct RPC in pages)', () => {
    const futuresDesk = readTradeSurface('futures-desk-page.tsx');
    const positionsPage = readTradeSurface('futures-positions-page.tsx');
    const ordersPage = readTradeSurface('futures-orders-page.tsx');
    const bottomDock = readTradeSurface('trade-desk-bottom-dock.tsx');

    expect(futuresDesk).toContain('onClosePosition={wire.closePosition}');
    expect(futuresDesk).toContain('onCancelOrder={wire.cancelOrder}');
    expect(positionsPage).toContain('onClosePosition={closePosition}');
    expect(ordersPage).toContain('onCancelOrder={cancelOrder}');
    expect(bottomDock).toContain('onClosePosition');
    expect(bottomDock).toContain('onCancelOrder');

    for (const source of [futuresDesk, positionsPage, ordersPage, bottomDock]) {
      expect(source).not.toContain('rpc_close_futures_position');
      expect(source).not.toContain('rpc_cancel');
    }
  });

  it('routes submit-order through desk wire modules only (ticket + sticky CTA)', () => {
    const submitRow = findTradeActionPath('submit-order');
    expect(submitRow?.sharedHookModule).toBe('features/trading/use-futures-desk-wire.ts');

    const futuresWire = readFeature('use-futures-desk-wire.ts');
    const spotWire = readFeature('use-spot-desk-wire.ts');
    const futuresTicket = readTradeSurface('futures-order-ticket.tsx');
    const spotTicket = readTradeSurface('spot-order-ticket.tsx');
    const stickyCta = readTradeSurface('trade-desk-mobile-sticky-cta.tsx');

    expect(futuresWire).toContain('requestSubmitOpen');
    expect(spotWire).toContain('requestSubmit');
    expect(futuresTicket).toContain('wire.requestSubmitOpen');
    expect(spotTicket).toContain('wire.requestSubmit');
    expect(stickyCta).toContain('wire.requestSubmit');
  });

  it('routes desk feedback through showTradeFeedback only (Phase 2B P2-10)', () => {
    const tradingModules = [
      'use-spot-desk-wire.ts',
      'use-futures-desk-wire.ts',
      'use-futures-positions-page-controller.ts',
      'use-futures-orders-page-controller.ts',
    ];
    const earnModules = [
      'use-staking-page-controller.ts',
      'use-staking-positions-page-controller.ts',
    ];

    for (const mod of tradingModules) {
      const src = readFeature(mod);
      expect(src).toContain('showTradeFeedback');
      expect(src).not.toContain('productToast');
    }
    for (const mod of earnModules) {
      const src = readEarnFeature(mod);
      expect(src).toContain('showTradeFeedback');
      expect(src).not.toContain('productToast');
    }
  });
});
