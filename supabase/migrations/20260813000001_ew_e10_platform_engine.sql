-- ============================================================
-- Migration: ew_e10_platform_engine
-- E10 Platform Engine — KRW proof · mission chains · co-bet · recommendations
-- Plan: ew-e10-platform-engine-wave · ADR-020
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO app_config (key, value, description) VALUES
  ('feature_krw_deposit_proof_enabled','true','KRW deposit proof kill switch.'),
  ('feature_mission_chains_enabled','true','Mission chain unlock kill switch.'),
  ('feature_co_bet_enabled','true','Affiliate co-bet kill switch.'),
  ('feature_ml_mission_recommend_enabled','true','Mission recommendation kill switch.'),
  ('co_bet_reward_phon','25.000000','PHON reward per completed co-bet participant.')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION rpc_set_feature_enabled(
  p_feature TEXT,
  p_enabled BOOLEAN,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_key TEXT;
  v_rows INT;
BEGIN
  IF NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF p_feature NOT IN (
    'spot','futures','staking','game','referral','deposit','withdrawal',
    'p2p_transfer','giftcard_redeem',
    'siwe_login','support_tickets','product_analytics','app_install_mission',
    'krw_deposit_proof','mission_chains','co_bet','ml_mission_recommend'
  ) THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  v_key := 'feature_' || p_feature || '_enabled';
  UPDATE app_config
     SET value = CASE WHEN p_enabled THEN 'true' ELSE 'false' END,
         updated_at = NOW()
   WHERE key = v_key;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'invalid_feature' USING HINT = p_feature;
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, payload)
  VALUES (
    v_actor, 'feature_toggle', 'app_config',
    jsonb_build_object('feature', p_feature, 'enabled', p_enabled, 'reason', p_reason)
  );
  RETURN jsonb_build_object('feature', p_feature, 'enabled', p_enabled);
END;
$$;

REVOKE ALL ON FUNCTION rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_set_feature_enabled(TEXT, BOOLEAN, TEXT)
  TO authenticated, service_role;

INSERT INTO rpc_rate_limit_configs (rpc_name,capacity,refill_rate,cost,window_sec) VALUES
  ('rpc_attach_krw_deposit_proof',10,0.2,1,60),('rpc_invite_co_bet',10,0.2,1,60),
  ('rpc_accept_co_bet',10,0.2,1,60),('rpc_link_co_bet_bet',20,0.4,1,60),
  ('rpc_complete_co_bet',10,0.2,1,60),('rpc_recommend_missions',30,0.5,1,60)
ON CONFLICT (rpc_name) DO NOTHING;

ALTER TABLE krw_deposit_requests
  ADD COLUMN IF NOT EXISTS proof_path TEXT,
  ADD COLUMN IF NOT EXISTS proof_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS proof_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_review_note TEXT;
ALTER TABLE krw_deposit_requests DROP CONSTRAINT IF EXISTS krw_deposit_requests_proof_path_chk;
ALTER TABLE krw_deposit_requests ADD CONSTRAINT krw_deposit_requests_proof_path_chk
  CHECK (proof_path IS NULL OR proof_path ~ '^[0-9a-f-]{36}/proof\.(jpg|jpeg|png|webp)$');
ALTER TABLE krw_deposit_requests DROP CONSTRAINT IF EXISTS krw_deposit_requests_proof_status_chk;
ALTER TABLE krw_deposit_requests ADD CONSTRAINT krw_deposit_requests_proof_status_chk
  CHECK (proof_status IN ('none','pending','approved','rejected'));

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES
  ('krw-deposit-proofs','krw-deposit-proofs',false,5242880,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=EXCLUDED.public,file_size_limit=EXCLUDED.file_size_limit,
  allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "krw proof own insert" ON storage.objects;
CREATE POLICY "krw proof own insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id='krw-deposit-proofs' AND (storage.foldername(name))[1]=auth.uid()::TEXT
  AND name ~ ('^' || auth.uid()::TEXT || '/proof\.(jpg|jpeg|png|webp)$'));
