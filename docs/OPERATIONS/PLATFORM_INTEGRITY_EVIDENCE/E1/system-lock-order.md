# E1 — `pir-e1-system-lock-order`

> **Todo:** `pir-e1-system-lock-order`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (migration + SQL · `stack:push-remote` · advisor 0)

## 목표 (C-2 · ADR-008 §PIR)

동시 spot buy∥sell 시 `system_accounts` AB-BA 데드락 제거.  
`_lock_system_accounts(TEXT[])`가 요청 코드를 **code 알파벳 순**으로 `FOR UPDATE` 선잠금.

## 구현

| 파일                                                                   | 변경                                                              |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `supabase/migrations/20260726000001_pir_system_account_lock_order.sql` | `_lock_system_accounts` · buy/sell/fill 선잠금 · REVOKE anon/auth |
| `supabase/tests/pir_spot_buy_sell_deadlock_test.sql`                   | helper·call-site pin · reverse-array · cross-user buy∥sell Σ=0    |
| `supabase/tests/grants_rls_inventory_test.sql`                         | `_lock_system_accounts` EXECUTE deny                              |

**선잠금 세트 (spot house):** `house_fee_phon` · `house_fee_usdt` · `house_liquidity_phon` · `house_liquidity_usdt`  
(배열 순서는 무관 — helper가 `ORDER BY code`)

## 증거

```text
Local: bun run gate:local-autopilot -- --from=l5-sql --skip-e2e --skip-remote
  → test:sql 118/118 green
  → pir_spot_buy_sell_deadlock_test: E1-0 / E1-1 / E1-2 OK

Remote: bun run stack:push-remote
  → migration pir_system_account_lock_order applied
  → security advisor 0 ERROR
```

## DoD 체크

- [x] `_lock_system_accounts` · `ORDER BY code` · `FOR UPDATE` · VOLATILE
- [x] `rpc_spot_market_buy` / `rpc_spot_market_sell` / `_fill_house_spot_order` 선잠금
- [x] buy∥sell SQL · Σ=0 · deadlock abort 0 (single-backend pin; multi-session soak = ADR-008 residual)
- [x] anon/authenticated EXECUTE deny
- [x] `stack:push-remote` · advisor 0 ERROR

## 다음

`pir-e4-sweep-chunk` — liquidations/funding/stop/affiliate `LIMIT` + `has_more`  
(E3 golden-earth **`[x]`** — [`E3/golden-earth.md`](../E3/golden-earth.md))
