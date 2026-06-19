# LOVABLE Games Polish · G#5-C — Promo Card Overflow (parallel amend)

> **상태:** **FULL APPROVE · EXECUTE GO** · 2026-06-18  
> **큐:** L1-GP **parallel** · G#5 §AMBER 해소 · **G#10 HEAD 차단 아님**  
> **선행:** vitest **630/630** carry · i18n DIFF=0

---

## Scope (1줄)

`/casino/roulette` page shell horizontal overflow → **0** at 375/390/414. Roulette wheel/board/Stage/engine/styles.css **NO-TOUCH**. Shared `GameDetailFrame` shell fix (other `/casino/*` inherit — non-blocking, not scope creep).

---

## Root cause (PRE-FLIGHT confirmed)

`src/components/casino/detail/GameDetailFrame.tsx` `GameHeroStage` (~L212/215):

- `sm:grid-cols-[200px_1fr]` + `aspect-[4/3]` poster · `<img width=768>` intrinsic ~520px min-content
- `useIsMobile()` hydration + 640–767px `sm` tier → desktop hero paints on 390/414 metric → overflow 146/122

Other PRE-FLIGHT hits (`crash/Stage`, `GameCard`) — **NOT in roulette page shell · NO-TOUCH**

---

## FIX (C1–C5) — EDIT allowed: `GameDetailFrame.tsx` GameHeroStage only

| ID | Change |
|----|--------|
| C1 | `sm:grid-cols-[200px_1fr]` → `md:grid-cols-[200px_1fr] md:items-center md:gap-5 md:p-5` · below md single column |
| C2 | `min-w-0` on grid wrapper + text child (L239) · poster container `w-full max-w-full` |
| C3 | Poster `sm:max-w-[280px] md:max-w-none` below md · **no** page-shell overflow-x-hidden band-aid |
| C4 | md+ 2-col rhythm preserved · h1 ladder untouched |
| C5 | i18n DIFF=0 — no key edits |

className-only · LCP img attrs preserved.

**Note:** shared frame fix — benefits all game detail routes; §GREEN measure **roulette only**.

---

## NO-TOUCH

`src/games/roulette/**` · engine · styles.css · shared auto-bet 3 · other 10 games · `casino.roulette.tsx` route · crash/Stage · GameCard

---

## EXECUTE 0→5

0. vitest 630/630 BEFORE · 2. C1–C4 line replace · 3. §3.7 375/390/414 = 0/0/0 · 4. wheel/board spot 1280+390 · 5. vitest carry + §GREEN STOP

---

## §GREEN template

```text
Roulette G#5-C promo-overflow §GREEN — §3.7 0/0/0 on 375/390/414 · NO-TOUCH wheel/board · vitest 630/630 carry · i18n DIFF=0 · G#10 defer · ZIP defer.
```

---

## FAIL

roulette/engine/styles.css touch · §3.7 390/414 ≠0 · vitest red · md+ 2-col regression

---

## Cursor review log

| 일자 | 판정 | 비고 |
|------|------|------|
| 2026-06-18 | **EXECUTE APPROVE** | GameDetailFrame sm→md · min-w-0 · max-w poster |
| 2026-06-18 | **§GREEN APPROVE** | §3.7 0/0/0 · vitest 630/630 carry · GameDetailFrame sm→md · NO-TOUCH wheel/board |