DROP POLICY IF EXISTS "krw proof own update" ON storage.objects;
CREATE POLICY "krw proof own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='krw-deposit-proofs' AND (storage.foldername(name))[1]=auth.uid()::TEXT)
  WITH CHECK (bucket_id='krw-deposit-proofs' AND (storage.foldername(name))[1]=auth.uid()::TEXT);
DROP POLICY IF EXISTS "krw proof owner admin select" ON storage.objects;
CREATE POLICY "krw proof owner admin select" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id='krw-deposit-proofs' AND ((storage.foldername(name))[1]=auth.uid()::TEXT OR _is_admin()));

CREATE OR REPLACE FUNCTION _assert_krw_deposit_proof_path_owned(p_user_id UUID,p_path TEXT)
RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp,storage AS $$
BEGIN
  IF p_path IS NULL OR p_path !~ ('^'||p_user_id::TEXT||'/proof\.(jpg|jpeg|png|webp)$') THEN
    RAISE EXCEPTION 'krw_deposit_proof_path_invalid';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='krw-deposit-proofs' AND name=p_path) THEN
    RAISE EXCEPTION 'krw_deposit_proof_not_uploaded';
  END IF;
END; $$;
REVOKE ALL ON FUNCTION _assert_krw_deposit_proof_path_owned(UUID,TEXT) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION rpc_attach_krw_deposit_proof(p_deposit_id UUID,p_proof_path TEXT,p_client_request_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp,storage AS $$
DECLARE v_uid UUID:=auth.uid(); v_row krw_deposit_requests%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM _assert_feature_enabled('krw_deposit_proof'); PERFORM _assert_system_live();
  PERFORM _assert_account_activity_live(v_uid); PERFORM _enforce_rate_limit(v_uid,'rpc_attach_krw_deposit_proof');
  INSERT INTO rpc_request_idem(user_id,client_request_id,rpc_name) VALUES(v_uid,p_client_request_id,'rpc_attach_krw_deposit_proof')
    ON CONFLICT(user_id,client_request_id) DO NOTHING;
  IF NOT FOUND THEN
    SELECT * INTO v_row FROM krw_deposit_requests WHERE id=p_deposit_id AND user_id=v_uid;
    IF FOUND AND v_row.proof_path=p_proof_path THEN
      RETURN jsonb_build_object('ok',true,'deposit_id',v_row.id,'proof_status',v_row.proof_status,'idempotent',true);
    END IF;
    RAISE EXCEPTION 'duplicate_request';
  END IF;
  SELECT * INTO v_row FROM krw_deposit_requests WHERE id=p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'krw_deposit_not_found'; END IF;
  IF v_row.user_id<>v_uid THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF v_row.status<>'pending' THEN RAISE EXCEPTION 'krw_deposit_not_pending'; END IF;
  IF v_row.proof_status IN ('approved','rejected') THEN RAISE EXCEPTION 'krw_deposit_proof_already_reviewed'; END IF;
  PERFORM _assert_krw_deposit_proof_path_owned(v_uid,p_proof_path);
  UPDATE krw_deposit_requests SET proof_path=p_proof_path,proof_uploaded_at=NOW(),proof_status='pending',
    proof_reviewed_at=NULL,proof_review_note=NULL,updated_at=NOW() WHERE id=v_row.id RETURNING * INTO v_row;
  RETURN jsonb_build_object('ok',true,'deposit_id',v_row.id,'proof_status',v_row.proof_status);
END; $$;
REVOKE ALL ON FUNCTION rpc_attach_krw_deposit_proof(UUID,TEXT,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_attach_krw_deposit_proof(UUID,TEXT,TEXT) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION rpc_admin_review_krw_deposit_proof(p_deposit_id UUID,p_decision TEXT,p_reason TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_actor UUID:=auth.uid(); v_row krw_deposit_requests%ROWTYPE; v_decision TEXT:=lower(btrim(p_decision));
BEGIN
  IF v_actor IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF v_decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'krw_deposit_proof_decision_invalid'; END IF;
  IF NULLIF(btrim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'reason_required'; END IF;
  SELECT * INTO v_row FROM krw_deposit_requests WHERE id=p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'krw_deposit_not_found'; END IF;
  IF v_row.proof_path IS NULL OR v_row.proof_status='none' THEN RAISE EXCEPTION 'krw_deposit_proof_missing'; END IF;
  IF v_row.proof_status IN ('approved','rejected') THEN
    RETURN jsonb_build_object('ok',true,'deposit_id',v_row.id,'proof_status',v_row.proof_status,'idempotent',true);
  END IF;
  UPDATE krw_deposit_requests SET proof_status=v_decision,proof_reviewed_at=NOW(),proof_review_note=p_reason,
    updated_at=NOW() WHERE id=v_row.id RETURNING * INTO v_row;
  INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,payload) VALUES
    (v_actor,'krw_deposit_proof_review','krw_deposit_requests',v_row.id,
     jsonb_build_object('decision',v_decision,'reason',p_reason,'ledger_credit_created',false));
  RETURN jsonb_build_object('ok',true,'deposit_id',v_row.id,'proof_status',v_row.proof_status,'credited',false);
END; $$;
REVOKE ALL ON FUNCTION rpc_admin_review_krw_deposit_proof(UUID,TEXT,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_admin_review_krw_deposit_proof(UUID,TEXT,TEXT) TO authenticated,service_role;

CREATE TABLE IF NOT EXISTS mission_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),chain_key TEXT NOT NULL UNIQUE,title_i18n_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS mission_chain_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),chain_id UUID NOT NULL REFERENCES mission_chains(id) ON DELETE CASCADE,
  step_order INT NOT NULL CHECK(step_order>0),catalog_key TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chain_id,step_order),UNIQUE(chain_id,catalog_key));
