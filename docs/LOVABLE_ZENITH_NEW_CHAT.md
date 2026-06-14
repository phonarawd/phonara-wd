# Lovable Zenith — 새 Cursor 채팅 부트스트랩 (v1 · 2026-06-14)

> **이 파일을 새 채팅 첫 메시지로 붙여넣기** — `@docs/LOVABLE_ZENITH_NEW_CHAT.md`  
> **장문 정본:** [`LOVABLE_ZENITH_SESSION_HANDOFF.md`](LOVABLE_ZENITH_SESSION_HANDOFF.md) (검토·히스토리·§E 템플릿)  
> **PHONARA 엔진:** [`CHAT_HANDOFF_2026-06-14.md`](CHAT_HANDOFF_2026-06-14.md) · [`ENGINE_100_HANDOFF.md`](ENGINE_100_HANDOFF.md)

---

## 0. AI가 먼저 읽을 것 (혼동 방지 · 필수)

### 0-A. 두 개의 작업 공간 — 절대 혼동 금지

| | **Lovable 워크스페이스** | **PHONARA monorepo** (`phonara-gb`) |
|---|-------------------------|-------------------------------------|
| **역할** | 게임 UI **실제 구현** | 엔진·RPC·docs · paste **대기** |
| **경로** | `src/games/**`, `.lovable/memory/**` | `apps/web/src/components/games/*` |
| **mines 예시** | `src/games/mines/Stage.tsx` 등 **여기 수정** | `imported-mines-game.tsx` = **placeholder만** |
| **mock** | `src/games/preview/useMockPipeline.ts` | **파일 없음** (`.lovableignore`) |
| **Cursor 채팅이 phonara-gb만 열렸을 때** | 코드 직접 수정 **불가** → spec/handoff 갱신 · Lovable 경로 요청 | docs · `GAMES-INTEGRATION.md` · engine **read-only** |

**첫 행동:** Lovable `src/games/` 트리가 워크스pace에 **없으면** Mines 구현 시작하지 말고, operator에게 Lovable 워크스페이스 열기 또는 ZIP 경로를 요청.

### 0-B. 레이어 분리

| 레이어 | 소유 | Cursor (이 채팅) |
|--------|------|------------------|
| RNG · 정산 · RPC · `game_code` | PHONARA 엔진 (**완료**) | **한 줄도 수정 금지** |
| Stage/HUD/Controls · mock preview | **Lovable 100%** | Crash 템플릿 복사 · callback only |

### 0-C. AI 흔한 실수 (하지 말 것)

1. ❌ PHONARA `apps/web/.../imported-mines-game.tsx` placeholder에 Mines UI 구현  
2. ❌ `packages/game-engine`, `supabase/*` 수정  
3. ❌ `@phonara/game-engine` / `rpc_*` 를 `src/games/**` 에 static import  
4. ❌ Plinko `{ bin, multiplier }` · Mines `{ mines, hit }` · Limbo `bet.result.multiplier`  
5. ❌ Stage result shape 변경 후 `useMockPipeline.simulate()` 미동기 (preview 베팅 무반응)  
6. ❌ 9 testid 외 ID 추가 (`casino-cashout`, `casino-currency-select` 등)  
7. ❌ `@docs/LOVABLE_ZENITH_SESSION_HANDOFF.md` 만 언급하고 **이 bootstrap §0-A 안 읽음**

---

## 1. 지금 어디까지 왔나 (2026-06-14)

### 완료 ✅

| 항목 | 증거 |
|------|------|
| Macro Phase 0–2 | Foundation · Shared A–G · **Crash** 템플릿 |
| 게임 **3/10 GREEN** (Lovable local) | crash · plinko (vitest 200) · limbo (vitest 40, red:grep 0) |
| §1-F hotfix | mock limbo/plinko/crash shape · BetPanel **"해시 커밋"** 라벨 · **preview PASS** |
| 공통 infra | `RGGateProvider` · `BetConfirmDialog` · `GameRulesSheet` · `GameBackLink` · 9 testid flow |

### 아직 ⏳ (블로커 아님)

- crash / plinko / limbo **e2e** WRITTEN → CI/local PASS  
- `casino-game-back` back smoke 3 spec  
- PHONARA paste · Phase 5–10 (shell · Earn · 32p · Admin · ZIP)

### 다음 1턴 🎯

**Mines v1** — Crash/Plinko/Limbo Phase 4 패턴 1:1 · **Lovable workspace에서만**

---

## 2. 이번 턴 — Mines v1 (LOCK · Phase 4 패턴 1:1)

### §0-RED (선행 · 비협상)

엔진 정본 (`packages/game-engine/src/games/mines.ts` L11–14 · `casino_parity_test.sql`):

```ts
export interface MinesResult { minePositions: number[]; hitMine: boolean; }
selection: { mineCount: number; revealedCells: number[] }
```

Lovable mock·Stage `{ mines, hit }` → paste 시 adapter **조용히 깨짐**.

| 파일 | 작업 |
|------|------|
| `mines/Stage.tsx` L36, 82–83 | `result as { minePositions?; hitMine? }` · `isMineHit` / `isSafeReveal` |
| `preview/useMockPipeline.ts` mines | `{ minePositions, hitMine }` emit |
| `shared/types.ts` | `MinesResult` 있으면 동기 |

