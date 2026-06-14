# PHONARA Lovable Zenith — 지구끝판왕 인계문 (새 채팅 · 2026-06-15)

> **새 Cursor/Lovable 채팅 첫 메시지:** `@docs/LOVABLE_ZENITH_CHAT_HANDOFF.md` **또는** 아래 §「AI 첫 지시」전체 복붙.  
> **이 파일 = 단일 부트스트랩 정본** — 상태·다음 작업·Mines LOCK spec·금지사항·에이전트 행동 규칙 **전부 인라인**.  
> **장문 히스토리/§E 아카이브:** [`LOVABLE_ZENITH_SESSION_HANDOFF.md`](LOVABLE_ZENITH_SESSION_HANDOFF.md) v5  
> **PHONARA 엔진 10종:** [`CHAT_HANDOFF_2026-06-14.md`](CHAT_HANDOFF_2026-06-14.md) · **ENGINE 100:** [`ENGINE_100_HANDOFF.md`](ENGINE_100_HANDOFF.md)

**PHONARA repo:** `c:\Users\PC\Desktop\phonara-gb` · **브랜치:** `main` · **HEAD:** `84eac23`  
**Lovable workspace:** `src/games/**`, `src/components/**`, `.lovable/memory/**` (별도 canvas — PHONARA repo에 **없음**)  
**마지막 갱신:** 2026-06-15 · **다음 1턴:** **Mines v1 LOCK** (Lovable build · §0-RED 선행)

---

## AI 첫 지시 (복붙용 · 이 블록만으로 시작 가능)

```text
@docs/LOVABLE_ZENITH_CHAT_HANDOFF.md 를 정본으로 Lovable Zenith를 이어서 진행.

【필수 선행】§2 워크스페이스 판별 — Lovable src/games/ 없으면 phonara-gb placeholder에 코드 쓰지 말고 operator에게 Lovable 경로 요청.

【현재 상태】게임 3/10 GREEN (crash·plinko·limbo) · §1-F hotfix APPLIED+preview PASS · Mines v1 LOCK 대기(미구현).

【이번 턴】§6 Mines v1 전체 실행 — §0-RED {minePositions,hitMine} 선행.

【금지】packages/* supabase/* 수정 · src/games/** 에 @phonara/game-engine/rpc static import · {mines,hit}/{bin,multiplier} · placeholder UI 구현.

【완료 보고】§6 §C-3 §E 형식 + vitest 실측 N/N + red:grep ALL 0.
```

---

## 0. 한 줄 미션

**Stake/Rollbit급 UI = Lovable 100%** · **돈·RNG·정산·RPC = PHONARA 엔진 (UI 작업 중 절대 no-touch)** · Earn first · Trade last · Phase 10 ZIP → PHONARA paste.

---

## 1. 절대 원칙 (9개 · 매 턴 반복)

| # | 규칙 |
|---|------|
| 1 | UI 100% Lovable — PHONARA `apps/web` 시각 **paste 전 수정 금지** |
| 2 | 엔진 no-touch — `packages/*`, `supabase/*`, hooks 정산 **한 줄도 금지** |
| 3 | Callback only — `ImportedGameSurfaceProps` + mock · `rpc_*`/`@phonara/game-engine` **static import 0** |
| 4 | **Money testid 9개** — `apps/web/src/features/casino/casino-e2e-testids.ts` 1:1 · `casino-submit-bet`/`betpanel-*` 금지 |
| 5 | i18n — JSX 한국어 0 · toast emoji 0 (rules sheet만 제한적 OK) |
| 6 | red:grep ALL 0 |
| 7 | 게임마다 Crash 템플릿 복사 · checkpoint `.lovable/memory/{game}-checkpoint.md` |
| 8 | Phase GREEN 전 다음 Phase 금지 · Pixi = Phase 2.5 defer |
| 9 | Stage result shape 변경 시 **`useMockPipeline.simulate()` 동 게임 분기 동시 수정** |

**계약 4파일 (Lovable AI paste):** `LOVABLE_ZENITH_MASTER_PLAN.md` · `LOVABLE_PRODUCT_PLATFORM_MANIFEST.md` · `LOVABLE_P1_FINAL_PHONARA.md` · `GAMES-INTEGRATION.md`  
**우선순위:** 기술/testid → GAMES-INTEGRATION > P1 > Zenith · 카피 → Manifest

---

## 2. 워크스페이스 판별 (AI 첫 행동 · 필수)

