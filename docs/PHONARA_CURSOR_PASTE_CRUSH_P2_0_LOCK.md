# P2.0 · Crash Production Rewrite (in-place) · LOCK v1.1 FINAL (정본) · **APPROVED · EXECUTE GO**

> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) · [`LOVABLE_ZENITH_CRUSH_HANDOFF.md`](LOVABLE_ZENITH_CRUSH_HANDOFF.md)  
> **선행:** P1.8 GREEN (단일 Stage · mobile-crush skin) · P1.10 GREEN (AutoBet stale guard)  
> **후행:** [`PHONARA_CURSOR_PASTE_CRUSH_P2_0B_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P2_0B_LOCK.md) — shared AutoBet additive  
> **갱신:** 2026-06-16 · v1.1 FINAL · Step 0 reconfirm · E2E-A `data-cta-mode`  
> **주의:** `PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md` = Trade 12-O — **본 문서와 별개**

---

## Scope (1줄)

`/casino/crash` — **crash-only** in-place rewrite: **Stage.tsx** · **Controls.shared.tsx** · **CrashRoundContext** · **useCrashLiveMultiplier** · **index.tsx** (mobile layout) · **BetPanel** (`primarySize="xl"` opt-in only). 60fps canvas · 기하 정합 · morphing CTA · 한손 모바일. **auto-cashout-only** (원샷 엔진). 수동 캐시아웃 = **§STOP · 별도 엔진 웨이브**.

**P2.0 범위 밖 → P2.0b:** `useAutoBetQueue` · `AutoBetPanel` **source EDIT**. **FAIL = P2.0 EDITs `useAutoBetQueue.ts` or `AutoBetPanel.tsx`.** (crash가 import하는 것은 OK.)

---

## Out of scope (explicit)

- 새 라우트 0 · `getCrashPoint` mock 0 · mock RNG 0
- `crashAt` = `p.bet.result.crashMultiplier` (**server-owned**)
- **Client `m(t)` never determines payout.** Settlement multiplier is server-owned. Displayed `{liveM}×` is advisory and **MAY** differ from settled value.
- `casino-bet-confirm*` testid 제거 0 · 엔진/pipeline/i18n key 삭제 0
- 다른 게임 Stage/Controls 편집 0
- **수동 라운드 중 캐시아웃 RPC 구현 0** (§Engine Wave)
- **P2.0:** shared `useAutoBetQueue` / `AutoBetPanel` 편집 0 → **P2.0b**

---

## §STOP · 수동 캐시아웃 = 별도 엔진 웨이브

**Manual mid-round cashout is a SEPARATE engine wave, not part of P2.0.** It requires:

1. Server-authoritative cashout RPC — settles on **server-received timestamp** (never client time)
2. Atomic resolution against `crashMultiplier` — latency-arbitrage / settle-after-crash 방지
3. **RED-first** money tests (conservation Σ=0 · idempotency · negative paths)

**Until that wave ships:** Crash runs **auto-cashout-only** (`rpc_place_game_bet` + `selection.autoCashout` 원샷). `casino-cashout` stays **disabled**. 버튼 미동작 = **버그 아님 · 의도된 상태**.

### 원샷 모델 · 보안 (§STOP 근거 — REVISE #2)

`rpc_place_game_bet` 완료 시 **`bet.result`(含 `crashMultiplier`)가 클라에 이미 도착**한다. 곡선은 **이미 알려진 `crashAt`을 향한 REPLAY/ANIMATION**일 뿐, 라이브 라운드가 아니다.

- auto-cashout-only: 결과 서버 확정 · 클라는 연출만 → **무해**
- **수동 캐시아웃을 클라에서 평가하면 안 되는 이유:** 클라가 **crash 시점(미래)을 이미 알고** 있음 → crash 직전 cashout = **완벽한 부정 경로** (latency arbitrage보다 근본적)
- 따라서 §STOP의 server-received-timestamp RPC는 **선택이 아니라 필수** — live round 모델 전환 없이 클라 `onCashout` 평가 **절대 금지**

### Build-mode gate

- 정산 경로: `rpc_place_game_bet` 1회 · `selection.autoCashout` · `cashoutMultiplier` 서버 반환
- **라운드 중 `onCashout` RPC 없음**
- P2.0: morph CTA **UI slot** · `typeof onCashout === 'function'` 일 때만 enable

### 제품 설계 메모 (operator)

| 모델 | 손맛 | PHONARA 현재 |
|------|------|--------------|
| Stake/Rollbit live crash | 「지금 뺄까 / 더 갈까」수동 캐시아웃 | **미구현** |
| auto-cashout only | 목표 배율 + 상승 연출(replay) | **현행** |

---

## LOCK Footer

| # | 내용 |
|---|------|
| #P2.0-EB-1 | `{liveM}×`·canvas hero = **advisory**; payout = `result.cashoutMultiplier` only |
| #P2.0-EB-2 | `crashAt` = `bet.result.crashMultiplier`; `GROWTH_RATE` = visual only |
| #P2.0-EB-3 | JSX 한글 0 — CTA 전부 i18n |
| #P2.0-EB-4 | `readDisplayM()` 단일 구현 (`CrashRoundContext`) |
| #P2.0-EB-5 | 수동 cashout 없으면 `casino-cashout` disabled — §STOP 우회 금지 |
| #P2.0-EB-6 | `useReducedMotionGuard` → curve **+** flash/tween 동시 suppress |
| #P2.0-EB-7 | Blocker 2 verbatim = **auto-cashout @ bet submit only**; mid-round CASHOUT/Space **NOT** grandfathered |
| #P2.0-EB-8 | `running` = replay toward known `crashAt` — round clock/WS/client cashout eval **금지** |
| #P2.0-UX-1 | `onCashout` absent + running → CTA `casino.crash.autoAt` `{autoCashout}` (not `cashoutAt`+liveM) |

**FAIL =** BLOCKER/EB hit · payout from `m(t)` · client cashout from known `crashAt` · round clock invented · WS wait for crashAt · manual cashout without server path · Korean in TSX · testid removed · framer-motion · per-frame React `setState` on multiplier · §STOP 우회 · P2.0에서 shared AutoBet 편집

---

## BLOCKER 1 — CASHOUT SETTLEMENT AUTHORITY (money gate)

- CASHOUT 버튼 · canvas hero = **ADVISORY** — payout 결정 **금지**
- Manual cashout: `onCashout()` = **intent only**; 권위 = 서버 `cashoutMultiplier`
- Result 도착: **SETTLED** multiplier (green flash / history) — tapped `m(t)` 아님
- settled ≠ displayed → **settled wins**

---

## BLOCKER 2 — RED-FIRST / GRANDFATHERING

다음 문구 plan에 **verbatim** 포함:

> Morphing CASHOUT and Space-cashout are new triggers onto the existing server-owned cashout settlement path. No settlement logic is added or changed, so no new RED-first money test is required — same grandfathering basis as Wave 4/7. The new code is trigger + display only.

**#P2.0-EB-7 (필수 · verbatim 직후):**

> The above grandfathering applies **ONLY** to auto-cashout via `rpc_place_game_bet`. Mid-round manual CASHOUT and Space-cashout are **NOT** covered — §STOP in P2.0; RED-first required in the engine wave. (In P2.0 itself, mid-round CASHOUT/Space ship as a **disabled UI slot only** — verbatim above is forward-reference for the engine wave.)

| 경로 | PHONARA | P2.0 |
|------|---------|------|
| auto-cashout @ bet submit | **EXISTS** | grandfathered · display only (P2.0 adds no new money trigger) |
| mid-round manual `onCashout` | **NOT EXISTS** | **§STOP** · disabled · engine wave |

build-mode money path **신규 생성** 필요 → **중단 · §STOP · RED-first 선행**.

---

## BLOCKER 3 — CASHOUT TESTID

- `data-testid="casino-cashout"` (**additive**)
- Space → **동일 selector**
- **E2E-A** (`onCashout` absent): attached · disabled · **`data-cta-mode="auto"`** (번역 문자열 매칭 금지) · click/Space → **0** requests
- **E2E-B** (`onCashout` present): enabled → **1** request · UI = `result.cashoutMultiplier`

---

## CLARIFY — single source = shared formula

- `readDisplayM()` — Stage 60fps · button 8/s **공식 공유**
- lag ≤125ms — **EXPECTED · HARMLESS** (Blocker 1)
- **Zero-drift** = **한 canvas 프레임** hero ↔ tip
- marker · curve **동일 `scaleM`** — 기하 교차 = 선택 배율

---

## CHECK — Flash + reduced-motion

`useReducedMotionGuard` → curve + 200ms flash + payout tween 모두 suppress. autobet 연속 시 flash stack 0.

---

## 1) Stage.tsx — canvas single-source m(t)

**Architecture**

- `GROWTH_RATE = 0.06` exported · `m(t) = exp(GROWTH_RATE * t)` — **visual only**
- round state → `useRef`; React state = **phase transition만**
- `useGameLoop` · canvas direct write (per-frame `setState` on mult **금지**)
- hero ↔ tip **동일 프레임 동일 `m`**
- `Float32Array` ring buffer
- camera lerp ~6/s

**Visuals**

- polyline · `--skin-*` · gradient · glowing tip
- 격자 기본 0 · integer line 조건부
- auto-cashout dashed line · **동일 scaleM**
- flash gated by reduced-motion
- DPR ≤2 · ResizeObserver · `aria-live` mirror

**State · 원샷 REPLAY (#P2.0-EB-8)**

One-shot engine: `bet.result`(含 `crashMultiplier`) arrives at `rpc_place_game_bet` resolution. **`running` curve = REPLAY/ANIMATION toward already-known server `crashAt`** — NOT a live round awaiting input. Animation may start on bet success; `crashAt` snaps from `bet.result.crashMultiplier`.

**FAIL =** Stage invents round clock · waits for WS for `crashAt` · **OR any cashout decision derived from client-known `crashAt`**. Because `crashMultiplier` is client-resident in the one-shot model, manual cashout **CANNOT** be client-evaluated — precisely why §STOP requires server-received-timestamp RPC.

- `idle` / `running`(replay) / `crashed`
- auto WIN: `result.cashedOut === true` → green flash (**settled** 값)

---

## 2) Controls.shared.tsx — morphing CTA

| phase | CTA | 동작 |
|-------|-----|------|
| idle | `casino.crash.prepareRound` | `onPrepareRound` |
| armed | `casino.crash.betAt` | `onOpenBetConfirm` (RG) |
| running | **#P2.0-UX-1** see below | see below |
| settled | `casino.crash.prepareRound` | reset |

**running CTA (#P2.0-UX-1):**

- `onCashout` **absent** (P2.0 default): `casino.crash.autoAt` `{selection.autoCashout}` · **disabled** · `data-testid="casino-cashout"` · **`data-cta-mode="auto"`** · 내부 사정 문구 노출 0
- `onCashout` **present** (engine wave 후): `casino.crash.cashoutAt` `{liveM}` · enabled · one-tap · dialog 0

- Initial BET: **BetConfirmDialog** 유지
- Auto-bet: P1.10 패턴 (**P2.0에서 hook 변경 0** — P2.0b)
- testid 9종 유지 + `casino-cashout`

---

## 3) Mobile (one-handed)

- `CrashRoundContext.Provider` · sticky bottom controls
- Stage ~60% · thumb zone ~40%
- primary CTA `min-h-16` — `BetPanel` `primarySize="xl"` (**crash-only opt-in**, P2.0)
- AutoBet Sheet = 기존 동작 유지 (P2.0b에서 토글 추가)
- Space = cashout (**onCashout 있을 때만**)

---

## 4) Files (P2.0 · crash-only)

```
src/games/crash/Stage.tsx                       rewrite
src/games/crash/Controls.shared.tsx             rewrite
src/games/crash/CrashRoundContext.tsx           new
src/games/crash/useCrashLiveMultiplier.ts       new
src/games/crash/index.tsx                       EDIT (Provider + mobile layout)
src/games/shared/BetPanel.tsx                   EDIT (primarySize opt-in only)
src/i18n/ko.ts, src/i18n/en.ts                  crash keys only (§5)
tests/e2e/*                                     E2E-A (required); E2E-B defer
```

**P2.0b (별도 LOCK):** `useAutoBetQueue` · `AutoBetPanel` · +4 vitest · 4-game smoke · `casino.auto.*` i18n

---

## 5) i18n (P2.0 additive)

- `casino.crash.prepareRound`
- `casino.crash.betAt`
- `casino.crash.cashoutAt` (engine wave 후 enabled 라벨)
- `casino.crash.autoAt` — e.g. ko 「{multiplier}× 자동 캐시아웃」 (**#P2.0-UX-1**)

`casino.crash.cashoutEnginePending` — **사용 금지** (UX-1 replaces)

---

## EXECUTE Step 0 → 7 (P2.0)

| Step | 내용 |
|------|------|
| 0 | vitest baseline · build-mode **reconfirm** (not discover): mid-round `onCashout`/cashout RPC **known-absent** (`rpc_place_game_bet` 원샷만 존재 — `use-casino-round.ts` submitBet). **없음 → disabled+autoAt 자동 진행.** **발견 시(예상 밖) → 자동 wire 금지 · §STOP 보고만.** |
| 1 | `CrashRoundContext` + `readDisplayM()` |
| 2 | `Stage.tsx` (replay model · #P2.0-EB-8 FAIL gates) |
| 3 | `Controls.shared.tsx` (morph · UX-1 · `casino-cashout`) |
| 4 | `index.tsx` + `BetPanel` xl |
| 5 | i18n (§5 only) |
| 6 | vitest crash-only · baseline 유지 |
| 7 | §GREEN · **E2E-A** |

**P2.0 GREEN 후** → P2.0b EXECUTE (shared AutoBet, 격리 검증).

---

## §GREEN self-check (full block)

```bash
bun run test 2>&1 | tail -5
scripts/red-grep.sh
scripts/i18n-parity.sh
rg -n "stake" src/games/crash && exit 1 || true
rg "[가-힣]" src/games/crash --glob '!**/i18n/*' && exit 1 || true
rg "framer-motion" src/games/crash && exit 1 || true
rg "setDisplayMult|setState.*[Mm]ult" src/games/crash/Stage.tsx && exit 1 || true
git diff --name-only | rg "useAutoBetQueue\.ts|AutoBetPanel\.tsx" && exit 1 || true
# Lovable fallback: FAIL = EDIT to useAutoBetQueue.ts or AutoBetPanel.tsx in this slice
# manual: running = replay; crashAt === result.crashMultiplier; no WS round clock
# manual: hero === tip Y same frame; scaleM marker cross (코드 리뷰: 순수함수 분리 권장)
# manual: running disabled CTA data-cta-mode=auto (not cashoutAt+liveM)
# manual: reduced-motion → no flash stack
# E2E-A: casino-cashout disabled · data-cta-mode=auto · 0 requests (no translated-copy assert)
```

---

## GREEN Gates

1. vitest ≥ Step 0 baseline
2. red-grep 0 · i18n-parity PASS · stake in src/games/crash 0
3. Blockers 1–3 + EB-7/8 + UX-1 + flash guard
4. `casino-cashout` additive · testid 9종 유지
5. §STOP 우회 0 · client cashout eval 0
6. replay model · scaleM 정합
7. **E2E-A PASS** · E2E-B = engine wave 후
8. **shared AutoBet source 0 EDIT** (imports OK · P2.0b 전)

---

## 마감 보고

```text
P2.0 GREEN · Crash-only rewrite · replay canvas · scaleM sync · morph CTA autoAt-disabled · E2E-A PASS · vitest baseline · P2.0b deferred
```

---

## Defer

| 항목 | 슬라이스 |
|------|----------|
| P2.0b AutoBet reset toggles | 별도 LOCK |
| Engine wave · `rpc_crash_cashout` | post-P2.0 |
| `onCashout` contract + E2E-B | engine wave 후 |
| Live round (crashAt 미공개 until end) | engine wave 전제 |

---

## PHONARA paste 어댑터

- Lovable EXECUTE only · crash zone paste
- testid: Lovable `stake-input` 등 → PHONARA `casino-*` (`casino-e2e-testids.ts`)
- 엔진 웨이브 전 `onCashout` absent → disabled + `autoAt` 동일

---

*P2.0 LOCK v1.1 FINAL · APPROVED EXECUTE GO · 2026-06-16*
