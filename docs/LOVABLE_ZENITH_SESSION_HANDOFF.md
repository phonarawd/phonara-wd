# PHONARA Lovable Zenith — 세션 인계문 (Phase 0→10 · 지존급)

> **새 Cursor 채팅 첫 메시지:** **`@docs/LOVABLE_ZENITH_CHAT_HANDOFF.md`** (지구끝판왕 · 단일 부트스트랩) — 장문 히스토리는 이 파일.  
> **이 문서 = Lovable Zenith 진행 상태 정본** (검토·승인·구현·게이트·히스토리·§E 템플릿).  
> **마지막 갱신:** 2026-06-15 (v11) · **모드:** Phase 4 ACTIVE — Roulette v1 RED LOCK FINAL+ · Lovable EXECUTE §7.  
> **PHONARA 엔진 100 / Supabase:** 별도 트랙 → [`ENGINE_100_HANDOFF.md`](ENGINE_100_HANDOFF.md) (UI no-touch).  
> **카지노 엔진 10종 / ZIP-1:** [`CHAT_HANDOFF_2026-06-14.md`](CHAT_HANDOFF_2026-06-14.md).

**작업 공간:** Lovable 프론트엔드 워크스페이스 (`src/games/**`, `src/components/**`, `.lovable/memory/**`)  
**PHONARA monorepo:** `c:\Users\PC\Desktop\phonara-gb` — **paste 전** placeholder UI · **엔진 read-only**  
**대화 transcript:** `dcf7249f-731d-42c6-8331-f9fe38272117` (Cursor agent-transcripts)

---

## 0. 절대 원칙 (매 Phase 반복 확정)

| # | 규칙 |
|---|------|
| 1 | **UI 100% Lovable** — PHONARA `apps/web` 시각 코드 **paste 전 수정·재디자인 금지** |
| 2 | **엔진 no-touch** — `packages/*`, `supabase/*`, hooks 정산 로직 **한 줄도 수정 금지** (별도 ENGINE 태스크) |
| 3 | **Callback only** — `ImportedGameSurfaceProps` + mock pipeline · `@supabase` / `rpc_*` / `@phonara/game-engine` **정적 import 0** |
| 4 | **9 money testid** — PHONARA `casino-e2e-testids.ts`와 1:1 · `casino-submit-bet` **금지** · `betpanel-*` **0** |
| 5 | **i18n** — JSX 한국어 0 · `casino.toast.*` / `trade.toast.*` emoji 0 · rules sheet emoji OK(과하지 않게) |
| 6 | **red:grep ALL 0** — `bet.result.grid`, howler, ads/survey 키워드, 직접 `rpc_(` 등 |
| 7 | **중복 파일 금지** — 게임마다 **Crash 템플릿 복사** · checkpoint는 `.lovable/memory/{game}-checkpoint.md` |
| 8 | **Phase 게이트** — green 전 다음 Phase 금지 · Pixi nebula = **Phase 2.5 defer** (MANUAL) |
| 9 | **Mock↔Stage 동기** — Stage `bet.result` shape를 PHONARA 정본으로 바꿀 때 **`useMockPipeline.simulate()` 해당 분기 동시 수정** (red:grep은 mock 출력 비대상 → 별도 수동 체크) |

**Lovable AI에 붙여넣을 계약 4파일:**

1. [`LOVABLE_ZENITH_MASTER_PLAN.md`](LOVABLE_ZENITH_MASTER_PLAN.md)  
2. [`LOVABLE_PRODUCT_PLATFORM_MANIFEST.md`](LOVABLE_PRODUCT_PLATFORM_MANIFEST.md)  
3. [`LOVABLE_P1_FINAL_PHONARA.md`](LOVABLE_P1_FINAL_PHONARA.md)  
4. [`GAMES-INTEGRATION.md`](GAMES-INTEGRATION.md)

**충돌 우선순위:** 기술/selection/testid → GAMES-INTEGRATION > P1 > Zenith · 제품/카피 → Manifest 항상 우선.

---

## 1. Phase 진행 상태 (한눈에) — 2026-06-15

### 1-0. 새 채팅 스냅샷 (30초)

| | |
|---|---|
| **작업 위치** | Lovable (`src/games/**`, `.lovable/memory/**`) — PHONARA repo는 docs/handoff만 |
| **완료** | Macro Phase 0–2 ✅ · Macro Phase 3 ✅ · 게임 **6/10 GREEN** (crash · plinko · limbo · mines · hilo · dice) |
| **최근** | Dice v1 LOCK ✅ · §1-H mock selection reset ✅ · vitest **266/266** |
| **다음** | **Roulette §7 EXECUTE** (Lovable) → Blackjack → MintReels/GoldRush |
| **잔여 게임** | Roulette → Blackjack → MintReels/GoldRush (**4턴**) |
| **Zenith 풀-green** | crash/plinko/limbo e2e CI-pending · back smoke 3 spec (블로커 아님) |
| **PHONARA** | 엔진 no-touch · casino UI placeholder · paste = Phase 10 ZIP 이후 |

> **작업 위치:** Lovable 프론트엔드 워크스페이스 (`src/games/**`, `.lovable/memory/**`).  
> **PHONARA repo:** `apps/web/src/components/games/*` = placeholder · paste 전.

### 1-A. 매크로 Phase (`LOVABLE_ZENITH_MASTER_PLAN.md` §4)

| Macro Phase | 내용 | 상태 |
|-------------|------|------|
| **0** | Foundation + QA | ✅ GREEN |
| **1** | Shared A–G + infra | ✅ GREEN |
| **2** | Crash (템플릿 1종) | ✅ GREEN (local) · e2e CI-pending |
| **3** | P1 게임 5종 (Plinko→Mines→Limbo→HiLo→Dice) | ✅ **GREEN** — Plinko ✅ · Limbo ✅ · Mines ✅ · HiLo ✅ · Dice ✅ |
| **4** | 신규 4종 (Mint Reels→Gold Rush→Blackjack→Roulette) | ⏳ |
| **5** | App Shell + Tier Nav | ⏳ |
| **6** | Design System (ui 47+) | ⏳ |
| **7** | Earn + 바이럴 + FOMO + Tier | ⏳ |
| **8** | User 페이지 32면 | ⏳ |
| **9** | Admin 8면 | ⏳ |
| **10** | i18n sweep + QA + ZIP export | ⏳ |
| **2.5** | Pixi nebula (Crash/Plinko) | ⏸ DEFER (MANUAL) |

