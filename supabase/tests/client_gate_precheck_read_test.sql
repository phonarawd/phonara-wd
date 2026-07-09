-- Client gate precheck read parity (PQA F2 · consent · MFA · geo · per-game)
BEGIN;

DO $$
DECLARE
  v_expected TEXT[] := ARRAY[
    'consent_gate_enabled',
    'withdrawal_mfa_step_up_enabled',
    'geo_block_enabled',
    'feature_game_crash_enabled',
    'feature_game_limbo_enabled',
    'feature_game_dice_enabled',
    'feature_game_mines_enabled',
    'feature_game_hilo_enabled',
    'feature_game_plinko_enabled',
    'feature_game_mint_reels_enabled',
    'feature_game_gold_rush_enabled',
    'feature_game_roulette_enabled',
    'feature_game_blackjack_enabled',
    'feature_game_deepshaft_enabled',
    'feature_game_momentum_enabled'
  ];
  v_key TEXT;
  v_is_public BOOLEAN;
  v_anon_count INT;
BEGIN
  FOREACH v_key IN ARRAY v_expected LOOP
    SELECT is_public INTO v_is_public FROM app_config WHERE key = v_key;
    ASSERT v_is_public IS TRUE,
      format('app_config.%s must be is_public for client gate precheck parity', v_key);
  END LOOP;

  PERFORM set_config('request.jwt.claims', '{}', true);
  SET ROLE anon;
  SELECT COUNT(*) INTO v_anon_count
    FROM app_config
   WHERE key = ANY(v_expected);
  RESET ROLE;

  ASSERT v_anon_count = array_length(v_expected, 1),
    format('anon must read all %s client gate keys, got %s', array_length(v_expected, 1), v_anon_count);

  RAISE NOTICE 'client_gate_precheck_read OK — % keys public + readable', array_length(v_expected, 1);
END;
$$;

ROLLBACK;
