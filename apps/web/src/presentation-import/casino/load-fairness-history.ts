import { verifyRound, type GameCode, type VerifyResult } from '@phonara/game-engine';
import type { FairnessUiEvidence, RoundCommitment } from '../../components/games/shared/types';
import { supabase } from '../../lib/supabase';

export type FairnessHistoryRow = {
  betId: string;
  roundId: string;
  game: GameCode;
  clientSeed: string;
  nonce: number;
  selection: Record<string, unknown>;
  outcome: 'won' | 'lost';
  serverSeedHash: string;
  serverSeed: string;
  result: Record<string, unknown>;
  settledAt: string | null;
  commitment: RoundCommitment;
  sheetVerification: FairnessUiEvidence | null;
};

function mapSheetVerification(
  serverSeedHash: string,
  serverSeed: string,
  verified: VerifyResult,
): FairnessUiEvidence {
  return {
    ok: verified.seedHashMatch && (verified.resultMatch ?? true),
    hmac: serverSeedHash,
    cursor: 0,
    serverSeed,
  };
}

/** Read-only PF history — sanitized bet rows; full results via reveal RPC. */
export async function loadFairnessHistory(): Promise<FairnessHistoryRow[]> {
  const { data: bets, error } = await supabase
    .from('v_game_bets_client')
    .select(
      'id, round_id, game, client_seed, nonce, selection, result_payload, status, settled_at',
    )
    .in('status', ['won', 'lost'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !bets?.length) return [];

  const roundIds = [...new Set(bets.map((b) => b.round_id as string))];

  const [{ data: reveals }, { data: rounds }] = await Promise.all([
    supabase.from('game_seed_reveals').select('round_id, server_seed').in('round_id', roundIds),
    supabase.from('v_game_rounds_public').select('id, server_seed_hash').in('id', roundIds),
  ]);

  const revealByRound = new Map(
    (reveals ?? []).map((r) => [r.round_id as string, r.server_seed as string]),
  );
  const hashByRound = new Map(
    (rounds ?? []).map((r) => [r.id as string, r.server_seed_hash as string]),
  );

  const rows: FairnessHistoryRow[] = [];

  for (const bet of bets) {
    const roundId = bet.round_id as string;
    const serverSeed = revealByRound.get(roundId);
    const serverSeedHash = hashByRound.get(roundId);
    if (!serverSeed || !serverSeedHash) continue;

    const { data: revealedRound } = await supabase.rpc('rpc_reveal_game_round', {
      p_round_id: roundId,
    });
    const revealPayload = revealedRound as { result?: Record<string, unknown> } | null;
    const result = (revealPayload?.result ??
      bet.result_payload ??
      {}) as Record<string, unknown>;
    const selection = (bet.selection ?? {}) as Record<string, unknown>;
    const game = bet.game as GameCode;
    const status = bet.status as string;

    let sheetVerification: FairnessUiEvidence | null;
    try {
      const verified = await verifyRound({
        game,
        serverSeed,
        serverSeedHash,
        clientSeed: bet.client_seed as string,
        nonce: (bet.nonce as number) ?? 1,
        selection,
        expectedResult: result,
      });
      sheetVerification = mapSheetVerification(serverSeedHash, serverSeed, verified);
    } catch {
      sheetVerification = null;
    }

    rows.push({
      betId: bet.id as string,
      roundId,
      game,
      clientSeed: bet.client_seed as string,
      nonce: (bet.nonce as number) ?? 1,
      selection,
      outcome: status === 'won' ? 'won' : 'lost',
      serverSeedHash,
      serverSeed,
      result,
      settledAt: (bet.settled_at as string | null) ?? null,
      commitment: { round_id: roundId, server_seed_hash: serverSeedHash },
      sheetVerification,
    });
  }

  return rows;
}

export function truncateSeed(value: string): string {
  if (value.length <= 12) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