**Gate:** `rg -n "result\.(mines|hit)\b" src/games/mines/ src/games/preview/` → **0건**

### §0-a · §0-b

- **§0-a:** `Controls.shared.tsx` L39 `"라운드 준비"` → `"해시 커밋"`
- **§0-b — money 9개** = PHONARA `apps/web/src/features/casino/casino-e2e-testids.ts` 1:1:
  - BetPanel: `casino-stake-input` · `casino-prepare-hash` · `casino-place-bet` · `casino-error`
  - Fairness open: `casino-client-seed-input` · `casino-fairness-verifier`
  - Confirm `open=true`: `casino-bet-confirm` · `casino-bet-confirm-confirm` · `casino-bet-confirm-cancel`
- **Optional non-money:** `casino-game-back` · `casino-presence-ghost`
- Mines는 cashout 분리 없음 (`casino-place-bet` 통합) · `casino-currency-select` 없음 · ❌ `casino-fairness-trigger` (정본 = `casino-fairness-verifier` on sheet open)

### §A — wiring (비주얼 1px 무변경)

| ID | 내용 |
|----|------|
| A-1 | `index.tsx`: `RGGateProvider` · `BetConfirmDialog` (N칸 · `minesMultiplier`) · **`GameRulesSheet`** → testid **`casino-game-rules`** · **PF sheet** → `casino-fairness-verifier` (open 후) · `useGameShortkeys` Space 2분기 + `1/2/5/Esc/?` |
| A-2 | `Stage.tsx`: `hitMine`→shake+lose · `!hitMine&&revealed>0`→juice+celebrate · `tierOf(Number(minesMultiplier(...)))` ≥1.01 · `CelebrateOverlay` · `useReducedMotionGuard` |
| A-3 | `Controls.shared.tsx`: `await rg.gate("place_bet")` on primary when ready+revealed · `secondaryLabel="해시 커밋"` |
| A-4 | `HUD.tsx`: `data-testid="casino-presence-ghost"` strip (Limbo 패턴) |
| A-5 | i18n `casino.field.next_multiplier` 등 (raw ko/en) |

### §B — vitest (정본 키)

기존 5 + `celebrate.test.tsx` + `shortkeys.test.tsx`:

- celebrate: `{ minePositions:[5,12], hitMine:false }` + revealed=[0,1,2] → juice · tier set
- loss: `{ minePositions:[0,5], hitMine:true }` revealed=[0] → screenShake · lose sound
- settled=false → no-op
- shortkeys: Space 2단계 · 빈 선택 openConfirm no-op · Esc/1/2/5

목표 **40+ PASS**.

### §C — closeout

- **C-1:** `result.(mines|hit)` 0 · `rg "라운드 준비" src/games/mines/` 0 · `rg "casino-(cashout|currency-select|fairness-trigger)" src/games/mines/` 0 · red:grep ALL 0
- **C-2:** `.lovable/memory/mines-checkpoint.md` — result shape · feel 2지 · tier ≥1.01 · 해시 커밋 · testid money 9 + optional 2 · `minesMultiplier(mineCount, revealCount)` engine fn 통일
- **C-3 §E:** `Mines v1 — RED({mines/hit}→{minePositions/hitMine}) + RGGate/Confirm/Shortkeys/Feel/Rules + 해시 커밋 + testid 정본`

**실행 순서:** §0-RED → §0-a → §0-b → A-1 → A-3 → A-2 → A-4 → A-5 → B → C-1 → C-2 → C-3

---

## 3. result shape 치트시트 (완료 게임 + Mines)

| game | result (PHONARA) | win feel | loss feel |
|------|------------------|----------|-----------|
| crash | `cashedOut`, `cashoutMultiplier` | cashedOut && ≥1.01 | !cashedOut shake |
| plinko | `bucketMultiplier` string | Number≥1.01 | Number<1 shake |
| limbo | `resultMultiplier`, `won` | won && ≥1.01 | !won shake |
| **mines** | **`minePositions`, `hitMine`** | **!hitMine && revealed>0** | **hitMine shake** |

---

## 4. Mines GREEN 후 순서

1. **HiLo** → **Dice** (macro Phase 3)  
2. **Roulette** → **Blackjack** (macro Phase 4)  
3. **MintReels** / **GoldRush**  
4. Phase 5–10: shell · Earn · 32 pages · Admin · ZIP export

---

## 5. 새 채팅 첫 지시 (한 줄)

```text
@docs/LOVABLE_ZENITH_NEW_CHAT.md — §0-A 워크스페이스 확인 후 Mines v1 §2 실행. Lovable src 없으면 placeholder repo에 구현하지 말 것. PHONARA 엔진 no-touch.
```

---

## 6. 계약 문서 (Lovable AI paste 번들)

1. `LOVABLE_ZENITH_MASTER_PLAN.md`  
2. `LOVABLE_PRODUCT_PLATFORM_MANIFEST.md`  
3. `LOVABLE_P1_FINAL_PHONARA.md`  
4. `GAMES-INTEGRATION.md`  

**우선순위:** 기술/testid → GAMES-INTEGRATION > P1 > Zenith · 카피 → Manifest

---

*LOVABLE_ZENITH_NEW_CHAT · v2 · Mines v1 LOCK · bootstrap · state = SESSION_HANDOFF v5*
