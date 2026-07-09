-- Client-visible server gate flags for useClientGatePrechecks (PQA F2 · P2-GATE-01–03 · per-game).
-- Values are operator toggles, not secrets — read-only via is_public RLS.

SET search_path = public, pg_temp;

UPDATE app_config
   SET is_public = TRUE,
       updated_at = NOW()
 WHERE key IN (
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
 );
