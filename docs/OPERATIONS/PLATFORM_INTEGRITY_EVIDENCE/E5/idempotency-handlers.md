# E5 — `pir-e5-idempotency-handlers`

> **Todo:** `pir-e5-idempotency-handlers`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (migration + SQL · `stack:push-remote` · advisor 0)

## 목표 (M-1)

place/claim 경로에서 idempotency TOCTOU 후 `unique_violation`이 raw 에러로 노출되지 않고  
**기존 결과**를 반환. UNIQUE는 최종 방어 · 클라이언트는 멱등 응답.

## 구현

| 파일                                                              | 변경                                                                                           |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260730000001_pir_idempotency_handlers.sql` | wallet helpers recheck+UV · place game/sports UV → already*placed · `\_pir*\*\_already_placed` |
| `supabase/tests/pir_idempotency_handlers_test.sql`                | E5-0 functiondef/grants · E5-1 casino place · E5-2 welcome claim · E5-3 credit duplicate       |
| `supabase/tests/grants_rls_inventory_test.sql`                    | `_pir_game_bet_already_placed` / `_pir_sports_bet_already_placed` REVOKE 핀                    |

**계약**

| 경로                                           | 동작                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `_credit/_debit/_lock/_unlock_wallet_internal` | FOR UPDATE 후 ledger 재조회 · mutate+INSERT nested `unique_violation` → existing id |
| `rpc_place_game_bet`                           | INSERT `unique_violation` → `_pir_game_bet_already_placed`                          |
| `rpc_place_sports_bet`                         | INSERT `unique_violation` → `_pir_sports_bet_already_placed`                        |
| claim (welcome 등)                             | `_credit_wallet_internal` 하드닝 상속                                               |

## 증거

```text
Local: docker apply pir_idempotency_handlers
       psql pir_idempotency_handlers_test.sql
  → E5-0 / E5-1 / E5-2 / E5-3 OK
       grants_rls_inventory OK (E5 helper REVOKE pins)

Remote: bun run stack:push-remote
  → migration pir_idempotency_handlers applied (server tail …_pir_idempotency_handlers)
  → security advisor 0 ERROR
```

## DoD 체크

- [x] place/claim `unique_violation` → 기존 결과 (functiondef + live)
- [x] wallet helper recheck after FOR UPDATE
- [x] helper REVOKE anon/auth
- [x] `stack:push-remote` · advisor 0 ERROR

## 다음

`pir-p2-pf-golden-vectors` — 12게임 PF 골든 벡터 pin (권위=SQL)
