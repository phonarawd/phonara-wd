-- PIR E1 (C-2): deterministic system_accounts lock order for spot buy∥sell.
-- Prevents AB-BA deadlock: buy touches USDT→PHON liquidity, sell touches PHON→USDT.
-- Helper locks requested codes ORDER BY code once before house legs.
-- Plan: platform_integrity_remediation_v1 · pir-e1-system-lock-order · ADR-008 §PIR

-- ─── Internal helper ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _lock_system_accounts(p_codes TEXT[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wanted INT;
  v_locked INT;
  r RECORD;
BEGIN
  IF p_codes IS NULL OR cardinality(p_codes) IS NULL OR cardinality(p_codes) = 0 THEN
    RETURN;
  END IF;

  SELECT COUNT(DISTINCT c) INTO v_wanted
  FROM unnest(p_codes) AS c
  WHERE c IS NOT NULL AND btrim(c) <> '';

  IF v_wanted = 0 THEN
    RETURN;
  END IF;

  -- Lock one row at a time in code order (alphabetical) — AB-BA safe across RPCs.
  FOR r IN
    SELECT code
    FROM system_accounts
    WHERE code = ANY (
      SELECT DISTINCT c
      FROM unnest(p_codes) AS c
      WHERE c IS NOT NULL AND btrim(c) <> ''
    )
    ORDER BY code
    FOR UPDATE
  LOOP
    NULL;
  END LOOP;

  SELECT COUNT(*)::INT INTO v_locked
  FROM system_accounts
  WHERE code = ANY (
    SELECT DISTINCT c
    FROM unnest(p_codes) AS c
    WHERE c IS NOT NULL AND btrim(c) <> ''
  );

  IF v_locked <> v_wanted THEN
    RAISE EXCEPTION 'system_account_not_found'
      USING HINT = array_to_string(p_codes, ',');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION _lock_system_accounts(TEXT[]) FROM PUBLIC, anon, authenticated;

-- Spot house paths always touch this set (fee rows locked even when fee=0).
-- Array order is irrelevant — helper re-orders by code.

-- ─── rpc_spot_market_buy (4-arg · latest body from fee conservation fix) ─────

CREATE OR REPLACE FUNCTION rpc_spot_market_buy(
  p_market           TEXT,
  p_stake_currency   TEXT,
  p_amount           TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_mkt spot_markets%ROWTYPE;
  v_price NUMERIC;
  v_amount NUMERIC;
  v_fee_rate NUMERIC;
  v_gross_base NUMERIC;
  v_fee NUMERIC;
  v_net_base NUMERIC;
  v_stake NUMERIC;
  v_base TEXT;
  v_trade_id UUID;
  v_tid UUID := gen_random_uuid();
  v_usdt_spent NUMERIC;
  v_phon_spent NUMERIC;
  v_fee_leg NUMERIC;
  v_fee_account TEXT;
  v_liquidity_account TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_spot_market_buy');
  PERFORM _assert_feature_enabled('spot');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_amount);

  IF p_stake_currency NOT IN ('USDT', 'PHON') THEN
    RAISE EXCEPTION 'invalid_stake_currency';
  END IF;

  IF p_client_request_id IS NOT NULL THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_spot_market_buy')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN RAISE EXCEPTION 'duplicate_request'; END IF;
    v_trade_id := _uuid_from_md5('spot_buy:' || v_user_id::TEXT || ':' || p_client_request_id);
  ELSE
    v_trade_id := gen_random_uuid();
  END IF;

  v_amount := p_amount::NUMERIC;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT * INTO v_mkt FROM spot_markets WHERE symbol = p_market AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  v_price := _assert_price_fresh(p_market);
  v_fee_rate := v_mkt.fee_rate::NUMERIC;

  -- PIR E1: lock house accounts before any wallet/system legs.
  PERFORM _lock_system_accounts(ARRAY[
    'house_fee_phon',
    'house_fee_usdt',
    'house_liquidity_phon',
    'house_liquidity_usdt'
  ]);

  IF p_market = 'PHON_USDT' THEN
    v_base := 'PHON';
    IF p_stake_currency <> 'USDT' THEN
      RAISE EXCEPTION 'invalid_stake_currency' USING HINT = 'PHON_USDT buy requires USDT';
    END IF;
    v_usdt_spent := trunc(v_amount, 6);
    IF v_mkt.min_notional IS NOT NULL AND v_usdt_spent < v_mkt.min_notional::NUMERIC THEN
      RAISE EXCEPTION 'below_min_notional' USING HINT = p_market;
    END IF;
    v_gross_base := v_usdt_spent / v_price;
    v_fee := v_gross_base * v_fee_rate;
    v_net_base := trunc(v_gross_base - v_fee, 6);

    PERFORM _debit_wallet_internal(v_user_id, 'USDT', _fmt6(v_usdt_spent),
      'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
    PERFORM _credit_system_account('house_liquidity_usdt', _fmt6(v_usdt_spent),
      'spot_buy_liquidity', v_user_id, v_trade_id::TEXT, v_tid);
    PERFORM _credit_wallet_internal(v_user_id, 'PHON', _fmt6(v_net_base),
      'spot_buy_recv', 'spot_recv:' || v_trade_id::TEXT);
    IF v_fee > 0 THEN
      PERFORM _credit_system_account('house_fee_phon', _fmt6(v_fee),
        'spot_buy_fee', v_user_id, v_trade_id::TEXT, v_tid);
    END IF;
    PERFORM _debit_system_account('house_liquidity_phon', _fmt6(v_net_base + v_fee),
      'spot_buy_liquidity', v_user_id, v_trade_id::TEXT, v_tid);

    INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
      fee_currency, fee_amount, base_asset, stake_currency, base_amount)
    VALUES (v_trade_id, v_user_id, p_market, 'buy', _fmt6(v_price), _fmt6(v_net_base),
      _fmt6(v_usdt_spent), 'PHON', _fmt6(v_fee), v_base, 'USDT'::currency, _fmt6(v_net_base));

    RETURN jsonb_build_object(
      'trade_id', v_trade_id, 'side', 'buy', 'market', p_market,
      'price', _fmt6(v_price), 'stake_currency', 'USDT',
      'stake_spent', _fmt6(v_usdt_spent), 'base_received', _fmt6(v_net_base), 'fee', _fmt6(v_fee)
    );
  END IF;

  v_base := split_part(p_market, '_', 1);

  IF p_stake_currency = 'USDT' THEN
    v_usdt_spent := trunc(v_amount, 6);
    v_stake := v_usdt_spent;
  ELSE
    v_phon_spent := trunc(v_amount, 6);
    v_stake := v_phon_spent * _assert_price_fresh('PHON_USDT');
    v_usdt_spent := trunc(v_stake, 6);
  END IF;

  IF v_mkt.min_notional IS NOT NULL AND v_usdt_spent < v_mkt.min_notional::NUMERIC THEN
    RAISE EXCEPTION 'below_min_notional' USING HINT = p_market;
  END IF;

  v_gross_base := v_usdt_spent / v_price;
  v_fee := v_gross_base * v_fee_rate;
  v_net_base := trunc(v_gross_base - v_fee, 6);

  IF p_stake_currency = 'USDT' THEN
    PERFORM _debit_wallet_internal(v_user_id, 'USDT', _fmt6(v_usdt_spent),
      'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
    PERFORM _credit_system_account('house_liquidity_usdt', _fmt6(v_usdt_spent),
      'spot_buy_liquidity', v_user_id, v_trade_id::TEXT, v_tid);
    v_fee_leg := trunc(v_fee * v_price, 6);
    v_fee_account := 'house_fee_usdt';
    v_liquidity_account := 'house_liquidity_usdt';
  ELSE
    PERFORM _debit_wallet_internal(v_user_id, 'PHON', _fmt6(v_phon_spent),
      'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
    PERFORM _credit_system_account('house_liquidity_phon', _fmt6(v_phon_spent),
      'spot_buy_liquidity', v_user_id, v_trade_id::TEXT, v_tid);
    v_fee_leg := trunc(v_fee * v_price, 6);
    v_fee_account := 'house_fee_phon';
    v_liquidity_account := 'house_liquidity_phon';
  END IF;

  PERFORM _upsert_spot_holding(v_user_id, v_base, v_net_base);

  IF v_fee > 0 THEN
    PERFORM _credit_system_account(v_fee_account, _fmt6(v_fee_leg),
      'spot_buy_fee', v_user_id, v_trade_id::TEXT, v_tid);
    PERFORM _debit_system_account(v_liquidity_account, _fmt6(v_fee_leg),
      'spot_buy_fee', v_user_id, v_trade_id::TEXT, v_tid);
  END IF;

  INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
    fee_currency, fee_amount, base_asset, stake_currency, base_amount)
  VALUES (
    v_trade_id, v_user_id, p_market, 'buy', _fmt6(v_price),
    CASE WHEN v_base = 'PHON' THEN _fmt6(v_net_base) ELSE '0.000000' END,
    _fmt6(v_usdt_spent),
    CASE WHEN p_stake_currency = 'USDT' THEN 'USDT'::currency ELSE 'PHON'::currency END,
    _fmt6(trunc(v_fee * v_price, 6)),
    v_base, p_stake_currency::currency, _fmt6(v_net_base)
  );

  RETURN jsonb_build_object(
    'trade_id', v_trade_id, 'side', 'buy', 'market', p_market,
    'price', _fmt6(v_price), 'stake_currency', p_stake_currency,
    'base_received', _fmt6(v_net_base), 'fee_base', _fmt6(v_fee)
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_spot_market_buy(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spot_market_buy(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ─── rpc_spot_market_sell (4-arg) ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rpc_spot_market_sell(
  p_market            TEXT,
  p_stake_currency    TEXT,
  p_base_amount       TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_mkt spot_markets%ROWTYPE;
  v_price NUMERIC;
  v_base_amt NUMERIC;
  v_fee_rate NUMERIC;
  v_gross_stake NUMERIC;
  v_fee NUMERIC;
  v_net_stake NUMERIC;
  v_base TEXT;
  v_trade_id UUID;
  v_tid UUID := gen_random_uuid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM _assert_system_live();
  PERFORM _enforce_rate_limit(v_user_id, 'rpc_spot_market_sell');
  PERFORM _assert_feature_enabled('spot');
  PERFORM _assert_onboarding_consent(v_user_id);
  PERFORM _assert_amount_text(p_base_amount);

  IF p_stake_currency NOT IN ('USDT', 'PHON') THEN
    RAISE EXCEPTION 'invalid_stake_currency';
  END IF;

  IF p_client_request_id IS NOT NULL THEN
    INSERT INTO rpc_request_idem (user_id, client_request_id, rpc_name)
    VALUES (v_user_id, p_client_request_id, 'rpc_spot_market_sell')
    ON CONFLICT (user_id, client_request_id) DO NOTHING;
    IF NOT FOUND THEN RAISE EXCEPTION 'duplicate_request'; END IF;
    v_trade_id := _uuid_from_md5('spot_sell:' || v_user_id::TEXT || ':' || p_client_request_id);
  ELSE
    v_trade_id := gen_random_uuid();
  END IF;

  v_base_amt := p_base_amount::NUMERIC;
  IF v_base_amt <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT * INTO v_mkt FROM spot_markets WHERE symbol = p_market AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  v_price := _assert_price_fresh(p_market);
  v_fee_rate := v_mkt.fee_rate::NUMERIC;

  -- PIR E1: lock house accounts before any wallet/system legs.
  PERFORM _lock_system_accounts(ARRAY[
    'house_fee_phon',
    'house_fee_usdt',
    'house_liquidity_phon',
    'house_liquidity_usdt'
  ]);

  IF p_market = 'PHON_USDT' THEN
    v_base := 'PHON';
    v_gross_stake := trunc(v_base_amt * v_price, 6);
    IF v_mkt.min_notional IS NOT NULL AND v_gross_stake < v_mkt.min_notional::NUMERIC THEN
      RAISE EXCEPTION 'below_min_notional' USING HINT = p_market;
    END IF;
    v_fee := trunc(v_gross_stake * v_fee_rate, 6);
    v_net_stake := v_gross_stake - v_fee;

    PERFORM _debit_wallet_internal(v_user_id, 'PHON', _fmt6(v_base_amt),
      'spot_sell_pay', 'spot_pay:' || v_trade_id::TEXT);
    PERFORM _credit_system_account('house_liquidity_phon', _fmt6(v_base_amt),
      'spot_sell_liquidity', v_user_id, v_trade_id::TEXT, v_tid);
    PERFORM _credit_wallet_internal(v_user_id, 'USDT', _fmt6(v_net_stake),
      'spot_sell_recv', 'spot_recv:' || v_trade_id::TEXT);
    IF v_fee > 0 THEN
      PERFORM _credit_system_account('house_fee_usdt', _fmt6(v_fee),
        'spot_sell_fee', v_user_id, v_trade_id::TEXT, v_tid);
    END IF;
    PERFORM _debit_system_account('house_liquidity_usdt', _fmt6(v_net_stake + v_fee),
      'spot_sell_liquidity', v_user_id, v_trade_id::TEXT, v_tid);

    INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
      fee_currency, fee_amount, base_asset, stake_currency, base_amount)
    VALUES (v_trade_id, v_user_id, p_market, 'sell', _fmt6(v_price), _fmt6(v_base_amt),
      _fmt6(v_net_stake), 'USDT', _fmt6(v_fee), v_base, 'USDT'::currency, _fmt6(v_base_amt));

    RETURN jsonb_build_object(
      'trade_id', v_trade_id, 'side', 'sell', 'market', p_market,
      'phon_sold', _fmt6(v_base_amt), 'usdt_received', _fmt6(v_net_stake)
    );
  END IF;

  v_base := split_part(p_market, '_', 1);
  PERFORM _upsert_spot_holding(v_user_id, v_base, -v_base_amt);

  v_gross_stake := trunc(v_base_amt * v_price, 6);
  IF v_mkt.min_notional IS NOT NULL AND v_gross_stake < v_mkt.min_notional::NUMERIC THEN
    RAISE EXCEPTION 'below_min_notional' USING HINT = p_market;
  END IF;
  v_fee := trunc(v_gross_stake * v_fee_rate, 6);
  v_net_stake := v_gross_stake - v_fee;

  IF p_stake_currency = 'USDT' THEN
    PERFORM _credit_wallet_internal(v_user_id, 'USDT', _fmt6(v_net_stake),
      'spot_sell_recv', 'spot_recv:' || v_trade_id::TEXT);
    PERFORM _debit_system_account('house_liquidity_usdt', _fmt6(v_net_stake + v_fee),
      'spot_sell_liquidity', v_user_id, v_trade_id::TEXT, v_tid);
    IF v_fee > 0 THEN
      PERFORM _credit_system_account('house_fee_usdt', _fmt6(v_fee),
        'spot_sell_fee', v_user_id, v_trade_id::TEXT, v_tid);
    END IF;
  ELSE
    v_net_stake := trunc(v_net_stake / NULLIF(_assert_price_fresh('PHON_USDT'), 0), 6);
    v_fee := trunc(v_fee / NULLIF(_assert_price_fresh('PHON_USDT'), 0), 6);
    PERFORM _credit_wallet_internal(v_user_id, 'PHON', _fmt6(v_net_stake),
      'spot_sell_recv', 'spot_recv:' || v_trade_id::TEXT);
    PERFORM _debit_system_account('house_liquidity_phon', _fmt6(v_net_stake + v_fee),
      'spot_sell_liquidity', v_user_id, v_trade_id::TEXT, v_tid);
    IF v_fee > 0 THEN
      PERFORM _credit_system_account('house_fee_phon', _fmt6(v_fee),
        'spot_sell_fee', v_user_id, v_trade_id::TEXT, v_tid);
    END IF;
  END IF;

  INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
    fee_currency, fee_amount, base_asset, stake_currency, base_amount)
  VALUES (
    v_trade_id, v_user_id, p_market, 'sell', _fmt6(v_price), '0.000000',
    CASE WHEN p_stake_currency = 'USDT' THEN _fmt6(v_net_stake) ELSE '0.000000' END,
    p_stake_currency::currency, _fmt6(v_fee), v_base, p_stake_currency::currency, _fmt6(v_base_amt)
  );

  RETURN jsonb_build_object(
    'trade_id', v_trade_id, 'side', 'sell', 'market', p_market,
    'base_sold', _fmt6(v_base_amt), 'stake_received', _fmt6(v_net_stake)
  );
END;
$$;

REVOKE ALL ON FUNCTION rpc_spot_market_sell(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spot_market_sell(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ─── _fill_house_spot_order ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _fill_house_spot_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order      spot_open_orders%ROWTYPE;
  v_mkt        spot_markets%ROWTYPE;
  v_mark       NUMERIC;
  v_fill_px    NUMERIC;
  v_fee_rate   NUMERIC;
  v_gross_base NUMERIC;
  v_fee        NUMERIC;
  v_net_base   NUMERIC;
  v_gross_stake NUMERIC;
  v_net_stake  NUMERIC;
  v_trade_id   UUID := gen_random_uuid();
  v_tid        UUID := gen_random_uuid();
  v_usdt_spent NUMERIC;
BEGIN
  SELECT * INTO v_order
  FROM spot_open_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.status NOT IN ('open', 'triggered') THEN
    RAISE EXCEPTION 'order_not_fillable';
  END IF;

  SELECT * INTO v_mkt FROM spot_markets WHERE symbol = v_order.market AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'market_not_found'; END IF;

  v_mark := _assert_price_fresh(v_order.market);
  v_fee_rate := v_mkt.fee_rate::NUMERIC;

  IF v_order.order_type = 'limit' THEN
    IF NOT _spot_order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
      RAISE EXCEPTION 'limit_not_crossed';
    END IF;
    v_fill_px := v_order.price::NUMERIC;
  ELSIF v_order.order_type = 'stop_market' THEN
    IF NOT _spot_order_stop_entry_triggered(v_order.side, v_mark, v_order.stop_price) THEN
      RAISE EXCEPTION 'stop_not_triggered';
    END IF;
    v_fill_px := v_mark;
  ELSIF v_order.order_type = 'stop_limit' THEN
    IF NOT _spot_order_limit_crossed(v_order.side, v_mark, v_order.price) THEN
      RAISE EXCEPTION 'limit_not_crossed';
    END IF;
    v_fill_px := v_order.price::NUMERIC;
  ELSE
    RAISE EXCEPTION 'invalid_order_type';
  END IF;

  -- PIR E1: lock house accounts before unlock/settle legs that touch system_accounts.
  PERFORM _lock_system_accounts(ARRAY[
    'house_fee_phon',
    'house_fee_usdt',
    'house_liquidity_phon',
    'house_liquidity_usdt'
  ]);

  IF v_order.side = 'buy' THEN
    PERFORM _unlock_wallet_internal(
      v_order.user_id, v_order.stake_currency, v_order.stake_amount,
      'spot_order_unlock', 'spot_fill_unlock:' || v_order.id::TEXT
    );

    IF v_order.market = 'PHON_USDT' THEN
      v_usdt_spent := v_order.stake_amount::NUMERIC;
      v_gross_base := v_usdt_spent / v_fill_px;
      v_fee := v_gross_base * v_fee_rate;
      v_net_base := trunc(v_gross_base - v_fee, 6);

      PERFORM _debit_wallet_internal(v_order.user_id, 'USDT', _fmt6(v_usdt_spent),
        'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
      PERFORM _credit_system_account('house_liquidity_usdt', _fmt6(v_usdt_spent),
        'spot_buy_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
      PERFORM _credit_wallet_internal(v_order.user_id, 'PHON', _fmt6(v_net_base),
        'spot_buy_recv', 'spot_recv:' || v_trade_id::TEXT);
      IF v_fee > 0 THEN
        PERFORM _credit_system_account('house_fee_phon', _fmt6(v_fee),
          'spot_buy_fee', v_order.user_id, v_trade_id::TEXT, v_tid);
      END IF;
      PERFORM _debit_system_account('house_liquidity_phon', _fmt6(v_net_base + v_fee),
        'spot_buy_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);

      INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
        fee_currency, fee_amount, base_asset, stake_currency, base_amount)
      VALUES (v_trade_id, v_order.user_id, v_order.market, 'buy', _fmt6(v_fill_px), _fmt6(v_net_base),
        _fmt6(v_usdt_spent), 'PHON', _fmt6(v_fee), v_order.base_asset, 'USDT'::currency, _fmt6(v_net_base));
    ELSE
      IF v_order.stake_currency = 'USDT' THEN
        v_usdt_spent := v_order.stake_amount::NUMERIC;
      ELSE
        v_usdt_spent := trunc(v_order.stake_amount::NUMERIC * _assert_price_fresh('PHON_USDT'), 6);
      END IF;
      v_gross_base := v_usdt_spent / v_fill_px;
      v_fee := v_gross_base * v_fee_rate;
      v_net_base := trunc(v_gross_base - v_fee, 6);

      IF v_order.stake_currency = 'USDT' THEN
        PERFORM _debit_wallet_internal(v_order.user_id, 'USDT', _fmt6(v_usdt_spent),
          'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
        PERFORM _credit_system_account('house_liquidity_usdt', _fmt6(v_usdt_spent),
          'spot_buy_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
      ELSE
        PERFORM _debit_wallet_internal(v_order.user_id, 'PHON', _fmt6(v_order.stake_amount::NUMERIC),
          'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
        PERFORM _credit_system_account('house_liquidity_phon', _fmt6(v_order.stake_amount::NUMERIC),
          'spot_buy_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
      END IF;

      PERFORM _upsert_spot_holding(v_order.user_id, v_order.base_asset, v_net_base);

      IF v_fee > 0 THEN
        PERFORM _credit_system_account(
          CASE WHEN v_order.stake_currency = 'USDT' THEN 'house_fee_usdt' ELSE 'house_fee_phon' END,
          _fmt6(trunc(v_fee * v_fill_px, 6)),
          'spot_buy_fee', v_order.user_id, v_trade_id::TEXT, v_tid
        );
      END IF;

      INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
        fee_currency, fee_amount, base_asset, stake_currency, base_amount)
      VALUES (
        v_trade_id, v_order.user_id, v_order.market, 'buy', _fmt6(v_fill_px),
        CASE WHEN v_order.base_asset = 'PHON' THEN _fmt6(v_net_base) ELSE '0.000000' END,
        _fmt6(v_usdt_spent),
        CASE WHEN v_order.stake_currency = 'USDT' THEN 'USDT'::currency ELSE 'PHON'::currency END,
        _fmt6(trunc(v_fee * v_fill_px, 6)),
        v_order.base_asset, v_order.stake_currency, _fmt6(v_net_base)
      );
    END IF;
  ELSE
    IF v_order.base_asset = 'PHON' THEN
      PERFORM _unlock_wallet_internal(
        v_order.user_id, 'PHON'::currency, v_order.quantity,
        'spot_order_unlock', 'spot_fill_unlock:' || v_order.id::TEXT
      );
    END IF;

    IF v_order.market = 'PHON_USDT' THEN
      v_gross_stake := trunc(v_order.quantity::NUMERIC * v_fill_px, 6);
      v_fee := trunc(v_gross_stake * v_fee_rate, 6);
      v_net_stake := v_gross_stake - v_fee;

      PERFORM _debit_wallet_internal(v_order.user_id, 'PHON', v_order.quantity,
        'spot_sell_pay', 'spot_pay:' || v_trade_id::TEXT);
      PERFORM _credit_system_account('house_liquidity_phon', v_order.quantity,
        'spot_sell_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
      PERFORM _credit_wallet_internal(v_order.user_id, 'USDT', _fmt6(v_net_stake),
        'spot_sell_recv', 'spot_recv:' || v_trade_id::TEXT);
      IF v_fee > 0 THEN
        PERFORM _credit_system_account('house_fee_usdt', _fmt6(v_fee),
          'spot_sell_fee', v_order.user_id, v_trade_id::TEXT, v_tid);
      END IF;
      PERFORM _debit_system_account('house_liquidity_usdt', _fmt6(v_net_stake + v_fee),
        'spot_sell_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);

      INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
        fee_currency, fee_amount, base_asset, stake_currency, base_amount)
      VALUES (v_trade_id, v_order.user_id, v_order.market, 'sell', _fmt6(v_fill_px), v_order.quantity,
        _fmt6(v_net_stake), 'USDT', _fmt6(v_fee), v_order.base_asset, 'USDT'::currency, v_order.quantity);
    ELSE
      v_gross_stake := trunc(v_order.quantity::NUMERIC * v_fill_px, 6);
      v_fee := trunc(v_gross_stake * v_fee_rate, 6);
      v_net_stake := v_gross_stake - v_fee;

      IF v_order.stake_currency = 'USDT' THEN
        PERFORM _credit_wallet_internal(v_order.user_id, 'USDT', _fmt6(v_net_stake),
          'spot_sell_recv', 'spot_recv:' || v_trade_id::TEXT);
        PERFORM _debit_system_account('house_liquidity_usdt', _fmt6(v_net_stake + v_fee),
          'spot_sell_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
        IF v_fee > 0 THEN
          PERFORM _credit_system_account('house_fee_usdt', _fmt6(v_fee),
            'spot_sell_fee', v_order.user_id, v_trade_id::TEXT, v_tid);
        END IF;
      ELSE
        v_net_stake := trunc(v_net_stake / NULLIF(_assert_price_fresh('PHON_USDT'), 0), 6);
        v_fee := trunc(v_fee / NULLIF(_assert_price_fresh('PHON_USDT'), 0), 6);
        PERFORM _credit_wallet_internal(v_order.user_id, 'PHON', _fmt6(v_net_stake),
          'spot_sell_recv', 'spot_recv:' || v_trade_id::TEXT);
        PERFORM _debit_system_account('house_liquidity_phon', _fmt6(v_net_stake + v_fee),
          'spot_sell_liquidity', v_order.user_id, v_trade_id::TEXT, v_tid);
        IF v_fee > 0 THEN
          PERFORM _credit_system_account('house_fee_phon', _fmt6(v_fee),
            'spot_sell_fee', v_order.user_id, v_trade_id::TEXT, v_tid);
        END IF;
      END IF;

      INSERT INTO spot_trades (id, user_id, market, side, price, phon_amount, usdt_amount,
        fee_currency, fee_amount, base_asset, stake_currency, base_amount)
      VALUES (
        v_trade_id, v_order.user_id, v_order.market, 'sell', _fmt6(v_fill_px), '0.000000',
        CASE WHEN v_order.stake_currency = 'USDT' THEN _fmt6(v_net_stake) ELSE '0.000000' END,
        v_order.stake_currency, _fmt6(v_fee), v_order.base_asset, v_order.stake_currency, v_order.quantity
      );
    END IF;
  END IF;

  INSERT INTO spot_order_fills (order_id, fill_price, fill_quantity, fee)
  VALUES (
    v_order.id,
    _fmt6(v_fill_px),
    v_order.quantity,
    _fmt6(COALESCE(v_fee, 0))
  );

  UPDATE spot_open_orders
  SET status = 'filled',
      filled_quantity = v_order.quantity,
      updated_at = NOW()
  WHERE id = v_order.id;

  RETURN jsonb_build_object(
    'order_id', v_order.id,
    'trade_id', v_trade_id,
    'fill_price', _fmt6(v_fill_px),
    'quantity', v_order.quantity,
    'side', v_order.side
  );
END;
$$;

REVOKE ALL ON FUNCTION _fill_house_spot_order(UUID) FROM PUBLIC, anon, authenticated;
