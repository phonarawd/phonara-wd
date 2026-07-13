# E2 — `pir-e2-realtime-narrow`

> **Todo:** `pir-e2-realtime-narrow`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (migration + SQL · `stack:push-remote` · advisor 0 · client invalidate)

## 목표 (C-3)

Realtime 초고빈도 팬아웃 축소.  
`wallet_ledger` · fill 테이블을 `supabase_realtime`에서 DROP하고,  
원장 조회용 `ledger_user_created_idx` + 클라이언트 `wallets` → ledger invalidate 이중 벨트.

## 구현

| 파일                                                             | 변경                                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `supabase/migrations/20260727000001_pir_realtime_narrow.sql`     | publication DROP 3 tables · `ledger_user_created_idx`                |
| `supabase/tests/pir_realtime_narrow_test.sql`                    | E2-0 DROP · E2-1 kept · E2-2 index                                   |
| `supabase/tests/trade_wallet_realtime_publication_test.sql`      | E5+E2 정합 (7 kept · 3 dropped)                                      |
| `apps/web/src/hooks/use-wallet.ts`                               | wallets UPDATE → wallet + ledger invalidate · no `wallet_ledger` sub |
| `apps/web/src/hooks/use-trading.ts`                              | fills-table realtime 제거 · RPC invalidate 유지                      |
| `apps/web/src/features/trading/use-trade-realtime-feedback.ts`   | fills sub 제거 · open_orders가 fills key invalidate                  |
| `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts` | PIR E2 pin                                                           |
| `apps/web/src/domain/trade-fill-realtime-display-contract.ts`    | `realtimeSource: 'open_orders'`                                      |

**DROP:** `wallet_ledger` · `spot_order_fills` · `trading_order_fills`  
**KEEP:** `oracle_prices` · `price_ticks` · `wallets` · `spot_open_orders` · `trading_open_orders` · `futures_positions` · `staking_positions`

## 증거

```text
Local: gate:ai-impl wallet-ledger + trade-fill contracts · vitest 5/5
       bun run gate:local-autopilot -- --from=l5-sql --skip-e2e --skip-remote
  → test:sql 119/119 green
  → pir_realtime_narrow_test · trade_wallet_realtime_publication_test PASSED

Remote: bun run stack:push-remote
  → migration pir_realtime_narrow applied
  → security advisor 0 ERROR
```

## DoD 체크

- [x] publication에 `wallet_ledger` / fills **없음**
- [x] `ledger_user_created_idx` 존재
- [x] UI 잔고/원장: wallets 채널 + mutation invalidate
- [x] fills: open_orders realtime + post-RPC invalidate
- [x] `stack:push-remote` · advisor 0 ERROR

## 다음

`pir-e4-sweep-chunk` — liquidations/funding/stop/affiliate `LIMIT` + `has_more`
