-- Platform SQL CI closeout 2 — sports SELECT merge · M-20 R4-b initplan re-wrap (8 tables)
-- Follow-up to 20260822000001_platform_sql_ci_closeout.sql

SET search_path = public, pg_temp;

-- ── 1. sports_sport_catalog: single permissive SELECT (public + service_role) ─────────────
DROP POLICY IF EXISTS "service_role read sports_sport_catalog" ON public.sports_sport_catalog;

DROP POLICY IF EXISTS "sports_sport_catalog: public read" ON public.sports_sport_catalog;
CREATE POLICY "sports_sport_catalog: public read"
  ON public.sports_sport_catalog
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

-- ── 2. M-20 R4-b: re-wrap bare auth.uid() on all 8 targeted hot tables ───────────────────
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

DROP POLICY IF EXISTS "co_mission_claims: consolidated select" ON public.co_mission_claims;
CREATE POLICY "co_mission_claims: consolidated select"
  ON public.co_mission_claims
  FOR SELECT
  USING (((select auth.uid()) = user_id) OR _is_admin());

DROP POLICY IF EXISTS "co_mission_sessions: consolidated select" ON public.co_mission_sessions;
CREATE POLICY "co_mission_sessions: consolidated select"
  ON public.co_mission_sessions
  FOR SELECT
  USING (
    ((select auth.uid()) = initiator_id)
    OR ((select auth.uid()) = partner_id)
    OR _is_admin()
  );

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
