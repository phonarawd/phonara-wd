# E4 — `pir-e4-sweep-chunk`

> **Todo:** `pir-e4-sweep-chunk`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (migration + SQL · `stack:push-remote` · advisor 0)

## 목표 (H-2)

청산·펀딩·스톱·제휴 스윕을 **단일 장기 TX**에서 **LIMIT 배치 + `has_more`** 로 쪼개  
트랜잭션당 행 잠금 보유 시간을 상수로 제한. cron은 `has_more`면 재호출.

## 구현

| 파일                                                     | 변경                                                                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260729000001_pir_sweep_chunk.sql` | `_pir_sweep_batch_limit` · liq/stop keyset(`p_after_id`) · funding unpaid filter · affiliate pay LIMIT · cron drain wrappers |
| `supabase/tests/pir_sweep_chunk_test.sql`                | E4-0 functiondef/grants · E4-1 liq keyset · E4-2 funding hold schedule · E4-3 affiliate drain                                |
| `supabase/tests/grants_rls_inventory_test.sql`           | `_apply_funding_for_market` / `rpc_run_funding_accrual` 시그니처 핀                                                          |

#### 계약

| RPC                                          | 배치                   | `has_more`           | cron                                                                  |
| -------------------------------------------- | ---------------------- | -------------------- | --------------------------------------------------------------------- |
| `rpc_run_liquidations(limit, after_id)`      | LIMIT + keyset         | `examined >= limit`  | `_run_liquidations_logged` drain                                      |
| `rpc_run_stop_orders(limit, after_id)`       | LIMIT + keyset         | 동일                 | `_run_stop_orders_logged` drain                                       |
| `rpc_run_funding_accrual(limit)`             | unpaid positions LIMIT | unpaid 잔여          | `_run_funding_accrual_logged` · **has_more면 `next_funding_at` 유지** |
| `rpc_run_affiliate_settlements(date, limit)` | computed pay LIMIT     | remaining `computed` | 호출측 재호출                                                         |

## 증거

```text
Local: stack:ensure --full (db reset) applied pir_sweep_chunk
       docker exec psql pir_sweep_chunk_test.sql
  → E4-0 / E4-1 / E4-2 / E4-3 OK
       trade_t2_futures_cron · trade_t2_funding_settlement · affiliate_settlements OK

Remote: bun run stack:push-remote
  → migration pir_sweep_chunk applied (server tail …_pir_sweep_chunk)
  → security advisor 0 ERROR
```

## DoD 체크

- [x] liquidations/stop/funding/affiliate `LIMIT` + `has_more`
- [x] funding: chunk 중 `next_funding_at` 미전진 · 완료 후 전진 · Σ=0
- [x] cron wrappers drain (`has_more` · liq/stop keyset `last_id`)
- [x] service_role only on engine sweeps · helper REVOKE
- [x] `stack:push-remote` · advisor 0 ERROR

## 다음

`pir-p2-quantize-odds` — `quantize6` number 제거 · ingest string-only
