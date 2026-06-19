# LOVABLE Games Polish · G#6 Mint Reels — LOCK v0.1 (re-issue)

> **상태:** **FULL APPROVE · EXECUTE GO** · 2026-06-18  
> **큐:** L1-GP Game #6 · contract gap · Stake 압살 · 렉 0  
> **선행:** G#1–G#5 §GREEN · vitest **615/615** · i18n **2639 DIFF=0**  
> **연결:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.5 · [`PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-18.md`](PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-18.md)

---

## Scope (1줄)

Mint Reels **presentation polish only** — Stake/Rollbit/Pragmatic slot surface 압살 · honest `totalMultiplier` settle · CONTRACT-GAP FLAG · outcome-leak · Path B auto N/A · perf transform-only · **engine consume-only**.

---

## Mandate

Stake/Rollbit/Pragmatic slot surface **압살** — 첫 3초 density · spin tension · win punch · mint premium feel — **rendering lag 0**.

---

## PRE-FLIGHT raw

```
src/games/mint-reels/  Controls.{desktop,mobile,shared}.tsx · HUD · Stage · index · __tests__
__tests__/             MintReelsGame.contract · auto.wiring · reducedMotion

rg MintReelsAutoSlot|casino-auto-slot-mint  → 0 hits
rg requestAnimationFrame|getComputedStyle   → 0 hits  (perf-clean baseline)
rg totalMultiplier|stops|window             → Stage reads result.totalMultiplier only
                                              + comment "NEVER read bet.result.grid"
```

- Stage 190 LOC. Grid via `seedToGrid(commitment.server_seed_hash + clientSeed + spinTick)` — UI-deterministic, NOT engine truth.
- Animation: CSS `slotBlur 0.45s` + `slotPop 0.4s` (col×0.08 stagger, max ~0.9s). transform / opacity / filter only.
- Selection `{ lines: number }` 1–20; presets `[1,5,10,15,20]`. Auto re-fires committed lines → **AutoSlot Path B = not-applicable**.

---

## CONTRACT-GAP FLAG (DELIVER paragraph — verbatim)

> Engine contract exposes `totalMultiplier` only — no `stops` / `window` / paytable in result. Per-reel "true symbol stop" animation is therefore impossible without engine extension. Current Stage uses **decorative reels (NOT engine stops) + honest settle reveal**: reels animate from public commitment hash (`seedToGrid`, UI-deterministic, decorative only), and the win tier/badge is keyed exclusively off `totalMultiplier`. Decorative grid is never presented as engine truth. To upgrade to authentic Pragmatic-grade reel stops, engine must surface `{ stops: number[], window: Symbol[][] }`. **Follow-up flagged for Cursor.**

**FAIL =** DELIVER에 위 paragraph 또는 "decorative / not engine stops" one-liner 누락 → LAW 1/3 violation.

---

## NO-TOUCH (git diff = EMPTY)

- `src/styles.css` · `packages/game-engine/**`
- `src/games/shared/hooks/useAutoBetQueue.ts` · `shared/AutoBetPanel.tsx` · `shared/BetModeTabs.tsx`
- `src/games/{crash,dice,limbo,hilo,roulette,blackjack,gold-rush}/**`
- `src/games/mint-reels/index.tsx` (pipeline)
- Existing `mint-reels/__tests__/*` — **sibling add only** (`outcome-leak.test.tsx`)

---

## Scope-out (carry · plan-acknowledged)

- §3.7 `/casino/roulette` promo card overflow at 390/414 — **G#5-C scope-out**, not this slice.
- §3.10 funded autobet INCONCLUSIVE — OK to defer.
- G#7 Gold Rush · ZIP · PHONARA paste — 0.

---

## EDIT — Stake-crushing slot surface (presentation only)

### Stage.tsx — frame + symbols + win punch (S1·S2·S3·S5·S6)