```
워크스pace에 src/games/crash/ 또는 src/games/mines/ 존재?
  ├─ YES → Lovable 모드: §6 Mines v1 코드 구현 진행
  └─ NO  → PHONARA-only 모드:
           · docs/handoff 갱신만 가능
           · imported-*-game.tsx placeholder **수정 금지**
           · operator에게 Lovable workspace 열기/ZIP 요청
           · packages/game-engine 은 **read-only 참조**만
```

| | **Lovable** | **PHONARA (`phonara-gb`)** |
|---|-------------|------------------------------|
| Mines UI | `src/games/mines/**` | `apps/web/.../imported-mines-game.tsx` = placeholder |
| mock preview | `src/games/preview/useMockPipeline.ts` | 없음 (`.lovableignore`) |
| paste 후 | ZIP export | `apps/web/src/components/games/mines/` 1:1 |

---

## 3. 지금까지 완료 (DONE · Lovable local)

### 3-A. Macro Phase

| Phase | 내용 | 상태 |
|-------|------|------|
| 0–1 | Foundation · Shared A–G | ✅ GREEN |
| 2 | Crash 템플릿 | ✅ GREEN · e2e CI-pending |
| 3 | P1 5종 | 🟡 Plinko✅ Limbo✅ **Mines⏳** HiLo/Dice⏳ |

### 3-B. 게임 10종 턴 (3/10 GREEN)

| # | game | Lovable | selection | result (PHONARA 정본) |
|---|------|---------|-----------|------------------------|
| 1 | crash | ✅ GREEN | `{ autoCashout }` | `{ crashMultiplier, cashedOut, cashoutMultiplier }` number |
| 2 | plinko | ✅ vitest 200 | `{ rows, risk }` | `{ path, bucket, bucketMultiplier:string }` |
| 3 | limbo | ✅ vitest 40 · red:grep 0 | `{ target }` | `{ resultMultiplier, won }` |
| 4 | **mines** | **⏳ 다음 LOCK** | `{ mineCount, revealedCells[] }` | **`{ minePositions, hitMine }`** |
| 5 | hilo | ⏳ | `{ startCard, guesses[] }` | (Phase 3+) |
| 6 | dice | ⏳ | `{ target, direction }` | `{ roll, won }` |
| 7–10 | mint_reels/gold_rush/blackjack/roulette | ⏳ Phase 4 | GAMES-INTEGRATION | |

### 3-C. Limbo v1.3 final-r2 closeout ✅

- §0-0 useMockPipeline warn · §0-0b GameBackLink · A-1~A-6 · vitest **40/40** · red:grep ALL 0 · checkpoint v1.3 final-r2 · §E ✅  
- e2e `limbo.spec.ts`: 🟡 WRITTEN (CI-pending)

### 3-D. §1-F Hotfix ✅ APPLIED + preview PASS (2026-06-14)

| # | 내용 |
|---|------|
| 1 | `useMockPipeline.simulate()` crash/plinko/limbo → PHONARA result shape (crash **number**) |
| 2 | BetPanel L171 `"해시 커밋 완료"` + crash/plinko/limbo Controls `secondaryLabel="해시 커밋"` |
| 3 | `limbo-checkpoint.md` hotfix 메모 |
| 4 | preview `/casino/{limbo,plinko,crash}` 베팅 + 라벨 구분 **PASS** |

### 3-E. 공통 infra (Crash 템플릿 · 재사용)

`RGGateProvider` · `BetConfirmDialog` (confirm open만 DOM) · `GameRulesSheet` (`casino-game-rules`) · `FairnessSheet` (`casino-fairness-verifier`+`casino-client-seed-input`) · `GameBackLink` · `useGameShortkeys` · celebrate/feel · `useMockGhost` · BetPanel 9 testid flow

**Crash 템플릿 1턴 패턴:** index(RG+Confirm+Rules+shortkeys) → Controls(RG await+해시커밋) → Stage(feel) → HUD(ghost) → vitest+e2e → checkpoint → red:grep → §E

---

## 4. feel / celebrate 치트시트

| game | win | loss | neutral |
|------|-----|------|---------|
| crash | `cashedOut && cashoutMultiplier≥1.01` juice | `!cashedOut` shake | — |
| plinko | `Number(bucketMultiplier)≥1.01` | `<1` shake | — |
| limbo | `won && resultMultiplier≥1.01` | `!won && ≥1.01` shake | won && 1.0~1.01 |
| **mines** | **`!hitMine && revealed>0`** tier `minesMultiplier≥1.01` | **`hitMine`** shake | — |

