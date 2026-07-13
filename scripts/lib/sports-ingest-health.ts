import { resolveServiceClient } from './sports-engine-client';
import type { IngestHealthRecord } from '@phonara/sports-ingest';

export async function recordIngestHealth(record: IngestHealthRecord): Promise<void> {
  const client = resolveServiceClient();
  const { error } = await client.rpc('rpc_record_sports_ingest_health', {
    p_payload: {
      channel: record.channel,
      leagueCode: record.leagueCode,
      vendor: record.vendor ?? null,
      status: record.status,
      lastSuccessAt: record.lastSuccessAt ?? null,
      lastErrorAt: record.lastErrorAt ?? null,
      lastError: record.lastError ?? null,
      lagMs: record.lagMs ?? null,
      messagesProcessed: record.messagesProcessed ?? 0,
      metadata: record.metadata ?? {},
    },
  });

  if (error) {
    throw new Error(`[sports-ingest-health] record failed: ${error.message}`);
  }
}

export async function syncSportsIngestOpsAlerts(input: {
  readonly restStaleMs: number;
  readonly wsStaleMs: number;
  readonly settleStaleMs: number;
}): Promise<{ opened: number; resolved: number }> {
  const client = resolveServiceClient();
  const { data, error } = await client.rpc('rpc_sync_sports_ingest_ops_alerts', {
    p_rest_stale_ms: input.restStaleMs,
    p_ws_stale_ms: input.wsStaleMs,
    p_settle_stale_ms: input.settleStaleMs,
  });

  if (error) {
    throw new Error(`[sports-ingest-health] ops alert sync failed: ${error.message}`);
  }

  const payload = data as { opened?: number; resolved?: number } | null;
  return {
    opened: payload?.opened ?? 0,
    resolved: payload?.resolved ?? 0,
  };
}

/**
 * Wave 1 (sb-w1-health-sla-migration): reads via `rpc_get_sports_ingest_health`,
 * which recomputes freshness from `last_success_at` at query time instead of
 * trusting the raw stored `status` column (which never re-evaluates itself
 * once a worker stops writing — the "healthy for 662h" bug).
 */
export async function loadIngestHealthLag(
  channel: string,
  leagueCode = '_all',
): Promise<{ lastSuccessAt: string | null; lagMs: number | null; status: string } | null> {
  const client = resolveServiceClient();
  const { data, error } = await client.rpc('rpc_get_sports_ingest_health', {
    p_channel: channel,
    p_league_code: leagueCode,
  });

  if (error) {
    throw new Error(`[sports-ingest-health] load failed: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    last_success_at: string | null;
    lag_ms: number | null;
    status: string;
  }>;
  const row = rows[0];
  if (!row) return null;

  return {
    lastSuccessAt: row.last_success_at,
    lagMs: row.lag_ms,
    status: row.status,
  };
}