ALTER TABLE mission_chains ENABLE ROW LEVEL SECURITY; ALTER TABLE mission_chain_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission chains select" ON mission_chains; CREATE POLICY "mission chains select" ON mission_chains FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS "mission chain steps select" ON mission_chain_steps; CREATE POLICY "mission chain steps select" ON mission_chain_steps FOR SELECT TO authenticated USING(true);
REVOKE ALL ON mission_chains,mission_chain_steps FROM PUBLIC,anon,authenticated;
GRANT SELECT ON mission_chains,mission_chain_steps TO authenticated; GRANT ALL ON mission_chains,mission_chain_steps TO service_role;
INSERT INTO mission_chains(chain_key,title_i18n_key) VALUES('onboarding_viral','missions.chains.onboardingViral.title') ON CONFLICT(chain_key) DO NOTHING;
INSERT INTO mission_chain_steps(chain_id,step_order,catalog_key)
SELECT c.id,v.n,v.k FROM mission_chains c CROSS JOIN (VALUES(1,'viral:share_referral_link'),(2,'viral:invite_friend_signup'),(3,'viral:viral_streak_share')) v(n,k)
WHERE c.chain_key='onboarding_viral' ON CONFLICT(chain_id,step_order) DO UPDATE SET catalog_key=EXCLUDED.catalog_key;

