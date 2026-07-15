-- Platform SQL CI closeout — rpc_place_game_bet overload · sports_sport_catalog RLS · R4-b initplan
-- Fixes CI sql job regressions after m20_r4c / ew_e23 (branch phase-r/platform-integrity-2026-07-11)

SET search_path = public, pg_temp;

-- ── 1. Drop ambiguous 7-arg rpc_place_game_bet wrapper (8-arg with defaults is canonical) ──
DROP FUNCTION IF EXISTS rpc_place_game_bet(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB);

-- ── 2. sports_sport_catalog: remove ALL+SELECT permissive overlap ─────────────────────────
DROP POLICY IF EXISTS "service_role all sports_sport_catalog" ON public.sports_sport_catalog;

DROP POLICY IF EXISTS "service_role read sports_sport_catalog" ON public.sports_sport_catalog;
CREATE POLICY "service_role read sports_sport_catalog"
  ON public.sports_sport_catalog
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "service_role insert sports_sport_catalog" ON public.sports_sport_catalog;
CREATE POLICY "service_role insert sports_sport_catalog"
  ON public.sports_sport_catalog
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role update sports_sport_catalog" ON public.sports_sport_catalog;
CREATE POLICY "service_role update sports_sport_catalog"
  ON public.sports_sport_catalog
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role delete sports_sport_catalog" ON public.sports_sport_catalog;
CREATE POLICY "service_role delete sports_sport_catalog"
  ON public.sports_sport_catalog
  FOR DELETE
  TO service_role
  USING (true);

-- ── 3. M-20 R4-b residual: wrap bare auth.uid() on hot tables (post ew_e8/e9/e10) ───────
DROP POLICY IF EXISTS "app_install_attributions: own select" ON public.app_install_attributions;
CREATE POLICY "app_install_attributions: own select"
  ON public.app_install_attributions
  FOR SELECT
  USING (((select auth.uid()) = user_id) OR _is_admin());

DROP POLICY IF EXISTS "co bet own claims select" ON public.co_bet_claims;
CREATE POLICY "co bet own claims select"
  ON public.co_bet_claims
  FOR SELECT
  TO authenticated
  USING (((select auth.uid()) = user_id) OR _is_admin());

DROP POLICY IF EXISTS "co bet participants select" ON public.co_bet_sessions;
CREATE POLICY "co bet participants select"
  ON public.co_bet_sessions
  FOR SELECT
  TO authenticated
  USING (((select auth.uid()) IN (initiator_id, partner_id)) OR _is_admin());

DROP POLICY IF EXISTS "crypto_deposit_addresses: consolidated select" ON public.crypto_deposit_addresses;
CREATE POLICY "crypto_deposit_addresses: consolidated select"
  ON public.crypto_deposit_addresses
  FOR SELECT
  USING (((select auth.uid()) = user_id) OR _is_admin());

DROP POLICY IF EXISTS "crypto_deposit_requests: consolidated select" ON public.crypto_deposit_requests;
CREATE POLICY "crypto_deposit_requests: consolidated select"
  ON public.crypto_deposit_requests
  FOR SELECT
  USING (((select auth.uid()) = user_id) OR _is_admin());

DROP POLICY IF EXISTS "giftcard_redeem: own select" ON public.giftcard_redeem_requests;
CREATE POLICY "giftcard_redeem: own select"
  ON public.giftcard_redeem_requests
  FOR SELECT
  USING (((select auth.uid()) = user_id) OR _is_admin());

DROP POLICY IF EXISTS "giftcard_redeem: admin update" ON public.giftcard_redeem_requests;
CREATE POLICY "giftcard_redeem: admin update"
  ON public.giftcard_redeem_requests
  FOR UPDATE
  USING (_is_admin());
