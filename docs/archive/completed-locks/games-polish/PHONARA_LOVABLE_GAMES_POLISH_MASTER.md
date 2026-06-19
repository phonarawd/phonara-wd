# PHONARA · Lovable Games Polish Master (12 originals · Stake 압살 · 렉 0)

> **목적:** Lovable canvas에서 casino **12 originals** UI/UX를 엔진 오차 0 · 렉 0 · Stake 압살 수준으로 올리는 **standing 정본**.  
> **갱신:** 2026-06-17 · operator desktop `PHONARA-lovable-master-prompt.md` 흡수 + Deepshaft/Momentum 확장  
> **담당:** Lovable AI · Cursor (§GREEN 검증) · operator (APPROVE/EXECUTE GO)  
> **연결:** `PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` §3.1.5 · `LOVABLE_OPERATOR_PROMPT_DISPATCH.md`

---

## 0. 큐 위치 · 우선순위

| 트랙 | ID | 상태 |
|------|-----|------|
| L1 formal HEAD | L1-20 K1 | PLAN |
| **L1-GP (operator priority parallel)** | **Games Polish Sub-Queue** | **ACTIVE · HEAD = G#2 Dice (G#1 ✅)** |
| L1 parallel | ~~L1-16f desktop~~ **CANCELLED** (operator 2026-06-18) |

**S4:** 게임 1개 = LOCK 1건. G#n §GREEN 전 G#n+1 금지. ZIP defer.

**Baseline:** vitest **586/586** · i18n **KO=EN=2620 DIFF=0**.

---

## 1. 12종 큐 (registry SOT)

| # | GameCode | 상태 |
|---|----------|------|
| — | plinko · mines · shell | ✅ signed-off |
| **G#1** | crash | ⏳ EXECUTE — `PHONARA_LOVABLE_GAMES_POLISH_G1_CRASH_LOCK.md` |
| **G#2** | **dice** | **⏳ HEAD** |
| G#3 | limbo | PLAN |
| G#4 | hilo | PLAN |
| G#5 | roulette | PLAN |
| G#6 | mint_reels | PLAN · contract gap |
| G#7 | gold_rush | PLAN · slot (dig 아님) |
| G#8 | blackjack | PLAN · contract gap |
| G#9 | deepshaft | PLAN · LAW 4 FULL |
| G#10 | momentum | PLAN |

**엔진 mirror:** `packages/game-engine/src/games/*.ts` · `cashoutMultiplier` (not cashoutMult).

---

## 2. Lovable standing instruction (PART 1–5)

# PHONARA — MASTER PROMPT: finish all remaining casino game UI/UX (self-contained)

You are Lovable, working in the PHONARA monorepo. This is a standing instruction set for
completing the remaining games' UI/UX to a world-class, 60fps, Stake-beating level. Follow it
for EVERY game below, in order, ONE game per pass. The human cannot always review between passes,
so this prompt is self-sufficient: it contains the gates, stop-conditions, and self-checks you
must enforce yourself. When a blocking gate fails, STOP and report — do not proceed or work around it.

The game ENGINES are FINAL (built in Cursor) and will be integrated there later. You do UI/UX only.
Everything is exported as a codebase to Cursor at the end — so: **no `main` writes, no GitHub push,
no PR, no merge, ever. Working branch only.**

═══════════════════════════════════════════════════════════════════════
## PART 1 — LAWS THAT APPLY TO EVERY GAME (never violate)
═══════════════════════════════════════════════════════════════════════

### LAW 1 — ENGINE IS UNTOUCHABLE (the most important rule)
- Each game engine already decides the FULL outcome the instant a bet is placed, returned via the
  casino pipeline (`useCasinoRoundPipeline` → `rpc_open_game_round` → `rpc_place_game_bet` → result).
- You CONSUME engine output read-only. You NEVER compute, fake, re-derive, re-roll, predict, or
  influence any result, multiplier, payout, crash point, dice value, card, reel stop, mine layout,
  or seed.
- **The animation is a REPLAY toward an already-decided endpoint.** The engine knows the result
  the instant the round starts; your animation just travels to it. Animation must never decide or
  block on the outcome.
