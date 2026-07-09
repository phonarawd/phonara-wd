-- WorldNo1 closeout — admin flag deposit · manual adjust idempotency · edge cron wiring
SET search_path = public, pg_temp;

-- ─── Admin flag/reject deposit (giftcard · KRW · crypto) ─────────────────────
CREATE OR REPLACE FUNCTION rpc_admin_flag_deposit(
  p_deposit_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reason TEXT := NULLIF(btrim(p_reason), '');
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF v_reason IS NULL OR length(v_reason) < 4 THEN RAISE EXCEPTION 'reason_too_short'; END IF;

  UPDATE giftcard_deposit_requests
     SET status = 'rejected',
         admin_note = v_reason,
         reviewed_by = auth.uid(),
         reviewed_at = NOW(),
         updated_at = NOW()
   WHERE id = p_deposit_id
     AND status = 'pending';
  IF FOUND THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (auth.uid(), 'giftcard_deposit_flagged', 'giftcard_deposit_requests', p_deposit_id,
            jsonb_build_object('reason', v_reason, 'status', 'rejected'));
    RETURN jsonb_build_object('ok', TRUE, 'kind', 'giftcard', 'status', 'rejected');
  END IF;

  UPDATE krw_deposit_requests
     SET status = 'admin_rejected',
         admin_note = v_reason,
         updated_at = NOW()
   WHERE id = p_deposit_id
     AND status IN ('pending', 'unmatched', 'disputed');
  IF FOUND THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (auth.uid(), 'krw_deposit_flagged', 'krw_deposit_requests', p_deposit_id,
            jsonb_build_object('reason', v_reason, 'status', 'admin_rejected'));
    RETURN jsonb_build_object('ok', TRUE, 'kind', 'krw', 'status', 'admin_rejected');
  END IF;

  UPDATE crypto_deposit_requests
     SET status = 'admin_rejected',
         updated_at = NOW()
   WHERE id = p_deposit_id
     AND status IN ('pending', 'unmatched', 'disputed');
  IF FOUND THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
    VALUES (auth.uid(), 'crypto_deposit_flagged', 'crypto_deposit_requests', p_deposit_id,
            jsonb_build_object('reason', v_reason, 'status', 'admin_rejected'));
    RETURN jsonb_build_object('ok', TRUE, 'kind', 'crypto', 'status', 'admin_rejected');
  END IF;

  RAISE EXCEPTION 'invalid_deposit_status';
END;
$$;

REVOKE ALL ON FUNCTION rpc_admin_flag_deposit(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_admin_flag_deposit(UUID, TEXT) TO authenticated, service_role;

-- ─── Manual adjust idempotency — return original ledger_id on replay ───────────
CREATE OR REPLACE FUNCTION rpc_admin_manual_wallet_adjust(
  p_user_id UUID,
  p_currency TEXT,
  p_amount TEXT,
  p_direction TEXT,
  p_reason TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ccy       currency;
  v_amt       TEXT;
  v_dir       TEXT := lower(btrim(COALESCE(p_direction, '')));
  v_reason    TEXT := NULLIF(btrim(p_reason), '');
  v_ledger_id UUID;
  v_sys_code  TEXT;
  v_idem      TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT _is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  PERFORM _assert_admin_aal2();
  IF v_reason IS NULL OR length(v_reason) < 8 THEN RAISE EXCEPTION 'reason_too_short'; END IF;
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'invalid_user'; END IF;
  IF p_amount !~ '^\d+(\.\d+)?$' OR p_amount::NUMERIC <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF v_dir NOT IN ('credit', 'debit') THEN RAISE EXCEPTION 'invalid_direction'; END IF;

  BEGIN v_ccy := p_currency::currency;
  EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'invalid_currency'; END;

  v_amt := _fmt6(p_amount::NUMERIC);
  v_sys_code := CASE v_ccy
    WHEN 'PHON' THEN 'manual_adjustment_phon'
    WHEN 'USDT' THEN 'manual_adjustment_usdt'
    WHEN 'KRW' THEN 'manual_adjustment_krw'
  END;

  IF p_client_request_id IS NOT NULL AND length(btrim(p_client_request_id)) > 0 THEN
    v_idem := 'manual_adj:' || auth.uid()::TEXT || ':' || p_client_request_id;
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (auth.uid(), p_client_request_id, 'rpc_admin_manual_wallet_adjust')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN
      SELECT id INTO v_ledger_id
        FROM wallet_ledger
       WHERE idempotency_key = v_idem
       LIMIT 1;
      IF v_ledger_id IS NULL THEN
        SELECT (payload->>'ledger_id')::UUID INTO v_ledger_id
          FROM audit_logs
         WHERE actor_id = auth.uid()
           AND action = 'admin_manual_wallet_adjust'
           AND payload->>'client_request_id' = p_client_request_id
         ORDER BY created_at DESC
         LIMIT 1;
      END IF;
      RETURN jsonb_build_object('ok', TRUE, 'idempotent', TRUE, 'ledger_id', v_ledger_id);
    END IF;
  ELSE
    v_idem := 'manual_adj:' || auth.uid()::TEXT || ':' || gen_random_uuid()::TEXT;
  END IF;

  IF v_dir = 'credit' THEN
    v_ledger_id := _credit_wallet_internal(p_user_id, v_ccy, v_amt, 'admin_manual_credit', v_idem);
    PERFORM _debit_system_account(v_sys_code, v_amt, 'admin_manual_credit', p_user_id, v_idem, v_ledger_id);
  ELSE
    v_ledger_id := _debit_wallet_internal(p_user_id, v_ccy, v_amt, 'admin_manual_debit', v_idem);
    PERFORM _credit_system_account(v_sys_code, v_amt, 'admin_manual_debit', p_user_id, v_idem, v_ledger_id);
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
  VALUES (
    auth.uid(), 'admin_manual_wallet_adjust', 'wallet', p_user_id,
    jsonb_build_object(
      'currency', v_ccy, 'amount', v_amt, 'direction', v_dir,
      'reason', v_reason, 'ledger_id', v_ledger_id, 'client_request_id', p_client_request_id
    )
  );

  RETURN jsonb_build_object('ok', TRUE, 'ledger_id', v_ledger_id);
END;
$$;

-- ─── WorldNo1 edge function cron (Vault secrets · price_feed_cron pattern) ─────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

SELECT cron.unschedule('phonara_crypto_chain_watcher')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phonara_crypto_chain_watcher');
SELECT cron.unschedule('phonara_usdt_krw_feed')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phonara_usdt_krw_feed');
SELECT cron.unschedule('phonara_notification_dispatch')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'phonara_notification_dispatch');

SELECT cron.schedule(
  'phonara_crypto_chain_watcher',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'crypto_chain_watcher_url' LIMIT 1),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'crypto_chain_watcher_invoke_key' LIMIT 1),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'crypto_chain_watcher_url')
    AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'crypto_chain_watcher_invoke_key');
  $cron$
);

SELECT cron.schedule(
  'phonara_usdt_krw_feed',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'usdt_krw_feed_url' LIMIT 1),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'usdt_krw_feed_invoke_key' LIMIT 1),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'usdt_krw_feed_url')
    AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'usdt_krw_feed_invoke_key');
  $cron$
);

SELECT cron.schedule(
  'phonara_notification_dispatch',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'notification_dispatch_url' LIMIT 1),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'notification_dispatch_invoke_key' LIMIT 1),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'notification_dispatch_url')
    AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'notification_dispatch_invoke_key');
  $cron$
);
