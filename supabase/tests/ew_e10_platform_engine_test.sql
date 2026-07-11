-- E10 Platform Engine SQL integration tests.
BEGIN;

-- E10-0: schema, config, and RPC surface.
DO $$
BEGIN
  ASSERT EXISTS(SELECT 1 FROM app_config WHERE key='feature_krw_deposit_proof_enabled'),'KRW proof feature missing';
  ASSERT EXISTS(SELECT 1 FROM app_config WHERE key='feature_mission_chains_enabled'),'mission chains feature missing';
  ASSERT EXISTS(SELECT 1 FROM app_config WHERE key='feature_co_bet_enabled'),'co-bet feature missing';
  ASSERT EXISTS(SELECT 1 FROM app_config WHERE key='feature_ml_mission_recommend_enabled'),'recommend feature missing';
  ASSERT to_regclass('public.mission_chains') IS NOT NULL,'mission_chains missing';
  ASSERT to_regclass('public.mission_chain_steps') IS NOT NULL,'mission_chain_steps missing';
  ASSERT to_regclass('public.co_bet_sessions') IS NOT NULL,'co_bet_sessions missing';
  ASSERT to_regclass('public.co_bet_claims') IS NOT NULL,'co_bet_claims missing';
  ASSERT _is_reward_issuance_reason('co_bet_reward'),'co-bet issuance reason missing';
  ASSERT EXISTS(SELECT 1 FROM pg_proc WHERE proname='rpc_attach_krw_deposit_proof'),'proof RPC missing';
  ASSERT EXISTS(SELECT 1 FROM pg_proc WHERE proname='rpc_list_mission_chains'),'chain RPC missing';
  ASSERT EXISTS(SELECT 1 FROM pg_proc WHERE proname='rpc_invite_co_bet'),'invite RPC missing';
  ASSERT EXISTS(SELECT 1 FROM pg_proc WHERE proname='rpc_recommend_missions'),'recommend RPC missing';
  RAISE NOTICE 'E10-0 OK — schema/config/RPCs';
END; $$;

-- E10-1: proof attach/review has no ledger effect and anonymous callers cannot attach.
DO $$
DECLARE u UUID:=gen_random_uuid(); a UUID:=gen_random_uuid(); d UUID:=gen_random_uuid(); w UUID; path TEXT; r JSONB; n_before BIGINT; n_after BIGINT;
BEGIN
 INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES
  (u,'authenticated','authenticated','e10_proof_u_'||u||'@t.local',NOW(),NOW()),
  (a,'authenticated','authenticated','e10_proof_a_'||a||'@t.local',NOW(),NOW());
 UPDATE profiles SET role='admin' WHERE id=a; SELECT id INTO w FROM wallets WHERE user_id=u;
 UPDATE app_config SET value='false' WHERE key IN('system_halt','system_readonly','consent_gate_enabled');
 UPDATE app_config SET value='true' WHERE key='feature_krw_deposit_proof_enabled';
 INSERT INTO krw_deposit_requests(id,user_id,wallet_id,reference_code,amount_krw,status)
 VALUES(d,u,w,'E10P'||replace(d::TEXT,'-',''),'10000.000000','pending');
 path:=u::TEXT||'/proof.png'; INSERT INTO storage.objects(bucket_id,name,owner,metadata) VALUES('krw-deposit-proofs',path,u,'{}');
 SELECT count(*) INTO n_before FROM wallet_ledger WHERE user_id=u;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',u::TEXT,'role','authenticated')::TEXT,true); SET LOCAL ROLE authenticated;
 r:=rpc_attach_krw_deposit_proof(d,path,'e10-proof-1'); ASSERT COALESCE((r->>'ok')::BOOLEAN,false),format('attach %s',r);
 r:=rpc_attach_krw_deposit_proof(d,path,'e10-proof-1'); ASSERT COALESCE((r->>'idempotent')::BOOLEAN,false),'attach must be idempotent';
 RESET ROLE; PERFORM set_config('request.jwt.claims',json_build_object('sub',a::TEXT,'role','authenticated','aal','aal2')::TEXT,true); SET LOCAL ROLE authenticated;
 r:=rpc_admin_review_krw_deposit_proof(d,'approved','bank receipt reviewed'); ASSERT r->>'proof_status'='approved',format('review %s',r); ASSERT COALESCE((r->>'credited')::BOOLEAN,true) IS FALSE,'review credits forbidden';
 RESET ROLE; PERFORM set_config('request.jwt.claims','{}',true);
 SELECT count(*) INTO n_after FROM wallet_ledger WHERE user_id=u; ASSERT n_after=n_before,'proof path must create no ledger rows';
 SET LOCAL ROLE anon; BEGIN PERFORM rpc_attach_krw_deposit_proof(d,path,'e10-proof-anon'); RAISE EXCEPTION 'anon attach must fail'; EXCEPTION WHEN OTHERS THEN NULL; END; RESET ROLE;
 RAISE NOTICE 'E10-1 OK — proof no ledger';
