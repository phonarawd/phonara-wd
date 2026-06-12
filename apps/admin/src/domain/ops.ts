import { callRpc } from '../lib/rpc';
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
