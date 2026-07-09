/**

 * P3-C — Trade desk load / realtime soak (Plan trade_desk_qa_audit).

 * N concurrent oracle_prices channels (10/50/100) · price_ticks burst read-only spotcheck.

 * DoD: disconnect banner false-positive 0 · submit gate false-positive 0 under load.

 */

import {
  resolveTradeOracleRealtimeDisconnected,
  type TradeOracleRealtimeDisconnectInput,
} from '@/features/trading/use-trade-oracle-realtime-disconnected';

import { resolveTradeDeskSubmitGate } from './trade-submit-display-contract';

export const TRADE_DESK_LOAD_REALTIME_TODO = 'p3-load-realtime' as const;

/** Concurrent realtime channel tiers (Plan P3-C). */

export const TRADE_DESK_LOAD_REALTIME_CHANNEL_TIERS = [10, 50, 100] as const;

export type TradeDeskLoadRealtimeChannelTier =
  (typeof TRADE_DESK_LOAD_REALTIME_CHANNEL_TIERS)[number];

/** Operator soak duration per tier (ms). */

export const TRADE_DESK_LOAD_REALTIME_SOAK_MS = 30_000 as const;

/** Read-only prod spotcheck — price_ticks burst observation window (seconds). */

export const TRADE_DESK_LOAD_TICK_BURST_WINDOW_SEC = 60 as const;

/** Advisory max total price_ticks per burst window before soak WARNING (runaway feed). */

export const TRADE_DESK_LOAD_TICK_BURST_MAX_PER_WINDOW = 12_000 as const;

/** Min price_ticks for BTC_USDT in burst window when spot active (feed alive). */

export const TRADE_DESK_LOAD_TICK_MIN_BTC_PER_WINDOW = 1 as const;

/** Min subscribed fraction at soak end — below = load failure. */

export const TRADE_DESK_LOAD_REALTIME_MIN_SUBSCRIBE_RATIO = 1 as const;

export const TRADE_DESK_LOAD_REALTIME_SOAK_SCRIPT =
  'scripts/trade-desk-realtime-load-soak.ts' as const;

/** Launch RC 24h soak spotcheck extended with P3-C read-only burst/tick checks. */

export const TRADE_DESK_LOAD_REALTIME_SPOTCHECK_SCRIPT =
  'scripts/trade-desk-launch-rc-soak-spotcheck.sql' as const;

export const TRADE_DESK_LOAD_REALTIME_DOC =
  'docs/OPERATIONS/TRADE_DESK_LOAD_REALTIME_SOAK.md' as const;

export type TradeDeskLoadRealtimeSoakMetrics = {
  tier: TradeDeskLoadRealtimeChannelTier;

  channelCount: number;

  subscribedCount: number;

  channelErrors: number;

  oracleEvents: number;

  soakMs: number;
};

export type TradeDeskLoadRealtimeSoakVerdict = {
  pass: boolean;

  disconnectFalsePositive: boolean;

  submitGateFalsePositive: boolean;

  reasons: string[];
};

/** Pure — disconnect banner must not fire while subscribed or still connecting after first connect. */

export function hasLoadRealtimeDisconnectFalsePositive(
  input: TradeOracleRealtimeDisconnectInput,
): boolean {
  return resolveTradeOracleRealtimeDisconnected(input);
}

/** Pure — submit gate must not block spot desk when oracle realtime is healthy. */

export function hasLoadRealtimeSubmitGateFalsePositive(input: {
  deskBlocked: boolean;

  priceStale: boolean;

  realtimeInput: TradeOracleRealtimeDisconnectInput;
}): boolean {
  const disconnected = resolveTradeOracleRealtimeDisconnected(input.realtimeInput);

  const gate = resolveTradeDeskSubmitGate({
    desk: 'spot',

    deskBlocked: input.deskBlocked,

    priceStale: input.priceStale,

    realtimeDisconnected: disconnected,
  });

  const healthy =
    !input.deskBlocked &&
    !input.priceStale &&
    input.realtimeInput.connected &&
    input.realtimeInput.status === 'subscribed';

  return healthy && gate.submitBlocked;
}

/** Evaluate soak metrics + gate invariants (DoD #10 disconnect/submit false-positive 0). */

export function evaluateTradeDeskLoadRealtimeSoak(
  metrics: TradeDeskLoadRealtimeSoakMetrics,
): TradeDeskLoadRealtimeSoakVerdict {
  const reasons: string[] = [];

  const subscribeRatio =
    metrics.channelCount === 0 ? 0 : metrics.subscribedCount / metrics.channelCount;

  if (subscribeRatio < TRADE_DESK_LOAD_REALTIME_MIN_SUBSCRIBE_RATIO) {
    reasons.push(
      `subscribe ratio ${subscribeRatio.toFixed(2)} < ${TRADE_DESK_LOAD_REALTIME_MIN_SUBSCRIBE_RATIO}`,
    );
  }

  if (metrics.channelErrors > 0) {
    reasons.push(`channel errors=${metrics.channelErrors}`);
  }

  const healthyConnected: TradeOracleRealtimeDisconnectInput = {
    hadSubscription: true,

    status: 'subscribed',

    connected: true,
  };

  const transientConnecting: TradeOracleRealtimeDisconnectInput = {
    hadSubscription: true,

    status: 'connecting',

    connected: false,
  };

  const disconnectFalsePositive =
    hasLoadRealtimeDisconnectFalsePositive(healthyConnected) ||
    hasLoadRealtimeDisconnectFalsePositive(transientConnecting);

  if (disconnectFalsePositive) {
    reasons.push('disconnect banner false-positive under load invariant');
  }

  const submitGateFalsePositive = hasLoadRealtimeSubmitGateFalsePositive({
    deskBlocked: false,

    priceStale: false,

    realtimeInput: healthyConnected,
  });

  if (submitGateFalsePositive) {
    reasons.push('submit gate false-positive while oracle subscribed');
  }

  const pass = reasons.length === 0;

  return {
    pass,

    disconnectFalsePositive,

    submitGateFalsePositive,

    reasons,
  };
}
