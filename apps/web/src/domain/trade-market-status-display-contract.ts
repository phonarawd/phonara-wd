/**
 * Trade market status banner — P9 WORLD step 20 (Plan §25.12.9.1-E #20).
 * Single desk banner below header · stale / circuit halt / kill-switch · AppShell duplicate 0.
 *
 * Authority: TRADE_UX_CANON.md · §22.2.2 G1 risk state · §22.2.3 H1 zone owner
 */

import type { MessageKey } from '@phonara/i18n';

export const P9_TRADE_ORACLE_CIRCUIT_BANNER_TODO = 'p9-trade-oracle-circuit-banner' as const;

export const TRADE_MARKET_STATUS_BANNER_COMPONENT = 'trade-market-status-banner.tsx' as const;

export const TRADE_MARKET_STATUS_BANNER_MOUNT =
  'spot-desk-page.tsx · futures-desk-page.tsx below market header' as const;

export type TradeDeskKind = 'spot' | 'futures';

export type TradeMarketStatusKind =
  | 'kill'
  | 'circuit'
  | 'realtimeDisconnected'
  | 'freeze'
  | 'stale';

export type TradeMarketStatusBannerView = {
  kind: TradeMarketStatusKind;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
};

export type TradeMarketStatusInput = {
  desk: TradeDeskKind;
  systemHalted: boolean;
  spotBlocked: boolean;
  futuresBlocked: boolean;
  marketSymbol: string | null;
  marketHalted: boolean;
  symbolStale: boolean;
  symbolFrozen: boolean;
  realtimeDisconnected: boolean;
};

/** Priority: kill → circuit → disconnect → freeze (mark unchanged) → stale (lag). */
export function resolveTradeMarketStatusBanner(
  input: TradeMarketStatusInput,
): TradeMarketStatusBannerView | null {
  const deskBlocked = input.desk === 'spot' ? input.spotBlocked : input.futuresBlocked;

  if (input.systemHalted || deskBlocked) {
    return {
      kind: 'kill',
      titleKey: 'gate.killswitch.title',
      descriptionKey: input.systemHalted
        ? 'gate.killswitch.tradeBlocked'
        : input.desk === 'spot'
          ? 'trade.gate.spotBlocked'
          : 'trade.gate.futuresBlocked',
    };
  }

  if (input.marketSymbol && input.marketHalted) {
    return {
      kind: 'circuit',
      titleKey: 'trade.dataStatus.circuit',
      descriptionKey: 'trade.dataStatus.circuitDescription',
    };
  }

  if (input.realtimeDisconnected) {
    return {
      kind: 'realtimeDisconnected',
      titleKey: 'trade.dataStatus.realtimeDisconnected',
      descriptionKey: 'trade.dataStatus.realtimeDisconnectedDescription',
    };
  }

  if (input.marketSymbol && input.symbolFrozen && !input.symbolStale) {
    return {
      kind: 'freeze',
      titleKey: 'trade.dataStatus.freeze',
      descriptionKey: 'trade.dataStatus.freezeDescription',
    };
  }

  if (input.marketSymbol && input.symbolStale) {
    return {
      kind: 'stale',
      titleKey: 'trade.dataStatus.stale',
      descriptionKey: 'trade.dataStatus.staleDescription',
    };
  }

  return null;
}

export function assertTradeMarketStatusDisplayContractSync(): void {
  const kill = resolveTradeMarketStatusBanner({
    desk: 'spot',
    systemHalted: true,
    spotBlocked: true,
    futuresBlocked: true,
    marketSymbol: 'PHON_USDT',
    marketHalted: true,
    symbolStale: true,
    symbolFrozen: true,
    realtimeDisconnected: true,
  });
  if (kill?.kind !== 'kill') {
    throw new Error('trade-market-status: kill-switch must win over circuit and stale');
  }

  const circuit = resolveTradeMarketStatusBanner({
    desk: 'futures',
    systemHalted: false,
    spotBlocked: false,
    futuresBlocked: false,
    marketSymbol: 'BTCUSDT-SIM',
    marketHalted: true,
    symbolStale: true,
    symbolFrozen: true,
    realtimeDisconnected: true,
  });
  if (circuit?.kind !== 'circuit') {
    throw new Error('trade-market-status: circuit halt must win over stale and disconnect');
  }

  const disconnect = resolveTradeMarketStatusBanner({
    desk: 'spot',
    systemHalted: false,
    spotBlocked: false,
    futuresBlocked: false,
    marketSymbol: 'PHON_USDT',
    marketHalted: false,
    symbolStale: true,
    symbolFrozen: true,
    realtimeDisconnected: true,
  });
  if (disconnect?.kind !== 'realtimeDisconnected') {
    throw new Error('trade-market-status: realtime disconnect must win over stale');
  }

  const freeze = resolveTradeMarketStatusBanner({
    desk: 'spot',
    systemHalted: false,
    spotBlocked: false,
    futuresBlocked: false,
    marketSymbol: 'PHON_USDT',
    marketHalted: false,
    symbolStale: false,
    symbolFrozen: true,
    realtimeDisconnected: false,
  });
  if (freeze?.kind !== 'freeze') {
    throw new Error('trade-market-status: freeze must win over stale when oracle is fresh');
  }
}