| ID | Before | After (압살 polish) |
|----|--------|---------------------|
| S1 frame | `border-teal-400/20 inset-shadow` | **double rim**: outer `border-teal-300/35` + inner `ring-1 ring-emerald-200/15`; **top-light streak** (decorative gradient `linear-gradient(180deg, rgba(167,243,208,.08), transparent 60%)`); deeper plate `from-emerald-950/80 via-teal-900/40 to-emerald-950/60` |
| S1 cell | `aspect-square size-7 md:size-8` | `size-8 md:size-10`; idle border `border-teal-500/20`; **inner highlight** `inset 0 1px 0 rgba(255,255,255,.04)` (boxShadow, not layout) |
| S2 spin | `slotBlur 0.45s` + `slotPop 0.4s × col*0.08` (max ~0.9s) | preserve timing budget ≤900ms; add `willChange: 'transform, filter'` on column during `p.busy`, **drop to `'auto'` on idle** (effect cleanup ref) — prevents idle GPU layer leak |
| S3 win banner | `text-lg` tier color | **layered punch**: WIN tier → `text-xl`; MEGA tier → `text-2xl` + `text-amber-200` + Crown icon + radial glow `radial-gradient(circle, rgba(252,211,77,.25), transparent 60%)` halo div; all `tabular-nums`; banner fades in via existing `slotPop` timing — **no new keyframe over 900ms** |
| S5 hot path | transform/opacity only ✓ | inline doc comment: `// PERF: transform + opacity + filter only. NO rAF, NO getComputedStyle.`; cell `transition-all` → `transition-[box-shadow,border-color] duration-200` (kill `all` to avoid implicit layout transitions) |
| S6 RM | `reduced` skips both keyframes ✓ | **spot-check confirmed**: when `reduced=true`, `style.animation=undefined` on both column AND cell → `slotPop 0%` never runs → symbol opacity stays `1` (Tailwind base). Add vitest: `reduced=true` render → symbol `<svg>` count = 15, banner present when bet settled |

### Controls.shared.tsx — lines selector clarity (S4)

- Keep 5 preset chips `[1,5,10,15,20]` (engine contract unchanged).
- Active chip: add `ring-2 ring-teal-300/70 shadow-[0_0_12px_rgba(94,234,212,.25)]` lift (presentation only, no layout shift).
- Add inline mini-scale below chips: `<div role="presentation">` 20 dots, active up-to-`lines` filled teal — **display-only**, no click handlers (avoids contract scope creep).

### Path B AutoSlot — N/A (S2 rapid replay)

- Inline JSDoc on `MintReelsControlsShared`: `// Path B (AutoSlot mirror): lines re-fires committed selection; per-fire input = zero. AutoSlot wrapper adds no value. auto.wiring.test.tsx guards re-fire correctness.`

### CREATE — `src/games/mint-reels/__tests__/outcome-leak.test.tsx`

- Vitest sibling (not edit). 2 cases:
  1. `bet=null` render → no `data-winning*`, no fabricated grid; mounted DOM `data-testid=casino-stage` present, symbol count = 15.
  2. `bet={ result: { totalMultiplier: "12.50" } }` → mega banner visible; symbol count still = 15; no `bet.result.grid` traversal (probe via `JSON.stringify(props)` containing no `grid` key).
- Plus RM gate: `matchMedia('reduce')=true` + settled bet → banner present AND symbols visible (count=15).
- Target: **616/616**.

### i18n — additive

- `games.mintreels.win` · `games.mintreels.mega` (banner labels) — KO + EN, DIFF=0.

---

## EXECUTE order (Steps 0→8)

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · vitest BEFORE **615/615** |
| 1 | PRE-FLIGHT raw (above) |
| 2 | Stage.tsx S1/S2 will-change/S3/S5/S6 polish + Controls.shared.tsx S4 chip lift + dot scale |
| 3 | CREATE `outcome-leak.test.tsx` → **616/616** |
| 4 | Playwright §3 raw — `wc1_spin · wc2_reveal · wc3_win_mega · wc4_mobile_390 · wc5_perf_note (will-change idle drop)`; rapid replay 2 spins <4s wall |
| 5 | i18n additive (DIFF=0) |
| 6 | §3 raw 1–10 + CONTRACT-GAP FLAG paragraph + decorative/not-engine-stops one-liner in DELIVER |
| 7 | §GREEN line + STOP |
| 8 | §GREEN self-check commands (full block below) |

---

## §3 SELF-VERIFY (blocking 🔒)

