# LOVABLE World Crush · Games QA Sweep LOCK — L1-16i v0.1 EXECUTE

> **상태:** **✅ §GREEN APPROVE** · 2026-06-17 · vitest **572/572** · auto 10/10 · crash timer parity · e2e specs **10/10** · Playwright runtime **CI defer**  
> **큐 ID:** **L1-16i** (vitest auto-bet · crash timer · result parity · e2e 4 games)  
> **의존:** L1-16h ✅ · vitest **544/548 carry** (4× mint-reels/gold-rush auto.wiring) · catalog **2595+**  
> **상위:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md)

---

## Scope (1줄)

**Test-only sweep** — fix **4 failing** auto.wiring vitests · extend auto-bet coverage to **10/10 games** · crash **timer + countdown** parity · **result vs UI** parity per game · **Playwright e2e** for 4 missing games + crash result block · **production game code 0-touch**.

---

## Goals

| # | Goal | FAIL |
|---|------|------|
| G1 | Fix 4 pre-existing vitest fails (mint-reels + gold-rush auto wiring) | still red |
| G2 | Auto-bet wiring tests on **all 10** games (8 new) | game without test |
| G3 | Crash timer display === engine `crashAt` at bust frame | overshoot shown |
| G4 | HUD/Stage === settled `bet.multiplier` / `bet.payout` per game | drift |
| G5 | e2e for blackjack · gold-rush · mint-reels · roulette | spec missing |

---

## Root cause (locked)

`useAutoBetQueue` fires `onFire` at **320ms**. mint-reels/gold-rush tests use `waitFor` default **1000ms** → jsdom flake/consistently fail.

**Fix:** `waitFor(..., { timeout: 3000 })` in failing tests + same shape for new tests. **Crash only:** `waitFor` **7000ms** OR test wrapper `autoFireDelayMs: 100` (no production knob).

**NO-TOUCH:** `useAutoBetQueue.ts` · `useCrashLiveMultiplier.ts` production bodies.

---

## Files (test + e2e only)

### A. Auto-bet wiring vitest

| ID | Path | Action |
|----|------|--------|
| H16i-A1 | `src/games/mint-reels/__tests__/auto.wiring.test.tsx` | **EDIT** — `waitFor` → 3000ms |
| H16i-A2 | `src/games/gold-rush/__tests__/auto.wiring.test.tsx` | **EDIT** — same |
| H16i-A3 | `src/games/{crash,dice,mines,plinko,limbo,hilo,blackjack,roulette}/__tests__/auto.wiring.test.tsx` | **NEW** ×8 |

**Contract (each new test):**

1. Auto tab + **commitment present** → `onSubmitBet` 1× · `onPrepareRound` 0× (within 3s)
2. Auto tab + **no commitment** → `onPrepareRound` 1× · `onSubmitBet` 0×
3. Selection preset → canonical single-key payload (where applicable)

Use `ControlsShared` · mock `ImportedGameSurfaceProps` · `RGGateProvider` (allow). Crash: stub shorter fire delay in test wrapper only.

### B. Crash timer parity

| ID | Path | Action |
|----|------|--------|
| H16i-B1 | `src/games/crash/__tests__/timer.parity.test.tsx` | **NEW** |
| H16i-B2 | `src/games/crash/__tests__/autoCountdown.test.tsx` | **NEW** |

**timer.parity:** `crashAt=2.0` · `auto=1.5` · `vi.advanceTimersByTime(100)` steps · at first frame `m(t)>=crashAt` display **exactly** `crashAt` (invariant `useCrashLiveMultiplier.ts:41`) · `replayMultAt(t)` vs `Math.exp(0.85*t)`.

**autoCountdown:** `<CrashAutoCountdown seconds={4.7} />` shows `4.7` · reduced-motion → `games.crash.autoBet.nextSoon`.

### C. Result vs UI parity (10 games)

| ID | Path | Action |
|----|------|--------|
| H16i-C1 | `src/games/{each}/__tests__/result.parity.test.tsx` | **NEW** ×10 (~25 LOC each) |

Mount HUD (or recent-bets cell) with fixture `multiplier: "2.50"`, `payout: "25.00"` · assert exact strings · use `derive-ui-bet` helpers · **no engine math duplicate**.

