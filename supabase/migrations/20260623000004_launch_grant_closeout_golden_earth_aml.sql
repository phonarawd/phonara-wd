-- ============================================================
-- Grant closeout — Golden Earth + AML tables (post 000079 pattern)
-- ============================================================

SET search_path = public, pg_temp;

REVOKE ALL ON TABLE
  user_earn_vip,
  golden_earth_daily,
  golden_earth_taps,
  golden_earth_global,
  aml_events,
  aml_identity_fingerprints
FROM anon, authenticated;

GRANT SELECT ON user_earn_vip, golden_earth_daily, golden_earth_taps TO authenticated;
GRANT SELECT ON golden_earth_global TO anon, authenticated;
GRANT SELECT ON aml_events TO authenticated;
