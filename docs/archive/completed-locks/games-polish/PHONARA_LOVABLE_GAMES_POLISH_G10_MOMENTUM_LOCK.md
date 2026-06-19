# LOVABLE Games Polish · G#10 Momentum — LOCK v0.1 (greenfield + engine-honest replay)

> **상태:** **FULL APPROVE → EXECUTE GO** · 2026-06-18  
> **큐:** L1-GP Game #10 — **L1-GP FINAL slice** — combo/streak replay · LAW 4 roll-reveal  
> **선행:** G#1–G#9 §GREEN · vitest **630/630** · i18n **DIFF=0 carry**  
> **정본:** [`PHONARA_LOVABLE_GAMES_POLISH_MASTER.md`](PHONARA_LOVABLE_GAMES_POLISH_MASTER.md) §10 · [`PHONARA_DEEPSHAFT_MOMENTUM_ENGINE_DELIVERABLE.md`](PHONARA_DEEPSHAFT_MOMENTUM_ENGINE_DELIVERABLE.md)

---

## Scope (1줄)

Momentum **greenfield + polish** — electric cyan **momentum gauge** + combo nodes 0..15 + roll 0–99 threshold replay — **full engine fields honest** (NOT contract-gap) — LAW 4 roll-reveal quarantine — **MomentumAutoSlot** combo target policy — poster + casino grid wiring.

---

## Identity (anti-clone)

- **Electric cyan/teal momentum arc** + streak nodes **1..15** + pulsing charge toward next combo tier
- **Roll readout 0–99** with **52.00 win threshold** marker (tabular) — **not** Dice horizontal slider clone · **not** Crash curve · **not** Deepshaft vertical shaft · **not** slot reels · **not** emerald blackjack felt
- Cash-out moment = **bank burst** keyed exclusively off `totalMultiplier` when `cashedOut=true`

---

## Engine contract (FULL — NOT contract-gap)

**Selection (per bet):**

```ts
{ comboBefore: number; /* 0..15 */ cashOut: boolean }
```

**Result (engine truth — consume read-only):**

```ts
interface MomentumResult {
  won: boolean;
  roll: number;              // diceFromFloat 0..99; 0 on cashOut
  comboBefore: number;
  comboAfter: number;
  comboMultiplier: number;   // COMBO_MULT table display
  cashedOut: boolean;
  totalMultiplier: number;   // >0 ONLY on cashOut; play rounds = 0
}
```

**Round semantics (mandatory UI branch):**

| Path | `cashOut` | settle banner source | roll animation |
|------|-----------|---------------------|----------------|
| **Play** | `false` | **none** until roll reveal completes; streak continues (`totalMultiplier=0`) | animate toward `result.roll`, then win/loss |
| **Cash out** | `true` | **`totalMultiplier` only** | **skip roll** (`roll=0`) — bank/settle burst |

**Settle rule:** payout display = pipeline `totalMultiplier` / wallet only — **never** recompute `COMBO_MULT` client-side as truth.

**DELIVER one-liner (필수):**

> **Full engine replay — NOT contract-gap.** Engine exposes `roll`, `comboBefore/After`, `comboMultiplier`, `cashedOut`, `totalMultiplier`. UI replays toward settled fields; mock preview may use commitment-hash decorative roll **only when `bet.result` absent** — never override engine truth.

---

## LAW 4 — roll-reveal quarantine (Momentum scope)

Deepshaft-style cell grid **아님**. Momentum LAW 4 = **pre-reveal roll/outcome leak** 금지.

**RollCell / Stage quarantine pattern:**

```ts
type RollDisplayPhase = "idle" | "rolling" | "revealed";
// Pass ONLY resolved display props to RollReadout:
// idle: no final roll digits, no win/loss class, no comboAfter leak
// rolling: indeterminate/count-up WITHOUT committing final roll >= threshold early
// revealed: show result.roll + won/loss + comboAfter transition
```

**Rules:**