CREATE OR REPLACE FUNCTION _mission_chain_step_unlocked(p_user_id UUID,p_chain_id UUID,p_step_order INT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT COALESCE((SELECT c.enabled AND (SELECT value::BOOLEAN FROM app_config WHERE key='feature_mission_chains_enabled')
   AND (p_step_order=1 OR EXISTS(SELECT 1 FROM mission_chain_steps prev JOIN viral_mission_claims vmc
     ON vmc.user_id=p_user_id AND vmc.mission::TEXT=substring(prev.catalog_key FROM 7)
     WHERE prev.chain_id=c.id AND prev.step_order=p_step_order-1))
 FROM mission_chains c WHERE c.id=p_chain_id),false); $$;
REVOKE ALL ON FUNCTION _mission_chain_step_unlocked(UUID,UUID,INT) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION _assert_mission_chain_claimable(p_user_id UUID,p_mission viral_mission_code)
RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r RECORD;
BEGIN
 IF COALESCE((SELECT value::BOOLEAN FROM app_config WHERE key='feature_mission_chains_enabled'),false) IS NOT TRUE THEN RETURN; END IF;
 FOR r IN SELECT s.chain_id,s.step_order FROM mission_chain_steps s JOIN mission_chains c ON c.id=s.chain_id
  WHERE c.enabled AND s.catalog_key='viral:'||p_mission::TEXT LOOP
   IF NOT _mission_chain_step_unlocked(p_user_id,r.chain_id,r.step_order) THEN RAISE EXCEPTION 'mission_chain_locked'; END IF;
 END LOOP;
END; $$;
REVOKE ALL ON FUNCTION _assert_mission_chain_claimable(UUID,viral_mission_code) FROM PUBLIC,anon,authenticated;

-- E2 compatibility: un-catalogued legacy missions remain claimable before chain enforcement.
CREATE OR REPLACE FUNCTION _assert_mission_catalog_claimable(p_mission viral_mission_code)
RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_key TEXT:='viral:'||p_mission::TEXT; v_enabled BOOLEAN; v_exposure TEXT;
BEGIN
 SELECT enabled,exposure INTO v_enabled,v_exposure FROM mission_catalog WHERE catalog_key=v_key;
 IF NOT FOUND THEN RETURN; END IF;
 IF COALESCE(v_enabled,false) IS NOT TRUE THEN RAISE EXCEPTION 'mission_disabled'; END IF;
 IF COALESCE(v_exposure,'hidden')<>'live' THEN RAISE EXCEPTION 'mission_hidden'; END IF;
 IF auth.uid() IS NOT NULL THEN PERFORM _assert_mission_chain_claimable(auth.uid(),p_mission); END IF;
END; $$;
REVOKE ALL ON FUNCTION _assert_mission_catalog_claimable(viral_mission_code) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION rpc_list_mission_chains()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_chains JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  PERFORM _assert_feature_enabled('mission_chains');

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'chain_key', c.chain_key,
      'title_i18n_key', c.title_i18n_key,
      'enabled', c.enabled,
      'steps', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'step_order', s.step_order,
            'catalog_key', s.catalog_key,
            'unlocked', _mission_chain_step_unlocked(v_uid, c.id, s.step_order)
          ) ORDER BY s.step_order
        ), '[]'::JSONB)
        FROM mission_chain_steps s
        WHERE s.chain_id = c.id
      )
    ) ORDER BY c.created_at, c.chain_key
  ), '[]'::JSONB)
  INTO v_chains
  FROM mission_chains c
  WHERE c.enabled IS TRUE;

  RETURN jsonb_build_object('ok', TRUE, 'chains', v_chains);
END;
$$;
CREATE OR REPLACE FUNCTION rpc_get_mission_chain_status(p_chain_key TEXT) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r JSONB;
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF; PERFORM _assert_feature_enabled('mission_chains');
 SELECT jsonb_build_object('ok',true,'chain_key',c.chain_key,'steps',(SELECT jsonb_agg(jsonb_build_object('step_order',s.step_order,'catalog_key',s.catalog_key,'unlocked',_mission_chain_step_unlocked(auth.uid(),c.id,s.step_order)) ORDER BY s.step_order) FROM mission_chain_steps s WHERE s.chain_id=c.id)) INTO r FROM mission_chains c WHERE c.chain_key=p_chain_key;
 IF r IS NULL THEN RAISE EXCEPTION 'mission_chain_not_found'; END IF; RETURN r; END; $$;
REVOKE ALL ON FUNCTION rpc_list_mission_chains(),rpc_get_mission_chain_status(TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_list_mission_chains(),rpc_get_mission_chain_status(TEXT) TO authenticated,service_role;

CREATE TABLE IF NOT EXISTS co_bet_sessions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),initiator_id UUID NOT NULL REFERENCES profiles(id),partner_id UUID NOT NULL REFERENCES profiles(id),
 fixture_id UUID NOT NULL REFERENCES sports_fixtures(id),window_key TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','active','completed','cancelled','expired')),
 initiator_bet_id UUID REFERENCES sports_bets(id),partner_bet_id UUID REFERENCES sports_bets(id),completed_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(initiator_id<>partner_id),UNIQUE(initiator_id,partner_id,fixture_id,window_key));
