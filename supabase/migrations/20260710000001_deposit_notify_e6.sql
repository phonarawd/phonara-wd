-- ============================================================
-- Migration: 20260710000001_deposit_notify_e6
-- E6 — deposit credited push outbox + realtime publication (all rails)
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Unified deposit-credited notification producer ───────────────────────────

CREATE OR REPLACE FUNCTION _notify_deposit_credited(
  p_user_id UUID,
  p_deposit_id UUID,
  p_rail TEXT,
  p_amount TEXT,
  p_currency TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM _enqueue_notification(
    p_user_id,
    'push',
    'deposit_credited',
    jsonb_build_object(
      'deposit_id', p_deposit_id,
      'rail', p_rail,
      'amount', p_amount,
      'currency', p_currency,
      'amount_phon', CASE WHEN p_currency = 'PHON' THEN p_amount ELSE NULL END
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION _notify_deposit_credited(UUID, UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── KRW credit ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _credit_krw_deposit_internal(
  p_deposit_id UUID,
  p_transfer_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep       krw_deposit_requests%ROWTYPE;
  v_ledger_id UUID;
  v_idem      TEXT;
  v_phon      TEXT;
BEGIN
  SELECT * INTO v_dep FROM krw_deposit_requests WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;

  IF v_dep.status = 'credited' THEN
    SELECT id INTO v_ledger_id FROM wallet_ledger
     WHERE related_entity_id = p_deposit_id AND reason_code = 'krw_deposit_credit'
     LIMIT 1;
    RETURN v_ledger_id;
  END IF;

  PERFORM _assert_account_activity_live(v_dep.user_id);

  v_idem := 'krw_dep:' || p_transfer_id;

  SELECT id INTO v_ledger_id FROM wallet_ledger WHERE idempotency_key = v_idem;
  IF FOUND THEN
    UPDATE krw_deposit_requests
       SET status = 'credited', credited_at = COALESCE(credited_at, NOW()), matched_at = COALESCE(matched_at, NOW())
     WHERE id = p_deposit_id;
    RETURN v_ledger_id;
  END IF;

  v_phon := COALESCE(v_dep.expected_phon, '0.000000');

  v_ledger_id := _credit_wallet_internal(
    v_dep.user_id, 'PHON', v_phon, 'krw_deposit_credit', v_idem
  );

  PERFORM _debit_system_account(
    'deposit_conversion_phon', v_phon, 'krw_deposit_credit',
    v_dep.user_id, p_transfer_id, v_ledger_id
  );

  UPDATE krw_deposit_requests
     SET status = 'credited', credited_at = NOW(), matched_at = COALESCE(matched_at, NOW())
   WHERE id = p_deposit_id;

  PERFORM _notify_deposit_credited(v_dep.user_id, p_deposit_id, 'krw', v_phon, 'PHON');

  RETURN v_ledger_id;
END;
$$;

REVOKE ALL ON FUNCTION _credit_krw_deposit_internal(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Crypto credit ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _credit_crypto_deposit_internal(
  p_deposit_id UUID,
  p_tx_hash TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep       crypto_deposit_requests%ROWTYPE;
  v_ledger_id UUID;
  v_idem      TEXT;
BEGIN
  SELECT * INTO v_dep FROM crypto_deposit_requests WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;

  IF v_dep.status = 'credited' THEN
    SELECT id INTO v_ledger_id FROM wallet_ledger
     WHERE related_entity_id = p_deposit_id AND reason_code = 'crypto_deposit_credit'
     LIMIT 1;
    RETURN v_ledger_id;
  END IF;

  PERFORM _assert_account_activity_live(v_dep.user_id);

  v_idem := 'crypto_dep:' || p_tx_hash;

  SELECT id INTO v_ledger_id FROM wallet_ledger WHERE idempotency_key = v_idem;
  IF FOUND THEN
    UPDATE crypto_deposit_requests
       SET status = 'credited',
           credited_at = COALESCE(credited_at, NOW()),
           matched_at = COALESCE(matched_at, NOW()),
           tx_hash = COALESCE(tx_hash, p_tx_hash)
     WHERE id = p_deposit_id;
    RETURN v_ledger_id;
  END IF;

  v_ledger_id := _credit_wallet_internal(
    v_dep.user_id, 'USDT', v_dep.amount, 'crypto_deposit_credit', v_idem
  );

  PERFORM _debit_system_account(
    'deposit_conversion_usdt', v_dep.amount, 'crypto_deposit_credit',
    v_dep.user_id, p_tx_hash, v_ledger_id
  );

  UPDATE crypto_deposit_requests
     SET status = 'credited',
         credited_at = NOW(),
         matched_at = COALESCE(matched_at, NOW()),
         tx_hash = p_tx_hash
   WHERE id = p_deposit_id;

  PERFORM _notify_deposit_credited(v_dep.user_id, p_deposit_id, 'crypto', v_dep.amount, 'USDT');

  RETURN v_ledger_id;
END;
$$;

REVOKE ALL ON FUNCTION _credit_crypto_deposit_internal(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Giftcard credit ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _credit_giftcard_deposit_internal(p_deposit_id UUID, p_idem_suffix TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dep       giftcard_deposit_requests%ROWTYPE;
  v_ledger_id UUID;
  v_fee_phon  TEXT;
  v_idem      TEXT;
  v_face_phon TEXT;
BEGIN
  SELECT * INTO v_dep FROM giftcard_deposit_requests WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit_not_found'; END IF;
  IF v_dep.status = 'credited' THEN
    SELECT id INTO v_ledger_id FROM wallet_ledger
     WHERE idempotency_key = 'giftcard_dep:' || p_deposit_id::TEXT || ':' || p_idem_suffix LIMIT 1;
    RETURN v_ledger_id;
  END IF;

  v_idem := 'giftcard_dep:' || p_deposit_id::TEXT || ':' || p_idem_suffix;

  v_face_phon := _fmt6((v_dep.face_value_krw::NUMERIC / (
    SELECT rate::NUMERIC FROM exchange_rate_snapshots WHERE id = v_dep.rate_snapshot_id
  )));
  v_fee_phon := _fmt6(v_face_phon::NUMERIC - v_dep.expected_phon::NUMERIC);

  v_ledger_id := _credit_wallet_internal(
    v_dep.user_id, 'PHON', v_dep.expected_phon, 'giftcard_deposit_credit', v_idem
  );

  IF v_fee_phon::NUMERIC > 0 THEN
    PERFORM _credit_system_account(
      'giftcard_fee_phon', v_fee_phon, 'giftcard_fee',
      v_dep.user_id, p_idem_suffix, v_ledger_id
    );
  END IF;

  PERFORM _debit_system_account(
    'deposit_conversion_phon', v_face_phon, 'giftcard_deposit_credit',
    v_dep.user_id, p_idem_suffix, v_ledger_id
  );

  UPDATE giftcard_deposit_requests
     SET status = 'credited', credited_at = NOW(), updated_at = NOW()
   WHERE id = p_deposit_id;

  PERFORM _notify_deposit_credited(
    v_dep.user_id, p_deposit_id, 'giftcard', v_dep.expected_phon, 'PHON'
  );

  RETURN v_ledger_id;
END;
$$;

REVOKE ALL ON FUNCTION _credit_giftcard_deposit_internal(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Realtime publication (user-scoped deposit status transitions) ───────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'krw_deposit_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE krw_deposit_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'crypto_deposit_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE crypto_deposit_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'giftcard_deposit_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE giftcard_deposit_requests;
  END IF;
END;
$$;