**매크로 기준 남은 묶음:** **Phase 4~10 (7묶음)**. 게임 10종만 끝나도 Phase 5~10(셸·Earn·페이지·Admin·ZIP)이 대부분.

### 1-B. 카지노 게임 10종 (Crash 템플릿 복사 턴)

| # | gameCode | Lovable 상태 | result / selection 정본 |
|---|----------|--------------|-------------------------|
| 1 | crash | ✅ GREEN (local) | `{ autoCashout }` · `{ cashedOut, cashoutMultiplier }` |
| 2 | plinko | ✅ GREEN (local) · vitest **200/200** | `{ rows, risk }` · `{ path, bucket, bucketMultiplier:string }` |
| 3 | limbo | ✅ GREEN (local) · vitest **40/40** · red:grep ALL 0 | `{ target }` · `{ resultMultiplier, won }` · Limbo 3구간 feel |
| 4 | mines | ✅ GREEN (local) · vitest **29/29** · red:grep ALL 0 | `{ mineCount, revealedCells[] }` · `{ minePositions, hitMine }` |
| 5 | hilo | ✅ GREEN (local) · vitest incl. · red-grep clean | `{ startCard, guesses[] }` · `{ cards, rounds, won }` |
| 6 | dice | ✅ GREEN (local) · vitest incl. · red-grep 6 clean | `{ target, direction }` · `{ roll, won }` · `bet.multiplier` celebrate |
| 7 | mint_reels | ⏳ (macro Phase 4) | `{ lines }` · `{ totalMultiplier }` |
| 8 | gold_rush | ⏳ | `{ lines }` · `{ totalMultiplier }` |
| 9 | blackjack | ⏳ | `{ actions[] }` · settle `{ totalMultiplier }` |
| 10 | roulette | 🟡 **ACTIVE · RED LOCK FINAL+ §7** | `{ bets[] }` · `{ winningNumber, totalMultiplier }` · split lower · integer chips |

**게임 턴:** **6/10 GREEN** (crash · plinko · limbo · mines · hilo · dice) → **4턴** 남음 (Roulette next). **vitest Lovable:** 266/266 PASS.

### 1-C. 게이트 잔여 (별 Phase 아님)

| 항목 | 상태 |
|------|------|
| Crash C-3 e2e | 🟡 WRITTEN → CI/local `playwright install` 후 PASS |
| Plinko C-3 e2e | 🟡 WRITTEN → CI/local PASS |
| Limbo C-3 e2e | 🟡 WRITTEN → CI/local PASS |
| crash/plinko back smoke | ⏳ `casino-game-back` 1줄 (3 spec) |
| chunk gzip / 60fps | ⏸ MANUAL · Phase 2.5 defer |
| PHONARA paste | ⏳ Lovable Phase 10 ZIP 이후 별 트랙 |

### 1-D. 공통 인프라 (최근 승인 · Limbo §0에 포함)

| 항목 | 내용 |
|------|------|
| **§0-0** | `useMockPipeline` throw → `!DEV` warn only (preview 라우트 ErrorBoundary 해소) |
| **§0-0b** | `GameBackLink` → `shared/` paste · Lovable preview 10라우트 · PHONARA `CasinoLovableSurface` **1회** · `casino.back_to_games` i18n |
| **9 testid** | BetPanel 4 first-paint · PF 2 after-open · Confirm 3 · attached-after-flow |

### 1-E. Limbo v1.3 final-r2 — closeout 완료 (2026-06-14 · Lovable local)

| 구간 | 상태 | 증거 |
|------|------|------|
| **§0-0** useMockPipeline guard | ✅ | throw → `!DEV` warn only |
| **§0-0b** GameBackLink | ✅ | shared + i18n + preview 10라우트 |
| **A-1~A-6** Limbo wiring | ✅ | 3구간 feel · `{ resultMultiplier, won }` · RG gate · ghost HUD · i18n |
| **B-1** vitest (Limbo suite) | ✅ **40/40** | Controls 10 · Stage 4 · HUD 2 · contract 9 · celebrate 5 · shortkeys 6 · reducedMotion 1 · GameBackLink 3 |
| **B-2** e2e spec | 🟡 **WRITTEN** | `tests/e2e/games/limbo.spec.ts` |
| **C-1** red:grep | ✅ **ALL 0** | Stage 주석 + `games.bet.multiplier` i18n key namespace만 패턴 매치 · **객체 접근 0건** |
| **C-2** checkpoint | ✅ | `.lovable/memory/limbo-checkpoint.md` v1.3 final-r2 (3구간 + superseded ×2 + §nav) |
| **C-3** §E closeout | ✅ | 첫 줄: `0-0 useMockPipeline preview guard (throw → warn) + 0-0b GameBackLink (Lovable preview 10라우트 · PHONARA paste 시 CasinoLovableSurface 1회)` |

**잔여 (Zenith 풀-green · 별 턴):** crash/plinko/limbo e2e PASS · back smoke 3 spec · chunk/60fps MANUAL.

### 1-F. Final Plan — Hotfix 묶음 (**✅ APPLIED** · 2026-06-14)

**상태:** 6/6 적용 완료 — mock 3 case · BetPanel L171 · Controls ×3 · checkpoint hotfix 메모.

| # | 항목 | 상태 |
|---|------|------|
| §1 | `useMockPipeline.simulate()` crash/plinko/limbo | ✅ |
| §2 | `BetPanel.tsx` L171 + Controls.shared ×3 라벨 | ✅ |
| §3 | `limbo-checkpoint.md` Hotfix 2줄 | ✅ |
| preview | 3 route 베팅 + 라벨 구분 | ✅ **PASS** (operator confirm · 2026-06-14) |

**실행 순서 (완료):** §1 mock 3 case → §2 BetPanel L171 → §2 Controls.shared ×3 → preview 검증 → §3 checkpoint

---

#### §1. Mock pipeline ↔ Stage shape drift

