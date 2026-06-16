# PHONARA Engine Wave-S3 · Place Bet LOCK

> **상태:** LOCK DRAFT · **EXECUTE 0** — S2 GREEN · **Wave-1 Crash migration과 병렬 금지**  
> **Scope:** `sports_bets` · `sports_bet_legs` · `rpc_place_sports_bet` · wallet lock · RG · RED-first SQL  
> **상위:** [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) §5 병렬 금지

---

## 아키텍처

```text
Client legs + stake + idempotency_key
  → rpc_place_sports_bet (auth.uid)
  → server re-read latest odds (TEXT Decimal)
  → odds_at_bet match (tolerance 0)
  → kickoff > now (prematch)
  → RG + kill switch (game place parity)
  → wallet lock/debit
  → sports_bets + legs insert
```

**FAIL =** client odds used for debit amount without server snapshot match

---

## 산출물

| 산출 | 경로 |
|------|------|
| migration | bets + legs tables · indexes · RLS |
| RPC | `rpc_place_sports_bet(p_legs jsonb, p_stake text, p_idempotency_key text)` |
| SQL test RED-first | `supabase/tests/sportsbook_place_conservation_test.sql` |
| hook | `apps/web/src/features/sports/use-place-sports-bet.ts` (**S3 GREEN 후 only**) |

---

## i18n

RPC errors → `sports.errors.place.*` · `sports.errors.odds_changed` · `sports.errors.kickoff_passed`

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | `@phonara/money` Decimal · **number 금지** |
| F2 | combo ≤ **8 legs** · leg odds product server-side (D2) |
| F3 | idempotency replay → **same bet id** · no double debit |
| F4 | RG/kill: **동일 패턴** as casino place |
| F5 | snapshot **max age** N sec (S2 TTL LOCK에 숫자 고정) |
| F6 | **`game-engine` / `rpc_place_game_bet` 미사용** |
| F7 | Wave-1 money migration **동시 적용 금지** |
| F8 | **본 LOCK EXECUTE = Cursor only** · Lovable supabase **0** |

**FAIL =** F6/F7 · conservation fail · client payout calc

---

## RPC 의사코드 (LOCK 고정)

```sql
-- p_legs: [{ "outcome_id": uuid, "odds_at_bet": "2.10" }, ...]
-- 1. auth.uid() NOT NULL
-- 2. kill + RG checks
-- 3. FOR each leg: load outcome, market, fixture; assert prematch; assert odds == latest within TTL
-- 4. combined_odds := product(legs) -- Decimal library in plpgsql via text round-trip or app layer pre-validated
-- 5. wallet lock stake
-- 6. INSERT sports_bets + legs; RETURN bet_id
-- 7. ON idempotency conflict RETURN existing
```

참고: A1 PlaceBet state machine

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | S2 GREEN · Wave-1 migration window **clear** |
| 1 | RED: `sportsbook_place_conservation_test.sql` fail first |
| 2 | migration bets/legs |
| 3 | `rpc_place_sports_bet` implement |
| 4 | GREEN: conservation Σ=0 · idempotency · insufficient balance |
| 5 | negative: odds_changed · kickoff_passed · kill switch |
| 6 | `grants_rls_inventory_test.sql` |
| 7 | security advisor 0 ERROR |
| 8 | §GREEN full block |

---

## §GREEN self-check (Step 8 · full block)

```bash
rg "rpc_place_sports_bet" supabase/migrations/
rg "sports_bets|sports_bet_legs" supabase/migrations/
test -f supabase/tests/sportsbook_place_conservation_test.sql

# no game engine path
rg "rpc_place_game_bet|game-engine" supabase/migrations/*wave_s3* 2>/dev/null && exit 1 || true

supabase db reset
bun run test:sql -- supabase/tests/sportsbook_place_conservation_test.sql

# parallel ban doc
rg "Wave-1" docs/PHONARA_ENGINE_WAVE_S3_PLACE_BET_LOCK.md

rg "[\u4e00-\u9fff]" docs/PHONARA_ENGINE_WAVE_S3_PLACE_BET_LOCK.md
```

**FAIL =** conservation RED · double debit on idempotency replay · place without S2 odds

---

## §GREEN template

```text
Wave-S3 GREEN
- rpc_place_sports_bet: prematch 1X2+OU, combo ≤8
- conservation SQL: PASS
- RG negative: PASS
- MVP bar B4 met (engine)
- NEXT: S4 settle · Lovable UI mock→paste · Cursor hook wire
```

---

## Defer

- live place branch → S5
- cashout
- system bets

---

## paste adapter memo

- S3 GREEN = **Cursor** `use-place-sports-bet` + conservation GREEN
- **Lovable** real RPC call **0** until paste GO · UI mock only ([`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md))

---

## 참고 Tier

A1 · D2 [WagerBrain](https://github.com/sedemmler/WagerBrain)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | LOCK DRAFT 초판 |

---

*EXECUTE 0 until S2 GREEN · Wave-1 parallel 0*
