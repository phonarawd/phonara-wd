-- Sports display tables — consolidate service_role ALL + public SELECT (advisor overlap).
SET search_path = public, pg_temp;

DROP POLICY IF EXISTS "service_role all sports_fixtures" ON sports_fixtures;
DROP POLICY IF EXISTS "sports_fixtures: public read" ON sports_fixtures;
DROP POLICY IF EXISTS "sports_fixtures: consolidated select" ON sports_fixtures;
DROP POLICY IF EXISTS "sports_fixtures: service insert" ON sports_fixtures;
DROP POLICY IF EXISTS "sports_fixtures: service update" ON sports_fixtures;
DROP POLICY IF EXISTS "sports_fixtures: service delete" ON sports_fixtures;
CREATE POLICY "sports_fixtures: consolidated select" ON sports_fixtures
  FOR SELECT USING (TRUE);
CREATE POLICY "sports_fixtures: service insert" ON sports_fixtures
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "sports_fixtures: service update" ON sports_fixtures
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "sports_fixtures: service delete" ON sports_fixtures
  FOR DELETE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role all sports_markets" ON sports_markets;
DROP POLICY IF EXISTS "sports_markets: public read" ON sports_markets;
DROP POLICY IF EXISTS "sports_markets: consolidated select" ON sports_markets;
DROP POLICY IF EXISTS "sports_markets: service insert" ON sports_markets;
DROP POLICY IF EXISTS "sports_markets: service update" ON sports_markets;
DROP POLICY IF EXISTS "sports_markets: service delete" ON sports_markets;
CREATE POLICY "sports_markets: consolidated select" ON sports_markets
  FOR SELECT USING (TRUE);
CREATE POLICY "sports_markets: service insert" ON sports_markets
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "sports_markets: service update" ON sports_markets
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "sports_markets: service delete" ON sports_markets
  FOR DELETE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role all sports_odds_snapshots" ON sports_odds_snapshots;
DROP POLICY IF EXISTS "sports_odds_snapshots: public read" ON sports_odds_snapshots;
DROP POLICY IF EXISTS "sports_odds_snapshots: consolidated select" ON sports_odds_snapshots;
DROP POLICY IF EXISTS "sports_odds_snapshots: service insert" ON sports_odds_snapshots;
DROP POLICY IF EXISTS "sports_odds_snapshots: service update" ON sports_odds_snapshots;
DROP POLICY IF EXISTS "sports_odds_snapshots: service delete" ON sports_odds_snapshots;
CREATE POLICY "sports_odds_snapshots: consolidated select" ON sports_odds_snapshots
  FOR SELECT USING (TRUE);
CREATE POLICY "sports_odds_snapshots: service insert" ON sports_odds_snapshots
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "sports_odds_snapshots: service update" ON sports_odds_snapshots
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "sports_odds_snapshots: service delete" ON sports_odds_snapshots
  FOR DELETE USING (auth.role() = 'service_role');