---

## 5. testid 정본

### Money 9 (필수 · `casino-e2e-testids.ts`)

| testid | Owner | When |
|--------|-------|------|
| `casino-stake-input` | BetPanel | first paint |
| `casino-prepare-hash` | BetPanel | first paint |
| `casino-place-bet` | BetPanel | first paint |
| `casino-error` | BetPanel | disabledReason |
| `casino-client-seed-input` | FairnessSheet | PF open |
| `casino-fairness-verifier` | FairnessSheet | PF open |
| `casino-bet-confirm` | BetConfirmDialog | confirm open |
| `casino-bet-confirm-confirm` | BetConfirmDialog | confirm open |
| `casino-bet-confirm-cancel` | BetConfirmDialog | confirm open |

### Optional non-money

`casino-game-back` · `casino-presence-ghost` · `casino-game-rules` (GameRules trigger)

### ❌ Mines에 없음

`casino-cashout` · `casino-currency-select` · `casino-fairness-trigger` · `casino-submit-bet` · `betpanel-*`

---

## 6. 다음 1턴 — Mines v1 (**LOCK · 미구현 · Lovable에서 실행**)

> **상태:** spec LOCK · operator 승인 완료 · **코드 구현 대기**  
> **패턴:** Crash/Plinko/Limbo Phase 4 · **비주얼 1px 무변경**

### §0-RED — result key 전면 교체 (선행 · 비협상)

```ts
// packages/game-engine/src/games/mines.ts L11-14
export interface MinesResult { minePositions: number[]; hitMine: boolean; }
// selection: { mineCount: number; revealedCells: number[] }
```

현 Lovable `{ mines, hit }` → paste 시 adapter **조용히 깨짐**.

| 파일 | 변경 |
|------|------|
| `mines/Stage.tsx` L36, 82–83 | 아래 snippet |
| `preview/useMockPipeline.ts` mines | `{ minePositions, hitMine }` emit |
| `shared/types.ts` | `MinesResult` 동기 |

```ts
const result = p.bet?.result as { minePositions?: number[]; hitMine?: boolean } | undefined;
const isMineHit = settled && result?.minePositions?.includes(i);
const isSafeReveal = settled && result?.minePositions && !result.minePositions.includes(i) && isRevealed;
```

**Gate:** `rg -n "result\.(mines|hit)\b" src/games/mines/ src/games/preview/` → **0**

### §0-a · §0-b

- **§0-a:** `Controls.shared.tsx` L39 `"라운드 준비"` → `"해시 커밋"`
- **§0-b:** §5 testid 정본 준수

### §A — wiring

**A-1 `index.tsx`**

```tsx
export function ImportedMinesGame(p: ImportedGameSurfaceProps<"mines">) {
  return (
    <RGGateProvider>
      <MinesSurface {...p} />
    </RGGateProvider>
  );
}
```

- `useGameShortkeys` Space 2분기 (0 tile → openConfirm no-op) + `1/2/5/Esc/?`
- `BetConfirmDialog` summary: N칸 · `minesMultiplier(mineCount, revealCount)`
- **`GameRulesSheet`** → `data-testid="casino-game-rules"`
- **`FairnessSheet`** 별도 → `casino-fairness-verifier` + `casino-client-seed-input`

**A-2 `Stage.tsx`**

```ts
useEffect(() => {
  if (!settled) return;
  if (result?.hitMine) {
    screenShake(stageRef); playSound("lose");
  } else if (revealed.length > 0) {
    juice(badgeRef); playSound("win");
    setCelebrateTier(tierOf(Number(minesMultiplier(mineCount, revealed.length))));
  }
}, [p.bet?.id]);
```

`useReducedMotionGuard` · `CelebrateOverlay` · tier **≥ 1.01**

**A-3 `Controls.shared.tsx`**

```ts
const onPrimary = ready && revealed.length > 0
  ? async () => { if (await rg.gate("place_bet")) p.onOpenBetConfirm(); }
  : p.onPrepareRound;
```

**A-4 `HUD.tsx`:** `casino-presence-ghost` strip (Limbo 패턴)  
**A-5 i18n:** `casino.field.next_multiplier` 등 raw ko/en

### §B — vitest (기존 5 + 신규 2 → **40+ PASS**)

- `celebrate.test.tsx`: safe `{ minePositions:[5,12], hitMine:false }` revealed=[0,1,2] → juice · loss `{ minePositions:[0,5], hitMine:true }` revealed=[0] → shake · settled=false no-op
- `shortkeys.test.tsx`: Space 2단계 · 0 tile no-op · Esc/1/2/5

