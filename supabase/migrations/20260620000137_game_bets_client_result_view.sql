-- LAW 1 back door — mask outcome-leak game results on client table reads.
-- Full result_payload remains on game_bets for settlement / reveal / admin (service_role).

SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION _deepshaft_client_result(p_full_result JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_full_result IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object(
    'reachedDepth', p_full_result->'reachedDepth',
    'caveIn', p_full_result->'caveIn',
    'totalMultiplier', p_full_result->'totalMultiplier',
    'won', p_full_result->'won'
  );
END;
$$;

REVOKE ALL ON FUNCTION _deepshaft_client_result(JSONB) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _game_bets_client_result_payload(
  p_game game_code,
  p_full JSONB,
  p_selection JSONB,
  p_seed_revealed BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hit BOOLEAN;
BEGIN
  IF p_full IS NULL THEN
    RETURN NULL;
  END IF;

  CASE p_game
    WHEN 'mines' THEN
      v_hit := COALESCE((p_full->>'hitMine')::BOOLEAN, FALSE);
      IF _mines_is_terminal(p_selection, v_hit) THEN
        RETURN p_full;
      END IF;
      RETURN _mines_client_result(p_full, p_selection);

    WHEN 'deepshaft' THEN
      IF p_seed_revealed THEN
        RETURN p_full;
      END IF;
      RETURN _deepshaft_client_result(p_full);

    ELSE
      RETURN p_full;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION _game_bets_client_result_payload(game_code, JSONB, JSONB, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION _game_bets_client_result_payload(game_code, JSONB, JSONB, BOOLEAN)
  TO authenticated;

DROP VIEW IF EXISTS v_game_bets_client;

CREATE VIEW v_game_bets_client
WITH (security_invoker = false)
AS
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

REVOKE ALL ON v_game_bets_client FROM PUBLIC, anon;
REVOKE SELECT ON game_bets FROM authenticated;
GRANT SELECT ON v_game_bets_client TO authenticated;

-- game_rounds public view must not expose full pre-reveal outcomes cross-user.
CREATE OR REPLACE VIEW v_game_rounds_public
WITH (security_invoker = true)
AS
SELECT
  gr.id,
  gr.game,
  gr.server_seed_hash,
  gr.status,
  NULL::JSONB AS result_payload,
  gr.created_at,
  gr.settled_at
FROM game_rounds gr;

-- Extend rpc_place_game_bet client sanitization to Deepshaft bet responses.
DO $$
DECLARE
  v_def TEXT;
  v_new TEXT;
BEGIN
  v_def := pg_get_functiondef('public.rpc_place_game_bet(uuid,text,text,jsonb,text,text,jsonb)'::regprocedure);

  IF position('''deepshaft''::game_code THEN _deepshaft_client_result' IN v_def) = 0 THEN
    v_new := replace(
      v_def,
      'v_client_result := CASE WHEN v_round.game = ''mines''::game_code
    THEN _mines_client_result(v_result, p_selection)
    ELSE v_result END;',
      'v_client_result := CASE
    WHEN v_round.game = ''mines''::game_code THEN _mines_client_result(v_result, p_selection)
    WHEN v_round.game = ''deepshaft''::game_code THEN _deepshaft_client_result(v_result)
    ELSE v_result END;'
    );
    IF v_new = v_def THEN RAISE EXCEPTION 'deepshaft bet response anchor not found'; END IF;
    v_def := v_new;
  END IF;

  IF position('''deepshaft''::game_code THEN _deepshaft_client_result(v_existing.result_payload)' IN v_def) = 0 THEN
    v_new := replace(
      v_def,
      '''result'', CASE WHEN v_existing.game = ''mines''::game_code
        THEN _mines_client_result(v_existing.result_payload, v_existing.selection)
        ELSE v_existing.result_payload END',
      '''result'', CASE
        WHEN v_existing.game = ''mines''::game_code
          THEN _mines_client_result(v_existing.result_payload, v_existing.selection)
        WHEN v_existing.game = ''deepshaft''::game_code
          THEN _deepshaft_client_result(v_existing.result_payload)
        ELSE v_existing.result_payload END'
    );
    IF v_new = v_def THEN RAISE EXCEPTION 'deepshaft idempotency anchor not found'; END IF;
    v_def := v_new;
  END IF;

  EXECUTE v_def;
END;
$$;
