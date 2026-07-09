import { describe, expect, it } from 'vitest';

import {
  CROSS_MARGIN_LAUNCH_FLAG,
  OKX_MARGIN_POSITION_PARITY_ACHIEVED,
} from '../margin-position-mode-display-contract';
import {
  FUTURES_CANCEL_ORDER_RPC,
  FUTURES_CLOSE_POSITION_RPC,
  FUTURES_PARTIAL_CLOSE_RPC,
  FUTURES_ADJUST_ISOLATED_MARGIN_RPC,
  FUTURES_SET_MARGIN_MODE_RPC,
  FUTURES_UPDATE_SLTP_RPC,
  TRADE_ORDER_UI_WIRE_STATUS,
} from '../trade-order-states-display-contract';
import {
  assertTradeParityContractSync,
  assertTradeLayoutDedupContractSync,
  findTradeActionPath,
  findTradeComplaintRisk,
  findTradeDualCurrencyRow,
  findTradeParityRow,
  findTradePlatformSettlementRow,
  findTradeRealtimeFeedRow,
  findTradeZoneOwner,
  listTradeComplaintRisksByOwnerTodo,
  listTradeDualCurrencyBySurface,
  listTradeParityRowsByTier,
  listTradePlatformSettlementBySurface,
  P9_TRADE_LAYOUT_DEDUP_GATE_TODO,
  P9_TRADE_PARITY_MATRIX_SYNC_TODO,
  P9_TRADE_WORLD_CLASS_GATE_TODO,
  TRADE_ACTION_PATH_REGISTRY,
  TRADE_EXCHANGE_PARITY_MATRIX,
  TRADE_EXTEND_ONLY_REGISTRY,
  TRADE_DUAL_CURRENCY_MATRIX,
  TRADE_FUTURES_DESK_ROUTE,
  TRADE_PLATFORM_SETTLEMENT_MODEL,
  TRADE_REALTIME_MARKET_DATA_MATRIX,
  TRADE_SETTLEMENT_CURRENCIES,
  TRADE_ORDERS_ROUTE,
  TRADE_POSITIONS_ROUTE,
  TRADE_SPOT_DESK_ROUTE,
  TRADE_UI_ZONE_OWNERS,
  TRADE_USER_COMPLAINT_RISKS,
} from '../trade-exchange-parity-display-contract';

describe('trade-exchange-parity-display-contract §22.2.1', () => {
  it('registers Binance·Bybit·OKX parity matrix with tier-A gaps mapped to P9 todos', () => {
    expect(TRADE_EXCHANGE_PARITY_MATRIX.length).toBeGreaterThanOrEqual(20);
    expect(findTradeParityRow('desktop-3-panel')?.tier).toBe('DONE');
    expect(findTradeParityRow('desktop-3-panel')?.phonara).toBe('yes');
    expect(findTradeParityRow('bottom-dock')?.tier).toBe('DONE');
    expect(findTradeParityRow('spot-market')?.tier).toBe('DONE');
    expect(findTradeParityRow('chart-overlays')?.phonara).toBe('yes');
    expect(findTradeParityRow('hedge-position')?.tier).toBe('B');
    expect(findTradeParityRow('okx-parity-flag')?.phonara).toBe('no');
  });

  it('maps all three exchanges as reference on every matrix row', () => {
    for (const row of TRADE_EXCHANGE_PARITY_MATRIX) {
      expect(row.binance).toBe(true);
      expect(row.bybit).toBe(true);
      expect(row.okx).toBe(true);
    }
  });

  it('has no pending Tier-A parity rows after P9 WORLD gate closeout', () => {
    const tierA = listTradeParityRowsByTier('A');
    expect(tierA.every((row) => !row.ownerTodo?.startsWith('p9-'))).toBe(true);
    expect(findTradeParityRow('cross-margin')?.tier).toBe('DONE');
    expect(findTradeParityRow('one-way-position')?.tier).toBe('DONE');
    expect(findTradeParityRow('partial-close')?.tier).toBe('DONE');
    expect(findTradeParityRow('margin-adjust')?.tier).toBe('DONE');
    expect(findTradeParityRow('unrealized-pnl')?.tier).toBe('DONE');
    expect(findTradeParityRow('unrealized-pnl')?.phonara).toBe('yes');
    expect(findTradeParityRow('leverage-slider')?.tier).toBe('DONE');
    expect(findTradeParityRow('leverage-slider')?.phonara).toBe('yes');
  });
});

