import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readLocalSupabaseEnv } from './db-connect';

export function resolveServiceClient(): SupabaseClient {
  const local = readLocalSupabaseEnv();
  const url = process.env['SUPABASE_URL'] ?? local?.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const key =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ??
    local?.SUPABASE_SERVICE_ROLE_KEY ??
    process.env['SUPABASE_SECRET_KEY'] ??
    '';

  if (!key) {
    throw new Error('[sports-engine] SUPABASE_SERVICE_ROLE_KEY required.');
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function recordScoreQuorumMismatch(
  client: SupabaseClient,
  input: {
    canonicalFixtureId: string;
    leagueCode: string;
    primaryHome: number;
    primaryAway: number;
    secondaryHome: number;
    secondaryAway: number;
    primarySource?: string;
    secondarySource?: string;
  },
): Promise<void> {
  const { error } = await client.rpc('rpc_record_sports_score_quorum_mismatch', {
    p_canonical_fixture_id: input.canonicalFixtureId,
    p_league_code: input.leagueCode,
    p_primary_home: input.primaryHome,
    p_primary_away: input.primaryAway,
    p_secondary_home: input.secondaryHome,
    p_secondary_away: input.secondaryAway,
    p_primary_source: input.primarySource ?? 'primary',
    p_secondary_source: input.secondarySource ?? 'secondary',
  });
  if (error) throw new Error(error.message);
}

export async function ingestFixtureStatus(
  client: SupabaseClient,
  input: {
    canonicalFixtureId: string;
    status: string;
    homeGoals?: number | null;
    awayGoals?: number | null;
    suspendMs?: number;
    reason?: string;
    autoSettle?: boolean;
  },
): Promise<unknown> {
  const { data, error } = await client.rpc('rpc_ingest_sports_fixture_status', {
    p_canonical_fixture_id: input.canonicalFixtureId,
    p_status: input.status,
    p_home_goals: input.homeGoals ?? null,
    p_away_goals: input.awayGoals ?? null,
    p_suspend_ms: input.suspendMs ?? null,
    p_reason: input.reason ?? null,
    p_auto_settle: input.autoSettle ?? true,
  });
  if (error) throw new Error(error.message);
  return data;
}
