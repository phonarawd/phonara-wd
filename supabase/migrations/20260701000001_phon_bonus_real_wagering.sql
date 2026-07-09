-- ============================================================
-- Migration: 20260701000001_phon_bonus_real_wagering
-- AT (at-token-track): PHON bonus/real split + wagering + real-only withdrawal
-- ============================================================
-- §4 A안: mission/reward → bonus bucket · deposit/conversion → real bucket
-- Bets consume bonus first · wagering FIFO · completed → promote to real
-- Withdrawal locks/debits real PHON only
-- ============================================================

SET search_path = public, pg_temp;

-- ─── Schema: wallet bonus/real columns ───────────────────────────────────────

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS phon_bonus_available TEXT NOT NULL DEFAULT '0.000000'
    CONSTRAINT wallets_phon_bonus_available_fmt CHECK (phon_bonus_available ~ '^-?\d+(\.\d+)?$'),
  ADD COLUMN IF NOT EXISTS phon_real_available TEXT NOT NULL DEFAULT '0.000000'
    CONSTRAINT wallets_phon_real_available_fmt CHECK (phon_real_available ~ '^-?\d+(\.\d+)?$'),
  ADD COLUMN IF NOT EXISTS phon_bonus_locked TEXT NOT NULL DEFAULT '0.000000'
    CONSTRAINT wallets_phon_bonus_locked_fmt CHECK (phon_bonus_locked ~ '^-?\d+(\.\d+)?$'),
  ADD COLUMN IF NOT EXISTS phon_real_locked TEXT NOT NULL DEFAULT '0.000000'
    CONSTRAINT wallets_phon_real_locked_fmt CHECK (phon_real_locked ~ '^-?\d+(\.\d+)?$');

-- Migrate existing single-pool balances → real track (preserve totals)
UPDATE wallets
   SET phon_real_available = phon_available,
       phon_real_locked    = phon_locked,
       phon_bonus_available = '0.000000',
       phon_bonus_locked    = '0.000000'
 WHERE phon_real_available = '0.000000'
   AND phon_real_locked = '0.000000'
   AND phon_bonus_available = '0.000000';

-- ─── Wagering obligations (append-only status transitions) ───────────────────

CREATE TABLE IF NOT EXISTS bonus_wagering_requirements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  wallet_id           UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  source_ledger_id    UUID NOT NULL REFERENCES wallet_ledger(id) ON DELETE RESTRICT,
  bonus_amount        TEXT NOT NULL
    CONSTRAINT bwr_bonus_amount_pos CHECK (bonus_amount ~ '^\d+(\.\d+)?$'),
  wagering_multiplier NUMERIC NOT NULL DEFAULT 1
    CONSTRAINT bwr_multiplier_pos CHECK (wagering_multiplier > 0),
  wagering_required   TEXT NOT NULL
    CONSTRAINT bwr_required_pos CHECK (wagering_required ~ '^\d+(\.\d+)?$'),
  wagering_remaining  TEXT NOT NULL
    CONSTRAINT bwr_remaining_nonneg CHECK (wagering_remaining ~ '^\d+(\.\d+)?$'),
  status              TEXT NOT NULL DEFAULT 'active'
    CONSTRAINT bwr_status_chk CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS bwr_user_active_idx
  ON bonus_wagering_requirements (user_id, status, created_at)
  WHERE status = 'active';

ALTER TABLE bonus_wagering_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own wagering" ON bonus_wagering_requirements;
CREATE POLICY "users read own wagering" ON bonus_wagering_requirements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON bonus_wagering_requirements TO authenticated;

INSERT INTO app_config (key, value, description)
VALUES ('bonus_wagering_multiplier', '1', 'Wagering turnover multiplier applied to bonus credits')
ON CONFLICT (key) DO NOTHING;

