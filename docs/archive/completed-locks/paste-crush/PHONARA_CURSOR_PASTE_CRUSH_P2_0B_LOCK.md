# P2.0b · Shared AutoBet Reset Toggles · LOCK v1.1 (정본) · **EXECUTE GO**

> **선행:** **P2.0 GREEN** (crash Stage/Controls frozen)  
> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK.md)  
> **갱신:** 2026-06-16 · Lovable paste용 풀 스펙  
> **엔진:** NO-TOUCH · money path 0 · display/UI queue only

---

## §0. Scope — file allowlist

**EDIT 허용 (이 밖 = FAIL):**

```
src/games/shared/hooks/useAutoBetQueue.ts
src/games/shared/AutoBetPanel.tsx
src/games/shared/hooks/useAutoBetQueue.test.ts   (+4 scenarios)
src/games/crash/Controls.test.tsx                (smoke only — toggle render)
src/games/dice/Controls.test.tsx                 (smoke only)
src/games/limbo/Controls.test.tsx                (smoke only)
src/games/hilo/Controls.test.tsx               (smoke only)
src/i18n/ko.ts                                   (§5 keys only)
src/i18n/en.ts                                   (§5 keys only)
```

**#P2.0b-FROZEN — P2.0 crash files 0 EDIT:**

```
src/games/crash/Stage.tsx
src/games/crash/Controls.shared.tsx
src/games/crash/CrashRoundContext.tsx
src/games/crash/useCrashLiveMultiplier.ts
src/games/crash/index.tsx
```

**FAIL =** any diff on §0 밖 파일 · any diff on #P2.0b-FROZEN · engine/supabase/RPC 0-touch.

---

## §1. Purpose (1줄)

Expose explicit **Reset vs Increase-by-%** toggles for on-win / on-loss stake adjustment in shared `useAutoBetQueue` + `AutoBetPanel`. **Additive only** — existing AutoBet callers unchanged at defaults.

---

## §2. CHECK — Martingale UI (RG)

**(a) intentional** — Reset / Increase-by-% visible in **shared** `AutoBetPanel` for **all games** (crash · dice · limbo · hilo).  
Defaults: `onWinReset=true` · `onLossReset=true` (Reset = safe). Increase-by-% requires user opt-in per outcome row.

No per-game gate (b rejected).

---

## §3. `useAutoBetQueue` — additive API

### New options (defaults preserve today)

```ts
export type AutoBetQueueOptions = {
  // ...existing fields unchanged...
  onWinMultiplier?: number;   // existing — e.g. 1.5 = +50%
  onLossMultiplier?: number;  // existing — e.g. 2 = +100%
  /** NEW — default true */
  onWinReset?: boolean;
  /** NEW — default true */
  onLossReset?: boolean;
};
```

### Stake adjustment after each settled round (UI queue only — no RPC)

After `onFire` completes and outcome is known:

```ts
if (won) {
  if (options.onWinReset !== false) {
    stakeRef.current = baseStake;
  } else if (options.onWinMultiplier != null && options.onWinMultiplier !== 1) {
    stakeRef.current = applyPercentIncrease(stakeRef.current, options.onWinMultiplier);
  }
} else {
  if (options.onLossReset !== false) {
    stakeRef.current = baseStake;
  } else if (options.onLossMultiplier != null && options.onLossMultiplier !== 1) {
    stakeRef.current = applyPercentIncrease(stakeRef.current, options.onLossMultiplier);
  }
}
```

- `onWinReset === true` (default) → **ignore** `onWinMultiplier` for that win.
- `onLossReset === true` (default) → **ignore** `onLossMultiplier` for that loss.
- `=== 1` on multiplier → treat as no-op increase (existing parity).
- **NO** floating `number` for money — stake stays `string` / Decimal path used by existing hook; adjustment uses existing stake math helpers only.

**FAIL =** default `onWinReset`/`onLossReset` false · existing caller behavior changes without opt-in · new RPC/money path.

---

## §4. `AutoBetPanel.tsx` — UI

Per outcome row (on-win · on-loss), add **segmented control**:

| Mode | Effect |
|------|--------|
| **Reset** | sets `onWinReset=true` / `onLossReset=true` · hides or disables % input |
| **Increase by %** | sets `onWinReset=false` / `onLossReset=false` · shows % / multiplier input (wire to existing `onWinMultiplier` / `onLossMultiplier`) |

- Use existing panel layout / skin tokens — no framer-motion.
- Labels via i18n §5 only — **no Korean in TSX**.
- `data-testid` (additive):
  - `autobet-on-win-mode-reset` · `autobet-on-win-mode-increase`
  - `autobet-on-loss-mode-reset` · `autobet-on-loss-mode-increase`