END; $$;

-- E10-2: chain progression unlocks the successor after predecessor claim.
DO $$
DECLARE u UUID:=gen_random_uuid(); r JSONB;
BEGIN
 INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES(u,'authenticated','authenticated','e10_chain_'||u||'@t.local',NOW(),NOW());
 UPDATE app_config SET value='true' WHERE key='feature_mission_chains_enabled';
 PERFORM set_config('request.jwt.claims',json_build_object('sub',u::TEXT,'role','authenticated')::TEXT,true); SET LOCAL ROLE authenticated;
 r:=rpc_get_mission_chain_status('onboarding_viral'); ASSERT COALESCE((r->'steps'->0->>'unlocked')::BOOLEAN,false),'first step unlocked';
 ASSERT COALESCE((r->'steps'->1->>'unlocked')::BOOLEAN,false) IS FALSE,'second starts locked';
 RESET ROLE; PERFORM set_config('request.jwt.claims','{}',true);
 INSERT INTO viral_mission_claims(user_id,mission,window_key,phon_awarded) VALUES(u,'share_referral_link','day:'||to_char(NOW() AT TIME ZONE 'UTC','YYYY-MM-DD')||':e10','0.000000');
 PERFORM set_config('request.jwt.claims',json_build_object('sub',u::TEXT,'role','authenticated')::TEXT,true); SET LOCAL ROLE authenticated;
 r:=rpc_get_mission_chain_status('onboarding_viral'); ASSERT COALESCE((r->'steps'->1->>'unlocked')::BOOLEAN,false),'second unlocks';
 RESET ROLE; PERFORM set_config('request.jwt.claims','{}',true);
 RAISE NOTICE 'E10-2 OK — chain progression';
END; $$;

-- E10-3: always invite/accept; seed a minimal fixture if the stack has none, then link/complete when a market is available.
DO $$
DECLARE a UUID:=gen_random_uuid(); b UUID:=gen_random_uuid(); stranger UUID:=gen_random_uuid(); f UUID; m UUID; o UUID; s UUID; ba UUID:=gen_random_uuid(); bb UUID:=gen_random_uuid(); r JSONB;
  a_before NUMERIC; b_before NUMERIC; sys_before NUMERIC; a_after NUMERIC; b_after NUMERIC; sys_after NUMERIC;
