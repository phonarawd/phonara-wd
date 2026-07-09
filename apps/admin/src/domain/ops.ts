import { callRpc } from '../lib/rpc';
import { supabase } from '../lib/supabase';
import type { Json } from '@phonara/shared-types';

export async function setSystemMode(input: {
  halt: boolean;
  readonly: boolean;
  reason: string;
}): Promise<void> {
  await callRpc('rpc_set_system_mode', {
    p_halt: input.halt,
    p_readonly: input.readonly,
    p_reason: input.reason,
  });
}

export async function setFeatureEnabled(input: {
  feature: string;
  enabled: boolean;
  reason: string;
}): Promise<void> {
  await callRpc('rpc_set_feature_enabled', {
    p_feature: input.feature,
    p_enabled: input.enabled,
    p_reason: input.reason,
  });
}

export async function syncOpsAlertsFromHealth(): Promise<void> {
  await callRpc('rpc_sync_ops_alerts_from_health');
}

export async function ackOpsAlert(input: { alertId: string; reason: string }): Promise<void> {
  await callRpc('rpc_ack_ops_alert', {
    p_alert_id: input.alertId,
    p_reason: input.reason,
  });
}

export async function resolveOpsAlert(input: { alertId: string; reason: string }): Promise<void> {
  await callRpc('rpc_resolve_ops_alert', {
    p_alert_id: input.alertId,
    p_reason: input.reason,
  });
}

export async function getOpsHealthRaw(): Promise<Json> {
  return await callRpc('rpc_get_ops_health');
}

export async function getOpsAlertsRaw(statuses?: string[]): Promise<Json> {
  return statuses
    ? await callRpc('rpc_get_ops_alerts', { p_statuses: statuses })
    : await callRpc('rpc_get_ops_alerts', {});
}

export async function getOpsDashboardRaw(): Promise<Json> {
  const { data, error } = await supabase.rpc('rpc_admin_get_ops_dashboard' as never);
  if (error) throw error;
  return data as Json;
}

export async function listExceptionQueueRaw(domain?: string, limit?: number): Promise<Json> {
  const { data, error } = await supabase.rpc(
    'rpc_admin_list_exception_queue' as never,
    {
      p_domain: domain ?? null,
      p_limit: limit ?? 50,
    } as never,
  );
  if (error) throw error;
  return data as Json;
}

export async function listAlertThresholdsRaw(): Promise<Json> {
  const { data, error } = await supabase.rpc('rpc_admin_list_alert_thresholds' as never);
  if (error) throw error;
  return data as Json;
}

export async function setAlertThreshold(input: {
  domain: string;
  thresholdKey: string;
  thresholdValue: number;
  windowSeconds: number;
  reason: string;
}): Promise<Json> {
  const { data, error } = await supabase.rpc(
    'rpc_admin_set_alert_threshold' as never,
    {
      p_domain: input.domain,
      p_threshold_key: input.thresholdKey,
      p_threshold_value: input.thresholdValue,
      p_window_seconds: input.windowSeconds,
      p_reason: input.reason,
    } as never,
  );
  if (error) throw error;
  return data as Json;
}

export interface AdminTradeMarketBreakerRow {
  symbol: string;
  isHalted: boolean;
  haltReason: string | null;
  haltedAt: string | null;
  oraclePrice: string | null;
  spotIsActive: boolean | null;
  futuresIsActive: boolean | null;
}

function parseTradeMarketBreakerRow(value: Json): AdminTradeMarketBreakerRow | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const row = value as Record<string, Json | undefined>;
  const symbol = typeof row['symbol'] === 'string' ? row['symbol'] : null;
  if (!symbol) return null;
  return {
    symbol,
    isHalted: row['is_halted'] === true,
    haltReason: typeof row['halt_reason'] === 'string' ? row['halt_reason'] : null,
    haltedAt: typeof row['halted_at'] === 'string' ? row['halted_at'] : null,
    oraclePrice: typeof row['oracle_price'] === 'string' ? row['oracle_price'] : null,
    spotIsActive: typeof row['spot_is_active'] === 'boolean' ? row['spot_is_active'] : null,
    futuresIsActive:
      typeof row['futures_is_active'] === 'boolean' ? row['futures_is_active'] : null,
  };
}

export async function listTradeMarketBreakersRaw(): Promise<AdminTradeMarketBreakerRow[]> {
  const { data, error } = await supabase.rpc('rpc_admin_list_trade_market_breakers' as never);
  if (error) throw error;
  const rows = data as Json[] | null;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => parseTradeMarketBreakerRow(row))
    .filter((row): row is AdminTradeMarketBreakerRow => row !== null);
}

export async function haltTradeMarket(input: { symbol: string; reason: string }): Promise<void> {
  const { error } = await supabase.rpc(
    'rpc_admin_halt_market' as never,
    {
      p_symbol: input.symbol,
      p_reason: input.reason,
    } as never,
  );
  if (error) throw error;
}

export async function resumeTradeMarket(input: { symbol: string; reason: string }): Promise<void> {
  const { error } = await supabase.rpc(
    'rpc_resume_market' as never,
    {
      p_symbol: input.symbol,
      p_reason: input.reason,
    } as never,
  );
  if (error) throw error;
}