CREATE TABLE IF NOT EXISTS co_bet_claims (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),session_id UUID NOT NULL REFERENCES co_bet_sessions(id),user_id UUID NOT NULL REFERENCES profiles(id),
 window_key TEXT NOT NULL,ledger_entry_id UUID REFERENCES wallet_ledger(id),claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(user_id,session_id));
ALTER TABLE co_bet_sessions ENABLE ROW LEVEL SECURITY; ALTER TABLE co_bet_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "co bet participants select" ON co_bet_sessions; CREATE POLICY "co bet participants select" ON co_bet_sessions FOR SELECT TO authenticated USING(auth.uid() IN(initiator_id,partner_id) OR _is_admin());
DROP POLICY IF EXISTS "co bet own claims select" ON co_bet_claims; CREATE POLICY "co bet own claims select" ON co_bet_claims FOR SELECT TO authenticated USING(auth.uid()=user_id OR _is_admin());
REVOKE ALL ON co_bet_sessions,co_bet_claims FROM PUBLIC,anon,authenticated; GRANT SELECT ON co_bet_sessions,co_bet_claims TO authenticated; GRANT ALL ON co_bet_sessions,co_bet_claims TO service_role;
CREATE OR REPLACE FUNCTION _co_bet_window() RETURNS TEXT LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$ SELECT 'day:'||to_char(NOW() AT TIME ZONE 'UTC','YYYY-MM-DD'); $$;
CREATE OR REPLACE FUNCTION _grant_co_bet_claim(p_session UUID,p_user UUID,p_window TEXT) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_claim UUID; v_ledger UUID; v_reward TEXT;
BEGIN SELECT id INTO v_claim FROM co_bet_claims WHERE session_id=p_session AND user_id=p_user; IF FOUND THEN RETURN v_claim; END IF;
 SELECT value INTO v_reward FROM app_config WHERE key='co_bet_reward_phon'; IF v_reward IS NULL OR v_reward::NUMERIC<=0 THEN RAISE EXCEPTION 'co_bet_reward_unconfigured'; END IF;
 v_ledger:=_credit_wallet_internal(p_user,'PHON',v_reward,'co_bet_reward','co_bet:'||p_session||':'||p_user);
 INSERT INTO co_bet_claims(session_id,user_id,window_key,ledger_entry_id) VALUES(p_session,p_user,p_window,v_ledger) RETURNING id INTO v_claim; RETURN v_claim; END; $$;
