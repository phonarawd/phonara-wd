-- Raise welcome bonus base from 5,000 → 10,000 PHON for users who have not yet claimed.
-- Existing welcome_bonuses rows are unchanged; rpc_claim_welcome_bonus returns
-- already_claimed without a second ledger credit (user_id PK + welcome:{user_id} idempotency).

CREATE OR REPLACE FUNCTION rpc_claim_welcome_bonus(
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id         UUID := auth.uid();
  v_base_phon       NUMERIC := 10000;
  v_bonus_phon      NUMERIC := 0;
  v_total_phon      NUMERIC;
  v_total_text      TEXT;
  v_ref_row         referrals%ROWTYPE;
  v_ledger_id       UUID;
  v_idempotency_key TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  PERFORM 1 FROM welcome_bonuses WHERE user_id = v_user_id;
  IF FOUND THEN
    RETURN (SELECT jsonb_build_object(
      'already_claimed', TRUE,
      'phon_awarded', phon_awarded,
      'referral_bonus', referral_bonus
    ) FROM welcome_bonuses WHERE user_id = v_user_id);
  END IF;

  SELECT * INTO v_ref_row FROM referrals WHERE referred_id = v_user_id;
  IF v_ref_row.id IS NOT NULL AND v_ref_row.rewarded_at IS NULL THEN
    v_bonus_phon := 1000;
  END IF;

  v_total_phon := v_base_phon + v_bonus_phon;
  v_total_text := TO_CHAR(v_total_phon, 'FM9999990.000000');

  v_idempotency_key := COALESCE(p_idempotency_key, 'welcome:' || v_user_id::TEXT);

  PERFORM _credit_wallet_internal(
    v_user_id, 'PHON', v_total_text, 'welcome_bonus', v_idempotency_key
  );

  SELECT id INTO v_ledger_id
    FROM wallet_ledger
   WHERE idempotency_key = v_idempotency_key
   LIMIT 1;

  INSERT INTO welcome_bonuses (user_id, phon_awarded, referral_bonus, ledger_entry_id)
  VALUES (
    v_user_id,
    v_total_text,
    TO_CHAR(v_bonus_phon, 'FM9999990.000000'),
    v_ledger_id
  );

  IF v_ref_row.id IS NOT NULL AND v_ref_row.rewarded_at IS NULL THEN
    DECLARE
      v_ref_idem TEXT := 'referral_reward:' || v_ref_row.id::TEXT;
      v_ref_ledger UUID;
    BEGIN
      PERFORM _credit_wallet_internal(
        v_ref_row.referrer_id, 'PHON', '2000.000000', 'referral_bonus', v_ref_idem
      );

      SELECT id INTO v_ref_ledger
        FROM wallet_ledger
       WHERE idempotency_key = v_ref_idem
       LIMIT 1;

      UPDATE referrals SET
        referrer_phon      = '2000.000000',
        referred_phon      = TO_CHAR(v_bonus_phon, 'FM9999990.000000'),
        referrer_ledger_id = v_ref_ledger,
        rewarded_at        = NOW()
      WHERE id = v_ref_row.id;
    END;
  END IF;

  RETURN jsonb_build_object(
    'already_claimed', FALSE,
    'phon_awarded', v_total_text,
    'referral_bonus', TO_CHAR(v_bonus_phon, 'FM9999990.000000')
  );
END;
$$;