describe('trade-exchange-parity-display-contract §22.2.3 TRADE_UI_ZONE_OWNERS', () => {
  it('defines single owner per viewport zone (H1 dedup registry)', () => {
    expect(TRADE_UI_ZONE_OWNERS.length).toBeGreaterThanOrEqual(8);
    expect(findTradeZoneOwner('desktop-bottom-strip')?.ownerComponent).toBe('TradeDeskBottomDock');
    expect(findTradeZoneOwner('desktop-bottom-strip')?.forbiddenDuplicates).toContain(
      'inline FuturesPositionsPanel on futures-desk-page',
    );
    expect(findTradeZoneOwner('all-market-ws')?.ownerComponent).toBe('MarketDataBridge');
    expect(findTradeZoneOwner('positions-page-full')?.ownerComponent).toContain('variant=full');
  });

  it('registers desktop recent tape zone owner', () => {
    expect(findTradeZoneOwner('desktop-recent-tape')?.ownerComponent).toBe('TradeRecentTradesRail');
    expect(findTradeZoneOwner('desktop-recent-tape')?.ownerTodo).toBeNull();
  });

  it('marks recent trades tape parity as DONE after rail wire', () => {
    expect(findTradeParityRow('recent-trades-tape')?.tier).toBe('DONE');
    expect(findTradeParityRow('recent-trades-tape')?.phonara).toBe('yes');
    expect(findTradeRealtimeFeedRow('recent-trades-tape')?.phonara).toBe('yes');
  });

  it('marks order book parity as DONE after grouping·spread·click wire', () => {
    expect(findTradeParityRow('orderbook-parity')?.tier).toBe('DONE');
    expect(findTradeParityRow('orderbook-parity')?.phonara).toBe('yes');
    expect(findTradePlatformSettlementRow('synthetic-book-display')?.phonara).toBe('yes');
    expect(findTradeRealtimeFeedRow('synthetic-book')?.phonara).toBe('yes');
  });

  it('marks funding rate + history parity as DONE after dock wire', () => {
    expect(findTradeParityRow('funding-rate-history')?.tier).toBe('DONE');
    expect(findTradeParityRow('funding-rate-history')?.phonara).toBe('yes');
    expect(findTradeComplaintRisk('funding-history-missing')?.rpcPath).toBe('useFundingPayments');
  });

  it('registers oracle circuit banner parity as DONE with desk mount owner', () => {
    expect(findTradeParityRow('oracle-circuit-banner')?.tier).toBe('DONE');
    expect(findTradeParityRow('oracle-circuit-banner')?.phonara).toBe('yes');
    expect(findTradeZoneOwner('desktop-status-banner')?.ownerComponent).toContain(
      'TradeMarketStatusBanner',
    );
    expect(findTradeZoneOwner('desktop-status-banner')?.ownerTodo).toBeNull();
    expect(findTradeComplaintRisk('duplicate-status-banner')?.mitigatedBy).toBe('live');
  });

  it('registers ultra 2560 layout parity as DONE after desk shell wire', () => {
    expect(findTradeParityRow('ultra-2560-layout')?.tier).toBe('DONE');
    expect(findTradeParityRow('ultra-2560-layout')?.phonara).toBe('yes');
    expect(findTradeParityRow('ultra-2560-layout')?.ownerTodo).toBeNull();
  });

  it('registers tier fee badge parity as DONE after badge wire', () => {
    expect(findTradeParityRow('tier-fee-badge')?.tier).toBe('DONE');
    expect(findTradeParityRow('tier-fee-badge')?.phonara).toBe('yes');
    expect(findTradeParityRow('tier-fee-badge')?.ownerTodo).toBeNull();
    expect(findTradeComplaintRisk('duplicate-est-fee-row')?.mitigatedBy).toBe('live');
    expect(listTradeComplaintRisksByOwnerTodo('p9-trade-tier-fee-display')).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'duplicate-est-fee-row' })]),
    );
  });

  it('registers i18n surface audit parity as DONE after step 26 contract', () => {
    expect(findTradeParityRow('i18n-surface-audit')?.tier).toBe('DONE');
    expect(findTradeParityRow('i18n-surface-audit')?.phonara).toBe('yes');
    expect(findTradeParityRow('i18n-surface-audit')?.ownerTodo).toBeNull();
    expect(findTradeComplaintRisk('external-exchange-copy')?.mitigatedBy).toBe('live');
  });

  it('forbids mobile dock + tabs duplicate for same data', () => {
    const mobileTabs = findTradeZoneOwner('mobile-tabs');
    const mobilePositions = findTradeZoneOwner('mobile-positions');
    const mobileBook = findTradeZoneOwner('mobile-book');
    expect(mobileTabs?.forbiddenDuplicates).toContain('bottom dock + tabs same data');
    expect(mobilePositions?.forbiddenDuplicates).toContain('dock + tab duplicate');
    expect(mobileBook?.ownerComponent).toBe('SpotOrderBookPanel');
    expect(mobileBook?.mountLocation).toContain('book subtab');
  });

  it('documents extend-only registry (H2 — no parallel files)', () => {
    expect(TRADE_EXTEND_ONLY_REGISTRY.length).toBeGreaterThanOrEqual(6);
    expect(TRADE_EXTEND_ONLY_REGISTRY.map((row) => row.extendFile)).toContain(
      'futures-positions-panel.tsx',
    );
    expect(TRADE_EXTEND_ONLY_REGISTRY.map((row) => row.extendFile)).toContain(
      'trade-desk-bottom-dock.tsx',
    );
  });

  it('locks canonical trade routes for zone ownership', () => {
    expect(TRADE_SPOT_DESK_ROUTE).toBe('/trade');
    expect(TRADE_FUTURES_DESK_ROUTE).toBe('/trade/futures');
    expect(TRADE_POSITIONS_ROUTE).toBe('/trade/positions');
    expect(TRADE_ORDERS_ROUTE).toBe('/trade/orders');
  });
});

