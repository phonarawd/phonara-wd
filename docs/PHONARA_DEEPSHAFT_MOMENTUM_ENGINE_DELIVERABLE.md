# Deepshaft + Momentum 엔진 — PR Deliverable (플랜 100% closeout)

**플랜:** `deepshaft_momentum_engines_b7ae5ae3.plan.md`  
**브랜치:** `main` (로컬 작업 트리)  
**closeout 일자:** 2026-06-17

---

## 1. 신규·변경 파일 목록

### TypeScript (`@phonara/game-engine`)

| 파일 | 역할 |
|------|------|
| `packages/game-engine/src/games/deepshaft.ts` | Deepshaft 엔진 (`caveInProb`, `levelGrowthMult`, `deepshaftRawMultiplier`, `completeProbability`) |
| `packages/game-engine/src/games/deepshaft.test.ts` | reachability 12-grid, 이론 RTP, MC 10k×12, Zod tier |
| `packages/game-engine/src/games/momentum.ts` | Momentum 엔진 (`COMBO_MULT`, policy RTP, selection-scoped exposure) |
| `packages/game-engine/src/games/momentum.test.ts` | 3-policy MC 10k, `verifyRound` cashOut, exposure |
| `packages/game-engine/src/registry.ts` | `GAME_CODES` +2 (additive) |
| `packages/game-engine/src/index.ts` | export +2 (additive) |
| `packages/game-engine/src/fairness/verifier.ts` | side-effect import +2 |
| `packages/game-engine/src/lib/rtp-harness.ts` | `defaultSelectionFor` +2 |
| `packages/game-engine/src/casino-parity.test.ts` | locked vectors +2 games |

### SQL

| 파일 | 역할 |
|------|------|
| `supabase/migrations/20260617000120_game_code_enum_deepshaft_momentum.sql` | enum A |
| `supabase/migrations/20260617000121_deepshaft_momentum_engine.sql` | helpers, `_game_result`, caps, flags |
| `supabase/tests/casino_parity_test.sql` | locked vectors (deepshaft + momentum play/cashOut) |

### UI / i18n / types

| 파일 | 역할 |
|------|------|
| `apps/web/src/features/casino/game-config.ts` | GAME_CONFIGS +2 |
| `apps/web/src/components/games/registry.ts` | lazy loaders +2 |
| `apps/web/src/components/games/deepshaft/*` | `PresentationImportPlaceholder` |
| `apps/web/src/components/games/momentum/*` | `PresentationImportPlaceholder` |
| `apps/web/src/routes/casino.tsx` | `/casino/deepshaft`, `/casino/momentum` |
| `apps/web/src/router.ts` | route 등록 |
| `packages/i18n/src/index.ts` | game/field/option keys |
| `packages/shared-types/src/database.types.ts` | `game_code` enum 갱신 |

### Tests (extend)

| 파일 | 변경 |
|------|------|
| `tests/integration/casino-sql-parity.test.ts` | CASE_DEFS +3 (deepshaft, momentum play, momentum cashOut) |
| `tests/e2e/casino.spec.ts` | GAME_CASES +2 |

**미변경 (플랜 lock):** 기존 10게임 `packages/game-engine/src/games/*.ts`, `lib/slot-engine.ts`, `rpc_place_game_bet` 시그니처.

---

## 2. Result 인터페이스 (구현본)

### Deepshaft

```ts
interface DeepshaftLevel {
  depth: number;
  outcome: 'gold' | 'cavein';
  levelMultiplier: number; // levelGrowthMult — super-linear running display
}
interface DeepshaftResult {
  levels: DeepshaftLevel[];
  reachedDepth: number;
  caveIn: boolean;
  totalMultiplier: number; // floor(deepshaftRawMultiplier × 99) / 100
  won: boolean;
}
```

### Momentum

