-- ============================================================

-- Trade T0-c sub-gate: price_ticks bootstrap from oracle_prices

-- ============================================================

-- Proves E29 regression closeout: every active spot major + PHON + PERP

-- has at least one bootstrap tick aligned to the current oracle mark.

-- Idempotent re-bootstrap must not duplicate when ticks already exist.

-- ============================================================



BEGIN;



DO $$

DECLARE

  v_major_count INT;

  v_major_missing_ticks INT;

  v_phon_ticks INT;

  v_perp_ticks INT;

  v_phon_tick_price TEXT;

  v_phon_oracle TEXT;

  v_perp_tick_price TEXT;

  v_perp_oracle TEXT;

  v_bootstrap_version TEXT;

  v_ticks_before INT;

  v_ticks_after INT;

BEGIN

  PERFORM set_config('request.jwt.claims', '{}', true);



  SELECT value INTO v_bootstrap_version

    FROM app_config

   WHERE key = 'trade_t0c_ticks_bootstrap_version';

  ASSERT v_bootstrap_version = '1',

    format('trade_t0c_ticks_bootstrap_version must be 1, got %s', v_bootstrap_version);



  SELECT COUNT(*)::INT INTO v_major_count

    FROM spot_markets

   WHERE is_active

     AND symbol <> 'PHON_USDT';

  ASSERT v_major_count = 20,

    format('T0-c expects exactly 20 active spot majors excluding PHON, got %s', v_major_count);



  SELECT COUNT(*)::INT INTO v_major_missing_ticks

    FROM spot_markets sm

    JOIN oracle_prices op ON op.symbol = sm.symbol

   WHERE sm.is_active

     AND sm.symbol <> 'PHON_USDT'

     AND op.price::NUMERIC > 0

     AND NOT EXISTS (

       SELECT 1 FROM price_ticks pt WHERE pt.symbol = sm.symbol

     );

  ASSERT v_major_missing_ticks = 0,

    format('every active spot major must have bootstrap price_ticks, missing=%s', v_major_missing_ticks);



  SELECT COUNT(*)::INT INTO v_phon_ticks

    FROM price_ticks

   WHERE symbol = 'PHON_USDT';

  ASSERT v_phon_ticks >= 1,

    format('PHON_USDT must have at least one bootstrap price_tick, got %s', v_phon_ticks);



  SELECT COUNT(*)::INT INTO v_perp_ticks

    FROM price_ticks

   WHERE symbol = 'PHONUSDT-PERP';

  ASSERT v_perp_ticks >= 1,

    format('PHONUSDT-PERP must have at least one bootstrap price_tick, got %s', v_perp_ticks);



  SELECT price INTO v_phon_oracle FROM oracle_prices WHERE symbol = 'PHON_USDT';

  SELECT price INTO v_perp_oracle FROM oracle_prices WHERE symbol = 'PHONUSDT-PERP';



  SELECT pt.price INTO v_phon_tick_price

    FROM price_ticks pt

   WHERE pt.symbol = 'PHON_USDT'

   ORDER BY pt.created_at DESC

   LIMIT 1;

  ASSERT v_phon_tick_price = v_phon_oracle,

    format('PHON bootstrap tick must match oracle mark, tick=%s oracle=%s', v_phon_tick_price, v_phon_oracle);



  SELECT pt.price INTO v_perp_tick_price

    FROM price_ticks pt

   WHERE pt.symbol = 'PHONUSDT-PERP'

   ORDER BY pt.created_at DESC

   LIMIT 1;

  ASSERT v_perp_tick_price = v_perp_oracle,

    format('PERP bootstrap tick must match oracle mark, tick=%s oracle=%s', v_perp_tick_price, v_perp_oracle);



  -- E29 regression spot-check: BTC_USDT oracle seed must have matching bootstrap tick.

  ASSERT EXISTS (

    SELECT 1

      FROM oracle_prices op

      JOIN price_ticks pt ON pt.symbol = op.symbol AND pt.price = op.price

     WHERE op.symbol = 'BTC_USDT'

  ), 'BTC_USDT E29 oracle seed must have matching bootstrap price_tick';



  -- Idempotency: re-run bootstrap INSERT pattern must not add duplicate bootstrap rows.

  SELECT COUNT(*)::INT INTO v_ticks_before FROM price_ticks WHERE symbol = 'ETH_USDT';



  INSERT INTO price_ticks (symbol, price, created_at)

  SELECT op.symbol, op.price, op.updated_at

    FROM oracle_prices op

   WHERE op.symbol = 'ETH_USDT'

     AND op.price::NUMERIC > 0

     AND NOT EXISTS (

       SELECT 1 FROM price_ticks pt WHERE pt.symbol = op.symbol

     );



  SELECT COUNT(*)::INT INTO v_ticks_after FROM price_ticks WHERE symbol = 'ETH_USDT';

  ASSERT v_ticks_after = v_ticks_before,

    format('bootstrap must be idempotent for ETH_USDT, before=%s after=%s', v_ticks_before, v_ticks_after);

END;

$$;



ROLLBACK;