- NEVER edit: `@phonara/game-engine`, `@phonara/trading-engine`, `@phonara/money`,
  `@phonara/shared-types`, any engine module, Supabase RPC/migrations, or `useCasinoRoundPipeline`.
- If making the UI work seems to require an engine/RPC/contract change → STOP and report. Do NOT
  work around the engine. If unsure whether something is "engine" — it is.

### LAW 2 — NO-TOUCH FILES (bit-for-bit unchanged)
- `src/styles.css` — typography/design-token lock. No edits, no `@import`. Import motion tokens
  from game entry points only.
- Navy/mint palette tokens, wallet `[data-wallet="v2"]` tokens.
- `@phonara/i18n` EXISTING keys — additive copy only (new keys OK, never edit/delete existing).
- Shared auto-bet CORE: `src/games/shared/hooks/useAutoBetQueue.ts`, `AutoBetPanel.tsx`,
  `BetModeTabs.tsx` — you CONSUME them; never edit them.
- All EXISTING `__tests__/*` files — never edit. You MAY add NEW sibling test files.
- Verify with `git diff` (working tree) at the end of every pass: these paths must be EMPTY.

### LAW 3 — NO FABRICATED DATA (legal + integrity)
- Never render fake live-win feeds, fake hot-multiplier tickers, fake "선착순/한정" scarcity,
  fake player counts, or a fake "LIVE" indicator. If a feed isn't wired to real engine/RPC data,
  leave it empty or omit it. A fake feed is a blocking defect, not polish.

### LAW 4 — OUTCOME-LEAK QUARANTINE (for any game whose full result is known at bet time but
revealed gradually — Mines, Gold Rush/Deepshaft-style dig, anything with hidden cells)
- The full layout (mine positions, dig outcomes, etc.) lives in client state during play, but it
  must NEVER reach the DOM, attributes, class names, or React-readable props/`memoizedProps` of any
  cell the player has NOT yet revealed.
- Resolve each cell to a string state ("hidden" | "revealed-gem" | "bust" | …) in a closure; pass
  ONLY the resolved string to the tile component — never the full result array.
- Untouched hidden cells stay hidden even after settle. Treat any leak as a BLOCKING bug.