**원인:** Crash/Plinko/Limbo Stage가 PHONARA `bet.result` 정본으로 마이그됐으나 `useMockPipeline.simulate()` 구 shape 유지 → preview 베팅 **무반응**. red:grep mock 출력 **비대상**.

| game | Stage 정본 | mock 구 shape | 증상 |
|------|-----------|---------------|------|
| limbo | `resultMultiplier`, `won` | `multiplier` | 카운터 1.00 고정 |
| plinko | `bucket`, `bucketMultiplier`, `path` | `bin` | 공 미낙하 |
| crash | `crashMultiplier`, `cashedOut`, `cashoutMultiplier` (**number**) | `crashMultiplier`만 | celebrate 미발화 |

**수정:** `src/games/preview/useMockPipeline.ts` `simulate()` **3 case** (dice/mines/그 외 5종 무변경).

<details>
<summary>3 case 스니펫 (crash = number 정본)</summary>

```ts
// limbo
case "limbo": {
  const ls = sel as SelectionFor<"limbo">;
  const r = Math.random();
  const raw = 0.99 / Math.max(0.0001, r);
  const resultMultiplier = Math.max(1, raw);
  const target = Number(ls.target);
  const won = resultMultiplier >= target;
  return {
    result: { resultMultiplier, won },
    payout: won ? (s * target).toFixed(2) : "0",
    multiplier: won ? target.toFixed(2) : "0",
    win: won,
  };
}

// plinko
case "plinko": {
  const ps = sel as SelectionFor<"plinko">;
  const bins = ps.rows + 1;
  let bucket = 0;
  const path: number[] = [];
  for (let i = 0; i < ps.rows; i++) {
    const step = Math.random() < 0.5 ? 0 : 1;
    path.push(step);
    bucket += step;
  }
  bucket = Math.max(0, Math.min(bins - 1, bucket));
  const previewMults = [1.5, 1, 0.7, 0.5, 0.3, 0.5, 0.7, 1, 1.5];
  const m = previewMults[Math.min(previewMults.length - 1, Math.abs(bucket - Math.floor(bins / 2)))];
  return {
    result: { bucket, bucketMultiplier: m.toFixed(2), path },
    payout: (s * m).toFixed(2),
    multiplier: m.toFixed(2),
    win: m >= 1,
  };
}

// crash — PHONARA packages/game-engine/src/games/crash.ts number 1:1
case "crash": {
  const r = Math.random();
  const crash = Math.max(1.0, 0.99 / Math.max(0.0001, 1 - r));
  const auto = Number((sel as SelectionFor<"crash">).autoCashout) || 0;
  const cashedOut = auto > 0 && crash >= auto;
  const cashoutMultiplier = cashedOut ? auto : 0;
  const m = cashedOut ? auto : 0;
  return {
    result: { crashMultiplier: crash, cashedOut, cashoutMultiplier },
    payout: (s * m).toFixed(2),
    multiplier: m.toFixed(2),
    win: cashedOut,
  };
}
```

</details>

---

#### §2. BetPanel "라운드 준비" 라벨 중복

**원인:** `BetPanel` secondary (`casino-prepare-hash`) + primary (`casino-place-bet`) 모두 `!ready` 시 **"라운드 준비"** — 동일 문자열 2버튼.

```ts
// Controls.shared.tsx (crash/plinko/limbo 공통 패턴)
primaryLabel={ready ? "<bet>" : "라운드 준비"}
secondaryLabel="라운드 준비"   // ← !ready 시 primary 와 중복
```

**수정 (A안 · LOCK):** 2단계 UX + 9 testid 유지 · **4파일 1라인씩**

| 파일 | 변경 |
|------|------|
| `src/games/shared/BetPanel.tsx` **L171** | `"라운드 준비 완료"` → `"해시 커밋 완료"` |
| `src/games/limbo/Controls.shared.tsx` **L36** | `secondaryLabel="라운드 준비"` → `"해시 커밋"` |
| `src/games/crash/Controls.shared.tsx` **L35** | 동일 |
| `src/games/plinko/Controls.shared.tsx` **L38** | 동일 |

**!ready UX:** 위 "해시 커밋" · 아래 "라운드 준비" → commit 후 위 disabled "해시 커밋 완료" · 아래 "N×에 베팅".

**대안 B (미채택):** `!ready` 시 secondary 숨김 — 1버튼 흐름 · preflight 시각화 상실.

**i18n:** raw 한국어 유지 (기존 패턴) · key화는 후속 PR.

#### §3. 영향 · 검증 · checkpoint

| 항목 | 영향 |
|------|------|
| 9 E2E testid | **무변경** |
| vitest **240** (Plinko 200 + Limbo 40) | 라벨만 — text assertion 없으면 회귀 0 |
| red:grep | 무영향 |
| PHONARA paste | 4파일 1줄씩 · mock `.lovableignore` 제외 |
| i18n | raw 한국어 유지 · key화 후속 PR |

**검증 (실행 후):**

1. `/casino/limbo` — 카운터 ease-out · win juice · high-mult miss shake
2. `/casino/plinko` — 공 낙하 · bucket · celebrate
3. `/casino/crash` — autoCashout 도달 시 juice
4. 3 route `!ready` — "해시 커밋" / "라운드 준비" 라벨 구분

**§3 checkpoint** — `.lovable/memory/limbo-checkpoint.md` v1.3 final-r2 §E 아래:

> ### Hotfix (post-handoff)
> - **mock↔Stage shape drift**: useMockPipeline.simulate() limbo/plinko/crash 3 case 동기. crash number 정본. 후속 §0 에 "Stage shape 변경 시 mock 동기 체크" 1줄.
> - **BetPanel 라벨 중복**: secondary `"해시 커밋"` 분리 (3 Controls + BetPanel L171). preflight 2단계·testid 유지.

**Mines 착수:** ✅ **GO** (§1-F hotfix + preview PASS · 2026-06-14)

#### Preview 검증 체크리스트 (operator · Lovable canvas)

