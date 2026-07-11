/\*\*

- ENGINE_GAP E10 Growth UI (`ew-e10-growth-ui`)
-
- > **상태:** `[x]` DONE · **날짜:** 2026-07-12
- > **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e10-growth-ui`
- > **선행:** `ew-e10-trust-support-ui` `[x]` · E9 engine + GATE `[x]`
- > **후행:** `ew-e10-gate-platform-world-class`
- > **코드 계약:** [`ew-e10-growth-ui-display-contract.ts`](../../apps/web/src/domain/ew-e10-growth-ui-display-contract.ts)
  > \*/

## 범위

| 항목        | 내용                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------- |
| Launch      | `appInstallMissionLive` · `kakaoShareSdkLive` = **true**                                 |
| Kakao       | `/referral/invite` augment · Web Share canonical · `VITE_KAKAO_JAVASCRIPT_KEY`           |
| App install | `/home/missions?tab=growth` · `growth-appInstall` · `rpc_record_app_install_attribution` |
| Migration   | **0** (E9 engine already applied)                                                        |

## Unlock 표

| Surface                                 | 상태     | 비고                                       |
| --------------------------------------- | -------- | ------------------------------------------ |
| `/referral/invite` Kakao CTA            | **live** | progressive enhancement · env key required |
| `/home/missions` growth tab app-install | **live** | PWA install prompt + attribution RPC       |

## 증거

| Gate                        | 결과                                              |
| --------------------------- | ------------------------------------------------- |
| `gate:ai-impl` growth UI    | L0–L4 green · vitest · typecheck · i18n · release |
| `isEwE10GrowthUiUnlocked()` | **true**                                          |
| Wire status                 | app_install_mission_tab = **live**                |
| Remote migration            | E9 identity already applied — remigration **0**   |

## 다음

`ew-e10-gate-platform-world-class` — Platform World-Class DONE gate.
