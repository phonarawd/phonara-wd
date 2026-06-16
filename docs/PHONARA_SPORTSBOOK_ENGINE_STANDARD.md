# PHONARA 스포츠북 엔진 표준 (Cursor · 메이저급)

> **적용 범위:** `supabase/migrations/*wave_s*` · `packages/sportsbook-engine` · `packages/sports-ingest` · `scripts/sports-odds-ingest` · `features/sports/use-*.ts`  
> **UI 금지:** Lovable `/sports` 화면은 paste 전 mock · 엔진은 Cursor only

---

## 1. 작업 순서 (World-class delivery order)

| 순서 | Wave | 산출 | 완료 bar |
|------|------|------|----------|
| 1 | **S1** | schema + READ RPC | anon/authenticated direct table SELECT **0** |
| 2 | **S2** | ingest C1 + worker | `rpc_ingest_sports_c1_batch` · vendor key server-only |
| 3 | **S3** | place bet | wallet lock · idempotency · odds exact match · RG |
| 4 | **S4** | settle/void | Σ=0 conservation SQL GREEN |
| 5 | **S6** | major hardening | OU 2.5 · parlay rules · exposure cap · suspend |
| 6 | **S5** | in-play | live branch · suspend window · shorter odds TTL |
| 7 | **E2E** | Playwright | place → settle · negative paths |
| 8 | **UI** | Lovable paste | hook wire only · 시각 1:1 |

**병렬 금지:** Wave-1 Crash money migration + S3 · Lovable supabase DDL

---

## 2. 네이밍 규칙

| 계층 | 규칙 | 예 |
|------|------|-----|
| SQL 테이블 | `sports_*` snake · `game_*` **분리** | `sports_bets`, `sports_odds_snapshots` |
| SQL RPC (client) | `rpc_<verb>_sports_*` | `rpc_place_sports_bet` |
| SQL RPC (ingest) | `rpc_ingest_sports_*` | service_role only |
| SQL RPC (admin) | `rpc_admin_*` / settle service | `rpc_settle_sports_fixture_scores` |
| SQL internal | `_sports_*` / `_finalize_sports_bet` | REVOKE anon/authenticated |
| TS package | `@phonara/sportsbook-engine` · `@phonara/sports-ingest` | C1 normalizer |
| Hook | `use-*-sports-*` · `features/sports/` | `usePlaceSportsBet` |
| i18n | `error.SPORTS_*` · `sports.*` | RPC exception → `translate-error.ts` |
| Money | **TEXT Decimal** · `@phonara/money` parse | float **`number` 금지** |

---

## 3. 보안 · 무오차 (non-negotiable)

1. **배당:** client `odds_at_bet` ≠ server latest snapshot → `odds_changed` (trunc 6dp exact)
2. **스테이크:** place 시 lock only · settle 시 unlock+debit+credit · Σ=0 per currency
3. **Idempotency:** `(user_id, idempotency_key)` unique · replay = same bet_id
4. **조합:** ≤8 legs · duplicate outcome **금지** · duplicate fixture parlay **금지**
5. **Stale:** prematch TTL `sports_odds_snapshot_max_age_sec` (default 300s)
6. **Exposure:** pending `potential_payout` sum ≤ `sports_house_exposure_cap_*`
7. **RLS:** fixtures/markets/outcomes direct GRANT **0** · READ RPC only
8. **Settle:** `rpc_settle_sports_fixture_scores` idempotent · service_role
9. **API key:** `THE_ODDS_API_KEY` · **VITE_ 0** · browser bundle vendor SDK **0**

---

## 4. 마켓 타입 (B2 bar)

| `market_type` | 정산 |
|---------------|------|
| `match_1x2` | home/draw/away from FT score |
| `totals_2_5` | over ≥3 goals · under ≤2 goals |

---

## 5. self-check (엔진 마감)

```bash
rg "sports_fixtures|rpc_place_sports_bet|rpc_settle_sports_fixture_scores" supabase/migrations/
supabase db reset
bun run test:sql -- supabase/tests/sportsbook_place_conservation_test.sql
bun run test:sql -- supabase/tests/sportsbook_settle_conservation_test.sql
bun run test:sql -- supabase/tests/sportsbook_major_hardening_test.sql
bun run test -- packages/sportsbook-engine packages/sports-ingest
rg "VITE_.*ODDS" apps/web .env.example
```

**FAIL =** float odds column · game_bets FK · conservation RED · VITE vendor key

---

## 6. Phase A / B (operator 전략 · 2026-06-16)

**정본:** [`PHONARA_SPORTSBOOK_ENGINE_TIER_STRATEGY.md`](PHONARA_SPORTSBOOK_ENGINE_TIER_STRATEGY.md)

| Phase | Cursor 엔진 | 수익 게이트 |
|-------|-------------|-------------|
| **A (지금)** | S15–S22: Asian HC · multi totals · cashout · SGP · system · props **framework** · admin desk | LEGAL + 「스포츠 GO」 |
| **B (수익 후)** | 30+ 리그 WS · premium feed · props **카탈로그 폭** · Lovable UI · affiliate GGR | operator 「스포츠 스케일 GO」 |

§4 `market_type`는 S15 GREEN 후 registry 정본으로 **대체·확장**한다.
