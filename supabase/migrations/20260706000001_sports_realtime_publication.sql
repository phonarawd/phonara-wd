-- ============================================================
-- Migration: 20260706000001_sports_realtime_publication
-- Phase A sports realtime — display-only push (money-safe read path)
-- ============================================================
-- Adds sports fixtures/markets/odds to supabase_realtime publication.
-- Grants SELECT + public read RLS for anon/authenticated (oracle_prices pattern).
-- service_role ALL policies unchanged; outcomes remain RPC-only direct access.
-- Settlement / place-bet RPCs are not modified.
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Public read RLS (display tables only) ───────────────────────────────────

DROP POLICY IF EXISTS "sports_fixtures: public read" ON sports_fixtures;
CREATE POLICY "sports_fixtures: public read" ON sports_fixtures
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "sports_markets: public read" ON sports_markets;
CREATE POLICY "sports_markets: public read" ON sports_markets
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "sports_odds_snapshots: public read" ON sports_odds_snapshots;
CREATE POLICY "sports_odds_snapshots: public read" ON sports_odds_snapshots
  FOR SELECT USING (TRUE);

GRANT SELECT ON sports_fixtures, sports_markets, sports_odds_snapshots
  TO anon, authenticated;

-- ─── Realtime publication (idempotent) ───────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sports_fixtures'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sports_fixtures;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sports_markets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sports_markets;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sports_odds_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sports_odds_snapshots;
  END IF;
END;
$$;
