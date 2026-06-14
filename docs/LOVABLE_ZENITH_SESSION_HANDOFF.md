# PHONARA Lovable Zenith — 세션 인계문 (Phase 0→10 · 지존급)

> **새 Cursor 채팅 첫 메시지:** `@docs/LOVABLE_ZENITH_SESSION_HANDOFF.md` 참조 후 **§11「새 채팅 첫 지시」** 복붙.  
> **이 문서 = Lovable Zenith 진행 상태 정본** (검토·승인·구현·게이트·다음 작업).  
> **마지막 갱신:** 2026-06-14 · **다음 실행:** Limbo v1.3 final-r2 (Lovable 워크스페이스).  
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

**Lovable AI에 붙여넣을 계약 4파일:**

1. [`LOVABLE_ZENITH_MASTER_PLAN.md`](LOVABLE_ZENITH_MASTER_PLAN.md)  
2. [`LOVABLE_PRODUCT_PLATFORM_MANIFEST.md`](LOVABLE_PRODUCT_PLATFORM_MANIFEST.md)  
3. [`LOVABLE_P1_FINAL_PHONARA.md`](LOVABLE_P1_FINAL_PHONARA.md)  
4. [`GAMES-INTEGRATION.md`](GAMES-INTEGRATION.md)

**충돌 우선순위:** 기술/selection/testid → GAMES-INTEGRATION > P1 > Zenith · 제품/카피 → Manifest 항상 우선.

---

## 1. Phase 진행 상태 (한눈에) — 2026-06-14

> **작업 위치:** Lovable 프론트엔드 워크스페이스 (`src/games/**`, `.lovable/memory/**`).  
> **PHONARA repo:** `apps/web/src/components/games/*` = placeholder · paste 전.

### 1-A. 매크로 Phase (`LOVABLE_ZENITH_MASTER_PLAN.md` §4)

| Macro Phase | 내용 | 상태 |
|-------------|------|------|
| **0** | Foundation + QA | ✅ GREEN |
| **1** | Shared A–G + infra | ✅ GREEN |
| **2** | Crash (템플릿 1종) | ✅ GREEN (local) · e2e CI-pending |
| **3** | P1 게임 5종 (Plinko→Mines→Limbo→HiLo→Dice) | 🟡 **진행 중** — Plinko ✅ · Limbo **다음** · Mines/HiLo/Dice ⏳ |
| **4** | 신규 4종 (Mint Reels→Gold Rush→Blackjack→Roulette) | ⏳ |
| **5** | App Shell + Tier Nav | ⏳ |
| **6** | Design System (ui 47+) | ⏳ |
| **7** | Earn + 바이럴 + FOMO + Tier | ⏳ |
| **8** | User 페이지 32면 | ⏳ |
| **9** | Admin 8면 | ⏳ |
| **10** | i18n sweep + QA + ZIP export | ⏳ |
| **2.5** | Pixi nebula (Crash/Plinko) | ⏸ DEFER (MANUAL) |

**매크로 기준 남은 묶음:** Phase 3 잔여 + **Phase 4~10 (7묶음)**. 게임 10종만 끝나도 Phase 5~10(셸·Earn·페이지·Admin·ZIP)이 대부분.

### 1-B. 카지노 게임 10종 (Crash 템플릿 복사 턴)

| # | gameCode | Lovable 상태 | result / selection 정본 |
|---|----------|--------------|-------------------------|
| 1 | crash | ✅ GREEN (local) | `{ autoCashout }` · `{ cashedOut, cashoutMultiplier }` |
| 2 | plinko | ✅ GREEN (local) · vitest **200/200** | `{ rows, risk }` · `{ path, bucket, bucketMultiplier:string }` |
| 3 | limbo | 🟡 **다음 실행** — spec **v1.3 final-r2** 승인 | `{ target }` · `{ resultMultiplier, won }` · Limbo 전용 3구간 feel |
| 4 | mines | ⏳ | `{ mineCount, revealedCells[] }` |
| 5 | hilo | ⏳ | `{ startCard, guesses[] }` |
| 6 | dice | ⏳ | `{ target, direction }` · `{ roll, won }` |
| 7 | mint_reels | ⏳ (macro Phase 4) | `{ lines }` · `{ totalMultiplier }` |
| 8 | gold_rush | ⏳ | `{ lines }` · `{ totalMultiplier }` |
| 9 | blackjack | ⏳ | `{ actions[] }` · settle `{ totalMultiplier }` |
| 10 | roulette | ⏳ | split `value`=lower pocket · integer chips |

