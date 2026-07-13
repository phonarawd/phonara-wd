-- M-20 / Platform audit R4-c — consolidate multiple permissive SELECT policies
-- Meaning-preserving OR merge only (own|participant OR _is_admin). No GRANT widen.

SET search_path = public, pg_temp;

-- co_mission_claims
DROP POLICY IF EXISTS "co_mission_claims: admin select" ON public.co_mission_claims;
DROP POLICY IF EXISTS "co_mission_claims: own select" ON public.co_mission_claims;
CREATE POLICY "co_mission_claims: consolidated select"
  ON public.co_mission_claims
  FOR SELECT
  USING (((select auth.uid()) = user_id) OR _is_admin());

-- co_mission_sessions
DROP POLICY IF EXISTS "co_mission_sessions: admin select" ON public.co_mission_sessions;
DROP POLICY IF EXISTS "co_mission_sessions: participant select" ON public.co_mission_sessions;
CREATE POLICY "co_mission_sessions: consolidated select"
  ON public.co_mission_sessions
  FOR SELECT
  USING (
    ((select auth.uid()) = initiator_id)
    OR ((select auth.uid()) = partner_id)
    OR _is_admin()
  );

-- p2p_transfers
DROP POLICY IF EXISTS "p2p_transfers: admin select" ON public.p2p_transfers;
DROP POLICY IF EXISTS "p2p_transfers: participant select" ON public.p2p_transfers;
CREATE POLICY "p2p_transfers: consolidated select"
  ON public.p2p_transfers
  FOR SELECT
  USING (
    ((select auth.uid()) = sender_id)
    OR ((select auth.uid()) = recipient_id)
    OR _is_admin()
  );

-- trading_api_keys
DROP POLICY IF EXISTS "trading_api_keys: admin select" ON public.trading_api_keys;
DROP POLICY IF EXISTS "trading_api_keys: own select" ON public.trading_api_keys;
CREATE POLICY "trading_api_keys: consolidated select"
  ON public.trading_api_keys
  FOR SELECT
  USING (((select auth.uid()) = user_id) OR _is_admin());

-- whale_mission_claims
DROP POLICY IF EXISTS "whale_mission_claims: admin select" ON public.whale_mission_claims;
DROP POLICY IF EXISTS "whale_mission_claims: own select" ON public.whale_mission_claims;
CREATE POLICY "whale_mission_claims: consolidated select"
  ON public.whale_mission_claims
  FOR SELECT
  USING (((select auth.uid()) = user_id) OR _is_admin());

-- sports_sport_catalog — merge identical anon/authenticated public reads
DROP POLICY IF EXISTS "anon read sports_sport_catalog" ON public.sports_sport_catalog;
DROP POLICY IF EXISTS "authenticated read sports_sport_catalog" ON public.sports_sport_catalog;
CREATE POLICY "sports_sport_catalog: public read"
  ON public.sports_sport_catalog
  FOR SELECT
  TO anon, authenticated
  USING (true);