-- ─── Classifiers ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _is_phon_withdrawal_lock_reason(p_reason_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_reason_code IN (
    'withdrawal_request_lock',
    'withdrawal_request',
    'withdrawal_lock'
  );
$$;

REVOKE ALL ON FUNCTION _is_phon_withdrawal_lock_reason(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _is_phon_wagering_bet_reason(p_reason_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_reason_code LIKE 'game_%'
      OR p_reason_code LIKE 'gbet_%'
      OR p_reason_code LIKE 'sports_%'
      OR p_reason_code IN (
        'futures_open_fee',
        'futures_margin_lock',
        'spot_buy',
        'spot_sell',
        'staking_stake'
      );
$$;

REVOKE ALL ON FUNCTION _is_phon_wagering_bet_reason(TEXT) FROM PUBLIC, anon, authenticated;

-- ─── Sync legacy total columns (conservation tests sum phon_available) ───────

CREATE OR REPLACE FUNCTION _sync_phon_wallet_totals(p_wallet_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  UPDATE wallets
     SET phon_available = (
           phon_bonus_available::NUMERIC + phon_real_available::NUMERIC
         )::TEXT,
         phon_locked = (
           phon_bonus_locked::NUMERIC + phon_real_locked::NUMERIC
         )::TEXT
   WHERE id = p_wallet_id;
END;
$$;

REVOKE ALL ON FUNCTION _sync_phon_wallet_totals(UUID) FROM PUBLIC, anon, authenticated;

-- ─── Wagering helpers ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _bonus_wagering_multiplier()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF((SELECT value FROM app_config WHERE key = 'bonus_wagering_multiplier'), '')::NUMERIC,
    1
  );
$$;

REVOKE ALL ON FUNCTION _bonus_wagering_multiplier() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _create_bonus_wagering_obligation(
  p_user_id UUID,
  p_wallet_id UUID,
  p_source_ledger_id UUID,
  p_bonus_amount TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mult NUMERIC := _bonus_wagering_multiplier();
  v_required TEXT;
  v_id UUID;
BEGIN
  v_required := _fmt6(p_bonus_amount::NUMERIC * v_mult);

  INSERT INTO bonus_wagering_requirements (
    user_id, wallet_id, source_ledger_id,
    bonus_amount, wagering_multiplier, wagering_required, wagering_remaining
  ) VALUES (
    p_user_id, p_wallet_id, p_source_ledger_id,
    p_bonus_amount, v_mult, v_required, v_required
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION _create_bonus_wagering_obligation(UUID, UUID, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _apply_wagering_progress(p_user_id UUID, p_bet_amount TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_remaining NUMERIC := p_bet_amount::NUMERIC;
  v_row bonus_wagering_requirements%ROWTYPE;
  v_take NUMERIC;
  v_new_remaining TEXT;
BEGIN
  IF v_remaining <= 0 THEN RETURN; END IF;

  FOR v_row IN
    SELECT *
      FROM bonus_wagering_requirements
     WHERE user_id = p_user_id
       AND status = 'active'
     ORDER BY created_at ASC
     FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_take := LEAST(v_remaining, v_row.wagering_remaining::NUMERIC);
    v_new_remaining := _fmt6(v_row.wagering_remaining::NUMERIC - v_take);

    IF v_new_remaining::NUMERIC <= 0 THEN
      UPDATE bonus_wagering_requirements
         SET wagering_remaining = '0.000000',
             status = 'completed',
             completed_at = NOW()
       WHERE id = v_row.id;
    ELSE
      UPDATE bonus_wagering_requirements
         SET wagering_remaining = v_new_remaining
       WHERE id = v_row.id;
    END IF;

    v_remaining := v_remaining - v_take;
  END LOOP;

  PERFORM _promote_completed_bonus_wagering(p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION _apply_wagering_progress(UUID, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION _promote_completed_bonus_wagering(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_active INT;
  v_promote TEXT;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  SELECT COUNT(*) INTO v_active
    FROM bonus_wagering_requirements
   WHERE user_id = p_user_id
     AND status = 'active';

  IF v_active > 0 THEN RETURN; END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_wallet.phon_bonus_available::NUMERIC <= 0 THEN RETURN; END IF;

  v_promote := v_wallet.phon_bonus_available;

  UPDATE wallets
     SET phon_bonus_available = '0.000000',
         phon_real_available  = (phon_real_available::NUMERIC + v_promote::NUMERIC)::TEXT,
         version = version + 1
   WHERE id = v_wallet.id;

  PERFORM _sync_phon_wallet_totals(v_wallet.id);
END;
$$;

REVOKE ALL ON FUNCTION _promote_completed_bonus_wagering(UUID) FROM PUBLIC, anon, authenticated;

-- ─── _credit_wallet_internal — bonus vs real bucket ──────────────────────────

CREATE OR REPLACE FUNCTION _credit_wallet_internal(
  p_user_id UUID, p_currency currency, p_amount TEXT,
  p_reason_code TEXT, p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets;
  v_entry_id UUID;
  v_avail_before TEXT;
  v_locked_before TEXT;
  v_to_bonus BOOLEAN := FALSE;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;

  IF auth.uid() = p_user_id THEN
    PERFORM _assert_account_activity_live(p_user_id);
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  IF p_currency = 'PHON' AND _is_reward_issuance_reason(p_reason_code) THEN
    v_to_bonus := TRUE;
  END IF;

  CASE p_currency
    WHEN 'PHON' THEN
      v_avail_before := v_wallet.phon_available;
      v_locked_before := v_wallet.phon_locked;
      IF v_to_bonus THEN
        UPDATE wallets
           SET phon_bonus_available = (phon_bonus_available::NUMERIC + p_amount::NUMERIC)::TEXT,
               version = version + 1
         WHERE id = v_wallet.id;
      ELSE
        UPDATE wallets
           SET phon_real_available = (phon_real_available::NUMERIC + p_amount::NUMERIC)::TEXT,
               version = version + 1
         WHERE id = v_wallet.id;
      END IF;
      PERFORM _sync_phon_wallet_totals(v_wallet.id);
    WHEN 'USDT' THEN
      v_avail_before := v_wallet.usdt_available; v_locked_before := v_wallet.usdt_locked;
      UPDATE wallets SET usdt_available=(usdt_available::NUMERIC+p_amount::NUMERIC)::TEXT,
                         version=version+1 WHERE id=v_wallet.id;
    WHEN 'KRW' THEN
      v_avail_before := v_wallet.krw_available; v_locked_before := v_wallet.krw_locked;
      UPDATE wallets SET krw_available=(krw_available::NUMERIC+p_amount::NUMERIC)::TEXT,
                         version=version+1 WHERE id=v_wallet.id;
  END CASE;

  INSERT INTO wallet_ledger (wallet_id,user_id,idempotency_key,direction,currency,amount,
    available_before,locked_before,available_after,locked_after,reason_code)
  SELECT v_wallet.id,p_user_id,p_idempotency_key,'credit',p_currency,p_amount,
    v_avail_before,v_locked_before,
    CASE p_currency WHEN 'PHON' THEN phon_available WHEN 'USDT' THEN usdt_available ELSE krw_available END,
    CASE p_currency WHEN 'PHON' THEN phon_locked WHEN 'USDT' THEN usdt_locked ELSE krw_locked END,
    p_reason_code
  FROM wallets WHERE id=v_wallet.id
  RETURNING id INTO v_entry_id;

  IF p_currency = 'PHON' AND _is_reward_issuance_reason(p_reason_code) THEN
    PERFORM _debit_system_account('reward_issuance_phon', p_amount,
      p_reason_code, p_user_id, p_idempotency_key, NULL);
    PERFORM _create_bonus_wagering_obligation(
      p_user_id, v_wallet.id, v_entry_id, p_amount
    );
  END IF;

  RETURN v_entry_id;
END;
$$;

REVOKE ALL ON FUNCTION _credit_wallet_internal(UUID, currency, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── _debit_wallet_internal — bonus-first spend + wagering ───────────────────

CREATE OR REPLACE FUNCTION _debit_wallet_internal(
  p_user_id UUID, p_currency currency, p_amount TEXT,
  p_reason_code TEXT, p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets;
  v_entry_id UUID;
  v_avail_before TEXT;
  v_locked_before TEXT;
  v_total NUMERIC;
  v_from_bonus NUMERIC;
  v_from_real NUMERIC;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;

  IF auth.uid() = p_user_id THEN
    PERFORM _assert_account_activity_live(p_user_id);
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  CASE p_currency
    WHEN 'PHON' THEN
      v_total := p_amount::NUMERIC;
      IF _is_phon_wagering_bet_reason(p_reason_code) THEN
        v_from_bonus := LEAST(v_total, v_wallet.phon_bonus_available::NUMERIC);
        v_from_real  := v_total - v_from_bonus;
      ELSE
        -- Non-bet debits (fees, admin): real first, then bonus
        v_from_real  := LEAST(v_total, v_wallet.phon_real_available::NUMERIC);
        v_from_bonus := v_total - v_from_real;
      END IF;

      IF (v_wallet.phon_bonus_available::NUMERIC + v_wallet.phon_real_available::NUMERIC) < v_total THEN
        RAISE EXCEPTION 'insufficient_available' USING HINT='PHON';
      END IF;

      v_avail_before := v_wallet.phon_available;
      v_locked_before := v_wallet.phon_locked;

      UPDATE wallets
         SET phon_bonus_available = (phon_bonus_available::NUMERIC - v_from_bonus)::TEXT,
             phon_real_available  = (phon_real_available::NUMERIC - v_from_real)::TEXT,
             version = version + 1
       WHERE id = v_wallet.id;

      PERFORM _sync_phon_wallet_totals(v_wallet.id);

      IF _is_phon_wagering_bet_reason(p_reason_code) AND v_total > 0 THEN
        PERFORM _apply_wagering_progress(p_user_id, _fmt6(v_total));
      END IF;

    WHEN 'USDT' THEN
      IF v_wallet.usdt_available::NUMERIC < p_amount::NUMERIC THEN
        RAISE EXCEPTION 'insufficient_available' USING HINT='USDT';
      END IF;
      v_avail_before := v_wallet.usdt_available; v_locked_before := v_wallet.usdt_locked;
      UPDATE wallets SET usdt_available=(usdt_available::NUMERIC-p_amount::NUMERIC)::TEXT,
                         version=version+1 WHERE id=v_wallet.id;
    WHEN 'KRW' THEN
      IF v_wallet.krw_available::NUMERIC < p_amount::NUMERIC THEN
        RAISE EXCEPTION 'insufficient_available' USING HINT='KRW';
      END IF;
      v_avail_before := v_wallet.krw_available; v_locked_before := v_wallet.krw_locked;
      UPDATE wallets SET krw_available=(krw_available::NUMERIC-p_amount::NUMERIC)::TEXT,
                         version=version+1 WHERE id=v_wallet.id;
  END CASE;

  INSERT INTO wallet_ledger (wallet_id,user_id,idempotency_key,direction,currency,amount,
    available_before,locked_before,available_after,locked_after,reason_code)
  SELECT v_wallet.id,p_user_id,p_idempotency_key,'debit',p_currency,p_amount,
    v_avail_before,v_locked_before,
    CASE p_currency WHEN 'PHON' THEN phon_available WHEN 'USDT' THEN usdt_available ELSE krw_available END,
    CASE p_currency WHEN 'PHON' THEN phon_locked WHEN 'USDT' THEN usdt_locked ELSE krw_locked END,
    p_reason_code
  FROM wallets WHERE id=v_wallet.id
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

REVOKE ALL ON FUNCTION _debit_wallet_internal(UUID, currency, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── _lock_wallet_internal — bonus-first lock · real-only withdrawal lock ────

CREATE OR REPLACE FUNCTION _lock_wallet_internal(
  p_user_id UUID, p_currency currency, p_amount TEXT,
  p_reason_code TEXT, p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets;
  v_entry_id UUID;
  v_avail_before TEXT;
  v_locked_before TEXT;
  v_total NUMERIC;
  v_from_bonus NUMERIC;
  v_from_real NUMERIC;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;

  IF auth.uid() = p_user_id THEN
    PERFORM _assert_account_activity_live(p_user_id);
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  CASE p_currency
    WHEN 'PHON' THEN
      v_total := p_amount::NUMERIC;
      v_avail_before := v_wallet.phon_available;
      v_locked_before := v_wallet.phon_locked;

      IF _is_phon_withdrawal_lock_reason(p_reason_code) THEN
        IF v_wallet.phon_real_available::NUMERIC < v_total THEN
          RAISE EXCEPTION 'insufficient_available' USING HINT='PHON';
        END IF;
        v_from_bonus := 0;
        v_from_real := v_total;
      ELSE
        IF (v_wallet.phon_bonus_available::NUMERIC + v_wallet.phon_real_available::NUMERIC) < v_total THEN
          RAISE EXCEPTION 'insufficient_available' USING HINT='PHON';
        END IF;
        v_from_bonus := LEAST(v_total, v_wallet.phon_bonus_available::NUMERIC);
        v_from_real  := v_total - v_from_bonus;
      END IF;

      UPDATE wallets
         SET phon_bonus_available = (phon_bonus_available::NUMERIC - v_from_bonus)::TEXT,
             phon_bonus_locked    = (phon_bonus_locked::NUMERIC + v_from_bonus)::TEXT,
             phon_real_available  = (phon_real_available::NUMERIC - v_from_real)::TEXT,
             phon_real_locked     = (phon_real_locked::NUMERIC + v_from_real)::TEXT,
             version = version + 1
       WHERE id = v_wallet.id;

      PERFORM _sync_phon_wallet_totals(v_wallet.id);

      IF _is_phon_wagering_bet_reason(p_reason_code) AND v_total > 0 THEN
        PERFORM _apply_wagering_progress(p_user_id, _fmt6(v_total));
      END IF;

    WHEN 'USDT' THEN
      IF v_wallet.usdt_available::NUMERIC < p_amount::NUMERIC THEN
        RAISE EXCEPTION 'insufficient_available' USING HINT='USDT';
      END IF;
      v_avail_before := v_wallet.usdt_available; v_locked_before := v_wallet.usdt_locked;
      UPDATE wallets SET usdt_available=(usdt_available::NUMERIC-p_amount::NUMERIC)::TEXT,
                         usdt_locked=(usdt_locked::NUMERIC+p_amount::NUMERIC)::TEXT,
                         version=version+1 WHERE id=v_wallet.id;
    WHEN 'KRW' THEN
      IF v_wallet.krw_available::NUMERIC < p_amount::NUMERIC THEN
        RAISE EXCEPTION 'insufficient_available' USING HINT='KRW';
      END IF;
      v_avail_before := v_wallet.krw_available; v_locked_before := v_wallet.krw_locked;
      UPDATE wallets SET krw_available=(krw_available::NUMERIC-p_amount::NUMERIC)::TEXT,
                         krw_locked=(krw_locked::NUMERIC+p_amount::NUMERIC)::TEXT,
                         version=version+1 WHERE id=v_wallet.id;
  END CASE;

  INSERT INTO wallet_ledger (wallet_id,user_id,idempotency_key,direction,currency,amount,
    available_before,locked_before,available_after,locked_after,reason_code)
  SELECT v_wallet.id,p_user_id,p_idempotency_key,'lock',p_currency,p_amount,
    v_avail_before,v_locked_before,
    CASE p_currency WHEN 'PHON' THEN phon_available WHEN 'USDT' THEN usdt_available ELSE krw_available END,
    CASE p_currency WHEN 'PHON' THEN phon_locked WHEN 'USDT' THEN usdt_locked ELSE krw_locked END,
    p_reason_code
  FROM wallets WHERE id=v_wallet.id
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

REVOKE ALL ON FUNCTION _lock_wallet_internal(UUID, currency, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── _unlock_wallet_internal — symmetric bonus/real unlock ─────────────────

CREATE OR REPLACE FUNCTION _unlock_wallet_internal(
  p_user_id UUID, p_currency currency, p_amount TEXT,
  p_reason_code TEXT, p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets;
  v_entry_id UUID;
  v_avail_before TEXT;
  v_locked_before TEXT;
  v_total NUMERIC;
  v_from_bonus NUMERIC;
  v_from_real NUMERIC;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;

  IF auth.uid() = p_user_id THEN
    PERFORM _assert_account_activity_live(p_user_id);
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  CASE p_currency
    WHEN 'PHON' THEN
      v_total := p_amount::NUMERIC;
      v_avail_before := v_wallet.phon_available;
      v_locked_before := v_wallet.phon_locked;

      IF (v_wallet.phon_bonus_locked::NUMERIC + v_wallet.phon_real_locked::NUMERIC) < v_total THEN
        RAISE EXCEPTION 'insufficient_locked' USING HINT='PHON';
      END IF;

      v_from_bonus := LEAST(v_total, v_wallet.phon_bonus_locked::NUMERIC);
      v_from_real  := v_total - v_from_bonus;

      UPDATE wallets
         SET phon_bonus_locked    = (phon_bonus_locked::NUMERIC - v_from_bonus)::TEXT,
             phon_bonus_available = (phon_bonus_available::NUMERIC + v_from_bonus)::TEXT,
             phon_real_locked     = (phon_real_locked::NUMERIC - v_from_real)::TEXT,
             phon_real_available  = (phon_real_available::NUMERIC + v_from_real)::TEXT,
             version = version + 1
       WHERE id = v_wallet.id;

      PERFORM _sync_phon_wallet_totals(v_wallet.id);

    WHEN 'USDT' THEN
      IF v_wallet.usdt_locked::NUMERIC < p_amount::NUMERIC THEN
        RAISE EXCEPTION 'insufficient_locked' USING HINT='USDT';
      END IF;
      v_avail_before := v_wallet.usdt_available; v_locked_before := v_wallet.usdt_locked;
      UPDATE wallets SET usdt_locked=(usdt_locked::NUMERIC-p_amount::NUMERIC)::TEXT,
                         usdt_available=(usdt_available::NUMERIC+p_amount::NUMERIC)::TEXT,
                         version=version+1 WHERE id=v_wallet.id;
    WHEN 'KRW' THEN
      IF v_wallet.krw_locked::NUMERIC < p_amount::NUMERIC THEN
        RAISE EXCEPTION 'insufficient_locked' USING HINT='KRW';
      END IF;
      v_avail_before := v_wallet.krw_available; v_locked_before := v_wallet.krw_locked;
      UPDATE wallets SET krw_locked=(krw_locked::NUMERIC-p_amount::NUMERIC)::TEXT,
                         krw_available=(krw_available::NUMERIC+p_amount::NUMERIC)::TEXT,
                         version=version+1 WHERE id=v_wallet.id;
  END CASE;

  INSERT INTO wallet_ledger (wallet_id,user_id,idempotency_key,direction,currency,amount,
    available_before,locked_before,available_after,locked_after,reason_code)
  SELECT v_wallet.id,p_user_id,p_idempotency_key,'unlock',p_currency,p_amount,
    v_avail_before,v_locked_before,
    CASE p_currency WHEN 'PHON' THEN phon_available WHEN 'USDT' THEN usdt_available ELSE krw_available END,
    CASE p_currency WHEN 'PHON' THEN phon_locked WHEN 'USDT' THEN usdt_locked ELSE krw_locked END,
    p_reason_code
  FROM wallets WHERE id=v_wallet.id
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

REVOKE ALL ON FUNCTION _unlock_wallet_internal(UUID, currency, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

-- ─── rpc_lock_wallet — PHON withdrawal = real-only ───────────────────────────

CREATE OR REPLACE FUNCTION rpc_lock_wallet(
  p_currency        currency,
  p_amount          TEXT,
  p_reason_code     TEXT,
  p_idempotency_key TEXT,
  p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM set_config('phonara.ledger_write', 'allowed', true);
  RETURN _lock_wallet_internal(
    v_user_id, p_currency, p_amount, p_reason_code, p_idempotency_key
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION rpc_lock_wallet(currency, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_lock_wallet(currency, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- ─── Client RPC: PHON balance breakdown (display-only contract for D3/D4) ──────

CREATE OR REPLACE FUNCTION rpc_get_phon_balance_breakdown()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet wallets%ROWTYPE;
  v_wagering_remaining TEXT := '0.000000';
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  SELECT COALESCE(
    _fmt6(SUM(wagering_remaining::NUMERIC)),
    '0.000000'
  ) INTO v_wagering_remaining
    FROM bonus_wagering_requirements
   WHERE user_id = v_user_id
     AND status = 'active';

  RETURN jsonb_build_object(
    'ok', TRUE,
    'phon_bonus_available', v_wallet.phon_bonus_available,
    'phon_real_available', v_wallet.phon_real_available,
    'phon_bonus_locked', v_wallet.phon_bonus_locked,
    'phon_real_locked', v_wallet.phon_real_locked,
    'phon_available', v_wallet.phon_available,
    'phon_locked', v_wallet.phon_locked,
    'wagering_remaining', v_wagering_remaining
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_get_phon_balance_breakdown() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_get_phon_balance_breakdown() TO authenticated;

-- ─── Test compat: legacy phon_available seeds → real bucket + total sync ─────

CREATE OR REPLACE FUNCTION _wallet_phon_track_compat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.phon_available IS DISTINCT FROM OLD.phon_available
     AND NEW.phon_real_available IS NOT DISTINCT FROM OLD.phon_real_available
     AND NEW.phon_bonus_available IS NOT DISTINCT FROM OLD.phon_bonus_available THEN
    NEW.phon_real_available := NEW.phon_available;
    NEW.phon_bonus_available := '0.000000';
  END IF;

  NEW.phon_available := (
    NEW.phon_bonus_available::NUMERIC + NEW.phon_real_available::NUMERIC
  )::TEXT;
  NEW.phon_locked := (
    NEW.phon_bonus_locked::NUMERIC + NEW.phon_real_locked::NUMERIC
  )::TEXT;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION _wallet_phon_track_compat() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_wallet_phon_track_compat ON wallets;
DROP TRIGGER IF EXISTS trg_00_a_phon_track_compat ON wallets;
CREATE TRIGGER trg_00_a_phon_track_compat
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION _wallet_phon_track_compat();

-- Extend balance guard for bonus/real columns; postgres superuser bypass for SQL tests
CREATE OR REPLACE FUNCTION _guard_wallet_balance_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_effective_role TEXT := COALESCE(NULLIF(current_setting('role', true), 'none'), session_user);
BEGIN
  IF v_effective_role IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF OLD.phon_available IS DISTINCT FROM NEW.phon_available
     OR OLD.phon_locked IS DISTINCT FROM NEW.phon_locked
     OR OLD.phon_bonus_available IS DISTINCT FROM NEW.phon_bonus_available
     OR OLD.phon_real_available IS DISTINCT FROM NEW.phon_real_available
     OR OLD.phon_bonus_locked IS DISTINCT FROM NEW.phon_bonus_locked
     OR OLD.phon_real_locked IS DISTINCT FROM NEW.phon_real_locked
     OR OLD.usdt_available IS DISTINCT FROM NEW.usdt_available
     OR OLD.usdt_locked IS DISTINCT FROM NEW.usdt_locked
     OR OLD.krw_available IS DISTINCT FROM NEW.krw_available
     OR OLD.krw_locked IS DISTINCT FROM NEW.krw_locked THEN
    PERFORM _require_ledger_write_allowed();
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION _guard_wallet_balance_update() FROM PUBLIC, anon, authenticated;

-- ─── _debit_locked_wallet_internal — consume real locked for PHON withdrawal ─

CREATE OR REPLACE FUNCTION _debit_locked_wallet_internal(
  p_user_id UUID,
  p_currency currency,
  p_amount TEXT,
  p_reason_code TEXT,
  p_idempotency_key TEXT,
  p_related_entity_id UUID DEFAULT NULL,
  p_transfer_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet wallets;
  v_entry_id UUID;
  v_avail_before TEXT;
  v_locked_before TEXT;
  v_from_bonus NUMERIC;
  v_from_real NUMERIC;
  v_total NUMERIC;
BEGIN
  PERFORM set_config('phonara.ledger_write', 'allowed', true);

  IF p_amount IS NULL OR p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT id INTO v_entry_id FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN RETURN v_entry_id; END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  CASE p_currency
    WHEN 'PHON' THEN
      v_total := p_amount::NUMERIC;
      IF _is_phon_withdrawal_lock_reason(p_reason_code)
         OR p_reason_code LIKE 'withdrawal%' THEN
        IF v_wallet.phon_real_locked::NUMERIC < v_total THEN
          RAISE EXCEPTION 'insufficient_locked' USING HINT = 'PHON';
        END IF;
        v_from_real := v_total;
        v_from_bonus := 0;
      ELSE
        IF (v_wallet.phon_bonus_locked::NUMERIC + v_wallet.phon_real_locked::NUMERIC) < v_total THEN
          RAISE EXCEPTION 'insufficient_locked' USING HINT = 'PHON';
        END IF;
        v_from_bonus := LEAST(v_total, v_wallet.phon_bonus_locked::NUMERIC);
        v_from_real  := v_total - v_from_bonus;
      END IF;

      v_avail_before := v_wallet.phon_available;
      v_locked_before := v_wallet.phon_locked;

      UPDATE wallets
         SET phon_bonus_locked = (phon_bonus_locked::NUMERIC - v_from_bonus)::TEXT,
             phon_real_locked  = (phon_real_locked::NUMERIC - v_from_real)::TEXT,
             version = version + 1
       WHERE id = v_wallet.id;

      PERFORM _sync_phon_wallet_totals(v_wallet.id);

    WHEN 'USDT' THEN
      IF v_wallet.usdt_locked::NUMERIC < p_amount::NUMERIC THEN
        RAISE EXCEPTION 'insufficient_locked' USING HINT = 'USDT';
      END IF;
      v_avail_before := v_wallet.usdt_available;
      v_locked_before := v_wallet.usdt_locked;
      UPDATE wallets
         SET usdt_locked = (usdt_locked::NUMERIC - p_amount::NUMERIC)::TEXT,
             version = version + 1
       WHERE id = v_wallet.id;
    WHEN 'KRW' THEN
      IF v_wallet.krw_locked::NUMERIC < p_amount::NUMERIC THEN
        RAISE EXCEPTION 'insufficient_locked' USING HINT = 'KRW';
      END IF;
      v_avail_before := v_wallet.krw_available;
      v_locked_before := v_wallet.krw_locked;
      UPDATE wallets
         SET krw_locked = (krw_locked::NUMERIC - p_amount::NUMERIC)::TEXT,
             version = version + 1
       WHERE id = v_wallet.id;
  END CASE;

  INSERT INTO wallet_ledger (
    wallet_id, user_id, idempotency_key, direction, currency, amount,
    available_before, locked_before, available_after, locked_after,
    reason_code, related_entity_id, transfer_id
  )
  SELECT
    v_wallet.id, p_user_id, p_idempotency_key, 'debit', p_currency, p_amount,
    v_avail_before, v_locked_before,
    CASE p_currency
      WHEN 'PHON' THEN phon_available WHEN 'USDT' THEN usdt_available ELSE krw_available
    END,
    CASE p_currency
      WHEN 'PHON' THEN phon_locked WHEN 'USDT' THEN usdt_locked ELSE krw_locked
    END,
    p_reason_code, p_related_entity_id, p_transfer_id
  FROM wallets WHERE id = v_wallet.id
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

REVOKE ALL ON FUNCTION _debit_locked_wallet_internal(UUID, currency, TEXT, TEXT, TEXT, UUID, UUID)
  FROM PUBLIC, anon, authenticated;

-- ─── bonus_wagering_requirements GRANT hygiene ───────────────────────────────

REVOKE ALL ON TABLE bonus_wagering_requirements FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE bonus_wagering_requirements TO authenticated;
GRANT ALL ON TABLE bonus_wagering_requirements TO service_role;