- Crash/dice/limbo/hilo all use same shared panel — no per-game fork.

**FAIL =** crash-only panel fork · hardcoded copy · removed existing AutoBet testids.

---

## §5. i18n (additive · ko + en)

| Key | ko (예) | en (예) |
|-----|---------|---------|
| `casino.auto.resetOnWin` | 승리 시 | On win |
| `casino.auto.resetOnLoss` | 패배 시 | On loss |
| `casino.auto.modeReset` | 초기화 | Reset |
| `casino.auto.modeIncrease` | % 증가 | Increase by % |
| `casino.auto.increasePercent` | 증가율 (%) | Increase (%) |

`scripts/i18n-parity.sh` PASS · no key deletion/rename.

---

## §6. Vitest — +4 scenarios (`useAutoBetQueue.test.ts`)

Record **Step 0 baseline** count; after +4: **baseline + 4** PASS.

| # | Scenario | Setup | Assert |
|---|----------|-------|--------|
| 1 | win / reset | `onWinReset: true` (default), base `100`, win | next stake = `100` (base) |
| 2 | win / ×1.5 | `onWinReset: false`, `onWinMultiplier: 1.5`, base `100`, win | next stake = `150` (existing math) |
| 3 | loss / reset | `onLossReset: true`, base `100`, loss | next stake = `100` |
| 4 | loss / ×2 | `onLossReset: false`, `onLossMultiplier: 2`, base `100`, loss | next stake = `200` |

Use existing test harness / mock `onFire` — **no Supabase**.

---

## §7. 4-game Controls smoke (render only)

Each `src/games/{crash,dice,limbo,hilo}/Controls.test.tsx` (create if missing):

- Render controls with AutoBet tab open.
- Assert 4 testids exist: `autobet-on-win-mode-reset`, `autobet-on-win-mode-increase`, `autobet-on-loss-mode-reset`, `autobet-on-loss-mode-increase`.
- **No** bet/settle/RPC in smoke.

---

## §8. EXECUTE Step 0 → 5

| Step | Action |
|------|--------|
| 0 | `bun run test` → record PASS count baseline (post-P2.0) |
| 1 | `useAutoBetQueue.ts` — add `onWinReset` / `onLossReset` + adjustment branch |
| 2 | `AutoBetPanel.tsx` — segmented UI + testids |
| 3 | i18n ko/en §5 keys |
| 4 | `useAutoBetQueue.test.ts` +4 · 4-game smoke |
| 5 | §GREEN |

---

## §9. §GREEN self-check (full block)

```bash
bun run test 2>&1 | tail -5
scripts/red-grep.sh
scripts/i18n-parity.sh
rg "[가-힣]" src/games/shared/AutoBetPanel.tsx src/games/shared/hooks/useAutoBetQueue.ts --glob '!**/i18n/*' && exit 1 || true
rg "framer-motion" src/games/shared/AutoBetPanel.tsx && exit 1 || true
# #P2.0b-FROZEN — crash P2.0 files 0 touch
git diff --name-only | rg "src/games/crash/(Stage|Controls\.shared|CrashRoundContext|useCrashLiveMultiplier|index)\.tsx" && exit 1 || true
# vitest: baseline + 4 new useAutoBetQueue scenarios PASS
```

**Fallback (no git):** FAIL if any EDIT to #P2.0b-FROZEN paths in this slice.

---

## §10. GREEN Gates

1. vitest ≥ Step 0 baseline **+ 4**
2. red-grep 0 · i18n-parity PASS
3. #P2.0b-FROZEN 0 diff
4. §0 allowlist only
5. Defaults `onWinReset`/`onLossReset` = `true` — existing tests green
6. 4-game smoke PASS
7. P1.10 `onAutoFire` stale guard **unchanged** in Controls.shared (frozen — no edit)

---

## §11. FAIL (summary)

- P2.0 crash file EDIT · allowlist violation · engine/RPC touch
- Default behavior regression · deleted AutoBet testids
- Korean in TSX · framer-motion
- vitest < baseline + 4

---

## §12. 마감 보고

```text
§GREEN P2.0b
- files: useAutoBetQueue.ts · AutoBetPanel.tsx · useAutoBetQueue.test.ts (+4) · 4× Controls.test smoke · i18n ko/en
- #P2.0b-FROZEN: PASS (crash 0 diff)
- vitest: <baseline> → <baseline+4> PASS
- RG: Reset default · Increase opt-in all games
P2.0b GREEN
```

---

*P2.0b LOCK v1.1 · EXECUTE GO · paste to Lovable*
