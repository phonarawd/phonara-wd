# P2 — `pir-p2-quantize-odds`

> **Todo:** `pir-p2-quantize-odds`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (Implemented · `gate:ai-impl` L0~L4)

## 목표 (H-4 / M · float 경계)

- `quantize6` / `quantize6String`에서 **`number` 제거** — payout connector는 `Decimal | string`만
- sports-ingest `parseOddsDecimal` / `oddsUpsertMessage`는 **string-only**
- 벤더 JSON number는 `vendorPriceToOddsString` 엣지에서만 텍스트화 (정산 권위는 SQL 유지)

## 구현

| 파일                                                                 | 변경                                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `packages/game-engine/src/lib/quantize.ts`                           | `Decimal \| string` · runtime number reject                                     |
| `packages/game-engine/src/lib/quantize.test.ts`                      | accept string/Decimal · reject number                                           |
| `packages/sports-ingest/src/decimal-odds.ts`                         | `parseOddsDecimal(string)` · `vendorPriceToOddsString` · oddsUpsert string-only |
| `packages/sports-ingest/src/decimal-odds.test.ts`                    | string-only + edge pipeline                                                     |
| `packages/sports-ingest/src/normalizer.ts`                           | prices `Record<string, string>` · patch string-only                             |
| `the-odds-api` · `odds-api-io` · `odds-api-io-ws` · `sportsgameodds` | vendor number → `vendorPriceToOddsString` before upsert                         |

## 증거

```text
Implemented: bun run gate:ai-impl -- --test packages/game-engine/src/lib/quantize.test.ts --closeout pir-p2-quantize-odds
  evidence: quantize6 number forbid · ingest parseOddsDecimal string-only · vitest 14/14 · Evidence P2/quantize-odds.md

L0 cursor:status · check:hygiene · check:ui-architecture · check:phase-r-guards --strict
L1 typecheck · check:i18n · check:release
L2 lint
L3 vitest quantize **2/2** · decimal-odds+normalizer+the-odds-api **12/12** (합계 **14/14**)

gate:ai-impl ✓ Implemented (L0~L4) green
```

## DoD 체크

- [x] `quantize6` 시그니처에 `number` 없음 · runtime reject
- [x] `parseOddsDecimal(string)` only · number runtime reject
- [x] ingest upsert 경로 string odds만 (`expandEventWithOdds` prices string map)
- [x] 벤더 number는 edge stringify 후만 유입

## 다음

`pir-gate-platform-integrity` — presentation + CI required 4 · security-auditor