### LAW 5 — PERFORMANCE BUDGET (the definition of "지존급")
- 60fps target: no frame >16.6ms in steady state on mid hardware. Verify with CDP 4× CPU throttle.
- Animate `transform` + `opacity` ONLY (GPU-composited). NEVER animate width/height/top/left/margin;
  no box-shadow/filter animation in hot loops (fade a pseudo-overlay's opacity instead).
- Input → visual feedback ≤100ms (optimistic press state; the real round still waits on the engine).
- Physics-heavy games (curves, falling balls, spinning wheels/reels) → `<canvas>` driven by ONE
  `requestAnimationFrame` loop, NOT React re-renders per frame. Pause the loop on `document.hidden`
  and cancel it + remove listeners on unmount (no orphan rAF/timers/listeners).
- Discrete games (tile flip, card flip, slider, number ramp) → CSS transforms, no rAF loop.
- Reserve canvas/grid dimensions up front → CLS = 0.
- `@media (prefers-reduced-motion: reduce)` disables decorative motion; functional reveal, final
  result, and all numbers still render.

### LAW 6 — SHARED SHELL + AUTO-SLOT (reuse, never rebuild)
- Every game's controls reuse the shared `GameControls`/`BetPanel` + `BetModeTabs`:
  amount input (`min-w-0`, `tabular-nums`) + ½/2×/Max → game option slot → primary action,
  with the shipped mobile fixes (unbroken `min-w-0` chain, `overflow-x-hidden overflow-y-auto
  min-h-0` scrollers, outer sheet `overflow-hidden w-full`). Mute toggle + ≤100ms press feedback
  already exist — wire to them.
- AUTO-BET: the shared loop (`useAutoBetQueue`) already enforces bounded stop conditions and one
  in-flight bet. For each applicable game you AUTHOR a `<Game>AutoSlot.tsx` consuming
  `AutoSlotProps<"<game>">` and WIRE IT via `autoSlot={...}` into BOTH the LIVE
  `Controls.desktop.tsx` AND `Controls.mobile.tsx` (NOT a legacy shared wrapper, NOT `autoChildren`).
  **LIMBO LESSON: a typed slot that compiles but isn't rendered on the live route is a DEAD TYPE.
  You must MEASURE the slot actually rendering in both viewports — an existence check is not enough.**
- All money/multiplier text uses `font-variant-numeric: tabular-nums` so digits don't shuffle
  width during count-up.

### LAW 7 — MONEY/AUTOBET SAFETY
- Autobet cannot start unbounded: require a finite bet count OR a loss limit; always-on hard stops
  (insufficient balance, max-session ceiling); a Stop that halts after the current round settles.
  (This lives in the shared core — don't reimplement; just fill the slot and don't break it.)
- Never compute balances client-side as truth; display what the pipeline/wallet reports.

═══════════════════════════════════════════════════════════════════════
## PART 2 — PER-PASS PROCEDURE (do this for EVERY game)
═══════════════════════════════════════════════════════════════════════

For each game, in order:

1. **PRE-FLIGHT** — list every file you will create/edit. Confirm NONE are engine / NO-TOUCH /
   shared-core. Confirm the live route path (`src/games/<game>/Controls.{desktop,mobile}.tsx`).
2. **BUILD** — controls (reuse shell) + game canvas/board + motion per PART 3 spec + author
   `<Game>AutoSlot.tsx` and wire it into both live Controls.
3. **SELF-VERIFY (paste raw output, in this order). Blocking gates marked 🔒 — if any 🔒 fails,
   STOP and report, do not continue to the next game:**
   - 🔒 (if LAW 4 applies) Outcome-leak: new sibling vitest + Playwright probe; prove the full
     result is absent from outerHTML / attributes / classList / `memoizedProps` of unrevealed cells.
     The fiber check must actively run (assert `__reactFiber$*` exists first; explicit FAIL if not —
     never silent pass). DOM checks are primary, fiber is the deep secondary gate.
   - 🔒 Auto-slot live render (if game has an auto-slot): Playwright on the live route, Auto tab,
     at 1280×1800 AND 390×844 — `casino-auto-slot-<game>` count = 1; change params; toggle
     Auto→Manual→Auto; values persist; round-trip proven. Fails if EITHER viewport misses it.
   - 🔒 NO-TOUCH: `git diff` (working tree) on `src/styles.css`, `packages/game-engine/**`,
     the three shared-core files → EMPTY.
   - 🔒 `bunx vitest run`: record baseline BEFORE editing, then after; 0 fail; baseline count
     carries; new sibling tests pass.
   - i18n: `bash scripts/i18n-parity.sh` → DIFF=0 (additive only).
   - Perf (reporting): Playwright + CDP 4× CPU throttle, 30s sample + 3s warmup discard; report
     p50/p95/p99/max DrawFrame intervals + long-tasks>50ms. Label honestly ("GPU-presented cadence,
     not 60fps certified"). For canvas games also confirm no orphan rAF on unmount.
   - Mobile 375/390/414: `scrollWidth - clientWidth = 0`; controls reachable; screenshots.
   - reduced-motion: decorative motion suppressed; reveal + result + numbers survive.
   - Funded-only items (real-balance autobet concurrency max==1, no bet-dep double-fire; real-fire
     perf): mark "inconclusive — funded env required; verified post-export in Cursor." NEVER fake a pass.
4. **DELIVER** — pre-flight list + before/after notes + §3 raw outputs + HARD-RULES confirmation
   (engine untouched, styles.css/shared-core bit-for-bit, no main/GitHub push). Then STOP for review
   before starting the next game.

═══════════════════════════════════════════════════════════════════════
## PART 3 — GAME QUEUE + PER-GAME SPEC (one pass each, in this order)
═══════════════════════════════════════════════════════════════════════

> Already done & signed off: shared shell, Auto-bet layer (Limbo slot wired), Plinko, Mines.
> Do NOT redo these unless a later change regresses them.

### 1. Crash  ⚠️ has a known perf-baseline question
- Engine fields available: `crashMultiplier` (final crash point), `cashedOut`, `cashoutMultiplier`.
  Decided at bet instant → animate the curve toward the known crash point; never compute it.
- Canvas + single rAF loop. Curve eases as it climbs (not linear); central multiplier counts up
  (tabular-nums) with visual acceleration. Crash = snap red + brief transform-shake ≤200ms + freeze.
  Cash-out = green flash + payout pop. Multiplayer side-list (if real data only) updates without
  reflowing the canvas.
- ⚠️ PRE-WORK: Crash's existing render path showed p50 ~20.5ms under 4× throttle (missed 60fps at
  median) in an earlier baseline. BEFORE adding polish, trace the existing curve-draw path and
  report whether that's (a) just the 4× sandbox throttle or (b) a real inefficiency (e.g. redraw of
  the whole curve every frame, unbounded point accumulation). If (b), fix the render path (still
  presentation-only, no engine) before layering polish — don't polish on a leaking floor.
