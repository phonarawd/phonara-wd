-- ============================================================
-- Oracle feed cutover: remove seeded legacy sources for external markets
-- ============================================================
-- Earlier multisource-oracle migrations backfilled a `legacy` source row from
-- oracle_prices. Once BTC/ETH are fed by Binance/Bybit/OKX, that bootstrap row
-- must not participate in median calculation; otherwise a stale seed price can
-- distort the first real median and trip the circuit breaker.
-- ============================================================

SET search_path = public, pg_temp;

DELETE FROM oracle_source_prices
 WHERE symbol IN ('BTCUSDT-SIM', 'ETHUSDT-SIM')
   AND source_name = 'legacy';