| route | `!ready` 라벨 | post-commit | mock shape / feel |
|-------|---------------|-------------|-------------------|
| `/casino/limbo` | 위 **해시 커밋** · 아래 **라운드 준비** | 위 **해시 커밋 완료**(disabled) · 아래 **N×에 베팅** | 카운터 ease-out · win juice · loss shake |
| `/casino/plinko` | 동일 | 동일 | 공 낙하 · bucket · celebrate |
| `/casino/crash` | 동일 | 동일 | autoCashout 도달 시 juice |

---

### 1-G. Phase 5 — Mines v1 (**GO · LOCK** · Lovable · spec 확정 2026-06-14)

**목표:** Crash/Plinko/Limbo v1.3 패턴 1:1 — RG · confirm · shortkeys · feel · rules · checkpoint · tests. **비주얼 1px 무변경.**

**실행 순서:** §0-RED → §0-a → §0-b → A-1 → A-3 → A-2 → A-4 → A-5 → B → C-1 → C-2 → C-3

---

#### §0-RED — result key 전면 교체 (비협상 · 선행)

엔진 정본: `{ minePositions: number[]; hitMine: boolean }` — `packages/game-engine/src/games/mines.ts` L11–14 · `casino_parity_test.sql`. Lovable mock·Stage `{ mines, hit }` → paste 시 adapter **조용히 깨짐**.

| 파일 | 변경 |
|------|------|
| `mines/Stage.tsx` L36, 82–83 | `result as { minePositions?; hitMine? }` · `isMineHit` / `isSafeReveal` |
| `preview/useMockPipeline.ts` mines | emit `{ minePositions, hitMine }` |
| `shared/types.ts` | `MinesResult` 동기 또는 inline 정리 |

**Gate:** `rg -n "result\.(mines|hit)\b" src/games/mines/ src/games/preview/` → **0건**

#### §0-a · §0-b

- **§0-a:** `Controls.shared.tsx` L39 `"라운드 준비"` → `"해시 커밋"`
- **§0-b — money 9개** (PHONARA `casino-e2e-testids.ts` 1:1):
  - BetPanel: `casino-stake-input` · `casino-prepare-hash` · `casino-place-bet` · `casino-error`
  - Fairness open: `casino-client-seed-input` · `casino-fairness-verifier`
  - Confirm `open=true`: `casino-bet-confirm` · `casino-bet-confirm-confirm` · `casino-bet-confirm-cancel`
  - Optional non-money (3): `casino-game-back` · `casino-presence-ghost` · **`casino-game-rules`**
  - Mines: cashout 분리 없음 (`casino-place-bet` 통합) · `casino-currency-select` 없음 · ❌ `casino-cashout` · `casino-fairness-trigger`

#### §A 핵심

| ID | 산출 |
|----|------|
| **A-1** | `RGGateProvider` wrap · `BetConfirmDialog` · **`GameRulesSheet`** → **`data-testid="casino-game-rules"`** · **`FairnessSheet`** 별도 → `casino-fairness-verifier` + `casino-client-seed-input` · `useGameShortkeys` Space 2분기(0 tile no-op) + `1/2/5/Esc/?` |
| **A-2** | `useEffect` on `bet.id`: `hitMine`→`screenShake`+lose · `!hitMine&&revealed>0`→`juice`+celebrate · `tierOf(Number(minesMultiplier(mineCount, revealed.length)))` ≥1.01 · `CelebrateOverlay` · `useReducedMotionGuard` |
| **A-3** | `onPrimary`: ready+revealed → `await rg.gate("place_bet")` then `onOpenBetConfirm` · else `onPrepareRound` · `secondaryLabel="해시 커밋"` |
| **A-4** | HUD `data-testid="casino-presence-ghost"` strip (Limbo 패턴) |
| **A-5** | i18n `casino.field.next_multiplier` 등 (raw ko/en · key화 후속 PR) |

#### §B Tests

- 기존 5 + `celebrate.test.tsx` + `shortkeys.test.tsx`
- celebrate: `{ minePositions:[5,12], hitMine:false }` + revealed=[0,1,2] → juice · `{ minePositions:[0,5], hitMine:true }` revealed=[0] → shake · settled=false → no-op
- shortkeys: Space 2단계 · 빈 선택 openConfirm no-op · Esc/1/2/5
- 목표 **40+ PASS**

#### §C Closeout

- **C-1:** `result.(mines|hit)` 0 · `rg "라운드 준비" src/games/mines/` 0 · `rg "casino-(cashout|currency-select|fairness-trigger)" src/games/mines/` 0 · red:grep ALL 0
- **C-2:** `.lovable/memory/mines-checkpoint.md` — result shape · feel 2지 · tier ≥1.01 · 해시 커밋 · testid money 9 + optional 3 · `minesMultiplier(mineCount, revealCount)` · GameRules vs Fairness testid 분리
- **C-3 §E 첫 줄:** `Mines v1 — RED({mines/hit}→{minePositions/hitMine}) + RGGate/Confirm/Shortkeys/Feel/Rules(casino-game-rules)/Fairness(casino-fairness-verifier) + 해시 커밋`

**후속 (macro):** HiLo → Dice (Phase 3) → Roulette → Blackjack (Phase 4) → MintReels/GoldRush.

#### Mines §E closeout (실측 기록 · 2026-06-15)

```
[END PHASE 5 · Mines Closeout]
Mines v1 — RED({mines/hit}→{minePositions/hitMine}) + RGGate/Confirm/Shortkeys/Feel/Rules(casino-game-rules)/Fairness(casino-fairness-verifier) + 해시 커밋
§0-RED rg result.(mines|hit): 0 : PASS
A-1~A-5 PASS · B vitest 29/29 mines · 230/230 전체 PASS · B-2 mines.spec: WRITTEN
C-1 red:grep ALL 0 : PASS · C-2 mines-checkpoint.md: PASS
D chunk/60fps: MANUAL · Pixi: Phase 2.5 defer
Result: GREEN (local · e2e CI-pending)
```

**산출:** 7 files (5 mines + mock + 2 i18n) · 2 new tests · `.lovable/memory/mines-checkpoint.md`

#### §1-H Mock selection reset hotfix ✅ APPLIED (2026-06-15 · Lovable · 1 file)

**증상:** Mines 캐시아웃/라운드 준비 후에도 타일 선택이 남음. `bet.result` `{ minePositions, hitMine }`는 정확 — 그리드만 이전 `revealedCells`를 계속 그림.

