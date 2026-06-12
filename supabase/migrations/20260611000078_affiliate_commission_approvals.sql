-- ============================================================
-- T5: High-value affiliate commission approval queue
-- ============================================================
-- High-value settlements pause before payout. Approval is admin-only, reasoned,
-- audited, self-approval blocked, and the final payout reuses the T4 settlement
-- ledger path.
-- ============================================================

SET search_path = public, pg_temp;

INSERT INTO app_config (key, value, description, is_public) VALUES
  ('affiliate_commission_approval_threshold_phon', '1000000.000000',
   'PHON affiliate settlement amount above which admin approval is required.', FALSE),
  ('affiliate_commission_approval_threshold_usdt', '1000000.000000',
   'USDT affiliate settlement amount above which admin approval is required.', FALSE),
  ('affiliate_commission_approval_sla_hours', '24',
   'SLA hours for high-value affiliate commission approval review.', FALSE)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE affiliate_commission_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL UNIQUE REFERENCES affiliate_settlements(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  total_commission JSONB NOT NULL DEFAULT '{}'::JSONB,
  threshold_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  approval_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX affiliate_commission_approvals_status_idx
  ON affiliate_commission_approvals (status, requested_at);
CREATE INDEX affiliate_commission_approvals_affiliate_idx
  ON affiliate_commission_approvals (affiliate_id, requested_at DESC);

CREATE TRIGGER affiliate_commission_approvals_updated_at
  BEFORE UPDATE ON affiliate_commission_approvals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE affiliate_commission_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_commission_approvals: own read"
  ON affiliate_commission_approvals FOR SELECT
  USING (auth.uid() = affiliate_id OR _is_admin());
CREATE POLICY "affiliate_commission_approvals: admin rw"
  ON affiliate_commission_approvals FOR ALL
  USING (_is_admin())
  WITH CHECK (_is_admin());

REVOKE ALL ON affiliate_commission_approvals FROM PUBLIC, anon, authenticated;
GRANT SELECT ON affiliate_commission_approvals TO authenticated;
GRANT ALL ON affiliate_commission_approvals TO service_role;

CREATE OR REPLACE FUNCTION _affiliate_commission_threshold_snapshot(
  p_total_commission JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_currency TEXT;
  v_threshold NUMERIC;
  v_thresholds JSONB := '{}'::JSONB;
BEGIN
  FOR v_currency IN
    SELECT key FROM jsonb_each_text(COALESCE(p_total_commission, '{}'::JSONB))
  LOOP
    v_threshold := _app_config_numeric(
      'affiliate_commission_approval_threshold_' || lower(v_currency),
      1000000
    );
    v_thresholds := v_thresholds || jsonb_build_object(v_currency, _fmt6(v_threshold));
  END LOOP;

  RETURN v_thresholds;
END;
$$;

CREATE OR REPLACE FUNCTION _affiliate_commission_requires_approval(
  p_total_commission JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_currency TEXT;
  v_amount_text TEXT;
  v_threshold NUMERIC;
BEGIN
  FOR v_currency, v_amount_text IN
    SELECT key, value FROM jsonb_each_text(COALESCE(p_total_commission, '{}'::JSONB))
  LOOP
    v_threshold := _app_config_numeric(
      'affiliate_commission_approval_threshold_' || lower(v_currency),
      1000000
    );
    IF v_amount_text::NUMERIC > v_threshold THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION _enqueue_affiliate_commission_approval(
  p_settlement affiliate_settlements
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_approval_id UUID;
  v_sla_hours NUMERIC;
BEGIN
  INSERT INTO affiliate_commission_approvals (
    settlement_id,
    affiliate_id,
    total_commission,
    threshold_config
  ) VALUES (
    p_settlement.id,
    p_settlement.affiliate_id,
    p_settlement.total_commission,
    _affiliate_commission_threshold_snapshot(p_settlement.total_commission)
  )
  ON CONFLICT (settlement_id) DO NOTHING
  RETURNING id INTO v_approval_id;

  IF v_approval_id IS NULL THEN
    SELECT id INTO v_approval_id
      FROM affiliate_commission_approvals
     WHERE settlement_id = p_settlement.id;
  END IF;

  v_sla_hours := _app_config_numeric('affiliate_commission_approval_sla_hours', 24);

  INSERT INTO admin_review_queue (
    queue_type,
    entity_type,
    entity_id,
    user_id,
    reason,
    sla_due_at,
    payload
  )
  SELECT
    'affiliate_commission',
    'affiliate_commission_approval',
    v_approval_id,
    p_settlement.affiliate_id,
    'affiliate_commission_approval_required',
    NOW() + (v_sla_hours || ' hours')::INTERVAL,
    jsonb_build_object(
      'settlement_id', p_settlement.id,
      'settlement_date', p_settlement.settlement_date,
      'affiliate_id', p_settlement.affiliate_id,
      'total_commission', p_settlement.total_commission,
      'threshold_config', _affiliate_commission_threshold_snapshot(p_settlement.total_commission)
    )
  WHERE NOT EXISTS (
    SELECT 1
      FROM admin_review_queue
     WHERE entity_type = 'affiliate_commission_approval'
       AND entity_id = v_approval_id
       AND status IN ('pending', 'in_review')
  );

  RETURN v_approval_id;
END;
$$;

CREATE OR REPLACE FUNCTION _pay_affiliate_settlement(
  p_settlement_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
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
  SELECT * INTO v_settlement
    FROM affiliate_settlements
   WHERE id = p_settlement_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'affiliate_settlement_not_found';
  END IF;

  IF v_settlement.state = 'paid' THEN
    RETURN jsonb_build_object('ok', TRUE, 'settlement_id', p_settlement_id, 'idempotent', TRUE);
  END IF;

  IF v_settlement.state NOT IN ('computed', 'pending_approval') THEN
    RAISE EXCEPTION 'invalid_affiliate_settlement_state';
  END IF;

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
      'affiliate:settlement:' || v_settlement.settlement_date::TEXT || ':' || v_settlement.affiliate_id::TEXT || ':' || v_currency
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
    jsonb_build_object('settlement_date', v_settlement.settlement_date, 'affiliate_id', v_settlement.affiliate_id)
  );

  RETURN jsonb_build_object('ok', TRUE, 'settlement_id', p_settlement_id, 'status', 'paid');
END;
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
  v_pending_approval INT := 0;
  v_settlement affiliate_settlements%ROWTYPE;
  v_approval_id UUID;
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
    IF _affiliate_commission_requires_approval(v_settlement.total_commission) THEN
      v_approval_id := _enqueue_affiliate_commission_approval(v_settlement);

      UPDATE affiliate_settlements
         SET state = 'pending_approval',
             updated_at = NOW()
       WHERE id = v_settlement.id;

      INSERT INTO affiliate_settlement_events (settlement_id, event_type, payload)
      VALUES (
        v_settlement.id,
        'pending_approval',
        jsonb_build_object(
          'settlement_date', v_date,
          'affiliate_id', v_settlement.affiliate_id,
          'approval_id', v_approval_id
        )
      );

      v_pending_approval := v_pending_approval + 1;
    ELSE
      PERFORM _pay_affiliate_settlement(v_settlement.id);
      v_paid := v_paid + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'settlement_date', v_date,
    'computed', v_computed,
    'pending_approval', v_pending_approval,
    'paid', v_paid
  );
END;
$$;

CREATE OR REPLACE FUNCTION rpc_approve_affiliate_commission(
  p_approval_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_approval affiliate_commission_approvals%ROWTYPE;
  v_settlement affiliate_settlements%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT _is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  SELECT * INTO v_approval
    FROM affiliate_commission_approvals
   WHERE id = p_approval_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'affiliate_approval_not_found';
  END IF;

  SELECT * INTO v_settlement
    FROM affiliate_settlements
   WHERE id = v_approval.settlement_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'affiliate_settlement_not_found';
  END IF;

  IF v_settlement.affiliate_id = v_actor THEN
    RAISE EXCEPTION 'self_approval_forbidden';
  END IF;

  IF v_approval.status = 'approved' THEN
    RETURN jsonb_build_object('ok', TRUE, 'approval_id', p_approval_id, 'idempotent', TRUE);
  END IF;

  IF v_approval.status <> 'pending' THEN
    RAISE EXCEPTION 'invalid_affiliate_approval_status';
  END IF;

  UPDATE affiliate_commission_approvals
     SET status = 'approved',
         approved_by = v_actor,
         approved_at = NOW(),
         approval_reason = p_reason,
         updated_at = NOW()
   WHERE id = p_approval_id;

  UPDATE admin_review_queue
     SET status = 'resolved',
         resolved_at = NOW(),
         resolved_by = v_actor
   WHERE entity_type = 'affiliate_commission_approval'
     AND entity_id = p_approval_id
     AND status IN ('pending', 'in_review');

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    v_actor,
    'affiliate_commission_approved',
    'affiliate_commission_approval',
    p_approval_id,
    jsonb_build_object(
      'reason', p_reason,
      'settlement_id', v_settlement.id,
      'affiliate_id', v_settlement.affiliate_id,
      'total_commission', v_settlement.total_commission
    )
  );

  PERFORM _pay_affiliate_settlement(v_settlement.id);

  RETURN jsonb_build_object('ok', TRUE, 'approval_id', p_approval_id, 'settlement_id', v_settlement.id, 'status', 'approved');
END;
$$;

REVOKE ALL ON FUNCTION _affiliate_commission_threshold_snapshot(JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _affiliate_commission_requires_approval(JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _enqueue_affiliate_commission_approval(affiliate_settlements) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _pay_affiliate_settlement(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION _run_affiliate_settlements(DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION rpc_approve_affiliate_commission(UUID, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION rpc_approve_affiliate_commission(UUID, TEXT) TO authenticated, service_role;
