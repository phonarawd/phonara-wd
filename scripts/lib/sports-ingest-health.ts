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

export async function loadIngestHealthLag(
  channel: string,
  leagueCode = '_all',
): Promise<{ lastSuccessAt: string | null; lagMs: number | null; status: string } | null> {
  const client = resolveServiceClient();
  const { data, error } = await client
    .from('sports_ingest_health')
    .select('last_success_at, lag_ms, status')
    .eq('channel', channel)
    .eq('league_code', leagueCode)
    .maybeSingle();

  if (error) {
    throw new Error(`[sports-ingest-health] load failed: ${error.message}`);
  }

  if (!data) return null;
  const row = data as {
    last_success_at: string | null;
    lag_ms: number | null;
    status: string;
  };

  return {
    lastSuccessAt: row.last_success_at,
    lagMs: row.lag_ms,
    status: row.status,
  };
}