REVOKE ALL ON FUNCTION _co_bet_window(),_grant_co_bet_claim(UUID,UUID,TEXT) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION _is_reward_issuance_reason(p_reason_code TEXT) RETURNS BOOLEAN LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT p_reason_code IN ('welcome_bonus','referral_bonus','daily_claim','roulette_spin','mission_reward','staking_reward','viral_mission_reward','golden_earth_tap','golden_earth_jackpot','golden_earth_tier_upgrade','co_mission_reward','whale_mission_reward','co_bet_reward'); $$;
REVOKE ALL ON FUNCTION _is_reward_issuance_reason(TEXT) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION rpc_invite_co_bet(p_partner_id UUID,p_fixture_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u UUID:=auth.uid(); s co_bet_sessions%ROWTYPE; w TEXT:=_co_bet_window();
BEGIN IF u IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF; IF p_partner_id=u THEN RAISE EXCEPTION 'co_bet_self_forbidden'; END IF;
 PERFORM _assert_feature_enabled('co_bet'); PERFORM _assert_system_live(); PERFORM _assert_account_activity_live(u); PERFORM _assert_onboarding_consent(u); PERFORM _enforce_rate_limit(u,'rpc_invite_co_bet');
 IF NOT _co_mission_partners_linked(u,p_partner_id) THEN RAISE EXCEPTION 'co_bet_not_linked'; END IF; IF NOT EXISTS(SELECT 1 FROM sports_fixtures WHERE id=p_fixture_id) THEN RAISE EXCEPTION 'co_bet_fixture_not_found'; END IF;
 IF EXISTS(SELECT 1 FROM co_bet_sessions WHERE initiator_id=p_partner_id AND partner_id=u AND fixture_id=p_fixture_id AND window_key=w AND status IN('pending','active','completed')) THEN RAISE EXCEPTION 'co_bet_pair_exists'; END IF;
 SELECT * INTO s FROM co_bet_sessions WHERE initiator_id=u AND partner_id=p_partner_id AND fixture_id=p_fixture_id AND window_key=w;
 IF NOT FOUND THEN INSERT INTO co_bet_sessions(initiator_id,partner_id,fixture_id,window_key) VALUES(u,p_partner_id,p_fixture_id,w) RETURNING * INTO s; END IF;
 RETURN jsonb_build_object('ok',true,'session_id',s.id,'status',s.status,'window_key',s.window_key); END; $$;
CREATE OR REPLACE FUNCTION rpc_accept_co_bet(p_session_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u UUID:=auth.uid(); s co_bet_sessions%ROWTYPE;
BEGIN IF u IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF; PERFORM _assert_feature_enabled('co_bet'); PERFORM _assert_system_live(); PERFORM _assert_account_activity_live(u); PERFORM _assert_onboarding_consent(u); PERFORM _enforce_rate_limit(u,'rpc_accept_co_bet');
 SELECT * INTO s FROM co_bet_sessions WHERE id=p_session_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'co_bet_not_found'; END IF; IF s.partner_id<>u THEN RAISE EXCEPTION 'co_bet_not_partner'; END IF; IF s.status='pending' THEN UPDATE co_bet_sessions SET status='active',updated_at=NOW() WHERE id=s.id RETURNING * INTO s; ELSIF s.status<>'active' THEN RAISE EXCEPTION 'co_bet_not_pending'; END IF;
 RETURN jsonb_build_object('ok',true,'session_id',s.id,'status',s.status); END; $$;
CREATE OR REPLACE FUNCTION rpc_link_co_bet_bet(p_session_id UUID,p_bet_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u UUID:=auth.uid(); s co_bet_sessions%ROWTYPE;
BEGIN IF u IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF; PERFORM _assert_feature_enabled('co_bet'); PERFORM _assert_system_live(); PERFORM _assert_account_activity_live(u); PERFORM _assert_onboarding_consent(u); PERFORM _enforce_rate_limit(u,'rpc_link_co_bet_bet');
 SELECT * INTO s FROM co_bet_sessions WHERE id=p_session_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'co_bet_not_found'; END IF; IF s.status<>'active' THEN RAISE EXCEPTION 'co_bet_not_active'; END IF;
 IF u NOT IN(s.initiator_id,s.partner_id) THEN RAISE EXCEPTION 'co_bet_forbidden'; END IF;
 IF NOT EXISTS(SELECT 1 FROM sports_bets b JOIN sports_bet_legs l ON l.bet_id=b.id WHERE b.id=p_bet_id AND b.user_id=u AND l.fixture_id=s.fixture_id) THEN RAISE EXCEPTION 'co_bet_bet_invalid'; END IF;
 IF u=s.initiator_id THEN UPDATE co_bet_sessions SET initiator_bet_id=p_bet_id,updated_at=NOW() WHERE id=s.id RETURNING * INTO s; ELSE UPDATE co_bet_sessions SET partner_bet_id=p_bet_id,updated_at=NOW() WHERE id=s.id RETURNING * INTO s; END IF;
 RETURN jsonb_build_object('ok',true,'session_id',s.id,'initiator_bet_linked',s.initiator_bet_id IS NOT NULL,'partner_bet_linked',s.partner_bet_id IS NOT NULL); END; $$;
CREATE OR REPLACE FUNCTION rpc_complete_co_bet(p_session_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u UUID:=auth.uid(); s co_bet_sessions%ROWTYPE; r TEXT;
BEGIN IF u IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF; PERFORM _assert_feature_enabled('co_bet'); PERFORM _assert_system_live(); PERFORM _assert_account_activity_live(u); PERFORM _assert_onboarding_consent(u); PERFORM _enforce_rate_limit(u,'rpc_complete_co_bet');
 SELECT * INTO s FROM co_bet_sessions WHERE id=p_session_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'co_bet_not_found'; END IF; IF u NOT IN(s.initiator_id,s.partner_id) THEN RAISE EXCEPTION 'co_bet_forbidden'; END IF;
 IF s.status='completed' THEN RETURN jsonb_build_object('ok',true,'session_id',s.id,'status','completed','already_completed',true); END IF;
 IF s.status<>'active' OR s.initiator_bet_id IS NULL OR s.partner_bet_id IS NULL THEN RAISE EXCEPTION 'co_bet_bets_incomplete'; END IF;
 PERFORM _grant_co_bet_claim(s.id,s.initiator_id,s.window_key); PERFORM _grant_co_bet_claim(s.id,s.partner_id,s.window_key); SELECT value INTO r FROM app_config WHERE key='co_bet_reward_phon';
 UPDATE co_bet_sessions SET status='completed',completed_at=NOW(),updated_at=NOW() WHERE id=s.id; RETURN jsonb_build_object('ok',true,'session_id',s.id,'status','completed','phon_awarded',r); END; $$;
CREATE OR REPLACE FUNCTION rpc_get_co_bet_status(p_limit INT DEFAULT 20) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u UUID:=auth.uid();
BEGIN IF u IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF; PERFORM _assert_feature_enabled('co_bet');
 RETURN jsonb_build_object('ok',true,'sessions',COALESCE((SELECT jsonb_agg(jsonb_build_object('session_id',s.id,'fixture_id',s.fixture_id,'status',s.status,'window_key',s.window_key) ORDER BY s.created_at DESC) FROM (SELECT * FROM co_bet_sessions WHERE u IN(initiator_id,partner_id) ORDER BY created_at DESC LIMIT LEAST(GREATEST(COALESCE(p_limit,20),1),100)) s),'[]'::jsonb)); END; $$;
REVOKE ALL ON FUNCTION rpc_invite_co_bet(UUID,UUID),rpc_accept_co_bet(UUID),rpc_link_co_bet_bet(UUID,UUID),rpc_complete_co_bet(UUID),rpc_get_co_bet_status(INT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_invite_co_bet(UUID,UUID),rpc_accept_co_bet(UUID),rpc_link_co_bet_bet(UUID,UUID),rpc_complete_co_bet(UUID),rpc_get_co_bet_status(INT) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION rpc_recommend_missions(p_limit INT DEFAULT 5) RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u UUID:=auth.uid();
BEGIN IF u IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF; PERFORM _assert_feature_enabled('ml_mission_recommend'); PERFORM _enforce_rate_limit(u,'rpc_recommend_missions');
 RETURN jsonb_build_object('ok',true,'recommendations',COALESCE((SELECT jsonb_agg(jsonb_build_object('catalog_key',x.catalog_key,'score',x.score,'reason',x.reason) ORDER BY x.score DESC,x.sort_order) FROM (
 SELECT c.catalog_key,c.sort_order,(1000-c.sort_order+CASE WHEN EXISTS(SELECT 1 FROM mission_chain_steps s JOIN mission_chains ch ON ch.id=s.chain_id WHERE ch.enabled AND s.catalog_key=c.catalog_key AND _mission_chain_step_unlocked(u,ch.id,s.step_order)) THEN 10000 ELSE 0 END)::INT score,
 CASE WHEN EXISTS(SELECT 1 FROM mission_chain_steps s JOIN mission_chains ch ON ch.id=s.chain_id WHERE ch.enabled AND s.catalog_key=c.catalog_key AND _mission_chain_step_unlocked(u,ch.id,s.step_order)) THEN 'unlocked_chain_step' ELSE 'not_claimed_yet' END reason
 FROM mission_catalog c WHERE c.family='viral' AND c.enabled AND c.exposure='live' AND c.mission_code IS NOT NULL AND NOT _mission_catalog_is_forbidden_code(c.mission_code)
 AND NOT EXISTS(SELECT 1 FROM viral_mission_claims vmc WHERE vmc.user_id=u AND vmc.mission::TEXT=c.mission_code) ORDER BY score DESC,c.sort_order LIMIT LEAST(GREATEST(COALESCE(p_limit,5),1),20)) x),'[]'::jsonb)); END; $$;
REVOKE ALL ON FUNCTION rpc_recommend_missions(INT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_recommend_missions(INT) TO authenticated,service_role;