### §C — closeout

**C-1 red:grep**

```
rg -n "result\.(mines|hit)\b" src/games/mines/ src/games/preview/
rg -n "라운드 준비" src/games/mines/
rg -n "casino-(cashout|currency-select|fairness-trigger)" src/games/mines/
```

**C-2** `.lovable/memory/mines-checkpoint.md` 신규 — result shape · feel 2지 · tier ≥1.01 · 해시 커밋 · testid §5 · `minesMultiplier(mineCount, revealCount)` · GameRules vs Fairness 분리

**C-3 §E (완료 시 보고):**

```
[END PHASE 5 · Mines Closeout]
Mines v1 — RED({mines/hit}→{minePositions/hitMine}) + RGGate/Confirm/Shortkeys/Feel/Rules(casino-game-rules)/Fairness(casino-fairness-verifier) + 해시 커밋
§0-RED rg result.(mines|hit): 0 : PASS
A-1~A-5 PASS · B vitest <실측 N/N> PASS · B-2 mines.spec: WRITTEN|PASS
C-1 red:grep ALL 0 : PASS · C-2 mines-checkpoint.md: PASS
D chunk/60fps: MANUAL · Pixi: Phase 2.5 defer
Result: GREEN (local · e2e CI-pending)
```

### Mines 실행 순서

```
§0-RED → §0-a → §0-b → A-1 → A-3 → A-2 → A-4 → A-5 → B → C-1 → C-2 → C-3
```

**영향:** 5 파일 수정 + 2 test + checkpoint + mock · Crash/Plinko/Limbo **no-touch**

---

## 7. 대기열 (Mines GREEN 후)

| 순서 | 게임/Phase | 비고 |
|------|-----------|------|
| 1 | **HiLo** | Crash 템플릿 |
| 2 | **Dice** | macro Phase 3 잔여 |
| 3 | **Roulette** → **Blackjack** | macro Phase 4 |
| 4 | **MintReels** / **GoldRush** | |
| 5 | Phase 5–10 | shell · Earn · 32p · Admin · ZIP |

---

## 8. 선택 턴 (Zenith 풀-green · 블로커 아님)

- crash / plinko / limbo **e2e PASS** (`npx playwright install` 후)
- 3 spec **`casino-game-back`** smoke 1줄
- vitest **전체** 실측 N/N (Plinko 200 + Limbo 40 + Mines 40+ = 실측치)

---

## 9. AI 금지 · 흔한 실수

1. phonara-gb placeholder에 Mines/HiLo UI 구현  
2. `{ mines, hit }` · `{ bin, multiplier }` · `bet.result.multiplier`  
3. GameRules에 `casino-fairness-verifier` (→ `casino-game-rules`)  
4. mock shape drift (§1-F 교훈 — §0-RED 후 mines mock 동기)  
5. 엔진/RPC 수정으로 “빨리 맞추기”  
6. parallel plan/checkpoint 외 중복 md 양산  
7. Mines GREEN 전 HiLo 착수  

---

## 10. PHONARA repo 참조 (read-only)

| 경로 | 용도 |
|------|------|
| `packages/game-engine/src/games/mines.ts` | Mines result/selection 정본 |
| `apps/web/src/features/casino/casino-e2e-testids.ts` | testid 9 |
| `apps/web/src/components/games/*/imported-*-game.tsx` | placeholder — **no-touch** |
| `docs/GAMES-INTEGRATION.md` | selection + mines result |

---

## 11. 문서 인덱스

| 용도 | 파일 |
|------|------|
| **새 채팅 (이 파일)** | **`LOVABLE_ZENITH_CHAT_HANDOFF.md`** |
| 장문 히스토리·§E 아카이브 | `LOVABLE_ZENITH_SESSION_HANDOFF.md` |
| 짧은 bootstrap (이 파일로 supersede) | `LOVABLE_ZENITH_NEW_CHAT.md` |
| PHONARA 엔진/ZIP | `CHAT_HANDOFF_2026-06-14.md` |
| Zenith 마스터 플랜 | `LOVABLE_ZENITH_MASTER_PLAN.md` |
| 변경 이력 | `WORK_LOG_2026-06-14.md` |

---

*LOVABLE_ZENITH_CHAT_HANDOFF · v1 · 2026-06-15 · Games 3/10 GREEN · Hotfix PASS · Mines v1 LOCK 대기 · HEAD 84eac23*
