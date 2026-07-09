-- Fix major-market spot buy fee conservation: fee credit must debit house liquidity (Σ=0).
-- Bug: house_fee_* credited without pairing debit on non-PHON_USDT buy path (~0.1% USDT leak per trade).

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

CREATE OR REPLACE FUNCTION rpc_spot_market_buy(
  p_usdt_spent TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN rpc_spot_market_buy('PHON_USDT', 'USDT', p_usdt_spent, p_client_request_id);
END;
$$;

REVOKE ALL ON FUNCTION rpc_spot_market_buy(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spot_market_buy(TEXT, TEXT) TO authenticated, service_role;
