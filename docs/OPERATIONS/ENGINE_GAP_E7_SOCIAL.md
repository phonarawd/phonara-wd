# ENGINE_GAP E7 Social (#252)

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e7-social-wave` (#252)  
> **ADR:** [`014-social-co-mission.md`](../PRODUCT/ADR/014-social-co-mission.md)  
> **코드 계약:** [`social-co-mission-display-contract.ts`](../../apps/web/src/domain/social-co-mission-display-contract.ts)  
> **선행:** E6 GATE `#251` `[x]`  
> **후행:** `ew-e7-gate-engine-wave` (#253) **`[x]` DONE** 2026-07-12

## 범위

| 항목       | 내용                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| ADR        | co-mission affiliate pair · whale KRW→PHON threshold · 광고·설문 영구 제외                                  |
| Migration  | `20260807000001_ew_e7_social_co_mission.sql`                                                                |
| Co RPCs    | `rpc_invite_co_mission` · `rpc_accept_co_mission` · `rpc_complete_co_mission` · `rpc_get_co_mission_status` |
| Whale RPCs | `rpc_claim_whale_mission` · `rpc_get_whale_mission_status`                                                  |
| Seed       | `co_share_referral` · `whale_deposit_1m`                                                                    |
| Launch     | `LAUNCH_GATES.socialCoMissionEngine=true` · UI live = GATE                                                  |

## 증거

| Gate                             | 결과                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `gate:ai-impl` social-co-mission | vitest **2/2** · typecheck · lint · i18n · release                             |
| SQL                              | `ew_e7_social_co_mission_test.sql` E7-0..E7-4 · **CI sql authoritative** (G13) |
| Remote                           | GATE `#253` `[x]`: `stack:push-remote` · advisor 0                             |

## 다음

`ew-e21-trade-parity-wave` (#254) **`[x]` DONE** 2026-07-12 · GATE `#255` **`[x]`** — 후행 `ew-e21-ui-trade-engine-unlocks`.