1. 🔒 Contract-honest — `rg -i "spinSlot|stops|window|evaluateRoulette|bet\.result\.grid" src/games/mint-reels/` = 0; DELIVER one-liner "decorative / not engine stops" present
2. 🔒 §3.1 Path B `not-applicable` documented (auto.wiring green)
3. 🔒 NO-TOUCH empty — `git diff packages/game-engine src/styles.css src/games/shared/{hooks/useAutoBetQueue.ts,AutoBetPanel.tsx,BetModeTabs.tsx} src/games/{crash,dice,limbo,hilo,roulette,blackjack,gold-rush} src/games/mint-reels/index.tsx`
4. 🔒 vitest **616/616** (+1 outcome-leak file; +RM symbol-visibility case)
5. 🔒 G6-S1 S1–S8 self-audit table PASS on 1280 AND 390
6. §3.4 i18n DIFF=0
7. §3.5 perf — `rg "requestAnimationFrame|getComputedStyle" src/games/mint-reels/` = 0; Playwright probe: `getComputedStyle(column).willChange` returns `'auto'` after spin ends
8. §3.7 mobile overflow 375/390/414 on `/casino/mint-reels` = 0/0/0 (roulette promo overflow → G#5-C scope-out, not this slice)
9. §3.9 WC: wc1_spin · wc2_reveal · wc3_win_mega · wc4_mobile_390 · wc5_perf_note
10. §3.9b rapid replay 2 spins <4s · §3.10 funded autobet INCONCLUSIVE

---

## §GREEN self-check (Step 8 — full block)

```bash
# Contract-honest
rg -i "spinSlot|stops|window|evaluateRoulette|bet\.result\.grid" src/games/mint-reels/

# Perf clean (prod spin path)
rg "requestAnimationFrame|getComputedStyle" src/games/mint-reels/

# NO-TOUCH
git diff -- packages/game-engine src/styles.css \
  src/games/shared/hooks/useAutoBetQueue.ts \
  src/games/shared/AutoBetPanel.tsx \
  src/games/shared/BetModeTabs.tsx \
  src/games/crash src/games/dice src/games/limbo src/games/hilo \
  src/games/roulette src/games/blackjack src/games/gold-rush \
  src/games/mint-reels/index.tsx

# Tests + i18n
npm test -- --run
# expect 616/616
```

---

## §GREEN template

```text
Mint Reels Polish G#6 §GREEN — vitest 616/616 carry · contract-honest (decorative / not engine stops) · contract-gap FLAG delivered · G6-S1 S1–S8 PASS · §3.1 not-applicable (pre-committed lines) · perf OK (transform/opacity/filter only · rAF 0 · getComputedStyle 0 · will-change idle dropped) · rapid replay <4s · mobile 0/0/0 · WC shots 5 · §3.7 G#5-C scope-out · §3.10 defer · Gold Rush defer · ZIP defer.
```

---

## FAIL conditions

| FAIL | hit 조건 |
|------|----------|
| Contract breach | Any read of `bet.result.grid` / fabricated stops / client paytable recompute |
| LAW 1/3 | Removing "decorative / not engine stops" line from DELIVER |
| Perf | `requestAnimationFrame` orphan · `getComputedStyle` in spin path · `will-change` stuck on idle |
| NO-TOUCH | Non-empty diff · `styles.css` touch · vitest red · i18n DIFF≠0 |
| LAW 3 | Fake live ticker / jackpot feed |
| UX budget | Spin phase >900ms · re-spin lockout >2s · mobile 390 overflow ≠ 0 |
| RM regression | Symbol opacity 0 when reduced (slotPop 0% leak) |

---

## Defer

ZIP · PHONARA paste · G#7 Gold Rush · §3.10 funded autobet · §3.7 G#5-C promo — **0 in this slice**. STOP after §GREEN.

---

## Cursor review log

| 일자 | 판정 | 비고 |
|------|------|------|
| 2026-06-17 | Plan APPROVE | contract-gap · Path B N/A |
| 2026-06-18 | **LOCK v0.1 FULL APPROVE (re-issue)** | non-blocking acks only · EXECUTE GO 유효 |
| 2026-06-18 | **§GREEN APPROVE** | vitest 618/618 · contract-honest · FLAG delivered · G6-S1 S1–S8 · §3.1 N/A · perf OK · i18n 2650 DIFF=0 · NO-TOUCH empty |
