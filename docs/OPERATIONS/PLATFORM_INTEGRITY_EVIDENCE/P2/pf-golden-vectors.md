# P2 — `pir-p2-pf-golden-vectors`

> **Todo:** `pir-p2-pf-golden-vectors`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (Implemented · `gate:ai-impl` L0~L4)

## 목표 (H-4 / M · PF 경계)

- 12게임 PF **경계 float** SQL↔TS 골든 벡터를 vitest + `check:determinism`에 핀
- **정산 권위 = SQL** (`_game_float_stream` · `_game_result`) — TS는 동일 벡터만 검증
- `f=0` · `f=0.5` · `f=1-2^-32` 공식 경계 + parity seed 결과 잠금

## 구현

| 파일                                                          | 변경                                                                   |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/game-engine/src/fairness/pf-golden-vectors.ts`      | seed floats · boundary formula · 12게임 seed results · coverage assert |
| `packages/game-engine/src/fairness/pf-golden-vectors.test.ts` | vitest 4 cases (coverage · stream · seed · boundary)                   |
| `scripts/check-determinism.ts`                                | banned RNG + 12-game golden fixture coverage gate                      |
| `packages/game-engine/src/index.ts`                           | golden vector exports                                                  |
| `supabase/tests/pir_pf_golden_vectors_test.sql`               | SQL authority pin (stream + floors + 12-game seed)                     |

## 증거

```text
Implemented: bun run gate:ai-impl -- --test packages/game-engine/src/fairness/pf-golden-vectors.test.ts --closeout pir-p2-pf-golden-vectors
  evidence: 12-game PF golden vectors · check:determinism · vitest 4/4 (+ casino-parity 12) · SQL pir_pf_golden_vectors_test · Evidence P2/pf-golden-vectors.md

L0 cursor:status · check:hygiene · check:ui-architecture · check:phase-r-guards --strict
L1 typecheck · check:i18n · check:release
L2 lint
L3 vitest pf-golden-vectors **4/4** · casino-parity **12/12** · check:determinism OK

gate:ai-impl ✓ Implemented (L0~L4) green
```

## DoD 체크

- [x] 12 `GAME_CODES` seed + boundary coverage
- [x] `floatStream` golden seed first-8 pin
- [x] boundary floors: dice/crash/limbo/plinko/hilo/roulette/mines/slots/deepshaft
- [x] `check:determinism` fails if golden fixture drops a game
- [x] SQL test mirrors TS vectors (CI sql authoritative)

## 다음

`pir-gate-platform-integrity` — presentation + CI required 4 · security-auditor
