-- ============================================================
-- Advisor fix: v_game_bets_client — security_invoker wrapper + SD row fn
-- Preserves direct game_bets SELECT denial for authenticated.
-- ============================================================

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _game_bets_client_rows()
RETURNS TABLE (
  id UUID,
  round_id UUID,
  user_id UUID,
  game game_code,
  currency currency,
  stake TEXT,
  selection JSONB,
  client_seed TEXT,
  nonce INT,
  result_payload JSONB,
  payout TEXT,
  status bet_status,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  stake_lock_id UUID,
  payout_ledger_id UUID,
  house_ledger_transfer_id UUID,
  parity_hold BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    gb.id,
    gb.round_id,
    gb.user_id,
    gb.game,
    gb.currency,
    gb.stake,
    gb.selection,
    gb.client_seed,
    gb.nonce,
    _game_bets_client_result_payload(
      gb.game,
      gb.result_payload,
      gb.selection,
      EXISTS (
        SELECT 1
        FROM game_seed_reveals gsr
        WHERE gsr.round_id = gb.round_id
      )
    ) AS result_payload,
    gb.payout,
    gb.status,
    gb.idempotency_key,
    gb.created_at,
    gb.settled_at,
    gb.stake_lock_id,
    gb.payout_ledger_id,
    gb.house_ledger_transfer_id,
    gb.parity_hold
  FROM game_bets gb
  WHERE gb.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION _game_bets_client_rows() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION _game_bets_client_rows() TO authenticated;

DROP VIEW IF EXISTS v_game_bets_client;

CREATE VIEW v_game_bets_client
WITH (security_invoker = true)
AS
SELECT * FROM _game_bets_client_rows();

REVOKE ALL ON v_game_bets_client FROM PUBLIC, anon;
GRANT SELECT ON v_game_bets_client TO authenticated;