- AutoSlot: `autoCashout` (target multiplier). Wire both viewports.

### 2. Dice
- Engine fields: `roll` (0.00–99.99), `won`. One float, decided at bet instant.
- Minimal: horizontal slider (0–100); win-chance + payout update live during drag (1:1, no lag).
  Roll = result number springs in above slider; bar fills green/red. CSS transforms, no canvas.
- AutoSlot: `target` + `direction` ("over"/"under"). Wire both viewports.

### 3. Limbo  (auto-slot already wired — UI/motion polish only)
- Engine fields: `resultMultiplier`, `won`. Decided at bet instant.
- Giant central multiplier ramps fast then settles; ≥target green burst, <target dim. Sub-2s rounds
  → snappy, instantly re-triggerable, NO animation lockout blocking rapid replay. CSS transforms.
- AutoSlot exists (`target`) — verify it still renders on the live route in both viewports (LAW 6).

### 4. HiLo
- Engine fields: `cards` (full sequence array), `rounds[]`, `won`. ALL card values known at bet
  instant → you have the whole sequence; animate reveals toward it.
- Card flip (rotateY); cumulative multiplier ticks up per correct call; higher/lower buttons show
  live probability; card stack slides as it grows. CSS transforms.
- ⚠️ OUTCOME-LEAK-ADJACENT: `cards[]` contains upcoming cards. Do NOT reveal the next card's value
  before the player commits the higher/lower guess for the current step. Quarantine upcoming cards
  like LAW 4. Auto-slot: HiLo auto is awkward (per-step human calls) — if you add one, the guesses
  policy must be in the slot; if not applicable, mark auto-slot "not-applicable" and skip (don't
  ship a dead type).

### 5. Roulette
- Engine fields: `winningNumber` (0–36), `totalMultiplier`. Per-leg win breakdown is NOT exposed.
- Wheel + betting board. Wheel eases to a decided stop; ball settles into the result pocket.
  Canvas (or CSS) for the wheel spin toward `winningNumber`.
- ⚠️ CONTRACT LIMIT: because per-leg breakdown isn't exposed, you CANNOT reliably highlight exactly
  which individual bets won. Show the winning number + total result; do NOT fake per-bet
  win/loss highlighting you can't derive. If per-leg highlighting is wanted, mark it "needs engine
  contract exposure (Cursor follow-up)" — do NOT invent it. Auto-slot: roulette bet combos are
  complex; if not cleanly expressible, mark auto-slot "not-applicable" rather than shipping a dead type.

### 6. Mint Reels  ⚠️ engine contract gap — read carefully
- Engine field exposed: `totalMultiplier` ONLY. The reel STOP POSITIONS (`stops`) and symbol grid
  (`window`) are computed internally but NOT exposed in the result contract.
- ⚠️ THIS BLOCKS REAL SLOT MOTION. You cannot animate reels stopping on the correct symbols using
  only `totalMultiplier` — and you must NOT fake stop positions (that's LAW 1 + LAW 3: a reel that
  lands on symbols unrelated to the real result is fabricated outcome animation).
- ACTION: build everything you CAN honestly (layout, spin-up animation, mint theme, win celebration
  keyed off `totalMultiplier`, the AutoSlot, mobile/perf/reduced-motion), but for the final reel
  STOP, do NOT invent symbol positions. Implement a clean "result reveal" that's honest about what
  the contract gives (e.g. reels resolve to a state consistent with `totalMultiplier`, or a
  simplified reveal) and clearly FLAG in your delivery: "true per-reel stop animation requires the
  engine to expose `stops`/`window` — Cursor follow-up." STOP and flag rather than fabricate.
