# LOVABLE Games Polish · G#7 Gold Rush — LOCK v0.1 (presentation only)

> **상태:** **FULL APPROVE · EXECUTE GO** · 2026-06-18  
> **큐:** L1-GP Game #7 · contract gap · gold-premium distinct from G#6 mint-teal  
> **선행:** G#1–G#6 §GREEN · vitest **618/618** · i18n **2650 DIFF=0**  
> **연결:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.5 · G#6 [`PHONARA_LOVABLE_GAMES_POLISH_G6_MINT_REELS_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G6_MINT_REELS_LOCK.md)

---

## Scope (1줄)

Gold Rush **presentation polish only** — gold-premium identity (amber/yellow) **distinct from G#6 mint-teal**, same world-class bar · contract-honest (`totalMultiplier` only, decorative `seedToGrid` reels) · Engine NO-TOUCH.

---

## Baseline (PRE-FLIGHT confirmed)

- vitest **618/618** · i18n KO=EN=**2650** DIFF=0
- `rg requestAnimationFrame|getComputedStyle|stops|bet\.result\.grid` in `src/games/gold-rush/` → **0 hits**

---

## CONTRACT-GAP FLAG (DELIVER paragraph — verbatim)

> Engine contract exposes `totalMultiplier` only — no `stops` / `window` / paytable in result. Per-reel "true symbol stop" animation is therefore impossible without engine extension. Current Stage uses **decorative reels (NOT engine stops) + honest settle reveal**: reels animate from public commitment hash (`seedToGrid`, UI-deterministic, decorative only), and the win tier/badge is keyed exclusively off `totalMultiplier`. Decorative grid is never presented as engine truth. To upgrade to authentic Pragmatic-grade reel stops, engine must surface `{ stops: number[], window: Symbol[][] }`. **Follow-up flagged for Cursor.**

**FAIL =** DELIVER에 위 paragraph 또는 **"decorative / not engine stops"** one-liner 누락.

---

## NO-TOUCH (git diff = EMPTY)

- `src/styles.css` · `packages/game-engine/**`
- `src/games/shared/{hooks/useAutoBetQueue.ts,AutoBetPanel.tsx,BetModeTabs.tsx}`
- `src/games/{crash,dice,limbo,hilo,roulette,blackjack,mint-reels}/**` ← **G#6 frozen**
- `src/games/gold-rush/index.tsx` (pipeline)
- Existing `gold-rush/__tests__/{GoldRushGame.contract,auto.wiring,reducedMotion}.test.tsx` — **sibling add only**

---

## Scope-out

- §3.7 G#5-C promo overflow · §3.10 funded autobet · G#8 · ZIP · PHONARA paste — 0

---

## EDIT spec

### 1. `src/games/gold-rush/Stage.tsx` (S1–S6)

| ID | Spec |
|----|------|
| S1 frame | double rim `border-amber-400/35` + `ring-1 ring-yellow-200/15`; top-light `linear-gradient(180deg, rgba(252,211,77,.10), transparent 60%)`; plate `from-amber-950/85 via-yellow-900/45 to-amber-950/65` |
| S1 cell | `size-8 md:size-10`; `border-amber-500/25`; `boxShadow: inset 0 1px 0 rgba(255,255,255,.05)` |
| S2 spin | `willChange: transform,filter` on busy → **`auto` idle** (ref/effect cleanup); budget ≤900ms |
| S3 win | WIN `text-xl text-amber-200`; MEGA `text-2xl text-amber-300` + Crown + radial glow; `tabular-nums`; existing `goldDrop` keyframe — no new keyframe >900ms |
| S5 perf | `transition-[box-shadow,border-color] duration-200`; `// PERF: transform + opacity + filter only. NO rAF, NO getComputedStyle.` |
| S6 RM | `reduced=true` → `animation=undefined` column+cell; symbol opacity stays 1 |

### 2. `src/games/gold-rush/Controls.shared.tsx` (S4)

- Active chip: `ring-2 ring-amber-300/70 shadow-[0_0_12px_rgba(251,191,36,.30)]` + slight scale
- 20-dot mini-scale: dots 1..lines amber, rest muted; `role="presentation"`; no clicks
- JSDoc Path B not-applicable: lines pre-committed · AutoSlot zero per-fire input · `auto.wiring` guards

### 3. CREATE `src/games/gold-rush/__tests__/outcome-leak.test.tsx`