**원인:** `useMockPipeline` 라운드 리셋이 `commitment`/`bet`/`verification`만 처리, mines/hilo **누적 selection** 미처리.

**수정:** `src/games/preview/useMockPipeline.ts`

```ts
function resetAccumulatedSelection<G extends GameCode>(gameCode: G, prev: SelectionFor<G>): SelectionFor<G> {
  if (gameCode === 'mines') return { ...prev, revealedCells: [] } as SelectionFor<G>;
  if (gameCode === 'hilo') return { ...prev, guesses: [], startCard: null } as SelectionFor<G>;
  return prev;
}
```

- **`onPrepareRound`:** `setSelection(prev => resetAccumulatedSelection(gameCode, prev))`
- **`onSubmitBet` settle:** commitment `setTimeout(..., 400)` 와 동일 타이밍 selection 리셋

**검증:** mines 캐시아웃 → 400ms 결과 표시 후 그리드 비움 · 라운드 준비 → 빈 그리드 · vitest **230/230 PASS** ✅

**상태:** `onPrepareRound` + `onSubmitBet` settle 후 **두 지점 호출 적용 완료**

**PHONARA paste 후속:** `resetAccumulatedSelection` (§1-H) — **✅ APPLIED** `reset-accumulated-selection.ts` · `use-casino-round.ts` · unit test 3 cases.

#### §1-I Phase 6 — HiLo v1 LOCK **RED v3** (2026-06-15 · Lovable · §6 CHAT_HANDOFF)

- **§0-RED:** `{ cards, rounds, won }` · **`resultMultiplier` 금지** · tier = `rounds[last].multiplier`
- **A-6:** `hilo/multiplier.ts` — `expectedMultiplierFromGuesses(guesses)` (BetConfirm UI-only)
- RG · Confirm · Space 4-state · feel 2지 · 9 testid · `secondaryLabel="해시 커밋"`
- **목표:** vitest **232/232** · red-grep **5종 0**
- **실행:** `§0-RED → §0-a → §0-b → A-1 → A-6 → A-3 → A-2 → A-4 → A-5 → §B → C-1~C-3`
- **macro:** HiLo GREEN → **Dice** (Phase 3 마감)

#### HiLo §E closeout (실측 기록 · 2026-06-15)

```
[END PHASE 6 · HiLo Closeout · RED v3]
HiLo v1 — {cards,rounds,won} + expectedMultiplierFromGuesses(UI) + RG/Confirm/Shortkeys/Feel/Rules/Fairness + 해시 커밋
§0-RED red-grep 5종: 0 : PASS
A-1~A-6 PASS · B vitest 244/244 PASS
C-1 red-grep ALL 0 : PASS · C-2 hilo-checkpoint.md v2 : PASS · C-3 docs/checkpoints/hilo/wiring.md : PASS
D chunk/60fps: MANUAL · Pixi: Phase 2.5 defer
Result: GREEN (local · e2e CI-pending) · 5/10 games · macro P3 Dice ⏳
```

**산출:** hilo game tree · celebrate + shortkeys tests · `.lovable/memory/hilo-checkpoint.md` v2 · `docs/checkpoints/hilo/wiring.md`

#### §1-J HiLo + 전 게임 result 정합성 감정 (2026-06-15 · Lovable local)

**판정:** GREEN — shape·feel·red-grep·vitest 244/244 합격. HiLo §0-RED v3 1:1.

| 영역 | 결과 |
|------|------|
| HiLo bet.result ↔ Stage/HUD | `cards` · `rounds[-1].multiplier` · `won` — PHONARA `hilo.ts` 정본 일치 |
| 10종 Stage ↔ mock emit | 키 1:1 (limbo만 정본 `resultMultiplier`) |
| §1-H selection reset | mines/hilo 두 지점 리셋 ✅ |
| red-grep | 5종 0 ✅ |

**Preview-only 한계 (의도됨 · paste 전):**

1. mock `startCard` ↔ `correct` — 카드 비교 미사용 · 시각 incoherence 가능 · Stage ✓/✗ 뱃지 없어 UX 노출 낮음
2. `expectedMultiplierFromGuesses` — 1.1^n UI-only · 실엔진은 카드 거리 배수 · BetConfirm 전용

**🟡 paste/차기 (블로커 아님):**

1. HiLo 라운드별 `rounds[i].correct` 마이크로뱃지 (실엔진 검증 UX)
2. PHONARA `reset-accumulated-selection.ts` + `use-casino-round` — **✅ APPLIED 2026-06-15** (§1-H Lovable parity)
3. mock correct → 카드 비교 기반 (preview-only · 엔진 무영향)

**PHONARA read-only 교차:** `packages/game-engine` settle keys 확인. blackjack 엔진 settle = `{ totalMultiplier }` only — Lovable Stage의 `dealer`/`player`는 mock UI enrichment로 분류 · paste 시 settlement 키 drift 금지.

#### §1-K Phase 7 — Dice v1 LOCK **RED v3.1 FINAL** (2026-06-15 · Lovable · §6 CHAT_HANDOFF v8)

- **§0-RED:** `{ roll, won }` · roll [0.00, 99.99] · **`result.won` 진실** · tie=LOSE · UI `over ? roll>target` ❌
- **multiplier.ts:** `Math.floor(99/prob)/100` (엔진 1:1) · parity target=50 over ≈1.98 · `floor((99/prob)*100)/100` 금지
- celebrate: **`bet.multiplier`** · mock `{ roll, won }` 한 줄 emit · mock mult = `won ? diceMultiplier(...) : 0`
- RG · Confirm · Space **3-state** · feel 2지 · 9 testid · engine truth test `{roll:80,won:false}`
- **red-grep 6종** (v3.1 `#6 \roll\b | rg -v won`) · vitest **§E 실측 N/N** (248~249)
- **실행:** `§0-RED → §0-a → §0-b → A-1 → A-3 → A-2 → A-4 → A-5 → §B → C-1~C-4`
- **macro:** Dice GREEN → **macro P3 ✅** → Phase 4
- **PHONARA:** §1-H N/A · `GAMES-INTEGRATION.md` dice ✅ · handoff v10 merge ✅

