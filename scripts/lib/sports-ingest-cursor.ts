import { resolveServiceClient } from './sports-engine-client';

export interface IngestCursorRow {
  readonly vendor: string;
  readonly league_code: string;
  readonly last_seq: string | null;
  readonly last_success: string | null;
}

export async function loadIngestCursor(
  vendor: string,
  leagueCode: string,
): Promise<IngestCursorRow | null> {
  const client = resolveServiceClient();
  const { data, error } = await client
    .from('sports_ingest_cursors')
    .select('vendor, league_code, last_seq, last_success')
    .eq('vendor', vendor)
    .eq('league_code', leagueCode)
    .maybeSingle();

  if (error) {
    throw new Error(`[sports-ingest-cursor] load failed: ${error.message}`);
  }
  return data as IngestCursorRow | null;
}

export async function saveIngestCursor(
  vendor: string,
  leagueCode: string,
  lastSeq: number,
): Promise<void> {
  const client = resolveServiceClient();
  const now = new Date().toISOString();
  const { error } = await client.from('sports_ingest_cursors').upsert(
    {
      vendor,
      league_code: leagueCode,
      last_seq: String(lastSeq),
      last_success: now,
      updated_at: now,
    },
    { onConflict: 'vendor,league_code' },
  );

  if (error) {
    throw new Error(`[sports-ingest-cursor] save failed: ${error.message}`);
  }
}

export const ODDS_API_IO_WS_CURSOR = {
  vendor: 'odds-api-io',
  leagueCode: 'ws',
} as const;
