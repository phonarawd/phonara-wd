-- ============================================================
-- T2: Affiliate tier snapshots
-- ============================================================
-- Daily snapshots use the affiliate commission graph and RG-clean system ledger
-- activity. Suspicious-volume exclusion is intentionally left for the T6 signal
-- recorder; this slice records deterministic tier evidence only.
-- ============================================================

SET search_path = public, pg_temp;

CREATE TABLE affiliate_tier_configs (
  tier_code TEXT PRIMARY KEY CHECK (tier_code IN ('standard', 'silver', 'gold', 'platinum', 'elite')),
  tier_rank INT NOT NULL UNIQUE CHECK (tier_rank >= 0),
  min_rolling_30d_volume TEXT NOT NULL CHECK (min_rolling_30d_volume ~ '^\d+(\.\d+)?$'),
  min_active_direct_users INT NOT NULL CHECK (min_active_direct_users >= 0),
  direct_commission_bps INT NOT NULL CHECK (direct_commission_bps >= 0),
  override_commission_bps INT NOT NULL CHECK (override_commission_bps >= 0),
  auto_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO affiliate_tier_configs (
  tier_code,
  tier_rank,
  min_rolling_30d_volume,
  min_active_direct_users,
  direct_commission_bps,
  override_commission_bps,
  auto_eligible
) VALUES
  ('standard', 0,  '0.000000',     0,  500, 100, TRUE),
  ('silver',   10, '100.000000',   1,  750, 150, TRUE),
  ('gold',     20, '1000.000000',  1, 1000, 200, TRUE),
  ('platinum', 30, '5000.000000',  3, 1250, 250, TRUE),
  ('elite',    40, '0.000000',     0, 1500, 300, FALSE)
ON CONFLICT (tier_code) DO UPDATE SET
  tier_rank = EXCLUDED.tier_rank,
  min_rolling_30d_volume = EXCLUDED.min_rolling_30d_volume,
  min_active_direct_users = EXCLUDED.min_active_direct_users,
  direct_commission_bps = EXCLUDED.direct_commission_bps,
  override_commission_bps = EXCLUDED.override_commission_bps,
  auto_eligible = EXCLUDED.auto_eligible,
  updated_at = NOW();

CREATE TRIGGER affiliate_tier_configs_updated_at
  BEFORE UPDATE ON affiliate_tier_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE affiliate_elite_overrides (
  affiliate_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) >= 3),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX affiliate_elite_overrides_active_idx
  ON affiliate_elite_overrides (is_active, updated_at DESC);

CREATE TRIGGER affiliate_elite_overrides_updated_at
  BEFORE UPDATE ON affiliate_elite_overrides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE affiliate_tier_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  affiliate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier_code TEXT NOT NULL REFERENCES affiliate_tier_configs(tier_code),
  computed_tier_code TEXT NOT NULL REFERENCES affiliate_tier_configs(tier_code),
  rolling_30d_volume TEXT NOT NULL CHECK (rolling_30d_volume ~ '^\d+(\.\d+)?$'),
  active_direct_users INT NOT NULL CHECK (active_direct_users >= 0),
  affiliate_age_days INT NOT NULL CHECK (affiliate_age_days >= 0),
  is_age_eligible BOOLEAN NOT NULL,
  is_active_eligible BOOLEAN NOT NULL,
  elite_override_active BOOLEAN NOT NULL DEFAULT FALSE,
  demotion_candidate_since DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (snapshot_date, affiliate_id)
);

CREATE INDEX affiliate_tier_snapshots_affiliate_date_idx
  ON affiliate_tier_snapshots (affiliate_id, snapshot_date DESC);
CREATE INDEX affiliate_tier_snapshots_date_tier_idx
  ON affiliate_tier_snapshots (snapshot_date, tier_code);

CREATE TRIGGER affiliate_tier_snapshots_updated_at
  BEFORE UPDATE ON affiliate_tier_snapshots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE affiliate_tier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_elite_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_tier_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_tier_configs: authenticated read"
  ON affiliate_tier_configs FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "affiliate_tier_configs: admin rw"
  ON affiliate_tier_configs FOR ALL
  USING (_is_admin())
  WITH CHECK (_is_admin());

CREATE POLICY "affiliate_elite_overrides: own read"
  ON affiliate_elite_overrides FOR SELECT
  USING (auth.uid() = affiliate_id OR _is_admin());
CREATE POLICY "affiliate_elite_overrides: admin rw"
  ON affiliate_elite_overrides FOR ALL
  USING (_is_admin())
  WITH CHECK (_is_admin());

CREATE POLICY "affiliate_tier_snapshots: own read"
  ON affiliate_tier_snapshots FOR SELECT
  USING (auth.uid() = affiliate_id OR _is_admin());
CREATE POLICY "affiliate_tier_snapshots: admin rw"
  ON affiliate_tier_snapshots FOR ALL
  USING (_is_admin())
  WITH CHECK (_is_admin());

