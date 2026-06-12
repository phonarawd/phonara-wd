import { supabase } from '../lib/supabase';
import type { Json } from '@phonara/shared-types';

export async function setSystemMode(input: {
  halt: boolean;
  readonly: boolean;
  reason: string;
}): Promise<void> {
  const { error } = await supabase.rpc('rpc_set_system_mode', {
    p_halt: input.halt,
    p_readonly: input.readonly,
    p_reason: input.reason,
  });
  if (error) throw new Error(error.message);
}

export async function setFeatureEnabled(input: {
  feature: string;
  enabled: boolean;
  reason: string;
}): Promise<void> {
  const { error } = await supabase.rpc('rpc_set_feature_enabled', {
    p_feature: input.feature,
    p_enabled: input.enabled,
    p_reason: input.reason,
  });
  if (error) throw new Error(error.message);
}

export async function syncOpsAlertsFromHealth(): Promise<void> {
  const { error } = await supabase.rpc('rpc_sync_ops_alerts_from_health');
  if (error) throw new Error(error.message);
}

export async function ackOpsAlert(input: { alertId: string; reason: string }): Promise<void> {
  const { error } = await supabase.rpc('rpc_ack_ops_alert', {
    p_alert_id: input.alertId,
    p_reason: input.reason,
  });
  if (error) throw new Error(error.message);
}

export async function resolveOpsAlert(input: { alertId: string; reason: string }): Promise<void> {
  const { error } = await supabase.rpc('rpc_resolve_ops_alert', {
    p_alert_id: input.alertId,
    p_reason: input.reason,
  });
  if (error) throw new Error(error.message);
}

export async function getOpsHealthRaw(): Promise<Json> {
  const { data, error } = await supabase.rpc('rpc_get_ops_health');
  if (error) throw error;
  return data;
}

export async function getOpsAlertsRaw(statuses?: string[]): Promise<Json> {
  const { data, error } = statuses
    ? await supabase.rpc('rpc_get_ops_alerts', { p_statuses: statuses })
    : await supabase.rpc('rpc_get_ops_alerts');
  if (error) throw error;
  return data;
}