- AutoSlot: `lines`. Wire both viewports.

### 7. Gold Rush  ⚠️ same contract gap as Mint Reels
- Engine reality: Gold Rush is a 5-REEL SLOT (same `spinSlot` engine as Mint Reels, different
  paytable) — NOT a dig/cave-in game. Exposed field: `totalMultiplier` only; `stops`/`window` NOT
  exposed. Same blocker and same ACTION as Mint Reels (#6): build the honest layer, do NOT fabricate
  reel stops, FLAG the contract gap for Cursor. AutoSlot: `lines`. Wire both viewports.

### 8. Blackjack  ⚠️ engine contract gap
- Engine field exposed: `totalMultiplier` ONLY. Dealt cards / player & dealer hands / action trace
  are computed internally but NOT exposed.
- ⚠️ You cannot animate a real card deal without the cards. Do NOT fabricate cards (LAW 1/3).
  Build the table layout, bet UI, Hit/Stand/Double/Split controls, chip animation, and a result
  display keyed off `totalMultiplier`; for the actual dealt-card animation, FLAG: "requires engine
  to expose dealt hands — Cursor follow-up." STOP and flag rather than invent hands.
- Blackjack/Roulette use their own table-render tree (not the minimal shell). Auto-slot: typically
  not applicable — mark as such rather than shipping a dead type.



### 9. Deepshaft  ⚠️ LAW 4 FULL
- Engine: `levels[]` (depth · outcome gold|cavein · levelMultiplier) · `reachedDepth` · `caveIn` · `totalMultiplier` · `won`.
- Selection: `riskTier` · `targetDepth`. Dig/reveal replay toward known `levels[]`.
- **Quarantine:** unrevealed depth cells — LAW 4 vitest + Playwright 🔒.
- AutoSlot: `riskTier` + `targetDepth`. Both viewports.

### 10. Momentum
- Engine: `roll` · `won` · `comboBefore` · `comboAfter` · `comboMultiplier` · `cashedOut` · `totalMultiplier`.
- Selection: `comboBefore` · `cashOut`. Streak/combo ramp toward decided `roll`.
- CSS discrete or light canvas — LAW 5 perf budget.
- AutoSlot: combo policy if applicable.

> **LAW 4 정정:** Gold Rush는 5-reel slot (dig 아님). Deepshaft만 dig LAW 4 FULL.

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | 초판 — L1-GP 큐 정본 · 12종 · G#1 Crash FINAL LOCK |

═══════════════════════════════════════════════════════════════════════
## PART 4 — CONTRACT-GAP SUMMARY (games that CANNOT be fully animated yet)
═══════════════════════════════════════════════════════════════════════
These need the engine to EXPOSE already-computed internals (a Cursor task, NOT yours, NOT now):
- Mint Reels / Gold Rush: need `stops` + `window` (reel positions + symbol grid).
- Blackjack: needs dealt hands / cards.
- Roulette: needs per-leg win breakdown (for per-bet highlighting only; wheel works without it).
For all four: build the honest, contract-respecting layer now; FLAG the gap clearly in delivery;
NEVER fabricate the missing data to make the animation look complete. A beautiful fake is a LAW 1
+ LAW 3 violation and a worse outcome than an honest partial.

═══════════════════════════════════════════════════════════════════════
## PART 5 — STOP-AND-REPORT CONDITIONS (when to halt instead of pushing on)
═══════════════════════════════════════════════════════════════════════
STOP and report (do not work around) if ANY of these occur:
- A 🔒 blocking gate fails (outcome-leak, auto-slot live render, NO-TOUCH diff non-empty, vitest fail).
- Making the UI work seems to need an engine / RPC / contract change.
- You would have to fabricate any result data to complete an animation (contract-gap games).
- `git diff` shows any NO-TOUCH file changed.
- You're unsure whether something is engine vs presentation — assume engine, stop, ask.
Honest partial + clear flag always beats a fabricated or rule-breaking "complete."

REMEMBER: no `main` write, no GitHub push, no PR, no merge — working branch only; full codebase
exports to Cursor at the end.
