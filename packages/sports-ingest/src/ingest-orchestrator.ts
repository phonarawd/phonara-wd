import type { IngestChannel, IngestHealthStatus } from './ingest-orchestrator-types';

export type { IngestChannel, IngestHealthStatus } from './ingest-orchestrator-types';

export interface OrchestratorScheduleConfig {
  readonly restIntervalMs: number;
  readonly settleIntervalMs: number;
  readonly alertSyncIntervalMs: number;
  readonly restStaleMs: number;
  readonly wsStaleMs: number;
  readonly settleStaleMs: number;
  readonly wsEnabled: boolean;
}

export interface ChannelTickState {
  readonly lastRunAtMs: number | null;
  readonly lastSuccessAtMs: number | null;
}

export function computeLagMs(lastSuccessAtMs: number | null, nowMs: number): number | null {
  if (lastSuccessAtMs === null) return null;
  return Math.max(0, nowMs - lastSuccessAtMs);
}

export function evaluateIngestHealthStatus(input: {
  readonly lagMs: number | null;
  readonly staleMs: number;
  readonly errored: boolean;
  readonly disabled: boolean;
}): IngestHealthStatus {
  if (input.disabled) return 'disabled';
  if (input.errored) return 'error';
  if (input.lagMs === null) return 'degraded';
  if (input.lagMs > input.staleMs) return 'stale';
  if (input.lagMs > input.staleMs / 2) return 'degraded';
  return 'healthy';
}

export function shouldRunScheduledTick(
  lastRunAtMs: number | null,
  intervalMs: number,
  nowMs: number,
): boolean {
  if (intervalMs <= 0) return false;
  if (lastRunAtMs === null) return true;
  return nowMs - lastRunAtMs >= intervalMs;
}

export function staleMsForChannel(
  channel: IngestChannel,
  config: OrchestratorScheduleConfig,
): number {
  if (channel === 'rest') return config.restStaleMs;
  if (channel === 'ws') return config.wsStaleMs;
  if (channel === 'settle') return config.settleStaleMs;
  return config.restStaleMs;
}

export function parseOrchestratorScheduleFromEnv(
  env: Record<string, string | undefined>,
): OrchestratorScheduleConfig {
  const wsKey = env['ODDS_API_IO_KEY']?.trim();
  return {
    restIntervalMs: Number(env['SPORTS_REST_INTERVAL_MS'] ?? '300000'),
    settleIntervalMs: Number(env['SPORTS_SETTLE_INTERVAL_MS'] ?? '900000'),
    alertSyncIntervalMs: Number(env['SPORTS_OPS_ALERT_INTERVAL_MS'] ?? '600000'),
    restStaleMs: Number(env['SPORTS_REST_STALE_MS'] ?? '900000'),
    wsStaleMs: Number(env['SPORTS_WS_STALE_MS'] ?? '180000'),
    settleStaleMs: Number(env['SPORTS_SETTLE_STALE_MS'] ?? '3600000'),
    wsEnabled: env['SPORTS_ORCHESTRATOR_WS'] !== 'false' && Boolean(wsKey),
  };
}

export function nextWakeDelayMs(
  states: Readonly<Record<IngestChannel, ChannelTickState>>,
  config: OrchestratorScheduleConfig,
  nowMs: number,
): number {
  const candidates: number[] = [5_000];

  if (shouldRunScheduledTick(states.rest.lastRunAtMs, config.restIntervalMs, nowMs)) {
    candidates.push(0);
  } else if (states.rest.lastRunAtMs !== null) {
    candidates.push(config.restIntervalMs - (nowMs - states.rest.lastRunAtMs));
  }

  if (shouldRunScheduledTick(states.settle.lastRunAtMs, config.settleIntervalMs, nowMs)) {
    candidates.push(0);
  } else if (states.settle.lastRunAtMs !== null) {
    candidates.push(config.settleIntervalMs - (nowMs - states.settle.lastRunAtMs));
  }

  const positive = candidates.filter((ms) => ms >= 0);
  return Math.min(...positive, 60_000);
}
