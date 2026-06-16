import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { IngestMessage } from '@phonara/sportsbook-engine';
import { readLocalSupabaseEnv } from './db-connect';

function resolveServiceClient(): SupabaseClient {
  const local = readLocalSupabaseEnv();
  const url = process.env['SUPABASE_URL'] ?? local?.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54444';
  const key =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ??
    local?.SUPABASE_SERVICE_ROLE_KEY ??
    process.env['SUPABASE_SECRET_KEY'] ??
    '';

  if (!key) {
    throw new Error(
      '[sports-ingest-persist] SUPABASE_SERVICE_ROLE_KEY required. Run `supabase start` or set env.',
    );
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function persistIngestMessages(messages: readonly IngestMessage[]): Promise<number> {
  if (messages.length === 0) return 0;

  const client = resolveServiceClient();
  const payload = messages.map((message) => serializeC1Message(message));

  const { data, error } = await client.rpc('rpc_ingest_sports_c1_batch', {
    p_messages: payload,
  });

  if (error) {
    throw new Error(`[sports-ingest-persist] batch failed: ${error.message}`);
  }

  const processed = (data as { processed?: number } | null)?.processed ?? messages.length;
  return processed;
}

function serializeC1Message(message: IngestMessage): Record<string, unknown> {
  if (message.type === 'event_upsert') {
    return {
      type: message.type,
      fixture: {
        fixtureId: message.fixture.fixtureId,
        leagueCode: message.fixture.leagueCode,
        homeName: message.fixture.homeName,
        awayName: message.fixture.awayName,
        kickoffAt: message.fixture.kickoffAt,
        status: message.fixture.status,
      },
      markets: message.markets.map((market) => ({
        marketId: market.marketId,
        marketType: market.marketType,
        status: market.status,
        outcomes: market.outcomes.map((outcome) => ({
          outcomeId: outcome.outcomeId,
          selection: outcome.selection,
          line: outcome.line ?? null,
        })),
      })),
    };
  }

  if (message.type === 'odds_upsert') {
    return {
      type: message.type,
      outcomeId: message.outcomeId,
      odds: message.odds,
      capturedAt: message.capturedAt,
    };
  }

  return {
    type: message.type,
    fixtureId: message.fixtureId,
    reason: message.reason,
  };
}
