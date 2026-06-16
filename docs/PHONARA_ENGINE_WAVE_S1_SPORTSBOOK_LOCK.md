# PHONARA Engine Wave-S1 · Sportsbook Schema + Read LOCK

> **상태:** LOCK DRAFT · **EXECUTE 0** — operator **「스포츠 GO」** + [`PHONARA_SPORTSBOOK_LEGAL_GATE.md`](PHONARA_SPORTSBOOK_LEGAL_GATE.md) clearance 필수  
> **Scope:** `sports_*` schema · prematch **READ RPC** · RLS/GRANT · seed 없음  
> **상위:** [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) · [`PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md`](PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md) §3 S1

---

## 아키텍처

- 카지노 `game_*` / `rpc_place_game_bet` 와 **테이블·RPC 완전 분리**
- odds/stake/payout: **TEXT Decimal** · `@phonara/money` parse only
- S1은 **read-only mutation 0** (ingest는 S2 worker가 service_role로 upsert)

---

## 산출물

| 산출 | 경로/이름 |
|------|-----------|
| migration | `supabase/migrations/20260616XXXXXX_wave_s1_sportsbook_schema.sql` |
| READ RPC | `rpc_list_sports_fixtures` · `rpc_get_fixture_markets` |
| RLS test | `supabase/tests/sportsbook_rls_read_test.sql` |
| grants inventory | `grants_rls_inventory_test.sql` 갱신 |

---

## i18n

S1 엔진 슬라이스: **RPC error code only** (client maps `sports.errors.*`). UI keys는 [`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md).

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | `game_code` enum · `game_bets` **연결 금지** |
| F2 | `sports_odds_snapshots.odds` = TEXT · CHECK numeric string |
| F3 | anon/authenticated: fixtures/markets/outcomes **SELECT via RPC only** (direct table GRANT 최소) |
| F4 | `rpc_place_sports_bet` **본 슬라이스 0** |
| F5 | LEGAL clearance 날짜 LOCK 본문에 1줄 기록 |
| F6 | paste GO 없이 remote apply **금지** (local `db reset` only until operator paste wave) |
| F7 | **EXECUTE = Cursor (PHONARA repo) only** · Lovable `supabase/` **0** |

**FAIL =** F1/F4 위반 · migration without LEGAL · floating point odds column

---

## DDL 초안 (EXECUTE 시 정본)

```sql
-- sports_fixtures: id uuid PK, league_code text, home_name, away_name,
--   kickoff_at timestamptz, status text (scheduled|live|finished|void|cancelled)
-- sports_markets: fixture_id, market_type (match_1x2|totals_2_5), status
-- sports_outcomes: market_id, selection (home|draw|away|over|under), line text nullable
-- sports_odds_snapshots: outcome_id, odds text, captured_at, source_vendor text
-- sports_bets / sports_bet_legs: S3에서 CREATE (S1 optional stub 금지 — S1에 bet table 없음)
```

---

## RPC 시그니처 (가칭)

```sql
rpc_list_sports_fixtures(p_date date, p_league text, p_status text)
  → SETOF jsonb  -- fixture summary + latest 1x2 odds pointer

rpc_get_fixture_markets(p_fixture_id uuid)
  → jsonb  -- markets + outcomes + latest odds per outcome
```

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | LEGAL clearance + 「스포츠 GO」 확인 |
| 1 | migration DDL · indexes (kickoff, league, fixture status) |
| 2 | RLS policies · GRANT/REVOKE anon/authenticated |
| 3 | READ RPC 2종 · `auth.uid()` 불필요 read |
| 4 | `sportsbook_rls_read_test.sql` · negative anon write |
| 5 | `grants_rls_inventory_test.sql` |
| 6 | `supabase db reset` clean |
| 7 | security advisor 0 ERROR |
| 8 | §GREEN self-check (full block) |

---

## §GREEN self-check (Step 8 · full block)

```bash
# S1 objects exist
rg "sports_fixtures|sports_markets|sports_outcomes|sports_odds_snapshots" supabase/migrations/
rg "rpc_list_sports_fixtures|rpc_get_fixture_markets" supabase/migrations/

# no place bet in S1
rg "rpc_place_sports_bet" supabase/migrations/ && exit 1 || true

# no game_bets link
rg "game_bets|game_code" supabase/migrations/*wave_s1* 2>/dev/null | rg -v "금지|no|NOT" && exit 1 || true

# tests
test -f supabase/tests/sportsbook_rls_read_test.sql

# advisor + reset (operator/CI)
supabase db reset
bun run test:sql -- supabase/tests/sportsbook_rls_read_test.sql

# CJK operator docs
rg "[\u4e00-\u9fff]" docs/PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md
```

**FAIL =** place RPC in S1 migration · game_* FK · advisor ERROR · LEGAL date blank in LOCK header

---

## §GREEN template (closeout paste)

```text
Wave-S1 GREEN
- migration: 20260616XXXXXX_wave_s1_sportsbook_schema.sql
- READ RPC: list + get markets
- LEGAL ref: [날짜/참조]
- db reset: PASS · advisor: 0 ERROR
- NEXT: S2 LOCK + vendor key
```

---

## Defer

- `sports_bets` table → S3
- ingest worker → S2
- seed/demo fixtures → S2 ingest only (no hardcoded odds in migration)

---

## paste adapter memo

- **Cursor only:** migration + RPC · `apps/web` UI wire **0** until S3 GREEN
- **Lovable only:** mock `/sports` static display props until S2 odds in DB

---

## 참고 Tier

A1 [lets-bet](https://github.com/nutcas3/lets-bet) · A3 [Oddsmarket](https://github.com/AspiraLimited/oddsmarket_client)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | LOCK DRAFT 초판 |

---

*EXECUTE 0 until 「스포츠 GO」+ LEGAL cleared*
