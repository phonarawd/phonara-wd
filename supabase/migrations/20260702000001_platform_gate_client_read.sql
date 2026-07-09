-- Client-visible platform kill switches for usePlatformGates (UI §D gate states).
-- Rows remain read-only for anon/authenticated via is_public RLS; values are not secrets.

SET search_path = public, pg_temp;

UPDATE app_config
   SET is_public = TRUE,
       updated_at = NOW()
 WHERE key IN (
   'system_halt',
   'system_readonly',
   'feature_game_enabled',
   'feature_spot_enabled',
   'feature_futures_enabled',
   'feature_staking_enabled',
   'feature_deposit_enabled',
   'feature_withdrawal_enabled',
   'feature_sports_enabled'
 );
