# R2-c — Sports Odds Freshness Fail-Closed (`audit-r2c-sports-odds-freshness`)

> **Stage:** R2-c · **Plan todo:** `audit-r2c-sports-odds-freshness`  
> **Finding:** H-05  
> **Date:** 2026-07-13  
> **Command:** Implement (fail-closed · migration 0 · engine 0 · gate flip 0)  
> **Investigate:** [`r2-capability-rails-investigate.md`](r2-capability-rails-investigate.md) (H-05 요약)

## Finding touched

| Finding  | Fix summary                                                                                                          | Unit / contract gate                       |
| -------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **H-05** | server `captured_at` freshness · stale → `—` / 선택 불가 · place/cashout mutation block · ingest green 전 gate false | sports-odds-freshness · board · controller |

## Root cause / fix

| 필드           | 값                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Root cause** | Odds ingest 중단 (remote newest `captured_at` = 2026-06-16) · board가 stale numeric odds를 그대로 노출·선택 가능             |
| **Fix**        | display contract TTL(prematch 300s · live 15s) · board/markets `—` · controller ingest health · cashout mutation fail-closed |
| **Not done**   | ingest worker 복구 · `LAUNCH_GATES.sportsBetting/sportsCashout` flip — **ingest green 전 금지**                              |

## Ingest health (선행 확인)

| Check                             | Result                   |
| --------------------------------- | ------------------------ |
| `sports_odds_snapshots` row count | 1052                     |
| newest `captured_at`              | `2026-06-16 04:43:29+00` |
| fresh ≤300s                       | **0**                    |
| ingest health green               | **false**                |
| `LAUNCH_GATES.sportsBetting`      | **false** (유지)         |
| `LAUNCH_GATES.sportsCashout`      | **false** (유지)         |

## Code owners

| Path                                                                    | Role                                           |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| `apps/web/src/domain/sports-odds-freshness-display-contract.ts`         | freshness · ingest health · mutation block     |
| `apps/web/src/product/surfaces/sports/sports-fixture-board.tsx`         | stale → `—` · no toggle                        |
| `apps/web/src/product/surfaces/sports/sports-fixture-markets-panel.tsx` | same for multi-market                          |
| `apps/web/src/features/sports/use-sports-page-controller.ts`            | `oddsIngestHealthGreen` · place mutation guard |
| `apps/web/src/product/surfaces/sports/sports-cashout-card.tsx`          | cashout mutation fail-closed                   |

## Gates (local L0–L4)

```text
bun run gate:ai-impl -- --test <R2c owner paths>  → green · vitest 28/28
```

Owner paths:

- `apps/web/src/domain/__tests__/sports-odds-freshness-display-contract.test.ts`
- `apps/web/src/product/surfaces/sports/__tests__/sports-page.test.tsx`
- `apps/web/src/features/sports/__tests__/use-sports-page-controller.test.ts`
- `apps/web/src/product/surfaces/sports/__tests__/sports-cashout-card.test.tsx`

## Runtime / Browser

| Item                         | Status                                               |
| ---------------------------- | ---------------------------------------------------- |
| Stage1 `/sports` Browser MCP | see [`r2c-stage1-browser.md`](r2c-stage1-browser.md) |

Finding status after Stage1: **VERIFIED_FIXED** (H-05) — ingest 복구·gate flip는 후속 ops.

## No Shortcut checklist

- [x] Stale odds numeric 노출 제거 (`—`)
- [x] Stale outcome 선택 / place mutation 0
- [x] Cashout mutation ingest/gate fail-closed
- [x] `sportsBetting` / `sportsCashout` flip **0**
- [x] Migration 0 · engine 0
- [x] owner vitest 28/28 · gate:ai-impl L0~L4
- [x] Remote ingest health evidence (newest 2026-06-16)