BEGIN
 SELECT f0.id INTO f FROM sports_fixtures f0 ORDER BY f0.kickoff_at DESC LIMIT 1;
 IF f IS NULL THEN
   f:=gen_random_uuid();
   INSERT INTO sports_fixtures(id,canonical_fixture_id,league_code,home_name,away_name,kickoff_at,status)
   VALUES(f,'e10-'||replace(f::TEXT,'-',''),'E10','E10 Home','E10 Away',NOW()+INTERVAL '1 day','scheduled');
 END IF;
 SELECT m0.id,o0.id INTO m,o FROM sports_markets m0 JOIN sports_outcomes o0 ON o0.market_id=m0.id WHERE m0.fixture_id=f LIMIT 1;
 IF m IS NULL THEN
   m:=gen_random_uuid(); o:=gen_random_uuid();
   INSERT INTO sports_markets(id,fixture_id,canonical_market_id,market_type,status) VALUES(m,f,'e10-m-'||replace(m::TEXT,'-',''),'match_result','open');
   INSERT INTO sports_outcomes(id,market_id,canonical_outcome_id,selection) VALUES(o,m,'e10-o-'||replace(o::TEXT,'-',''),'home');
 END IF;
 INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES
  (a,'authenticated','authenticated','e10_co_a_'||a||'@t.local',NOW(),NOW()),
  (b,'authenticated','authenticated','e10_co_b_'||b||'@t.local',NOW(),NOW()),
  (stranger,'authenticated','authenticated','e10_co_s_'||stranger||'@t.local',NOW(),NOW());
 PERFORM _affiliate_create_relationship(b,a);
 UPDATE app_config SET value='false' WHERE key IN('system_halt','system_readonly','consent_gate_enabled');
 UPDATE app_config SET value='true' WHERE key='feature_co_bet_enabled'; UPDATE app_config SET value='25.000000' WHERE key='co_bet_reward_phon';
 PERFORM set_config('request.jwt.claims',json_build_object('sub',a::TEXT,'role','authenticated')::TEXT,true); SET LOCAL ROLE authenticated;
 BEGIN PERFORM rpc_invite_co_bet(stranger,f); RAISE EXCEPTION 'unlinked invite must fail'; EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%co_bet_not_linked%' THEN RAISE; END IF; END;
 r:=rpc_invite_co_bet(b,f); ASSERT COALESCE((r->>'ok')::BOOLEAN,false),format('invite %s',r); s:=(r->>'session_id')::UUID;
 RESET ROLE; PERFORM set_config('request.jwt.claims',json_build_object('sub',b::TEXT,'role','authenticated')::TEXT,true); SET LOCAL ROLE authenticated;
 r:=rpc_accept_co_bet(s); ASSERT r->>'status'='active',format('accept %s',r);
 BEGIN PERFORM rpc_complete_co_bet(s); RAISE EXCEPTION 'complete without bets must fail'; EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%co_bet_bets_incomplete%' THEN RAISE; END IF; END;
 RESET ROLE; PERFORM set_config('request.jwt.claims','{}',true);
 INSERT INTO sports_bets(id,user_id,currency,stake,combined_odds,potential_payout,status,idempotency_key) VALUES
  (ba,a,'PHON','1.000000','2.000000','2.000000','pending','e10-co-a-'||s),
  (bb,b,'PHON','1.000000','2.000000','2.000000','pending','e10-co-b-'||s);
 INSERT INTO sports_bet_legs(bet_id,outcome_id,fixture_id,odds_at_bet) VALUES(ba,o,f,'2.000000'),(bb,o,f,'2.000000');
 SELECT phon_available::NUMERIC INTO a_before FROM wallets WHERE user_id=a; SELECT phon_available::NUMERIC INTO b_before FROM wallets WHERE user_id=b;
 SELECT balance::NUMERIC INTO sys_before FROM system_accounts WHERE code='reward_issuance_phon';
 PERFORM set_config('request.jwt.claims',json_build_object('sub',a::TEXT,'role','authenticated')::TEXT,true); SET LOCAL ROLE authenticated; r:=rpc_link_co_bet_bet(s,ba); ASSERT COALESCE((r->>'initiator_bet_linked')::BOOLEAN,false),'initiator links';
 RESET ROLE; PERFORM set_config('request.jwt.claims',json_build_object('sub',b::TEXT,'role','authenticated')::TEXT,true); SET LOCAL ROLE authenticated; r:=rpc_link_co_bet_bet(s,bb); ASSERT COALESCE((r->>'partner_bet_linked')::BOOLEAN,false),'partner links'; r:=rpc_complete_co_bet(s); ASSERT r->>'status'='completed',format('complete %s',r);
 RESET ROLE; PERFORM set_config('request.jwt.claims','{}',true);
 SELECT phon_available::NUMERIC INTO a_after FROM wallets WHERE user_id=a; SELECT phon_available::NUMERIC INTO b_after FROM wallets WHERE user_id=b; SELECT balance::NUMERIC INTO sys_after FROM system_accounts WHERE code='reward_issuance_phon';
 ASSERT a_after-a_before=25,format('initiator delta %s',a_after-a_before); ASSERT b_after-b_before=25,format('partner delta %s',b_after-b_before);
 ASSERT sys_before-sys_after=50,format('system delta must be 50, got %s',sys_before-sys_after);
 ASSERT (SELECT count(*)=2 FROM co_bet_claims WHERE session_id=s),'two claims required';
 RAISE NOTICE 'E10-3 OK — invite/accept/link/complete and conservation';
END; $$;

-- E10-4: recommendations are structured and the feature kill switch works.
DO $$
DECLARE u UUID:=gen_random_uuid(); r JSONB;
BEGIN
 INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES(u,'authenticated','authenticated','e10_rec_'||u||'@t.local',NOW(),NOW());
 UPDATE app_config SET value='true' WHERE key='feature_ml_mission_recommend_enabled';
 PERFORM set_config('request.jwt.claims',json_build_object('sub',u::TEXT,'role','authenticated')::TEXT,true); SET LOCAL ROLE authenticated;
 r:=rpc_recommend_missions(5); ASSERT COALESCE((r->>'ok')::BOOLEAN,false),format('recommend %s',r); ASSERT jsonb_typeof(r->'recommendations')='array','recommendations array';
 RESET ROLE; UPDATE app_config SET value='false' WHERE key='feature_ml_mission_recommend_enabled';
 PERFORM set_config('request.jwt.claims',json_build_object('sub',u::TEXT,'role','authenticated')::TEXT,true); SET LOCAL ROLE authenticated;
 BEGIN PERFORM rpc_recommend_missions(5); RAISE EXCEPTION 'kill switch must deny'; EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%feature_disabled%' THEN RAISE; END IF; END;
 RESET ROLE; PERFORM set_config('request.jwt.claims','{}',true);
 RAISE NOTICE 'E10-4 OK — recommendations';
END; $$;

-- E10-5: direct anonymous and authenticated mutations remain denied.
DO $$
BEGIN
 ASSERT NOT has_table_privilege('anon','public.co_bet_sessions','SELECT'),'anon co-bet select';
 ASSERT NOT has_table_privilege('anon','public.co_bet_claims','SELECT'),'anon co-bet claims select';
 ASSERT NOT has_table_privilege('authenticated','public.co_bet_sessions','INSERT'),'client direct co-bet insert';
 ASSERT NOT has_table_privilege('authenticated','public.mission_chains','INSERT'),'client chain mutation';
 RAISE NOTICE 'E10-5 OK — grants';
END; $$;

ROLLBACK;
