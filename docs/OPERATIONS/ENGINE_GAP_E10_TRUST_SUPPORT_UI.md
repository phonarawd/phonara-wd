# ENGINE_GAP E10 Trust+Support UI (`ew-e10-trust-support-ui`)

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e10-trust-support-ui`  
> **선행:** `ew-e10-wallet-settings-ui` `[x]` · E9 GATE `[x]` · E9 Admin support `[x]`  
> **후행:** `ew-e10-growth-ui`  
> **코드 계약:** [`ew-e10-trust-support-ui-display-contract.ts`](../../apps/web/src/domain/ew-e10-trust-support-ui-display-contract.ts)

## 범위

| 항목      | 내용                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| Launch    | `supportTicketsLive` · `tierLeaderboardLive` · `systemStatusLive` = **true** |
| Support   | `/support/ticket` · `rpc_create_support_ticket` · `rpc_list_support_tickets` |
| Status    | `/status` · presentation lanes + announcements CTA                           |
| Tier LB   | `/tier/leaderboard` · `rpc_get_tier_leaderboard`                             |
| Migration | **0** (E9 engine already applied)                                            |

## Unlock 표

| Surface             | 상태     | 비고                           |
| ------------------- | -------- | ------------------------------ |
| `/support/ticket`   | **live** | auth required · confirm dialog |
| `/status`           | **live** | public marketing shell         |
| `/tier/leaderboard` | **live** | auth required · XP rank list   |

## 증거

| Gate                              | 결과                                              |
| --------------------------------- | ------------------------------------------------- |
| `gate:ai-impl` trust-support UI   | L0–L4 green · vitest · typecheck · i18n · release |
| `isEwE10TrustSupportUiUnlocked()` | **true**                                          |
| Wire status                       | ticket / status / tier LB = **live**              |
| Remote migration                  | E9 identity already applied — remigration **0**   |

## 다음

`ew-e10-growth-ui` — Kakao share SDK · app-install mission tab.