1. `bet=null` → no `data-winning*` · no fabricated grid · `casino-stage` · symbols=15
2. `totalMultiplier="12.50"` → MEGA banner · symbols=15 · no `grid` read
3. reduced-motion + settled → banner + symbols=15 (no opacity:0 regression)

Target: **621/621** (+3 from 618)

### 4. i18n additive

- `games.goldrush.win` — EN "WIN" / KO "당첨"
- `games.goldrush.mega` — EN "MEGA WIN" / KO "메가 당첨"
- DIFF=0

---

## EXECUTE (Steps 0→8)

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · vitest BEFORE **618/618** |
| 1 | PRE-FLIGHT raw |
| 2 | Stage S1–S6 + Controls S4 |
| 3 | CREATE outcome-leak.test.tsx → **621/621** |
| 4 | WC: wc1_spin · wc2_reveal · wc3_win_mega · wc4_mobile_390 · wc5_perf_note; rapid replay 2 spins <4s |
| 5 | i18n DIFF=0 |
| 6 | §3 raw 1–10 + CONTRACT-GAP FLAG + decorative one-liner DELIVER |
| 7 | §GREEN line + STOP |
| 8 | §GREEN self-check full block |

---

## §3 SELF-VERIFY (blocking 🔒)

1. 🔒 Contract-honest — forbidden symbol rg = 0; DELIVER decorative one-liner
2. 🔒 §3.1 Path B not-applicable · auto.wiring green
3. 🔒 NO-TOUCH empty (incl. mint-reels/**)
4. 🔒 vitest **621/621**
5. 🔒 G7-S1 S1–S8 PASS 1280+390 · **gold palette distinct from G#6 mint-teal**
6. §3.4 i18n DIFF=0
7. §3.5 rAF/getComputedStyle 0 · will-change idle dropped
8. §3.7 `/casino/gold-rush` 375/390/414 = 0/0/0
9. §3.9 WC 5 shots
10. §3.9b rapid replay <4s · §3.10 defer

---

## §GREEN self-check (Step 8)

```bash
rg -i "spinSlot|stops|window|bet\.result\.grid" src/games/gold-rush/
rg "requestAnimationFrame|getComputedStyle" src/games/gold-rush/
git diff -- packages/game-engine src/styles.css \
  src/games/shared/hooks/useAutoBetQueue.ts src/games/shared/AutoBetPanel.tsx \
  src/games/shared/BetModeTabs.tsx src/games/mint-reels \
  src/games/crash src/games/dice src/games/limbo src/games/hilo \
  src/games/roulette src/games/blackjack src/games/gold-rush/index.tsx
npm test -- --run
```

---

## §GREEN template

```text
Gold Rush Polish G#7 §GREEN — vitest 621/621 carry · contract-honest (decorative / not engine stops) · contract-gap FLAG delivered · G7-S1 S1–S8 PASS · §3.1 not-applicable (pre-committed lines) · perf OK (transform/opacity/filter only · rAF 0 · will-change idle dropped) · rapid replay <4s · mobile 0/0/0 · WC shots 5 · §3.7 G#5-C scope-out · §3.10 defer · G#8 defer · ZIP defer.
```

---

## FAIL conditions

| FAIL | hit |
|------|-----|
| Contract | `bet.result.grid` / fabricated stops / client paytable recompute |
| LAW 1/3 | CONTRACT-GAP FLAG or decorative one-liner missing from DELIVER |
| Perf | rAF/getComputedStyle in spin path · will-change stuck idle |
| NO-TOUCH | non-empty diff · `mint-reels/` touch · `styles.css` touch |
| Quality | vitest red · i18n DIFF≠0 · LAW 3 fake live ticker |
| UX | spin >900ms · RM symbol opacity 0 regression |
| Identity | **gold palette indistinguishable from G#6 mint-teal** |

---

## Cursor review log

| 일자 | 판정 | 비고 |
|------|------|------|
| 2026-06-18 | dispatch EXECUTE GO | Mint G#6 동형 · 621 target |
| 2026-06-18 | **LOCK v0.1 FULL APPROVE** | operator LOCK paste · gold distinct FAIL added |
| 2026-06-18 | **§GREEN APPROVE** | vitest 621/621 · contract-honest · FLAG · gold-premium distinct · NO-TOUCH empty · mint-reels frozen |
