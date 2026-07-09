-- Phase 0B RPC spot-check (read-only metadata + rpc_get_candles smoke)
-- Operator gate — not part of CI test:sql suite; run after db reset.
BEGIN;

DO $$
DECLARE
  v_candles jsonb;
  v_stake_phon_def text;
BEGIN
  ASSERT to_regprocedure('public.rpc_get_candles(text,text,int)') IS NOT NULL,
    'rpc_get_candles missing';
  ASSERT to_regprocedure('public.rpc_spot_market_buy(text,text,text,text)') IS NOT NULL,
    'rpc_spot_market_buy(4-arg) missing';
  ASSERT to_regprocedure('public.rpc_place_limit_order(text,text,text,text,text,text,text,text,text)') IS NOT NULL,
    'rpc_place_limit_order missing';
  ASSERT to_regprocedure('public.rpc_stake(text,text,text,text,text)') IS NOT NULL,
    'rpc_stake missing';
  ASSERT to_regprocedure('public.rpc_stake_phon(text,text,text)') IS NOT NULL,
    'rpc_stake_phon missing';

  ASSERT has_function_privilege('authenticated', 'public.rpc_get_candles(text,text,int)', 'EXECUTE'),
    'authenticated missing rpc_get_candles EXECUTE';
  ASSERT has_function_privilege('authenticated', 'public.rpc_spot_market_buy(text,text,text,text)', 'EXECUTE'),
    'authenticated missing rpc_spot_market_buy EXECUTE';
  ASSERT has_function_privilege('authenticated', 'public.rpc_place_limit_order(text,text,text,text,text,text,text,text,text)', 'EXECUTE'),
    'authenticated missing rpc_place_limit_order EXECUTE';
  ASSERT has_function_privilege('authenticated', 'public.rpc_stake(text,text,text,text,text)', 'EXECUTE'),
    'authenticated missing rpc_stake EXECUTE';
  ASSERT has_function_privilege('authenticated', 'public.rpc_stake_phon(text,text,text)', 'EXECUTE'),
    'authenticated missing rpc_stake_phon EXECUTE';

  v_stake_phon_def := pg_get_functiondef('public.rpc_stake_phon(text,text,text)'::regprocedure);
  ASSERT v_stake_phon_def ILIKE '%rpc_stake%', 'rpc_stake_phon must delegate to rpc_stake';

  v_candles := rpc_get_candles('PHON_USDT', '1m', 1);
  ASSERT v_candles IS NOT NULL, 'rpc_get_candles returned null';

  RAISE NOTICE 'Phase 0B RPC spot-check OK — get_candles rows=%', jsonb_array_length(v_candles);
END;
$$;

ROLLBACK;
