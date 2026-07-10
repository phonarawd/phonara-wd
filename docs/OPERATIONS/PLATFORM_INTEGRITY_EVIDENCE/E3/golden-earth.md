# E3 — `pir-e3-golden-earth`

> **Todo:** `pir-e3-golden-earth`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (migration + SQL · `stack:push-remote` · advisor 0)

## 목표 (H-1)

Golden Earth 전역 직렬화 구간 단축 + 글로벌 잭팟 이중지급 방어.  
`golden_earth_global` `FOR UPDATE`를 유저 로컬 보상 계산 **이후**로 미루고,  
마일스톤 잭팟 ledger 키 `golden_earth:gjp:{total_taps}` · `random()` → `gen_random_bytes`.

## 구현

| 파일                                                      | 변경                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `supabase/migrations/20260728000001_pir_golden_earth.sql` | `_golden_earth_secure_roll` · `rpc_golden_earth_tap` lock-late + gjp · REVOKE |
| `supabase/tests/pir_golden_earth_test.sql`                | E3-0 functiondef · E3-1 global jackpot+gjp · E3-2 non-jackpot req key         |

**순서 (tap):** user-local prep (daily · mini jackpot) → `FOR UPDATE` global → (optional) global jackpot → credit → daily/vip → `UPDATE total_taps` → insert tap

## 증거

```text
Local: db reset (gate:local-autopilot l5-stack-ensure) applied pir_golden_earth
       docker exec psql pir_golden_earth_test.sql
  → E3-0 / E3-1 / E3-2 OK
       golden_earth_conservation_test.sql OK (Σ=0)

Remote: bun run stack:push-remote
  → migration pir_golden_earth applied (server tail …_pir_golden_earth)
  → security advisor 0 ERROR
```

## DoD 체크

- [x] 전역 `FOR UPDATE`가 first_tap 등 유저 로컬 prep **이후**
- [x] `UPDATE golden_earth_global.total_taps`가 wallet credit **이후** (TX 말단)
- [x] 글로벌 잭팟 idempotency `golden_earth:gjp:{total_taps}` · 재credit no-op
- [x] tap body에 `random()` 없음 · `_golden_earth_secure_roll` + `gen_random_bytes`
- [x] anon/authenticated EXECUTE deny on helper
- [x] `stack:push-remote` · advisor 0 ERROR

## 다음

`pir-e5-idempotency-handlers` — place/claim `unique_violation` → 기존 결과
