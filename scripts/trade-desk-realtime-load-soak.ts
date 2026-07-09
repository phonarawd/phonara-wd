#!/usr/bin/env bun
/**
 * P3-C — Trade desk realtime load soak (read-only · Plan trade_desk_qa_audit).
 * Opens N concurrent oracle_prices Realtime channels (10/50/100 tiers) and counts
 * postgres_changes events as a price-tick burst proxy — **no prod writes**.
 *
 * Usage:
 *   bun run trade-desk:realtime-soak
 *   bun run trade-desk:realtime-soak -- --tier=50
 *   PHONARA_REALTIME_SOAK_MS=15000 bun run trade-desk:realtime-soak -- --tier=100
 *
 * Env: VITE_SUPABASE_URL · VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)
 */
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

import {
  evaluateTradeDeskLoadRealtimeSoak,
  TRADE_DESK_LOAD_REALTIME_CHANNEL_TIERS,
  TRADE_DESK_LOAD_REALTIME_SOAK_MS,
  type TradeDeskLoadRealtimeChannelTier,
  type TradeDeskLoadRealtimeSoakMetrics,
} from '../apps/web/src/domain/trade-desk-load-realtime-display-contract';

const SUPABASE_URL = process.env['VITE_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
const ANON_KEY =
  process.env['VITE_SUPABASE_ANON_KEY'] ??
  process.env['SUPABASE_ANON_KEY'] ??
  process.env['SUPABASE_KEY'];

function parseTierArg(): TradeDeskLoadRealtimeChannelTier[] {
  const raw = process.argv.find((arg) => arg.startsWith('--tier='))?.split('=')[1];
  if (!raw) return [...TRADE_DESK_LOAD_REALTIME_CHANNEL_TIERS];
  const tier = Number(raw);
  if (!TRADE_DESK_LOAD_REALTIME_CHANNEL_TIERS.includes(tier as TradeDeskLoadRealtimeChannelTier)) {
    throw new Error(`--tier must be one of ${TRADE_DESK_LOAD_REALTIME_CHANNEL_TIERS.join(', ')}`);
  }
  return [tier as TradeDeskLoadRealtimeChannelTier];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTier(
  tier: TradeDeskLoadRealtimeChannelTier,
): Promise<TradeDeskLoadRealtimeSoakMetrics> {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (read-only anon only).');
  }

  const soakMs = Number(
    process.env['PHONARA_REALTIME_SOAK_MS'] ?? TRADE_DESK_LOAD_REALTIME_SOAK_MS,
  );
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let subscribedCount = 0;
  let channelErrors = 0;
  let oracleEvents = 0;
  const channels: RealtimeChannel[] = [];

  for (let i = 0; i < tier; i += 1) {
    const channel = client
      .channel(`p3c-oracle-soak-${tier}-${i}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oracle_prices' }, () => {
        oracleEvents += 1;
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') subscribedCount += 1;
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') channelErrors += 1;
      });
    channels.push(channel);
  }

  await sleep(soakMs);

  await Promise.all(channels.map((channel) => client.removeChannel(channel)));

  return {
    tier,
    channelCount: tier,
    subscribedCount,
    channelErrors,
    oracleEvents,
    soakMs,
  };
}

async function main(): Promise<void> {
  const tiers = parseTierArg();
  const results: TradeDeskLoadRealtimeSoakMetrics[] = [];

  for (const tier of tiers) {
    const metrics = await runTier(tier);
    const verdict = evaluateTradeDeskLoadRealtimeSoak(metrics);
    results.push(metrics);

    console.log(
      `[p3c-realtime-soak] tier=${tier} subscribed=${metrics.subscribedCount}/${metrics.channelCount} errors=${metrics.channelErrors} oracle_events=${metrics.oracleEvents} soak_ms=${metrics.soakMs} pass=${verdict.pass}`,
    );
    if (!verdict.pass) {
      console.error(`[p3c-realtime-soak] FAIL tier=${tier}: ${verdict.reasons.join('; ')}`);
    }
  }

  const summary = {
    todo: 'p3-load-realtime',
    tiers: results.map((metrics) => ({
      metrics,
      verdict: evaluateTradeDeskLoadRealtimeSoak(metrics),
    })),
  };

  console.log(JSON.stringify(summary, null, 2));

  const allPass = summary.tiers.every((row) => row.verdict.pass);
  process.exit(allPass ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error('[p3c-realtime-soak] fatal', error);
  process.exit(1);
});
