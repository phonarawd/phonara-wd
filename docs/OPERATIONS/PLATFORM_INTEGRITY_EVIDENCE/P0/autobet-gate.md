# P0 — `pir-p0-autobet-gate`

> **Todo:** `pir-p0-autobet-gate`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (Implemented · `gate:ai-impl` L0~L4)

## 목표

Wave P0 Presentation CRITICAL — casino auto-bet + shell 번들 `gate:ai-impl` green.

## 번들

| 경로 | 역할 |
|------|------|
| `apps/web/src/features/casino/__tests__/use-auto-bet-queue.test.ts` | 순수 세션 · count/stop/martingale · 이중 Start |
| `apps/web/src/product/surfaces/games/__tests__/casino-game-shell.test.tsx` | shell 루프 · `autoBet(stakeOverride)` smoke |

## 증거

```text
Implemented: bun run gate:ai-impl -- --test \
  apps/web/src/features/casino/__tests__/use-auto-bet-queue.test.ts \
  apps/web/src/product/surfaces/games/__tests__/casino-game-shell.test.tsx

L0 cursor:status · check:hygiene · check:ui-architecture · check:phase-r-guards --strict
L1 typecheck · check:i18n · check:release
L2 lint
L3 vitest 13/13 (use-auto-bet-queue 9 + casino-game-shell 4)

gate:ai-impl ✓ Implemented (L0~L4) green
```

**부수 수정 (lint unblock):** `scripts/repair-plan-encoding.ts` — unused helpers 제거 · useless-escape 정리 (게이트 L2 차단 해제)

## 다음

`pir-p1-admin-rbac` — Admin grants fail-closed · localStorage DEV preview only **`[x]` DONE** 2026-07-11 · NEXT `pir-p1-sports-odds-debounce`
