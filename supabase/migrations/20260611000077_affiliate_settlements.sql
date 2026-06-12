-- ============================================================
-- T4: Idempotent affiliate settlement engine
-- ============================================================
-- Pays affiliate commissions through _credit_wallet_internal and balances each
-- payout with an affiliate expense system-account debit. Existing market/game
-- settlement decomposition is not changed.
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO system_accounts (code, currency, description) VALUES
  ('affiliate_commission_expense_phon', 'PHON', 'Affiliate commission expense counterparty for PHON payouts. May go negative.'),
  ('affiliate_commission_expense_usdt', 'USDT', 'Affiliate commission expense counterparty for USDT payouts. May go negative.')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE affiliate_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_date DATE NOT NULL,
  affiliate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'computed' CHECK (state IN ('computed', 'pending_approval', 'paid')),
  tier_code TEXT NOT NULL REFERENCES affiliate_tier_configs(tier_code),
  direct_ggr JSONB NOT NULL DEFAULT '{}'::JSONB,
  override_ggr JSONB NOT NULL DEFAULT '{}'::JSONB,
  direct_commission JSONB NOT NULL DEFAULT '{}'::JSONB,
  override_commission_raw JSONB NOT NULL DEFAULT '{}'::JSONB,
  override_commission JSONB NOT NULL DEFAULT '{}'::JSONB,
  cap_reduction JSONB NOT NULL DEFAULT '{}'::JSONB,
  total_commission JSONB NOT NULL DEFAULT '{}'::JSONB,
  ledger_entry_ids JSONB NOT NULL DEFAULT '{}'::JSONB,
  system_transfer_ids JSONB NOT NULL DEFAULT '{}'::JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (settlement_date, affiliate_id)
);

CREATE INDEX affiliate_settlements_affiliate_date_idx
  ON affiliate_settlements (affiliate_id, settlement_date DESC);
CREATE INDEX affiliate_settlements_state_date_idx
  ON affiliate_settlements (state, settlement_date);

CREATE TRIGGER affiliate_settlements_updated_at
  BEFORE UPDATE ON affiliate_settlements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE affiliate_settlement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES affiliate_settlements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('computed', 'pending_approval', 'paid')),
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX affiliate_settlement_events_settlement_idx
  ON affiliate_settlement_events (settlement_id, created_at);

ALTER TABLE affiliate_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_settlement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_settlements: own read"
  ON affiliate_settlements FOR SELECT
  USING (auth.uid() = affiliate_id OR _is_admin());
CREATE POLICY "affiliate_settlements: admin rw"
  ON affiliate_settlements FOR ALL
  USING (_is_admin())
  WITH CHECK (_is_admin());

CREATE POLICY "affiliate_settlement_events: own read"
  ON affiliate_settlement_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM affiliate_settlements s
       WHERE s.id = settlement_id
         AND (auth.uid() = s.affiliate_id OR _is_admin())
    )
  );
CREATE POLICY "affiliate_settlement_events: admin rw"
  ON affiliate_settlement_events FOR ALL
  USING (_is_admin())
  WITH CHECK (_is_admin());

REVOKE ALL ON affiliate_settlements, affiliate_settlement_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON affiliate_settlements, affiliate_settlement_events TO authenticated;
GRANT ALL ON affiliate_settlements, affiliate_settlement_events TO service_role;

CREATE OR REPLACE FUNCTION _affiliate_tier_for_settlement(
  p_affiliate_id UUID,
  p_settlement_date DATE
)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (
      SELECT tier_code
        FROM affiliate_tier_snapshots
       WHERE affiliate_id = p_affiliate_id
         AND snapshot_date <= p_settlement_date
       ORDER BY snapshot_date DESC
       LIMIT 1
    ),
    'standard'
  );
$$;

