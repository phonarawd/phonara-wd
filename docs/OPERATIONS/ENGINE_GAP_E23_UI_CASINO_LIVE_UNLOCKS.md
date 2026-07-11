# ENGINE_GAP E23 Casino UI Unlock (`ew-e23-ui-casino-live-unlocks`)

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e23-ui-casino-live-unlocks`  
> **선행:** E23 GATE `ew-e23-gate-casino-live` **`[x]`** · WAVE **`[x]`**  
> **후행:** `ew-e8-financial-wave`  
> **코드 계약:** [`ew-e23-ui-casino-live-unlocks-display-contract.ts`](../../apps/web/src/domain/ew-e23-ui-casino-live-unlocks-display-contract.ts)

## 범위

| 항목 | 내용 |
| ---- | ---- |
| Launch | `LAUNCH_GATES.casinoLiveLive=true` |
| Live crash | stage mid-flight cash-out · `rpc_live_crash_*` |
| Progressive | mines/hilo/blackjack step + mid cash-out · `rpc_progressive_*` |
| Fairness | seed get/set/rotate UI · account PF honesty copy |
| Dual mode | one-shot replay 유지 · play-mode toggle → live |
| Migration | **0** (engine WAVE/GATE만) |

## Unlock 표

| Surface | 상태 | 비고 |
| ------- | ---- | ---- |
| Progressive mines/hilo/blackjack | **live** | `casino-play-mode` · stage live controls |
| Live crash 공유 라운드 | **live** | `casino-crash-live-cashout` |
| Fairness seed 설정 | **live** | `casino-fairness-seed-controls` |
| One-shot 12종 place/settle | **live** (EXISTS) | nonce=1 path 유지 |

## 증거

| Gate | 결과 |
| ---- | ---- |
| `gate:ai-impl` casino UI unlock | vitest + typecheck + i18n + release |
| `isEwE23CasinoUiLiveUnlocked()` | **true** |
| Wire status | progressive/live/PF = **live** |
| Remote migration | GATE already applied — remigration **0** |

## 다음

`ew-e8-financial-wave` — P2P · API keys · points reverse.