#### Dice §E closeout (실측 기록 · 2026-06-15)

```
[END PHASE 7 · Dice Closeout · RED v3.1 FINAL]
Dice v1 — {roll,won} + bet.multiplier celebrate + multiplier.ts + RG/Confirm/Shortkeys/Feel/Rules/Fairness + 해시 커밋
§0-RED red-grep 6종: 0 : PASS
  #1 dice/ resultMultiplier|totalMultiplier: 0
  #2 dice/ over ? roll>target 실행코드: 0 (jsdoc/test 설명 only)
  #3 secondary "라운드 준비": secondary=해시 커밋 ✅ (L36 primary gate-out)
  #4 금지 testid: 0 · #5 dice 분기 drift: 0 · #6 {roll…} won 누락: 0
A-1~A-5 PASS · B vitest 266/266 PASS (+22 from baseline 244)
  celebrate 6 · shortkeys 6 · multiplier 6 · Stage/contract/Controls 보강
engine truth {roll:80,won:false} over 75 → LOSE ✅ Stage.test.tsx
parity diceMultiplier(50,'over')≈1.98 ✅ multiplier.test.ts
roll cap Math.floor(r*10000)/100 ✅ (diceFromFloat 동형)
C-1~C-3 PASS · .lovable/memory/dice-checkpoint.md · docs/checkpoints/dice/wiring.md v3.1 addendum
Result: GREEN (local · e2e CI-pending) · 6/10 games · macro P3 ✅ · Phase 4 ⏳
```

**산출:** `src/games/dice/{multiplier.ts(신규), Stage.tsx, Controls.shared.tsx, HUD.tsx, index.tsx}` · `useMockPipeline.ts` dice 1블록 + import · `shared/types.ts` DiceResult · `i18n/{ko,en}.ts` 4키 · 신규 테스트 3 + 갱신 3

**macro Phase 3 마감 선언 ✅** — Crash · Plinko · Limbo · Mines · HiLo · Dice. **다음:** Roulette → Blackjack (Phase 4) → MintReels/GoldRush.

#### §1-L Phase 8 — Roulette v1 LOCK **RED v1 FINAL+** (2026-06-15 · Lovable · §7 CHAT_HANDOFF v11)

