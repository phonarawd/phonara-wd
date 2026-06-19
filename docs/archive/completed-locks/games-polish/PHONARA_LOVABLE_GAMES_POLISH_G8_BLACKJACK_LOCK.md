# LOVABLE Games Polish · G#8 Blackjack — LOCK v0.1 (presentation only)

> **상태:** **FULL APPROVE · EXECUTE GO** · 2026-06-18 (amend: LOSS=0 · 625 target)  
> **큐:** L1-GP Game #8 · contract gap · mock fallback documented  
> **선행:** G#1–G#7 §GREEN · vitest **621/621** · i18n **2652 DIFF=0**  
> **연결:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.5

---

## Scope (1줄)

Blackjack **presentation polish only** — classic **emerald-felt + amber-trim** table (distinct from G#6 mint-teal · G#7 gold) · contract-honest **4-state `totalMultiplier` tier** · `result.player`/`result.dealer` = **preview-mock fallback only** (production `{ totalMultiplier }` alone) · Engine NO-TOUCH.

---

## Baseline (PRE-FLIGHT)

- vitest **621/621** · i18n KO=EN **DIFF=0**
- `requestAnimationFrame`/`getComputedStyle` in `src/games/blackjack/` → **0**
- No `bet.result.hands`/`bet.result.cards` read
- `result.dealer`/`result.player` only when present (mock) — **never fabricated from `totalMultiplier`**

---

## CONTRACT-GAP FLAG (DELIVER — verbatim)

> Engine contract exposes `totalMultiplier` only — no `playerHands` / `dealerHand` / `cards` in result. Authentic per-card deal/reveal keyed to engine outcome is therefore impossible without engine extension. Current Stage uses **decorative cards (NOT engine hands) + honest settle reveal**: table animates from public commitment hash (UI-deterministic, decorative only), and win/loss/push/blackjack badge is keyed exclusively off `totalMultiplier`. Decorative cards are never presented as engine truth. To upgrade to authentic hand-by-hand reveal, engine must surface `{ playerHands: Hand[], dealerHand: Hand }`. **Follow-up flagged for Cursor.**

**DELIVER one-liners (필수):**
- **decorative / not engine hands**
- Engine returns **`0` on LOSE** (verified `playBlackjack.ts` `handPayoutMultiplier`: bust/dealer-win paths return `0`) → **`<1` predicate covers bust/dealer-win/insurance-fail uniformly**

---

## NO-TOUCH (git diff = EMPTY)

`src/styles.css` · `packages/game-engine/**` · shared auto-bet 3 · `src/games/{crash,dice,limbo,hilo,roulette,mint-reels,gold-rush}/**` · `blackjack/index.tsx` · `blackjack/playBlackjack.ts` · existing `blackjack/__tests__/*` — sibling add only

---

## EDIT spec

### Stage.tsx (B1, B3, B5, B6)

- **B1 felt:** `border-emerald-600/40` + `ring-amber-200/10`; plate emerald gradient; semicircle inset + golden top-light
- **B3 banner** from `Number(totalMultiplier)`:
  - **LOSS** `<1` (covers **`0`** bust/lose)
  - **PUSH** `===1`
  - **WIN** `>1 && <2.5`
  - **BLACKJACK** `>=2.5`
  - Colors: LOSS rose · PUSH stone · WIN amber-200 xl · BJ 2xl + Crown + halo
- **B5:** PERF comment · no `transition-all`
- **B6 RM:** `bjFlip` disabled when reduced; cards stay visible
- Cards: mock `player`/`dealer` OR placeholder — never from multiplier

### Controls.shared.tsx (B4)

Active chip `ring-emerald-400/60` + glow · JSDoc Path B N/A

### CREATE `outcome-leak.test.tsx` (4 cases)

1. `bet=null` → stage · no winning attrs · no faces · no banner
2. `totalMultiplier="2.50"` no player/dealer → BJ banner · placeholders
3. RM + mult `1.50` → WIN banner · cards visible
4. **`totalMultiplier="0"` → LOSS banner** (`<1` path)

Target: **625/625** (+4)

### i18n

`games.blackjack.{loss,push,win,blackjack}` — KO+EN DIFF=0

---

## EXECUTE 0→8

0. vitest 621/621 · 3. outcome-leak 4 cases → **625/625** · 6. DELIVER FLAG + decorative + LOSE=0 line · 7. §GREEN STOP · 8. self-check

---

## §GREEN template

```text
Blackjack Polish G#8 §GREEN — vitest 625/625 carry · contract-honest (decorative / not engine hands · LOSE=0 covered by <1) · contract-gap FLAG delivered · G8-B1 B1–B6 PASS · §3.1 not-applicable (pre-committed actions) · perf OK · mobile 0/0/0 · WC shots 5 · §3.7 G#5-C scope-out · §3.10 defer · G#9 defer · ZIP defer.
```

---

## FAIL conditions

hands/cards read · hand from multiplier · per-hand highlight · FLAG/decorative missing · rAF/getComputedStyle · NO-TOUCH non-empty · mint-reels/gold-rush touch · vitest red · i18n DIFF≠0 · deal >900ms · RM opacity 0 · felt = slot reel

---

## Cursor review log

| 일자 | 판정 | 비고 |
|------|------|------|
| 2026-06-18 | LOCK v0.1 FULL APPROVE | mock fallback · playBlackjack.ts NO-TOUCH |
| 2026-06-18 | **amend APPROVE** | Case 4 LOSS=0 · target **625/625** · DELIVER LOSE=0 line |
| 2026-06-18 | **§GREEN APPROVE** | vitest 625/625 · 4-state banner · LOSS=0 · FLAG · NO-TOUCH empty · i18n 2647 DIFF=0 |
