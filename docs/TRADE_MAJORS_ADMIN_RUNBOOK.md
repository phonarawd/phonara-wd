# Trade Majors — Admin Ops Runbook

> Operator용. Tier-1 catalog 운영 · oracle · circuit breaker · DB-only coin add.

## 1. Market on/off

```sql
UPDATE futures_markets SET is_active = FALSE WHERE symbol = 'SOLUSDT-SIM';
UPDATE spot_markets SET is_active = FALSE WHERE symbol = 'SOL_USDT';
UPDATE staking_pools SET is_active = FALSE WHERE reference_asset = 'SOL';
```

## 2. Oracle source ops

- Admin UI: `rpc_set_market_source` (기존 admin 패턴)
- Single-source alert: `oracle_source_prices` stale count < `oracle_min_sources:{SYMBOL}`
- Price feed cron: `phonara_price_feed` (Vault secrets + Edge `price-feed`)

## 3. Circuit breaker / halt

- `market_circuit_breakers.is_halted = TRUE` → median reject · futures `is_active` false
- Resume: admin `rpc_resume_market` (기존)

## 4. DB-only coin add (template)

1. `futures_markets` + `oracle_prices` + `market_circuit_breakers`
2. `market_sources` ×3 (binance/bybit/okx)
3. `app_config` `oracle_min_sources:{BASE}USDT-SIM` = 2
4. `spot_markets` + `oracle_prices` for `{BASE}_USDT`
5. `staking_pools` (reference_asset, USDT/PHON × flexible/days_30)
6. Local: `supabase db reset` + SQL conservation + advisor 0 ERROR

## 5. Incident checklist

| Symptom | Action |
|---|---|
| Stale oracle | Check Edge logs · cron · `market_sources.enabled` |
| Feed outlier | `_compute_oracle_median` outlier_pct · source disable |
| User cannot open SOL | `futures_markets.is_active` · CB halt · min_sources |
