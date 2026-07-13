# P1 — `pir-p1-sports-odds-debounce`

> **Todo:** `pir-p1-sports-odds-debounce`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (Implemented · `gate:ai-impl` L0~L4)

## 목표 (H-4 / Realtime fanout)

`sports_odds_snapshots` INSERT 초고빈도 패치를 **≥500ms trailing debounce**로 합치고, **화면 fixture만** 캐시 패치하며, miss 시 full `['sports']` invalidate를 **제거**.

## 구현

| 파일                                                          | 변경                                                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/web/src/features/sports/sports-odds-insert-debounce.ts` | `SPORTS_ODDS_INSERT_DEBOUNCE_MS=500` · outcomeId coalesce · dispose                 |
| `apps/web/src/features/sports/sports-realtime-cache.ts`       | `SportsOddsPatchScope` · `applySportsOddsInsertPatch` · fixture-scoped list/markets |
| `apps/web/src/hooks/use-sports-realtime.ts`                   | odds INSERT → debouncer · miss drop · no full sports invalidate                     |
| `apps/web/src/features/sports/use-sports-page-controller.ts`  | `visibleFixtureIds` (board + focused detail) 전달                                   |
| `__tests__/sports-odds-insert-debounce.test.ts`               | coalesce · batch · dispose · floor                                                  |
| `__tests__/sports-realtime-cache.test.ts`                     | scope + miss no-op                                                                  |
| `__tests__/use-sports-page-controller.test.ts`                | visibleFixtureIds wire                                                              |

## 증거

```text
Implemented: bun run gate:ai-impl -- --test apps/web/src/features/sports/__tests__/sports-odds-insert-debounce.test.ts --closeout pir-p1-sports-odds-debounce

L0 cursor:status · check:hygiene · check:ui-architecture · check:phase-r-guards --strict
L1 typecheck · check:i18n · check:release
L2 lint
L3 vitest sports-odds-insert-debounce **5/5** · sports-realtime-cache + page-controller + live-surface **20/20**

gate:ai-impl ✓ Implemented (L0~L4) green
```

## DoD 체크

- [x] odds INSERT ≥500ms debounce (floor enforced)
- [x] 동일 outcomeId 최신 odds만 flush
- [x] 화면 fixture scope (`visibleFixtureIds`) — 비표시 fixture 패치 스킵
- [x] miss / malformed → full `['sports']` invalidate **없음**

## 다음

`pir-e1-system-lock-order` — `_lock_system_accounts` · spot buy/sell 동시성 SQL