```ts
interface MomentumResult {
  won: boolean;
  roll: number;           // diceFromFloat; 0 on cashOut
  comboBefore: number;
  comboAfter: number;
  comboMultiplier: number;
  cashedOut: boolean;
  totalMultiplier: number; // floor(comboMult × 99) / 100 on cashOut only
}
```

**Exposure (`maxPayoutMultiplier`):** Momentum은 플랜 아키텍처(라운드당 atomic bet)에 맞게 play → 0, cashOut → `comboBefore` 배율. combo-15 ceiling은 cashOut selection으로 별도 bet 시 적용.

---

## 3. Parity

| 경로 | 범위 |
|------|------|
| TS locked vectors | `casino-parity.test.ts` — deepshaft standard d5, momentum play + cashOut |
| SQL locked vectors | `casino_parity_test.sql` — 동일 seed 상수 |
| Integration | `PHONARA_SQL_PARITY=1` — **1000 seeds × CASE_DEFS** (12 legacy + deepshaft + momentum play + momentum cashOut) |

---

## 4. Deepshaft reachability (depth-15 P(complete))

| tier | d5 | d8 | d12 | d15 |
|------|-----|-----|------|------|
| safe | 75.85% | 55.67% | 30.20% | **16.77%** (≥8%) |
| standard | 64.74% | 39.83% | 15.10% | **5.76%** (≥2%) |
| deep | 51.93% | 25.50% | 6.16% | **1.51%** (≥0.5%) |

모든 12 combo P(complete) ≥ 0.1% — unit grid PASS.

---

## 5. Deepshaft theoretical RTP (12 combos)

| tier | d5 | d8 | d12 | d15 |
|------|-----|-----|------|------|
| safe | 98.60% | 98.53% | 98.75% | 98.92% |
| standard | 98.41% | 98.79% | 98.93% | 99.00% |
| deep | 98.67% | 98.95% | 98.95% | 99.09% |

MC 10k × 12 — measured RTP 98.5–99.5% 밴드 (unit).

---

## 6. Momentum policy RTP

| 정책 | closed-form | MC 10k |
|------|-------------|--------|
| early (combo≥2) | 98.87% | 98.5–99.5% |
| mid (combo≥5) | 98.98% | 98.5–99.5% |
| greedy (combo≥10) | 99.00% | 98.5–99.5% |

`verifyRound` cashOut (`comboBefore:4`, float ignored) — `resultMatch=true`.

---

## 7. 테스트 카운트 (baseline → after)

| 명령 | before (10게임 baseline) | after (closeout) |
|------|--------------------------|------------------|
| `bun run test -- packages/game-engine` | 87 tests / 8 files | **102 tests / 10 files** |
| `tests/e2e/casino.spec.ts` | 11 cases | **13 cases** (+deepshaft, +momentum) |
| integration SQL parity CASE_DEFS | 10 games | **13 defs** (+deepshaft, +momentum×2) |

기존 10게임 unit/E2E 시나리오 — 변경 없음 (CASE 배열 additive only).

---

## 8. Verification checklist (실행 결과)

| Gate | 결과 |
|------|------|
| `bun run typecheck` | GREEN |
| `bun run test:game-engine` | GREEN — closed-form 12+3 RTP grid + MC smoke (400/300 seeds, ~1min) |
| `supabase db reset` | GREEN |
| `bun run test:sql` | GREEN (57 files) |
| `PHONARA_SQL_PARITY=1` integration | GREEN |
| `check:games` | 12 codes |
| `check:determinism` / `check:i18n` / `check:release` | GREEN |
| `bun run test:e2e -- tests/e2e/casino.spec.ts` | 13/13 GREEN |
| `check:hygiene` | GREEN |

---

## 9. 원격 apply 메모

로컬 `supabase db reset`으로 migration A/B apply 확인됨. **원격 `yocjhjsdwoijfdrehzoq` apply는 operator 별도 1회** (standing autonomy 범위이나 본 deliverable 작성 시점 미실행).
