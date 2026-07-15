# ENGINE_GAP E21 Trade UI Unlock (`ew-e21-ui-trade-engine-unlocks`)

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e21-ui-trade-engine-unlocks`  
> **선행:** E21 GATE `#255` **`[x]`** · WAVE `#254` **`[x]`**  
> **후행:** `ew-e22-sports-parity-wave`  
> **코드 계약:** [`ew-e21-ui-trade-engine-unlocks-display-contract.ts`](../../apps/web/src/domain/ew-e21-ui-trade-engine-unlocks-display-contract.ts)

## 범위

| 항목            | 내용                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------- |
| Launch          | `LAUNCH_GATES.tradeParityLive=true`                                                       |
| Hedge           | `PositionModeSegment` · `rpc_set/get_position_mode` · wire `live`                         |
| Reduce-only     | futures advanced checkbox · `p_reduce_only` on limit/stop place · reduce-only wire `live` |
| Spot limit/stop | **이미 live** (EXISTS · honesty pin)                                                      |
| Post-open TP/SL | **이미 live** (EXISTS · honesty pin)                                                      |
| Migration       | **0** (engine WAVE/GATE만)                                                                |

## Unlock 표

| Surface                    | 상태     | 비고                         |
| -------------------------- | -------- | ---------------------------- |
| Hedge position mode toggle | **live** | `hedge-position-mode-toggle` |
| Reduce-only toggle         | **live** | limit/stop only              |
| Spot limit/stop tabs       | **live** | EXISTS RPC                   |
| Post-open TP/SL edit       | **live** | EXISTS RPC                   |

## 증거

| Gate                             | 결과                                            |
| -------------------------------- | ----------------------------------------------- |
| `gate:ai-impl` trade UI unlock   | vitest + typecheck + i18n + release             |
| `isEwE21TradeUiParityUnlocked()` | **true**                                        |
| Remote migration                 | GATE `#255` already applied — remigration **0** |

## 다음

`ew-e22-sports-parity-wave` **`[x]`** · GATE `ew-e22-gate-sports-parity` **`[x]` DONE** 2026-07-12 · next `ew-e22-ui-sports-parity-unlocks`.