describe('trade-exchange-parity-display-contract §13.1.1 TRADE_DUAL_CURRENCY_MATRIX', () => {
  it('registers USDT·PHON dual settlement for trade · sports · casino · staking', () => {
    expect(TRADE_SETTLEMENT_CURRENCIES).toEqual(['USDT', 'PHON']);
    expect(TRADE_DUAL_CURRENCY_MATRIX.length).toBeGreaterThanOrEqual(7);
    for (const row of TRADE_DUAL_CURRENCY_MATRIX) {
      expect(row.usdt).toBe(true);
      expect(row.phon).toBe(true);
      expect(row.engineRpc).toBeTruthy();
      if (row.phonara === 'yes') {
        expect(row.ownerTodo).toBeNull();
      } else {
        expect(row.ownerTodo).toBeTruthy();
      }
    }
  });

  it('maps completed trade dual-currency rows to phonara yes with null owner', () => {
    expect(findTradeDualCurrencyRow('futures-margin-selector')?.ownerTodo).toBeNull();
    expect(findTradeDualCurrencyRow('futures-margin-selector')?.phonara).toBe('yes');
    expect(findTradeDualCurrencyRow('desk-dual-balance')?.phonara).toBe('yes');
    expect(findTradeDualCurrencyRow('spot-stake-rules')?.ownerTodo).toBeNull();
    expect(findTradeDualCurrencyRow('spot-stake-rules')?.phonara).toBe('yes');
    expect(findTradeDualCurrencyRow('staking-pool-currency')?.phonara).toBe('yes');
    expect(findTradeDualCurrencyRow('staking-pool-currency')?.ownerTodo).toBeNull();
    expect(listTradeDualCurrencyBySurface('futures_margin')).toHaveLength(1);
  });

  it('maps sports and casino stake currency to P10 todos', () => {
    expect(findTradeDualCurrencyRow('sports-slip-currency')?.ownerTodo).toBeNull();
    expect(findTradeDualCurrencyRow('casino-stake-currency')?.ownerTodo).toBe(
      'p10-casino-replay-and-infra',
    );
    expect(findTradeDualCurrencyRow('sports-slip-currency')?.phonara).toBe('yes');
  });
});