### D. Playwright e2e (mirror crash.spec.ts)

| ID | Path | Action |
|----|------|--------|
| H16i-D1 | `tests/e2e/games/blackjack.spec.ts` | **NEW** |
| H16i-D2 | `tests/e2e/games/gold-rush.spec.ts` | **NEW** |
| H16i-D3 | `tests/e2e/games/mint-reels.spec.ts` | **NEW** |
| H16i-D4 | `tests/e2e/games/roulette.spec.ts` | **NEW** |

Each: testid first paint · PF Sheet · prepare→place→bet-confirm · mobile thumb-zone CTA.

### E. Crash result parity e2e

| ID | Path | Action |
|----|------|--------|
| H16i-E1 | `tests/e2e/games/crash.spec.ts` | **EDIT** — append `describe("crash · result parity")` |

Mock pipeline bet → compare `[data-testid="casino-bet-history"]` first row vs Stage final multiplier · **string equality**.

**NO-TOUCH:** `useMockPipeline.ts` production logic.

---

## LOCK Footer H16i-F1 ~ F8

| # | 고정 | FAIL |
|---|------|------|
| F1 | `bunx vitest run` → **548/548** (or N/N post-new baseline) | any red unrelated carry |
| F2 | **10/10** games have `auto.wiring.test.tsx` | missing game |
| F3 | Crash timer parity test hits line-41 invariant | display overshoot |
| F4 | **10/10** `result.parity.test.tsx` | missing |
| F5 | Playwright 6 specs green desktop + iphone-14-pro thumb | e2e red |
| F6 | **git diff** — only `__tests__/` + `tests/e2e/` | production `.ts` outside tests |
| F7 | i18n **DIFF=0** · no new keys | key append |
| F8 | routes · MobileGameFrame · Home · admin · trade **0-touch** | scope creep |

---

## EXECUTE Steps 0→7

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline 544/548 |
| 1 | H16i-A1/A2 fix timeouts |
| 2 | H16i-A3 eight new auto.wiring tests |
| 3 | H16i-B1/B2 crash timer + countdown |
| 4 | H16i-C1 ten result.parity tests |
| 5 | H16i-D1–D4 e2e specs |
| 6 | H16i-E1 crash e2e result block |
| 7 | full vitest + playwright · §GREEN |

---

## §GREEN full block

```bash
bunx vitest run
bunx playwright test --project=desktop-chromium tests/e2e/games/
bunx playwright test --project=iphone-14-pro tests/e2e/games/ --grep "thumb"

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print('DIFF',len(ko^en))"

git diff --stat
git diff --name-only | rg -v '__tests__|tests/e2e|\.md$' || true
```

**PASS:** vitest **548/548** (or documented N/N after +~30 specs) · playwright games **6/6** green · DIFF=**0** · diff stat **tests only**.

**§GREEN template:**

```text
L1-16i §GREEN — vitest N/N · auto 10/10 · crash timer parity · result parity 10/10 · e2e 6 specs green · production diff 0 · DIFF=0 · L1-18 next · ZIP defer.
```

---

## Risks (locked mitigations)

| Risk | Mitigation |
|------|------------|
| Crash 5s auto-fire vs timeout | test wrapper `autoFireDelayMs: 100` or `waitFor` 7s · **no prod knob** |
| Playwright preview server | existing `PLAYWRIGHT_BASE_URL` / playwright.config |
| rAF flake | reuse `src/games/shared/hooks/__tests__/` stub pattern |

---

## NO-TOUCH

`src/games/*/play*.ts` · Stage/HUD **production render math** · routes · **i18n keys** (reuse `games.crash.autoBet.*`) · MobileGameFrame · HomeSideNav · admin · trade · sports · wallet · BottomNav · `useAutoBetQueue.ts` · `useCrashLiveMultiplier.ts` · ZIP

---

## Defer

- L1-18 FOMO — after L1-16i §GREEN (or after L1-17 per queue)
- operator **`16i HEAD`** → before L1-17

---

## PHONARA paste note

After L2 paste, re-run same vitest/e2e gates in `apps/web` — test paths may map to `packages/game-engine` or preserved Lovable game tree per paste adapter.

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO — Games QA sweep test-only |

---

*Default queue: after L1-17 §GREEN · Lovable canvas · production 0-touch*
