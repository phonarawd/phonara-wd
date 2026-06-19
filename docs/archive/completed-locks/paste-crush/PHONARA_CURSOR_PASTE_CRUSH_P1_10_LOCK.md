# P1.10 · BetPanel Chips + Auto-Bet Fix · LOCK v1.1 (정본)

> **범위:** `BetPanel.tsx` + **4게임** `Controls.shared.tsx`  
> **P1.7 amend:** MAX `hidden md:inline-flex` **폐기** (#P1.10-B)  
> **엔진:** NO-TOUCH · `.phonara-stage` NO-TOUCH · testid 0 · i18n 0  
> **갱신:** 2026-06-15 · **§GREEN LOCK 확정**

---

## A. PC: MAX 글자 잘림

**Edit:** `src/games/shared/BetPanel.tsx`

- Row 1: stake input `w-full`
- Row 2: chips `grid grid-cols-3 gap-1`
- Chip class: `min-h-10 rounded-md border border-border bg-(--color-surface) text-xs font-semibold hover:bg-(--color-surface-elev)` — **`px-2` / `shrink-0` 제거**

**FAIL =** ½ / 2× / MAX text clip (PC 320px side panel)

---

## B. 모바일: MAX 숨김 해제

**Edit:** same `BetPanel.tsx`

- **DELETE:** `c.label === "MAX" && "hidden md:inline-flex"`
- A의 `grid-cols-3` → mobile 3칸 균등 · MAX visible
- testid DOM **유지** · 변경 0

**FAIL =** mobile MAX hidden · testid removed

---

## C. Auto-Bet stale `commitment` guard

**원인:** `await onPrepareRound()` 후 `if (!p.commitment) return` — stale closure → submit 0회 → AutoBetQueue idle stop

**Fix pattern (모든 대상 동일):**

```ts
const onAutoFire = async () => {
  if (!p.commitment) await p.onPrepareRound();
  await p.onSubmitBet();
};
```

- **DELETE:** second `if (!p.commitment) return;` after prepare
- **NO** `Promise.resolve()` flush hack
- submit fail → engine error → AutoBetPanel `errorReason` → stop (기존)

**Edit (4):**

| 파일 | 비고 |
|------|------|
| `src/games/crash/Controls.shared.tsx` | 사용자 보고 케이스 |
| `src/games/dice/Controls.shared.tsx` | 동일 stale guard |
| `src/games/limbo/Controls.shared.tsx` | 동일 |
| `src/games/hilo/Controls.shared.tsx` | **selection guard 유지** · commitment guard만 제거 |

**NO-TOUCH:** `.phonara-stage` · engine reducers · `packages/game-engine`

**FAIL =** Auto Start → 0 fires · stale guard 잔존 in 4 files

---

## 영향 파일 (5)

| # | 파일 |
|---|------|
| 1 | `src/games/shared/BetPanel.tsx` |
| 2 | `crash/Controls.shared.tsx` |
| 3 | `dice/Controls.shared.tsx` |
| 4 | `limbo/Controls.shared.tsx` |
| 5 | `hilo/Controls.shared.tsx` |

---

## 검증

| viewport | check |
|----------|-------|
| PC 1280 (320px panel) | ½ 2× MAX equal width · no clip |
| Mobile 390 | 3 chips · MAX visible |
| Crash Auto-Bet | Start → ~320ms prepare→submit→settle→next fire |
| dice/limbo/hilo Auto | same onAutoFire pattern · no stale return |

---

## §GREEN self-check

```bash
bun run test 2>&1 | tail -5
rg "hidden md:inline-flex" src/games/shared/BetPanel.tsx && exit 1 || true
rg "if \(!p\.commitment\) return" src/games/crash/Controls.shared.tsx src/games/dice/Controls.shared.tsx src/games/limbo/Controls.shared.tsx src/games/hilo/Controls.shared.tsx && exit 1 || true
```

---

## FAIL 조건 (통합)

- BetPanel chip clip (PC)
- mobile MAX hidden
- stale `if (!p.commitment) return` 잔존 (4 games)
- testid 변경
- `.phonora-stage` touched

---

## 마감 보고

```text
P1.10 GREEN · BetPanel grid chips · MAX mobile visible · auto-fire guard removed (crash+dice+limbo+hilo) · testid 0
```

---

*P1.10 v1.1 · Lovable EXECUTE only · PHONARA repo 0-touch*