describe('trade-exchange-parity-display-contract §32.7 TRADE_USER_COMPLAINT_RISKS', () => {
  const H9_REQUIRED_IDS = [
    'trade-dock-orphan',
    'futures-inline-positions',
    'desk-no-cancel',
    'pnl-dash',
    'fills-missing',
    'funding-history-missing',
    'duplicate-est-fee-row',
    'partial-close-ui',
    'margin-adjust-ui',
    'hedge-visible',
    'spot-limit-visible',
    'futures-margin-phon-hidden',
    'spot-stake-hardcode-usdt',
    'fills-currency-mismatch',
    'sports-stake-usdt-only',
    'casino-stake-usdt-only',
    'chart-price-settlement',
    'external-exchange-copy',
  ] as const;

  it('registers all §32.7 H9 repo-measured gap rows', () => {
    for (const id of H9_REQUIRED_IDS) {
      expect(findTradeComplaintRisk(id)).toBeDefined();
    }
    expect(TRADE_USER_COMPLAINT_RISKS.length).toBeGreaterThanOrEqual(H9_REQUIRED_IDS.length);
  });

  it('maps button↔RPC↔disabled reason for each complaint risk row', () => {
    for (const row of TRADE_USER_COMPLAINT_RISKS) {
      expect(row.id).toBeTruthy();
      expect(row.control).toBeTruthy();
      expect(row.failSymptom).toBeTruthy();
      expect(row.ownerTodo).toBeTruthy();
      expect(['live', 'disabled', 'disabled+key', 'built_hidden']).toContain(row.mitigatedBy);
    }
  });

  it('wires cancel/close/partial RPC paths on desk complaint rows', () => {
    expect(findTradeComplaintRisk('desk-no-cancel')?.rpcPath).toBe(FUTURES_CANCEL_ORDER_RPC);
    expect(findTradeComplaintRisk('dock-page-close-split')?.rpcPath).toBe(
      FUTURES_CLOSE_POSITION_RPC,
    );
    expect(findTradeComplaintRisk('partial-close-ui')?.rpcPath).toBe(FUTURES_PARTIAL_CLOSE_RPC);
    expect(findTradeComplaintRisk('partial-close-ui')?.mitigatedBy).toBe('live');
    expect(findTradeComplaintRisk('margin-adjust-ui')?.rpcPath).toBe(
      FUTURES_ADJUST_ISOLATED_MARGIN_RPC,
    );
    expect(findTradeComplaintRisk('margin-adjust-ui')?.mitigatedBy).toBe('live');
    expect(findTradeComplaintRisk('pnl-dash')?.mitigatedBy).toBe('live');
  });

  it('assigns hedge built_hidden, spot-limit live, reduce-only disabled, position-tpsl live', () => {
    expect(findTradeComplaintRisk('hedge-visible')?.mitigatedBy).toBe('built_hidden');
    expect(findTradeComplaintRisk('spot-limit-visible')?.mitigatedBy).toBe('live');
    expect(findTradeComplaintRisk('reduce-only-visible')?.mitigatedBy).toBe('disabled');
    expect(findTradeComplaintRisk('position-tpsl-edit')?.mitigatedBy).toBe('live');
    expect(findTradeComplaintRisk('position-tpsl-edit')?.rpcPath).toBe(FUTURES_UPDATE_SLTP_RPC);
  });

  it('assigns cross margin disabled+key until launch flag', () => {
    const crossRisk = findTradeComplaintRisk('cross-margin-live-claim');
    expect(crossRisk?.mitigatedBy).toBe('disabled+key');
    expect(crossRisk?.rpcPath).toBe(FUTURES_SET_MARGIN_MODE_RPC);
    expect(crossRisk?.disabledReasonKey).toBe('trade.margin.crossDisabled');
    expect(CROSS_MARGIN_LAUNCH_FLAG).toBe('feature_cross_margin_enabled');
  });

  it('groups complaint risks by owner todo for P9 WORLD ladder', () => {
    const dockRisks = listTradeComplaintRisksByOwnerTodo('p9-trade-terminal-bottom-dock');
    expect(dockRisks.map((row) => row.id)).toEqual(
      expect.arrayContaining(['trade-dock-orphan', 'futures-inline-positions', 'desk-no-cancel']),
    );
  });
});