- `bet=null` → **idle** — 0 roll digits, 0 win/loss banner, 0 `comboAfter` in DOM attrs/class/data-*
- **In-flight** (bet pending, result not yet in props) → **idle/rolling only** — no `result.roll` leak
- **Play settled:** roll reveal cap **≤900ms** (CSS transform/opacity) → then combo meter steps to `comboAfter` (win) or resets (loss)
- **CashOut settled:** no roll phase — immediate `totalMultiplier` banner; `cashedOut` badge
- **Timer cleanup:** `useEffect` return clears all setTimeout on unmount + bet/selection dep change
- **`prefers-reduced-motion`:** skip ramp — jump to final roll + final combo state; numbers still visible
- Session `comboBefore` in Controls selection = **allowed** (player state, not unrevealed engine outcome)

---

## MomentumAutoSlot (§3.1 — APPLICABLE)

**Policy presets** (mirror engine test names — presentation only):

| Policy | `targetCombo` | behavior |
|--------|---------------|----------|
| early | 2 | play until `comboBefore >= 2` → cashOut bet |
| mid | 5 | play until `comboBefore >= 5` → cashOut bet |
| greedy | 10 | play until `comboBefore >= 10` → cashOut bet |

- CREATE `MomentumAutoSlot.tsx` + `__tests__/MomentumAutoSlot.test.tsx`
- Wire `autoSlot={...}` into **LIVE** `Controls.desktop.tsx` **AND** `Controls.mobile.tsx`
- Playwright §3.1: **1280×1800 AND 390×844** — `casino-auto-slot-momentum` count = 1; param round-trip; Auto↔Manual↔Auto persist

---

## Greenfield scaffold (permitted)