CREATE OR REPLACE FUNCTION _jsonb_amount_object(
  p_amounts JSONB,
  p_currency currency,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(p_amounts, '{}'::JSONB)
    || jsonb_build_object(p_currency::TEXT, _fmt6(COALESCE(p_amount, 0)));
$$;

CREATE OR REPLACE FUNCTION _run_affiliate_settlements(
  p_settlement_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_date DATE := COALESCE(p_settlement_date, CURRENT_DATE);
  v_computed INT := 0;
  v_paid INT := 0;
  v_settlement affiliate_settlements%ROWTYPE;
  v_currency TEXT;
  v_amount_text TEXT;
  v_amount NUMERIC;
  v_ccy currency;
  v_wallet_ledger_id UUID;
  v_transfer_id UUID;
  v_account_code TEXT;
  v_ledger_ids JSONB;
  v_transfer_ids JSONB;
BEGIN
  WITH direct_ggr AS (
    SELECT
      affiliate_id,
      currency,
      GREATEST(SUM(gross_revenue::NUMERIC), 0) AS ggr
    FROM affiliate_commission_daily_aggregates
    WHERE aggregate_date = v_date
    GROUP BY affiliate_id, currency
  ),
  direct_calc AS (
    SELECT
      dg.affiliate_id,
      dg.currency,
      dg.ggr,
      _affiliate_tier_for_settlement(dg.affiliate_id, v_date) AS tier_code,
      cfg.direct_commission_bps,
      trunc(dg.ggr * cfg.direct_commission_bps::NUMERIC / 10000, 6) AS direct_commission
    FROM direct_ggr dg
    JOIN affiliate_tier_configs cfg
      ON cfg.tier_code = _affiliate_tier_for_settlement(dg.affiliate_id, v_date)
  ),
  override_calc AS (
    SELECT
      ar.parent_id AS affiliate_id,
      dc.currency,
      SUM(dc.ggr) AS override_ggr,
      SUM(trunc(dc.ggr * parent_cfg.override_commission_bps::NUMERIC / 10000, 6)) AS override_raw,
      SUM(
        LEAST(
          GREATEST(trunc(dc.ggr * 0.5, 6) - dc.direct_commission, 0),
          trunc(dc.ggr * parent_cfg.override_commission_bps::NUMERIC / 10000, 6)
        )
      ) AS override_commission
    FROM affiliate_relationships ar
    JOIN direct_calc dc ON dc.affiliate_id = ar.child_id
    JOIN affiliate_tier_configs parent_cfg
      ON parent_cfg.tier_code = _affiliate_tier_for_settlement(ar.parent_id, v_date)
    GROUP BY ar.parent_id, dc.currency
  ),
  currency_rows AS (
    SELECT
      COALESCE(dc.affiliate_id, oc.affiliate_id) AS affiliate_id,
      COALESCE(dc.currency, oc.currency) AS currency,
      COALESCE(dc.ggr, 0) AS direct_ggr,
      COALESCE(dc.direct_commission, 0) AS direct_commission,
      COALESCE(oc.override_ggr, 0) AS override_ggr,
      COALESCE(oc.override_raw, 0) AS override_raw,
      COALESCE(oc.override_commission, 0) AS override_commission,
      COALESCE(oc.override_raw, 0) - COALESCE(oc.override_commission, 0) AS cap_reduction,
      COALESCE(dc.direct_commission, 0) + COALESCE(oc.override_commission, 0) AS total_commission
    FROM direct_calc dc
    FULL OUTER JOIN override_calc oc
      ON oc.affiliate_id = dc.affiliate_id
     AND oc.currency = dc.currency
  ),
  settlement_rows AS (
    SELECT
      affiliate_id,
      _affiliate_tier_for_settlement(affiliate_id, v_date) AS tier_code,
      jsonb_object_agg(currency::TEXT, _fmt6(direct_ggr)) AS direct_ggr,
      jsonb_object_agg(currency::TEXT, _fmt6(override_ggr)) AS override_ggr,
      jsonb_object_agg(currency::TEXT, _fmt6(direct_commission)) AS direct_commission,
      jsonb_object_agg(currency::TEXT, _fmt6(override_raw)) AS override_commission_raw,
      jsonb_object_agg(currency::TEXT, _fmt6(override_commission)) AS override_commission,
      jsonb_object_agg(currency::TEXT, _fmt6(cap_reduction)) AS cap_reduction,
      jsonb_object_agg(currency::TEXT, _fmt6(total_commission)) AS total_commission
    FROM currency_rows
    GROUP BY affiliate_id
  ),
  inserted AS (
    INSERT INTO affiliate_settlements (
      settlement_date,
      affiliate_id,
      tier_code,
      direct_ggr,
      override_ggr,
      direct_commission,
      override_commission_raw,
      override_commission,
      cap_reduction,
      total_commission
    )
    SELECT
      v_date,
      affiliate_id,
      tier_code,
      direct_ggr,
      override_ggr,
      direct_commission,
      override_commission_raw,
      override_commission,
      cap_reduction,
      total_commission
    FROM settlement_rows
    ON CONFLICT (settlement_date, affiliate_id) DO NOTHING
    RETURNING *
  )
  INSERT INTO affiliate_settlement_events (settlement_id, event_type, payload)
  SELECT id, 'computed', jsonb_build_object('settlement_date', settlement_date, 'affiliate_id', affiliate_id)
    FROM inserted;

  GET DIAGNOSTICS v_computed = ROW_COUNT;

  FOR v_settlement IN
    SELECT *
      FROM affiliate_settlements
     WHERE settlement_date = v_date
       AND state = 'computed'
     FOR UPDATE
  LOOP
    v_ledger_ids := COALESCE(v_settlement.ledger_entry_ids, '{}'::JSONB);
    v_transfer_ids := COALESCE(v_settlement.system_transfer_ids, '{}'::JSONB);

    FOR v_currency, v_amount_text IN
      SELECT key, value
        FROM jsonb_each_text(v_settlement.total_commission)
    LOOP
      v_amount := v_amount_text::NUMERIC;
      IF v_amount <= 0 THEN
        CONTINUE;
      END IF;

      v_ccy := v_currency::currency;
      v_account_code := 'affiliate_commission_expense_' || lower(v_currency);

      v_wallet_ledger_id := _credit_wallet_internal(
        v_settlement.affiliate_id,
        v_ccy,
        _fmt6(v_amount),
        'affiliate_commission',
        'affiliate:settlement:' || v_date::TEXT || ':' || v_settlement.affiliate_id::TEXT || ':' || v_currency
      );

      SELECT transfer_id INTO v_transfer_id
        FROM system_account_ledger
       WHERE account_code = v_account_code
         AND reason_code = 'affiliate_commission_payout'
         AND related_user_id = v_settlement.affiliate_id
         AND related_tx_id = v_settlement.id::TEXT
       LIMIT 1;

      IF v_transfer_id IS NULL THEN
        v_transfer_id := gen_random_uuid();
        PERFORM _debit_system_account(
          v_account_code,
          _fmt6(v_amount),
          'affiliate_commission_payout',
          v_settlement.affiliate_id,
          v_settlement.id::TEXT,
          v_transfer_id
        );
      END IF;

      v_ledger_ids := _jsonb_amount_object(v_ledger_ids, v_ccy, 0)
        || jsonb_build_object(v_currency, v_wallet_ledger_id::TEXT);
      v_transfer_ids := _jsonb_amount_object(v_transfer_ids, v_ccy, 0)
        || jsonb_build_object(v_currency, v_transfer_id::TEXT);
    END LOOP;

    UPDATE affiliate_settlements
       SET state = 'paid',
           ledger_entry_ids = v_ledger_ids,
           system_transfer_ids = v_transfer_ids,
           paid_at = NOW(),
           updated_at = NOW()
     WHERE id = v_settlement.id;

    INSERT INTO affiliate_settlement_events (settlement_id, event_type, payload)
    VALUES (
      v_settlement.id,
      'paid',
      jsonb_build_object('settlement_date', v_date, 'affiliate_id', v_settlement.affiliate_id)
    );

    v_paid := v_paid + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'settlement_date', v_date,
    'computed', v_computed,
    'paid', v_paid
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_run_affiliate_settlements(
  p_settlement_date DATE DEFAULT CURRENT_DATE
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

  RETURN _run_affiliate_settlements(p_settlement_date);
END;
$$;

REVOKE ALL ON FUNCTION _affiliate_tier_for_settlement(UUID, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _jsonb_amount_object(JSONB, currency, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _run_affiliate_settlements(DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION rpc_run_affiliate_settlements(DATE) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION rpc_run_affiliate_settlements(DATE) TO authenticated, service_role;