REVOKE ALL ON affiliate_tier_configs, affiliate_elite_overrides, affiliate_tier_snapshots
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON affiliate_tier_configs, affiliate_elite_overrides, affiliate_tier_snapshots
  TO authenticated;
GRANT ALL ON affiliate_tier_configs, affiliate_elite_overrides, affiliate_tier_snapshots
  TO service_role;

CREATE OR REPLACE FUNCTION _affiliate_tier_rank(p_tier_code TEXT)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT tier_rank
    FROM affiliate_tier_configs
   WHERE tier_code = p_tier_code;
$$;

CREATE OR REPLACE FUNCTION _affiliate_computed_tier(
  p_rolling_30d_volume NUMERIC,
  p_active_direct_users INT,
  p_affiliate_age_days INT
)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT tier_code
    FROM affiliate_tier_configs
   WHERE auto_eligible
     AND p_affiliate_age_days >= 14
     AND p_rolling_30d_volume >= min_rolling_30d_volume::NUMERIC
     AND p_active_direct_users >= min_active_direct_users
   ORDER BY tier_rank DESC
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION _affiliate_refresh_tier_snapshots(
  p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_snapshot_date DATE := COALESCE(p_snapshot_date, CURRENT_DATE);
  v_from TIMESTAMPTZ := (COALESCE(p_snapshot_date, CURRENT_DATE)::TIMESTAMPTZ - INTERVAL '30 days');
  v_to TIMESTAMPTZ := ((COALESCE(p_snapshot_date, CURRENT_DATE) + 1)::TIMESTAMPTZ);
  v_rows INT := 0;
BEGIN
  WITH direct_child_volume AS (
    SELECT
      ar.parent_id AS affiliate_id,
      ar.child_id,
      SUM(
        CASE
          WHEN sal.direction = 'credit' THEN sal.amount::NUMERIC
          ELSE -sal.amount::NUMERIC
        END
      ) AS child_volume
    FROM affiliate_relationships ar
    JOIN system_account_ledger sal ON sal.related_user_id = ar.child_id
    WHERE sal.created_at >= v_from
      AND sal.created_at < v_to
      AND (
        (sal.account_code IN ('game_house_phon', 'game_house_usdt')
          AND sal.reason_code = 'game_house_settle')
        OR
        (sal.account_code IN ('house_fee_phon', 'house_fee_usdt', 'insurance_fund_phon', 'insurance_fund_usdt')
          AND sal.reason_code IN ('spot_buy_fee', 'spot_sell_fee', 'futures_open_fee', 'futures_close_fee', 'futures_counterparty'))
      )
      AND NOT _rg_commission_excluded(
        ar.child_id,
        CASE
          WHEN sal.account_code IN ('game_house_phon', 'game_house_usdt') THEN 'game'
          ELSE 'trading'
        END,
        sal.currency,
        sal.created_at
      )
    GROUP BY ar.parent_id, ar.child_id
  ),
  affiliate_volume AS (
    SELECT
      affiliate_id,
      GREATEST(COALESCE(SUM(child_volume), 0), 0) AS rolling_volume,
      COUNT(*) FILTER (WHERE child_volume > 0) AS active_direct_users
    FROM direct_child_volume
    GROUP BY affiliate_id
  ),
  candidates AS (
    SELECT DISTINCT parent_id AS affiliate_id FROM affiliate_relationships
    UNION
    SELECT affiliate_id FROM affiliate_elite_overrides WHERE is_active
  ),
  scored AS (
    SELECT
      c.affiliate_id,
      COALESCE(av.rolling_volume, 0) AS rolling_volume,
      COALESCE(av.active_direct_users, 0)::INT AS active_direct_users,
      GREATEST(0, v_snapshot_date - p.created_at::DATE)::INT AS affiliate_age_days,
      COALESCE(eo.is_active, FALSE) AS elite_override_active,
      COALESCE(
        _affiliate_computed_tier(
          COALESCE(av.rolling_volume, 0),
          COALESCE(av.active_direct_users, 0)::INT,
          GREATEST(0, v_snapshot_date - p.created_at::DATE)::INT
        ),
        'standard'
      ) AS base_computed_tier
    FROM candidates c
    JOIN profiles p ON p.id = c.affiliate_id
    LEFT JOIN affiliate_volume av ON av.affiliate_id = c.affiliate_id
    LEFT JOIN affiliate_elite_overrides eo ON eo.affiliate_id = c.affiliate_id
  ),
  with_previous AS (
    SELECT
      s.*,
      prev.tier_code AS previous_tier_code,
      prev.demotion_candidate_since AS previous_demotion_candidate_since
    FROM scored s
    LEFT JOIN LATERAL (
      SELECT ats.tier_code, ats.demotion_candidate_since
        FROM affiliate_tier_snapshots ats
       WHERE ats.affiliate_id = s.affiliate_id
         AND ats.snapshot_date < v_snapshot_date
       ORDER BY ats.snapshot_date DESC
       LIMIT 1
    ) prev ON TRUE
  ),
  resolved AS (
    SELECT
      wp.*,
      CASE
        WHEN wp.elite_override_active THEN 'elite'
        ELSE wp.base_computed_tier
      END AS computed_tier_code,
      COALESCE(wp.previous_demotion_candidate_since, v_snapshot_date) AS next_demotion_candidate_since
    FROM with_previous wp
  ),
  final_rows AS (
    SELECT
      r.affiliate_id,
      CASE
        WHEN r.elite_override_active THEN 'elite'
        WHEN r.previous_tier_code IS NOT NULL
          AND _affiliate_tier_rank(r.previous_tier_code) > _affiliate_tier_rank(r.computed_tier_code)
          AND v_snapshot_date < (r.next_demotion_candidate_since + 7)
          THEN r.previous_tier_code
        ELSE r.computed_tier_code
      END AS tier_code,
      r.computed_tier_code,
      r.rolling_volume,
      r.active_direct_users,
      r.affiliate_age_days,
      (r.affiliate_age_days >= 14) AS is_age_eligible,
      (r.active_direct_users > 0) AS is_active_eligible,
      r.elite_override_active,
      CASE
        WHEN r.elite_override_active THEN NULL::DATE
        WHEN r.previous_tier_code IS NOT NULL
          AND _affiliate_tier_rank(r.previous_tier_code) > _affiliate_tier_rank(r.computed_tier_code)
          AND v_snapshot_date < (r.next_demotion_candidate_since + 7)
          THEN r.next_demotion_candidate_since
        ELSE NULL::DATE
      END AS demotion_candidate_since
    FROM resolved r
  ),
  upserted AS (
    INSERT INTO affiliate_tier_snapshots (
      snapshot_date,
      affiliate_id,
      tier_code,
      computed_tier_code,
      rolling_30d_volume,
      active_direct_users,
      affiliate_age_days,
      is_age_eligible,
      is_active_eligible,
      elite_override_active,
      demotion_candidate_since
    )
    SELECT
      v_snapshot_date,
      affiliate_id,
      tier_code,
      computed_tier_code,
      _fmt6(rolling_volume),
      active_direct_users,
      affiliate_age_days,
      is_age_eligible,
      is_active_eligible,
      elite_override_active,
      demotion_candidate_since
    FROM final_rows
    ON CONFLICT (snapshot_date, affiliate_id) DO UPDATE SET
      tier_code = EXCLUDED.tier_code,
      computed_tier_code = EXCLUDED.computed_tier_code,
      rolling_30d_volume = EXCLUDED.rolling_30d_volume,
      active_direct_users = EXCLUDED.active_direct_users,
      affiliate_age_days = EXCLUDED.affiliate_age_days,
      is_age_eligible = EXCLUDED.is_age_eligible,
      is_active_eligible = EXCLUDED.is_active_eligible,
      elite_override_active = EXCLUDED.elite_override_active,
      demotion_candidate_since = EXCLUDED.demotion_candidate_since,
      updated_at = NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_rows FROM upserted;

  RETURN jsonb_build_object(
    'snapshot_date', v_snapshot_date,
    'snapshots', v_rows
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_refresh_affiliate_tier_snapshots(
  p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT _is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN _affiliate_refresh_tier_snapshots(p_snapshot_date);
END;
$$;

CREATE OR REPLACE FUNCTION rpc_set_affiliate_elite_override(
  p_affiliate_id UUID,
  p_is_active BOOLEAN,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT _is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_affiliate_id) THEN
    RAISE EXCEPTION 'affiliate_not_found';
  END IF;

  INSERT INTO affiliate_elite_overrides (
    affiliate_id, is_active, reason, updated_by
  ) VALUES (
    p_affiliate_id, COALESCE(p_is_active, FALSE), btrim(p_reason), v_actor
  )
  ON CONFLICT (affiliate_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    reason = EXCLUDED.reason,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    v_actor,
    'affiliate_elite_override_set',
    'affiliate_elite_overrides',
    p_affiliate_id,
    jsonb_build_object('is_active', COALESCE(p_is_active, FALSE), 'reason', btrim(p_reason))
  );

  RETURN jsonb_build_object(
    'affiliate_id', p_affiliate_id,
    'is_active', COALESCE(p_is_active, FALSE)
  );
END;
$$;

REVOKE ALL ON FUNCTION _affiliate_tier_rank(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _affiliate_computed_tier(NUMERIC, INT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _affiliate_refresh_tier_snapshots(DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION rpc_refresh_affiliate_tier_snapshots(DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rpc_set_affiliate_elite_override(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION rpc_refresh_affiliate_tier_snapshots(DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_set_affiliate_elite_override(UUID, BOOLEAN, TEXT) TO authenticated, service_role;

SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname = 'phonara_affiliate_tier_snapshot_daily';

SELECT cron.schedule(
  'phonara_affiliate_tier_snapshot_daily',
  '30 2 * * *',
  $cron$SELECT public.rpc_refresh_affiliate_tier_snapshots(CURRENT_DATE);$cron$
);
