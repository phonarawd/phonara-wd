# LOVABLE Games Polish · G#9 Deepshaft — LOCK v0.3 (greenfield + amend + poster)

> **상태:** **FULL APPROVE · EXECUTE GO** · 2026-06-18  
> **큐:** L1-GP Game #9 · LAW 4 FULL · greenfield · engine-vs-mock · **poster wired**  
> **선행:** G#1–G#8 §GREEN · vitest **625/625** · i18n **2647 DIFF=0**  
> **amend v0.2→v0.3:** timer teardown · poster imagegen + meta/og/route · wc6 grid card

---

## Scope (1줄)

Deepshaft greenfield + polish — copper/stone vertical shaft · LAW 4 FULL · engine-vs-mock honest branch · DeepshaftAutoSlot 1280+390 · **Lovable AI poster + casino grid wiring**.

---

## Amend summary

| v0.3 add | Spec |
|----------|------|
| Timer cleanup | `useEffect` return clears all setTimeout on unmount + selection/bet dep change |
| types.ts union | greenfield permitted · `packages/game-engine/**` untouched |
| Route | `casino.deepshaft.tsx` reachability · `routeTree.gen.ts` never hand-edit |
| Poster | imagegen standard 1024 · `src/assets/casino/deepshaft.jpg` · meta + `public/og/casino-deepshaft.jpg` |

---

## Identity (anti-clone)

Copper + stone vertical shaft · ladder spine · depth 1..15 · gold on revealed floors only · cave-in dust-collapse. Not mint/gold slot/emerald felt/horizontal Mines.

---

## Engine-vs-mock branch

```ts
const engineLevels = bet?.result?.levels;
const replayLevels = engineLevels ?? mockLevels(selection, commitment?.server_seed_hash);
const { totalMultiplier, won, caveIn } = bet?.result ?? {};
// replayLevels = visual only · settle = engine fields ONLY
```

`mockLevels.ts`: `// MOCK · replaced by engine.evaluateDeepshaft — decorative, never engine truth`

---

## LAW 4 FULL

- ShaftCell: `"hidden" | "revealed-gold" | "revealed-cavein"` only
- Hidden: stone only — no gold/cavein leak
- Reveal: setTimeout 60ms/cell cap 900ms · transform/opacity/filter
- Cleanup: no orphan timers on unmount/dep change
- RM: jump to final revealIndex · no timers
- bet=null: no replayLevels · zero leak

---

## NO-TOUCH

`src/styles.css` · `packages/game-engine/**` · shared auto-bet 3 ·  
`src/games/{crash,dice,limbo,hilo,roulette,mint-reels,gold-rush,blackjack,mines,plinko}/**` ·  
`routeTree.gen.ts` auto-gen only

---

## Poster (Lovable AI)

- Tool: imagegen standard 1024×1024 · no transparent bg
- Prompt: vertical copper-stone shaft · ladder center · amber glow one floor · dust below · dark stone · no text/logos · not horizontal mines · not slot reels
- Save: `src/assets/casino/deepshaft.jpg`
- Wire: `casino-game-meta.ts` deepshaft entry + ES import poster
- og: `public/og/casino-deepshaft.jpg` · route head() mirrors gold-rush

---

## D1–D10

D1 copper rim shaft · D2 stone hidden cells · D3 stagger ≤900ms + timer cleanup · D4 gold mult · D5 settle engine-only · D6 PERF · D7 RM · D8 quarantine · D9 risk+depth · D10 AutoSlot 1280+390

---

## Outcome-leak (5 → 630/630)

1. bet=null → 0 gold/cavein
2. settled revealIndex=0 → deeper quarantined
3. selection-building → 0 leak
4. RM partial → opacity 1
5. mock bet=null + commitment → hidden neutral · no settle banner

---

## EXECUTE 0→8

2. scaffold + D1–D10 + poster + meta/route/og parallel
3. 630/630 · 4. WC 6 incl. wc6_casino_grid_card · 6. DELIVER timer+poster 1-liners · 7. §GREEN STOP

---

## §GREEN template

```text
Deepshaft Polish G#9 §GREEN — vitest 630/630 carry · LAW 4 FULL PASS · engine-vs-mock honest · timer teardown · G9-D1 D1–D10 PASS · §3.1 AutoSlot 1280+390 · poster generated + wired · perf OK · mobile 0/0/0 · WC shots 6 · §3.7 G#5-C scope-out · §3.10 defer · G#10 defer · ZIP defer.
```

---

## FAIL

LAW 4 leak · settle from levels/mock · levels[] on hidden tile · timer leak · AutoSlot dead · rAF/getComputedStyle · NO-TOUCH non-empty · vitest red · i18n DIFF≠0 · reveal >900ms · mines horizontal clone · poster generic (purple gradient · coin shower · horizontal grid)

---

## Cursor review log

| 일자 | 판정 | 비고 |
|------|------|------|
| 2026-06-18 | LOCK v0.2 APPROVE | greenfield 630 |
| 2026-06-18 | **LOCK v0.3 FULL APPROVE** | poster + timer teardown · wc6 |
| 2026-06-18 | **§GREEN APPROVE** | vitest 630/630 · LAW 4 5/5 · engine-vs-mock · timer teardown · AutoSlot 1280+390 · poster/grid wired · NO-TOUCH empty · WC6/§3 raw carry-defer |