describe('trade-exchange-parity-display-contract §13.1.2 platform settlement · realtime feeds', () => {
  it('registers on-platform settlement for spot · futures · staking · sports · casino', () => {
    expect(TRADE_PLATFORM_SETTLEMENT_MODEL.length).toBeGreaterThanOrEqual(7);
    for (const row of TRADE_PLATFORM_SETTLEMENT_MODEL) {
      expect(row.externalExchangeRouting).toBe(false);
      expect(row.settlementEngine).toBeTruthy();
      expect(row.uxReference.length).toBeGreaterThanOrEqual(1);
    }
    expect(findTradePlatformSettlementRow('spot-market-on-platform')?.phonara).toBe('yes');
    expect(findTradePlatformSettlementRow('staking-on-platform')?.settlementEngine).toContain(
      'rpc_stake',
    );
    expect(findTradePlatformSettlementRow('staking-on-platform')?.settlementEngine).toContain(
      'rpc_stake_phon',
    );
    expect(findTradePlatformSettlementRow('staking-on-platform')?.ownerTodo).toBeNull();
    expect(findTradeDualCurrencyRow('staking-pool-currency')?.phonara).toBe('yes');
    expect(findTradeDualCurrencyRow('staking-pool-currency')?.ownerTodo).toBeNull();
    expect(listTradePlatformSettlementBySurface('futures')).toHaveLength(2);
  });

  it('registers display-only realtime feeds separate from settlement RPC', () => {
    expect(TRADE_REALTIME_MARKET_DATA_MATRIX.length).toBeGreaterThanOrEqual(6);
    for (const row of TRADE_REALTIME_MARKET_DATA_MATRIX) {
      expect(row.displayOnly).toBe(true);
      expect(row.settlementSource).toBeTruthy();
      expect(row.feedSource).toBeTruthy();
    }
    expect(findTradeRealtimeFeedRow('lwc-majors-ws')?.ownerTodo).toBe('p9-trade-chart-pro-lwc');
    expect(findTradeRealtimeFeedRow('phon-oracle-candles')?.feedSource).toContain(
      'rpc_get_candles',
    );
    expect(findTradeRealtimeFeedRow('market-data-bridge')?.phonara).toBe('yes');
  });
});

describe('trade-exchange-parity-display-contract sync · margin-position-mode · trade-order-states', () => {
  it('keeps OKX parity flag false and hedge hidden across contracts', () => {
    expect(OKX_MARGIN_POSITION_PARITY_ACHIEVED).toBe(false);
    expect(() => assertTradeParityContractSync()).not.toThrow();
  });

  it('aligns order-states wire status with complaint risk mitigations', () => {
    expect(TRADE_ORDER_UI_WIRE_STATUS.hedge_mode_toggle).toBe('built_hidden');
    expect(TRADE_ORDER_UI_WIRE_STATUS.spot_limit_tab).toBe('live');
    expect(TRADE_ORDER_UI_WIRE_STATUS.futures_margin_cross).toBe('built_disabled');
  });

  it('documents P9 gate todo ids for WORLD ladder', () => {
    expect(P9_TRADE_PARITY_MATRIX_SYNC_TODO).toBe('p9-trade-parity-matrix-sync');
    expect(P9_TRADE_LAYOUT_DEDUP_GATE_TODO).toBe('p9-trade-layout-dedup-gate');
    expect(P9_TRADE_WORLD_CLASS_GATE_TODO).toBe('p9-gate-trade-world-class');
    expect(TRADE_ACTION_PATH_REGISTRY.length).toBeGreaterThanOrEqual(7);
    expect(findTradeActionPath('cancel-spot-open-order')?.sharedHookModule).toBe(
      'features/trading/use-spot-desk-wire.ts',
    );
    expect(findTradeActionPath('cancel-open-order')?.sharedHookModule).toBe('hooks/use-trading.ts');
    expect(() => assertTradeLayoutDedupContractSync()).not.toThrow();
  });
});