- **§0-RED:** `{ winningNumber, totalMultiplier }` 2키 · **`Number(totalMultiplier) > 0` 진실** · UI `bets[] × winningNumber` ❌
- **zero pocket:** straight/0 only · split `0|1` LOSE on 0
- **split:** lower pocket · `|a−b|===1` UI reject · engine silent-fail 보완
- **5단 + Fairness:** RGGate · Confirm(i18n) · Rules 10키 · FairnessSheet · Shortkeys · Celebrate · reduced-motion
- **mock:** `evaluateRoulette` local mirror · emit `toFixed(6)` string · `bet.multiplier = Number(totalMultiplier)`
- **red-grep 8종** (+ optional #9 forbidden testids) · vitest **§E 실측 N/N**
- **testid:** handoff §5 정본 9 money + optional 3 + roulette 5
- **실행:** `§0-RED → A-1 → A-3 → A-2 → A-4 → A-5 → §B → §C`
- **order override:** handoff v10 §7 Roulette first · Master Plan §4 Roulette last deferred
- **PHONARA:** §1-H N/A · `GAMES-INTEGRATION.md` roulette Result ✅ · handoff v11 merge ✅
- **macro:** Roulette GREEN → macro Phase 4 Roulette ✅ → Blackjack next

---

#### Limbo §E closeout (실측 기록)

```
[END PHASE 4 · Limbo Closeout]
0-0 useMockPipeline preview guard (throw → warn)
+ 0-0b GameBackLink (Lovable preview 10라우트 · PHONARA paste 시 CasinoLovableSurface 1회)
A-1~A-6 PASS · B-1 vitest 40/40 PASS · B-2 e2e limbo.spec.ts: WRITTEN
C-1 red:grep ALL 0 : PASS
C-2 limbo-checkpoint.md v1.3 final-r2: PASS (3구간 + superseded ×2 + §nav)
D chunk/60fps: MANUAL · Pixi: Phase 2.5 defer
Result: GREEN (local · e2e CI-pending)
```

---

## 2. Phase 0–1 완료 요약

### Phase 0 `[END PHASE 0]`

- `scripts/` (qa, e2e, lighthouse:mobile, red:grep — **i18n toast emoji 검사 포함**)
- Playwright 3 profile + axe spec + lighthouserc
- **red:grep: 7/7 OK, exit 0**

### Phase 1 `[END PHASE 1]`

- A–G 7폴더 + `visuals/` + `hooks/` (각 ≥1 export + vitest)
- `useReducedMotionGuard` vitest 3 cases
- Shared root: **BetPanel** (`casino-* 4종 on panel, `betpanel-*` 0), **FairnessSheet**, **RGGate**, **BetHistoryStrip**, **ProvablyFairBadge**, **GameRulesSheet/Trigger**
- SEO 3 components + smoke · **useGameShortkeys** infra
- **vitest 176/176 · typecheck pass · red:grep ALL 0**

---

## 3. Phase 2 v3 — Crash (템플릿 게임 · GREEN)

### 3.1 구현 완료 (코어 와이어링)

| ID | 산출 |
|----|------|
| B-1 | `RGGateProvider` + `useRGGate` (mock policy, paste-time Cursor 주입) |
| B-3 | `BetConfirmDialog` — 3 testid, **`open=true`만 DOM** |
| B-2 | `ProvablyFairBadge` — hash 8자 prefix |
| A-1 | FairnessSheet + `casino-fairness-verifier` + **`casino-client-seed-input`** (sheet open) |
| A-2 | GameRules controlled `rulesOpen` + `?` shortkey |
| A-3 | BetConfirmDialog on `confirmOpen` |
| A-4 | `Controls.shared` `await rg.gate("place_bet")` → `onOpenBetConfirm` |
| A-5 | Space 상태머신 3분기 + 1/2/5/Esc/? (desktop, input focus no-op) |
| A-6 | Celebrate **win only** (아래 스키마) |
| A-7 | feel shake/juice + reducedMotion |
| HUD | `useMockGhost(5)` + BetHistoryStrip · optional `data-testid="casino-presence-ghost"` |

**vitest: 186/186 PASS · red:grep ALL 0**

### 3.2 Crash `bet.result` (PHONARA 정본 — celebrate/feel 필수)

```ts
// packages/game-engine/src/games/crash.ts
{ crashMultiplier: number; cashedOut: boolean; cashoutMultiplier?: number }
// ❌ top-level bet.multiplier 없음 · ❌ bet.result.crashed 없음
```

```ts
const r = bet?.result as { cashedOut?: boolean; cashoutMultiplier?: number };
const win = r?.cashedOut === true && (r.cashoutMultiplier ?? 0) >= 1.01;
const tier = win ? celebrationTier(r.cashoutMultiplier!) : 'none';
// loss: cashedOut === false → tier none + screenShake only
```

### 3.3 9 testid 소유 (attached-after-flow)

| testid | Owner | When |
|--------|-------|------|
| `casino-stake-input` | BetPanel | first paint |
| `casino-prepare-hash` | BetPanel | first paint |
| `casino-place-bet` | BetPanel | first paint |
| `casino-error` | BetPanel | disabledReason |
| `casino-client-seed-input` | FairnessSheet | PF sheet open |
| `casino-fairness-verifier` | FairnessSheet wrapper | PF sheet open |
| `casino-bet-confirm` ×3 | BetConfirmDialog | `confirmOpen === true` |

**Cursor paste:** Lovable preview mock만 활성 · PHONARA adapter **한 layer만 live** (이중 마운트 방지).

### 3.4 Phase 2 closeout 보고 (실제 출력됨)

```
Result: GREEN (D MANUAL · Pixi Phase 2.5 defer)
C-3 e2e crash.spec.ts: WRITTEN  ← Zenith 풀-green 위해 PASS 승격 필요 (§4.0-3)
```

### 3.5 Phase 2 v3 검토 이력 (승인 버전)

| 버전 | 변경 |
|------|------|
| v1 | 초안 — YELLOW 6건 |
| v2 | split/`?`/9 attached-flow/Zenith D 병합 |
| v3 | `cashoutMultiplier` (not `bet.multiplier`) + BetPanel 4 testid in §E |
| **v3 closeout** | 186/186 + §E 게이트 출력 |

---

## 4. Phase 2 잔여 (다음 채팅 **먼저** · ~5분)

Zenith **풀 GREEN** + checkpoint 완성.

### 4.0-1 `crash-checkpoint.md` 3줄 추가

"Contract Anchors" 또는 "Phase 2 §E 누락 보완":

- `GameRulesTrigger` + `casino-game-rules` (step≥4, tip≥2) — owner: `games/shared/GameRulesSheet.tsx`
- `selection { autoCashout: string }` vitest freeze — `CrashGame.contract.test.tsx`
- Presence `useMockGhost(5, 3500)` — `games/crash/HUD.tsx` (`casino-presence-ghost` optional, non-money)

### 4.0-2 D MANUAL 1줄

`bun run build` chunk gzip 실측 또는 측정 환경 메모 1줄 (Phase 2.5 defer 위).

### 4.0-3 C-3 e2e PASS 승격

```bash
bun run test:e2e -- tests/e2e/games/crash.spec.ts
# 3 profile: desktop-chromium, iphone-14-pro, pixel-7 · axe 0 · thumb zone
```

통과 시: **C-3: WRITTEN → PASS** (채팅 보고만). 실패 시 셀렉터/strict mode만 수정 — **와이어링 본문 no-touch**.

---

## 5. Phase 3 — Plinko (Crash 1:1 복사 · **승인됨**)

### 5.1 🔴 RED 수정 반영 (착수 전 필수)

플랜 초안 `{ bin, multiplier }` **사용 금지**. PHONARA 정본:

```ts
// packages/game-engine/src/games/plinko.ts
{ path: number[]; bucket: number; bucketMultiplier: string }
```

```ts
const mult = Number(r?.bucketMultiplier ?? 0);
const win = mult >= 1.01;
const tier = win ? celebrationTier(mult) : 'none';
// loss feel: mult < 1 → screenShake · win → juice
```

**selection freeze:** `{ rows: 8 | 12 | 16, risk: 'low' | 'medium' | 'high' }`

### 5.2 🟡 BetConfirm summary i18n

JSX 한국어 금지 — `t('casino.field.risk')` / `t('casino.field.rows')` 등.

### 5.3 Plinko 마운트 (Crash 동일 · 차이만)

| Step | 작업 |
|------|------|
| A-1 | `index.tsx`: RGGateProvider, BetConfirmDialog, GameRulesSheet, shortkeys |
| A-2 | `Stage.tsx`: celebrate/feel on **`bucketMultiplier`** |
| A-3 | `Controls.shared.tsx`: RG await |
| A-4 | `HUD.tsx`: `useMockGhost(5, 3500)` |
| A-5 | FairnessSheet + ProvablyFairBadge `gameCode="plinko"` |

### 5.4 테스트

- Crash `__tests__/` 6종 복사 → selection/result 교체
- **신규:** `Plinko.celebrate.test.tsx`, `Plinko.shortkeys.test.tsx`
- `PlinkoGame.contract.test.tsx`: 9 testid after-flow + `{ rows, risk }` freeze
- **e2e:** `tests/e2e/games/plinko.spec.ts` (Crash spec 복사, `/casino/plinko`)

### 5.5 증거

- `.lovable/memory/plinko-checkpoint.md` (crash 구조 복사 · Win/Loss = `Number(bucketMultiplier)`)
- red:grep ALL 0
- Phase 3 §E 게이트 블록 (Crash §E 포맷)

### 5.6 실행 순서 (한 턴)

```
4.0-1 → 4.0-2 → 4.0-3 (Crash 잔여)
  ↓
Plinko A-1 → A-2 → A-3 → A-4 → A-5
  ↓
B vitest + e2e
  ↓
plinko-checkpoint.md + §E 게이트 보고
```

### 5.7 비대상

- Pixi/Matter → Phase 2.5 defer
- Dice/Mines/HiLo/Limbo/신규 4종 → Phase 4+
- 실제 RG policy → Cursor paste-time

---

## 6. 공유 컴포넌트 (Phase 2에서 생성 · Phase 3+ 재사용)

| 파일 | 역할 |
|------|------|
| `shared/RGGateProvider.tsx` | `gate("place_bet")` · policy mock |
| `shared/BetConfirmDialog.tsx` | 3 testid · `open` controlled |
| `shared/ProvablyFairBadge.tsx` | PF sheet trigger |
| `shared/FairnessSheet.tsx` | verifier + client-seed testids |
| `shared/GameRulesSheet.tsx` | `casino-game-rules` |
| `shared/BetPanel.tsx` | 4 first-paint testids |
| `shared/hooks/useGameShortkeys.ts` | Space 3-state machine |
| `shared/celebrate/*` | 6-tier · win input = per-game multiplier field |
| `shared/feel/*` | screenShake · juice |

**기술 메모:** `useGameShortkeys` deps 재등록 — Crash에서 OK, 성능 이슈 시 별도 Phase.

---

## 7. 게임별 result 필드 치트시트 (celebrate/feel)

| gameCode | result 필드 (PHONARA) | Win celebrate | Loss feel |
|----------|----------------------|---------------|-----------|
| **crash** | `cashedOut`, `cashoutMultiplier` | `cashedOut && cashoutMultiplier ≥ 1.01` | `!cashedOut` → shake |
| **plinko** | `bucketMultiplier` (string) | `Number ≥ 1.01` | `Number < 1` → shake |
| **limbo** | `resultMultiplier`, `won` | `won && resultMultiplier ≥ 1.01` | `!won && resultMultiplier ≥ 1.01` → shake |
| **mines** | `minePositions`, `hitMine` | `!hitMine && revealed>0` · tier=`minesMultiplier(mineCount, n)` | `hitMine` → shake |
| dice/hilo/… | GAMES-INTEGRATION §selection | Phase 3+ 잔여 | — |

---

## 8. §E 게이트 보고 템플릿 (복붙용)

### Crash (완료 · C-3만 승격 대기)

```
[END PHASE 2 v3 · Crash Closeout]
A-1~A-7 · B-1~B-3 · C-1/C-2 vitest 186/186 · red:grep ALL 0 : PASS
C-3 e2e crash.spec.ts: WRITTEN → PASS (after §4.0-3)
D chunk/60fps: MANUAL · Pixi: Phase 2.5 defer
crash-checkpoint.md: PASS (+ §4.0-1 3줄)
Result: GREEN
```

### Plinko (완료 · e2e CI-pending)

```
[END PHASE 3 · Plinko Closeout]
(same sections as Crash §E · bucketMultiplier win/loss · plinko-checkpoint.md)
Result: GREEN (D MANUAL · Pixi 2.5 defer · e2e CI-pending)
```

### Limbo (완료 · e2e CI-pending)

```
[END PHASE 4 · Limbo Closeout]
(see §1-E block · resultMultiplier/won 3구간 · limbo-checkpoint v1.3 final-r2)
Result: GREEN (local · e2e CI-pending)
```

---

## 9. PHONARA monorepo vs Lovable (혼동 방지)

| 항목 | Lovable (지금 작업) | PHONARA repo (paste 후) |
|------|---------------------|-------------------------|
| 게임 UI | `src/games/crash/` 완성 | → `apps/web/src/components/games/crash/` |
| 엔진/RPC | mock pipeline only | `use-casino-round.ts` + `mapGameSurfaceProps` |
| testid 정의 | 로컬 상수 9개 이름 1:1 | `casino-e2e-testids.ts` import |
| types | Lovable `ImportedGameSurfaceProps` | `apps/web/.../shared/types.ts` (JSDoc 7개→9개 delta) |
| ENGINE 100 | **범위 밖** | [`ENGINE_100_HANDOFF.md`](ENGINE_100_HANDOFF.md) |

---

## 10. 하지 말 것

- ❌ `bet.result.grid` (slot RED)
- ❌ roulette split `value` = sum
- ❌ Plinko `bin` / `multiplier` 필드명
- ❌ JSX 하드코딩 한국어 (BetConfirm summary 포함)
- ❌ `@phonara/game-engine` 정적 import in `src/games/**`
- ❌ parallel plan 파일 대량 생성 (checkpoint.md만 게임별)
- ❌ Phase 3 전 Crash §4.0 잔여 미완
- ❌ Stage result shape 변경 후 `useMockPipeline.simulate()` 미동기 (handoff §1-F §1)
- ❌ BetPanel `!ready` secondary/primary 동일 "라운드 준비" 라벨 (handoff §1-F §2)

---

## 11. 새 채팅 첫 지시 (복붙용)

> **권장:** [`LOVABLE_ZENITH_CHAT_HANDOFF.md`](LOVABLE_ZENITH_CHAT_HANDOFF.md) — 상태·Mines LOCK·금지·§E **전부 인라인**.

```text
@docs/LOVABLE_ZENITH_CHAT_HANDOFF.md
```

---

## 12. 관련 문서 인덱스

| 용도 | 파일 |
|------|------|
| **새 채팅 (종합 인계)** | **[`LOVABLE_ZENITH_CHAT_HANDOFF.md`](LOVABLE_ZENITH_CHAT_HANDOFF.md)** |
| **장문 히스토리** | **이 파일** |
| Lovable 실행 마스터 | `LOVABLE_ZENITH_MASTER_PLAN.md` |
| 제품/퍼널/바이럴 | `LOVABLE_PRODUCT_PLATFORM_MANIFEST.md` |
| P1 ZIP / testid | `LOVABLE_P1_FINAL_PHONARA.md` |
| selection/RPC | `GAMES-INTEGRATION.md` |
| Crash Lovable QA | `LOVABLE_CRASH_CHECKPOINT.md` |
| 카지노 엔진/ZIP-1 | `CHAT_HANDOFF_2026-06-14.md` |
| ENGINE 100 Supabase | `ENGINE_100_HANDOFF.md` |
| 변경 이력 | `WORK_LOG_2026-06-14.md` |

---

*LOVABLE_ZENITH_SESSION_HANDOFF · v11 · 6/10 GREEN · Roulette RED LOCK FINAL+ ACTIVE*
