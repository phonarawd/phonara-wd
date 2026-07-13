-- ============================================================
-- Wave 4 (CAS-CFG-01) — casino per-game house exposure caps ≤ global cap
-- ============================================================
-- Plan: 스포츠 무료 실배당 완결 로드맵 · sb-w4-casino-exposure-cap
--
-- `_assert_game_exposure_cap` (20260609000029_s3_casino_atomic_settlement.sql)
-- checks a bet's max possible payout against THREE caps:
--   casino_max_payout_<ccy>              (per-bet ceiling)
--   casino_house_exposure_cap_<ccy>      (global total ceiling)
--   casino_<game>_house_exposure_cap_<ccy> (per-game ceiling, defaults to the
--                                            global cap when the config row is
--                                            absent — see _app_config_numeric
--                                            fallback in that function)
--
-- Six games (deepshaft, momentum, mint_reels, gold_rush, roulette, blackjack)
-- were seeded with an explicit sentinel `999999999` for their per-game cap —
-- because the row EXISTS, the fallback-to-global-cap never applies, and the
-- per-game ceiling is effectively disabled (999999999 always passes). This
-- migration re-caps every one of those rows to the existing global ceiling
-- (`casino_house_exposure_cap_phon` / `_usdt`), restoring defense-in-depth
-- without inventing new unreviewed business limits.
-- ============================================================

SET search_path = public, pg_temp;

DO $mig$
DECLARE
  v_global_phon NUMERIC := (SELECT value::NUMERIC FROM app_config WHERE key = 'casino_house_exposure_cap_phon');
  v_global_usdt NUMERIC := (SELECT value::NUMERIC FROM app_config WHERE key = 'casino_house_exposure_cap_usdt');
BEGIN
  IF v_global_phon IS NULL OR v_global_usdt IS NULL THEN
    RAISE EXCEPTION 'casino_house_exposure_cap_phon/usdt global caps must exist before this migration';
  END IF;

  UPDATE app_config
     SET value = v_global_phon::TEXT, updated_at = NOW()
   WHERE key LIKE 'casino_%_house_exposure_cap_phon'
     AND key <> 'casino_house_exposure_cap_phon'
     AND value::NUMERIC > v_global_phon;

  UPDATE app_config
     SET value = v_global_usdt::TEXT, updated_at = NOW()
   WHERE key LIKE 'casino_%_house_exposure_cap_usdt'
     AND key <> 'casino_house_exposure_cap_usdt'
     AND value::NUMERIC > v_global_usdt;
END
$mig$;
