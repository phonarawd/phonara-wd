-- ============================================================
-- Trade majors: spot holdings + generic spot RPC (USDT/PHON)
-- ============================================================

SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS rpc_spot_market_buy(TEXT);
DROP FUNCTION IF EXISTS rpc_spot_market_sell(TEXT);

CREATE TABLE IF NOT EXISTS spot_holdings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  base_asset  TEXT NOT NULL,
  quantity    TEXT NOT NULL DEFAULT '0.000000'
    CONSTRAINT sh_qty_fmt CHECK (quantity ~ '^\d+(\.\d+)?$'),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, base_asset)
);

CREATE INDEX IF NOT EXISTS sh_user_asset_idx ON spot_holdings (user_id, base_asset);

ALTER TABLE spot_holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spot_holdings: own read" ON spot_holdings;
CREATE POLICY "spot_holdings: own read" ON spot_holdings
  FOR SELECT USING (auth.uid() = user_id);

REVOKE ALL ON spot_holdings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON spot_holdings TO authenticated;

ALTER TABLE spot_trades
  ADD COLUMN IF NOT EXISTS base_asset TEXT,
  ADD COLUMN IF NOT EXISTS stake_currency currency,
  ADD COLUMN IF NOT EXISTS base_amount TEXT;

UPDATE spot_trades
   SET base_asset = 'PHON',
       stake_currency = CASE side WHEN 'buy' THEN 'USDT'::currency ELSE 'PHON'::currency END,
       base_amount = phon_amount
 WHERE base_asset IS NULL;

-- Tier-1 spot markets + oracle bootstrap (same prices as futures seed)
DO $$
DECLARE
  v_base TEXT;
  v_spot TEXT;
  v_futures TEXT;
  v_sort INT := 100;
  v_price TEXT;
  v_bases TEXT[] := ARRAY[
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT',
    'MATIC', 'LTC', 'UNI', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'INJ', 'SUI'
  ];
  v_prices JSONB := '{
    "BTC": "68000.000000", "ETH": "3500.000000", "SOL": "150.000000",
    "BNB": "600.000000", "XRP": "0.550000", "ADA": "0.450000", "DOGE": "0.120000",
    "AVAX": "35.000000", "LINK": "15.000000", "DOT": "7.000000", "MATIC": "0.550000",
    "LTC": "85.000000", "UNI": "8.000000", "ATOM": "8.000000", "NEAR": "5.000000",
    "APT": "8.000000", "ARB": "0.800000", "OP": "1.500000", "INJ": "20.000000",
    "SUI": "3.000000"
  }'::JSONB;
  v_precision INT;
BEGIN
  FOREACH v_base IN ARRAY v_bases LOOP
    v_spot := v_base || '_USDT';
    v_futures := v_base || 'USDT-SIM';
    v_sort := v_sort + 10;
    v_price := v_prices ->> v_base;
    v_precision := CASE
      WHEN v_base IN ('BTC', 'ETH', 'BNB', 'LTC') THEN 2
      WHEN v_base IN ('XRP', 'ADA', 'DOGE', 'MATIC', 'ARB', 'OP', 'SUI') THEN 4
      ELSE 3
    END;

    INSERT INTO spot_markets (symbol, fee_rate, is_active, display_name, sort_order, price_precision, tick_size, min_notional)
    VALUES (v_spot, '0.001', TRUE, v_base || '/USDT', v_sort, v_precision, '0.000001', '1.000000')
    ON CONFLICT (symbol) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      sort_order = EXCLUDED.sort_order,
      price_precision = EXCLUDED.price_precision,
      is_active = TRUE;

    INSERT INTO oracle_prices (symbol, price, updated_at)
    VALUES (v_spot, v_price, NOW())
    ON CONFLICT (symbol) DO NOTHING;

    INSERT INTO market_circuit_breakers (symbol, max_tick_pct, staleness_seconds)
    VALUES (v_spot, 10.0, 300)
    ON CONFLICT (symbol) DO NOTHING;
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION _upsert_spot_holding(
  p_user_id UUID,
  p_base_asset TEXT,
  p_delta NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_qty NUMERIC;
BEGIN
  INSERT INTO spot_holdings (user_id, base_asset, quantity)
  VALUES (p_user_id, p_base_asset, _fmt6(GREATEST(p_delta, 0)))
  ON CONFLICT (user_id, base_asset) DO UPDATE
    SET quantity = _fmt6((spot_holdings.quantity::NUMERIC + p_delta)),
        updated_at = NOW()
  RETURNING quantity::NUMERIC INTO v_qty;

  IF v_qty < 0 THEN
    RAISE EXCEPTION 'insufficient_holdings' USING HINT = p_base_asset;
  END IF;

  RETURN _fmt6(v_qty);
END;
$$;

REVOKE ALL ON FUNCTION _upsert_spot_holding(UUID, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;

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
  ELSE
    PERFORM _debit_wallet_internal(v_user_id, 'PHON', _fmt6(v_phon_spent),
      'spot_buy_pay', 'spot_pay:' || v_trade_id::TEXT);
    PERFORM _credit_system_account('house_liquidity_phon', _fmt6(v_phon_spent),
      'spot_buy_liquidity', v_user_id, v_trade_id::TEXT, v_tid);
  END IF;

  PERFORM _upsert_spot_holding(v_user_id, v_base, v_net_base);

  IF v_fee > 0 THEN
    PERFORM _credit_system_account(
      CASE WHEN p_stake_currency = 'USDT' THEN 'house_fee_usdt' ELSE 'house_fee_phon' END,
      _fmt6(trunc(v_fee * v_price, 6)),
      'spot_buy_fee', v_user_id, v_trade_id::TEXT, v_tid
    );
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

  IF p_market = 'PHON_USDT' THEN
    v_base := 'PHON';
    v_gross_stake := trunc(v_base_amt * v_price, 6);
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

CREATE OR REPLACE FUNCTION rpc_spot_market_sell(
  p_phon_sold TEXT,
  p_client_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN rpc_spot_market_sell('PHON_USDT', 'USDT', p_phon_sold, p_client_request_id);
END;
$$;

REVOKE ALL ON FUNCTION rpc_spot_market_buy(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spot_market_buy(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
REVOKE ALL ON FUNCTION rpc_spot_market_buy(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spot_market_buy(TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION rpc_spot_market_sell(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spot_market_sell(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
REVOKE ALL ON FUNCTION rpc_spot_market_sell(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_spot_market_sell(TEXT, TEXT) TO authenticated, service_role;
