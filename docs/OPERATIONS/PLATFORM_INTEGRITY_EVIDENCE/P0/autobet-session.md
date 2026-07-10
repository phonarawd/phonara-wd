# P0 — `pir-p0-autobet-session`

> **Todo:** `pir-p0-autobet-session`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (Implemented · local vitest)

## 목표 (C-1)

오토벳 루프가 React state를 진실로 쓰지 않도록 순수 세션 리듀서 + `stakeOverride` + 이중 Start 가드.

## 구현

| 파일 | 변경 |
|------|------|
| `apps/web/src/features/casino/use-auto-bet-queue.ts` | `createAutoBetSession` · `stepAutoBetSession` · `markAutoBetStopRequested` · `sessionActiveRef` · `syncSession` |
| `apps/web/src/product/surfaces/games/casino-game-shell.tsx` | 루프 지역 `session` · `pipeline.autoBet(fireStake)` |
| `apps/web/src/features/casino/use-casino-round.ts` | `autoBet(stakeOverride?)` · `submitBet(stakeOverride?)` |
| `apps/web/src/features/casino/__tests__/use-auto-bet-queue.test.ts` | RED-first: count=2 · stopOnLoss 누적 · martingale · 이중 Start |

## 증거

```text
Implemented: bun run test -- apps/web/src/features/casino/__tests__/use-auto-bet-queue.test.ts
  9/9 green (stepAutoBetSession 4 · useAutoBetQueue 5)
Shell smoke: casino-game-shell.test.tsx 4/4 green
```

## 수동 체크리스트 (operator)

- [ ] count=2 → 정확히 2회 후 정지
- [ ] stopOnLoss 누적 도달 시 정지
- [ ] Start 중 재 Start 거부
- [ ] martingale onLoss increase 후 다음 베팅 stake 반영

## 다음

`pir-p0-autobet-gate` — `gate:ai-impl` casino auto-bet + shell bundle **`[x]` DONE** 2026-07-11 · NEXT `pir-p1-admin-rbac`