Canvas에 `src/games/momentum/**` 없으면 **CREATE** (G#9 Deepshaft greenfield precedent):

- `index.tsx`, `Stage.tsx`, `Controls.{desktop,mobile}.tsx`, `Controls.shared.tsx`, `types.ts`, `playMomentum.ts` (mock pipeline only)
- `types.ts` union: `momentum` permitted — **`packages/game-engine/**` untouched**
- Route: `casino.momentum.tsx` reachability — **`routeTree.gen.ts` never hand-edit**

---

## Poster (Lovable AI)

- Tool: imagegen standard 1024×1024 — no transparent bg
- Prompt: electric cyan momentum arc · glowing streak nodes · dark premium · subtle 52 threshold tick · no text/logos · not dice slider · not vertical mine shaft · not slot reels
- Save: `src/assets/casino/momentum.jpg`
- Wire: `casino-game-meta.ts` momentum entry + ES import poster
- og: `public/og/casino-momentum.jpg` + route `head()` mirrors deepshaft/gold-rush pattern

---

## NO-TOUCH (git diff = EMPTY)

`src/styles.css` · `packages/game-engine/**` · shared auto-bet 3 (`useAutoBetQueue.ts`, `AutoBetPanel.tsx`, `BetModeTabs.tsx`) ·  
`src/games/{crash,dice,limbo,hilo,roulette,mint-reels,gold-rush,blackjack,mines,plinko,deepshaft}/**` ·  
existing `__tests__/*` in frozen games — **sibling add only** · `routeTree.gen.ts` auto-gen only

---

## D1–D10 deliverables

| ID | Spec |
|----|------|
| D1 | Cyan momentum arc + combo node rail 0..15 |
| D2 | Roll readout + 52.00 threshold marker (tabular-nums) |
| D3 | LAW 4 roll-reveal ≤900ms + timer cleanup |
| D4 | Play vs CashOut branch honest (settle = engine fields only) |
| D5 | Combo meter animates to `comboAfter` only post-reveal |
| D6 | PERF: CSS discrete — **no rAF loop** · no `getComputedStyle` hot path |
| D7 | RM: decorative motion off — final roll + combo + banner remain |
| D8 | Quarantine: RollReadout gets resolved phase string only |
| D9 | Controls: Play + Cash Out (enabled when session combo ≥1) + comboBefore in selection |
| D10 | MomentumAutoSlot early/mid/greedy + dual viewport wire |

---

## Outcome-leak vitest (CREATE sibling — target **635/635**)

CREATE `src/games/momentum/__tests__/outcome-leak.test.tsx` — **5 cases**:

1. `bet=null` → no roll digits, no win/loss banner, no `data-combo-after` leak
2. mock pending bet (no result) → roll readout stays idle/neutral
3. play **loss** settled (`roll<52`, `comboAfter=0`) → roll reveals then loss state; no early win class during rolling
4. play **win** settled → `comboAfter` DOM appears **only after** reveal phase completes (or RM instant final)
5. **cashOut** settled (`cashedOut=true`, `roll=0`) → `totalMultiplier` banner; **no** roll animation attrs

Baseline carry: **630** → target **635/635** (+5).

---

## i18n (additive · DIFF=0)

Keys (ko+en simultaneous):  
`games.momentum.{title,play,cashOut,combo,roll,threshold,win,loss,cashedOut,policyEarly,policyMid,policyGreedy}` + casino meta mirrors.

---

## EXECUTE 0→8

**0.** PRE-FLIGHT — list files; confirm greenfield vs amend; vitest **630/630**; i18n DIFF=0; NO-TOUCH paths  
**1.** Plan — identity + Visual References 2–4개 명시 + engine branch table + LAW 4 roll-reveal + AutoSlot policy  
**2.** BUILD — scaffold + D1–D10 + poster/meta/route/og  
**3.** vitest **635/635** — outcome-leak 5/5 green  
**4.** WC shots **6** incl. `wc6_casino_grid_card` momentum poster  
**5.** §3.1 Playwright 1280+390 AutoSlot live render  
**6.** DELIVER one-liners: full engine replay NOT contract-gap · timer cleanup · poster wired  
**7.** §GREEN STOP — template 아래 붙여 회신  
**8.** §GREEN full self-check block (아래) — **partial rg-only 마감 금지**

---

## §GREEN full self-check block (EXECUTE Step 8 — paste raw)

```bash
bunx vitest run 2>&1 | tail -5
bash scripts/i18n-parity.sh
git diff --name-only -- src/styles.css packages/game-engine src/games/shared/hooks/useAutoBetQueue.ts src/games/shared/AutoBetPanel.tsx src/games/shared/BetModeTabs.tsx
git diff --name-only -- src/games/crash src/games/dice src/games/limbo src/games/hilo src/games/roulette src/games/mint-reels src/games/gold-rush src/games/blackjack src/games/mines src/games/plinko src/games/deepshaft
rg "requestAnimationFrame|getComputedStyle" src/games/momentum/ || true
rg "bet\.result\.(roll|comboAfter)" src/games/momentum/Stage.tsx src/games/momentum/Controls*.tsx || true
```

Expected: vitest **635/635** · i18n DIFF=0 · NO-TOUCH empty · momentum perf rg clean · roll leak tests 5/5.

---

## §GREEN template

```text
Momentum Polish G#10 §GREEN — vitest 635/635 carry — full engine replay NOT contract-gap — LAW 4 roll-reveal PASS — timer teardown — G10-D1 D1–D10 PASS — §3.1 AutoSlot 1280+390 early/mid/greedy — poster generated + wired — perf OK — mobile 0/0/0 — WC shots 6 — §3.7 G#5-C scope-out — §3.10 defer — L1-GP COMPLETE defer GATE — ZIP defer.
```

---

## FAIL conditions

CONTRACT-GAP FLAG (wrong — engine is full) · client-side payout recompute · roll/threshold leak before reveal · `comboAfter` leak pre-reveal · cashOut shows roll animation · play round shows payout banner from `totalMultiplier` when `=0` · timer leak on unmount · AutoSlot dead type · rAF/getComputedStyle in momentum · NO-TOUCH non-empty · vitest red · i18n DIFF≠0 · reveal >900ms · dice slider clone · deepshaft shaft clone · poster generic purple gradient

---

## LOCK Footer

| # | Question | Resolution |
|---|----------|------------|
| 1 | Contract-gap? | **NO** — full `MomentumResult` exposed |
| 2 | LAW 4 scope? | **Roll-reveal quarantine** (not cell grid) |
| 3 | Greenfield? | **YES if canvas lacks `momentum/**`** (G#9 precedent) |
| 4 | AutoSlot? | **APPLICABLE** — targetCombo 2/5/10 |
| 5 | L1-GP after §GREEN? | **COMPLETE** → operator 「Lovable 100%」→ GATE/ZIP defer |

---

## Cursor review log

| 일자 | 판정 | 비고 |
|------|------|------|
| 2026-06-18 | LOCK v0.1 FULL APPROVE | dispatch 발송 · Lovable EXECUTE 대기 |