**게임 턴:** **2/10 완료** → Limbo 포함 **8턴** 남음 (Limbo GREEN 후 **7턴**).

### 1-C. 게이트 잔여 (별 Phase 아님)

| 항목 | 상태 |
|------|------|
| Crash C-3 e2e | 🟡 WRITTEN → CI/local `playwright install` 후 PASS |
| Plinko C-3 e2e | 🟡 WRITTEN → CI PASS 승격 (Limbo §0-1 선행) |
| chunk gzip / 60fps | ⏸ MANUAL · Phase 2.5 defer |
| PHONARA paste | ⏳ Lovable Phase 10 ZIP 이후 별 트랙 |

### 1-D. 공통 인프라 (최근 승인 · Limbo §0에 포함)

| 항목 | 내용 |
|------|------|
| **§0-0** | `useMockPipeline` throw → `!DEV` warn only (preview 라우트 ErrorBoundary 해소) |
| **§0-0b** | `GameBackLink` → `shared/` paste · Lovable preview 10라우트 · PHONARA `CasinoLovableSurface` **1회** · `casino.back_to_games` i18n |
| **9 testid** | BetPanel 4 first-paint · PF 2 after-open · Confirm 3 · attached-after-flow |

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
| dice/mines/… | GAMES-INTEGRATION §selection | Phase 4+에서 게임별 정의 | — |

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

### Plinko (Phase 3 목표)

```
[END PHASE 3 · Plinko Closeout]
(same sections as Crash §E · bucketMultiplier win/loss · plinko-checkpoint.md)
Result: GREEN (D MANUAL · Pixi 2.5 defer)
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
- ❌ parallel plan 파일量产 (checkpoint.md만 게임별)
- ❌ Phase 3 전 Crash §4.0 잔여 미완

---

## 11. 새 채팅 첫 지시 (복붙용)

```text
@docs/LOVABLE_ZENITH_SESSION_HANDOFF.md 기준으로 Lovable Zenith 작업을 이어서 진행해줘.

확정:
- Lovable UI only · PHONARA 엔진/supabase no-touch.
- 완료: Phase 0–1 GREEN · Crash GREEN (local) · Plinko GREEN (local, vitest 200/200, red:grep 0).
- 다음 실행 spec: Phase 4 Limbo v1.3 final-r2 (대화상 "Phase 4" = 게임 3번째 턴; 매크로 Phase 3 안 Limbo).

한 턴 순서:
0-0 useMockPipeline guard (throw → !DEV warn)
0-0b GameBackLink shared + i18n + preview 10라우트 (PHONARA paste는 CasinoLovableSurface 1회)
0-1 Plinko C-3 e2e PASS · 0-2 Phase 3 §E 실측 N/N
A-6~A-5 Limbo ({ resultMultiplier, won } · Limbo 전용 3구간 · 금지 bet.result.multiplier)
B-1 vitest 실측 N/N · B-2 limbo.spec + back smoke
C-1 red:grep · C-2 limbo-checkpoint · C-3 §E (첫 줄: 0-0 + 0-0b)

계약: GAMES-INTEGRATION > P1 > Zenith · 9 testid attached-after-flow · RG await · Space 3-state.
Pixi = Phase 2.5 defer.
```

---

## 12. 관련 문서 인덱스

| 용도 | 파일 |
|------|------|
| **이 대화 이어가기 (Lovable Phase 0–3)** | **이 파일** |
| Lovable 실행 마스터 | `LOVABLE_ZENITH_MASTER_PLAN.md` |
| 제품/퍼널/바이럴 | `LOVABLE_PRODUCT_PLATFORM_MANIFEST.md` |
| P1 ZIP / testid | `LOVABLE_P1_FINAL_PHONARA.md` |
| selection/RPC | `GAMES-INTEGRATION.md` |
| Crash Lovable QA | `LOVABLE_CRASH_CHECKPOINT.md` |
| 카지노 엔진/ZIP-1 | `CHAT_HANDOFF_2026-06-14.md` |
| ENGINE 100 Supabase | `ENGINE_100_HANDOFF.md` |
| 변경 이력 | `WORK_LOG_2026-06-14.md` |

---

*LOVABLE_ZENITH_SESSION_HANDOFF · v2 · 2026-06-14 · Games 2/10 (Crash·Plinko) · Next: Limbo v1.3 final-r2 · Macro Phase 3~10 잔여*
