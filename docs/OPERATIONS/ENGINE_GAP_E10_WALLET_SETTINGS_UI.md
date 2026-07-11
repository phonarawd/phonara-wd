/**
 * ENGINE_GAP E10 Wallet+Settings UI (`ew-e10-wallet-settings-ui`)
 *
 * > **상태:** `[x]` DONE · **날짜:** 2026-07-12
 * > **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e10-wallet-settings-ui`
 * > **선행:** E10 WAVE `ew-e10-platform-engine-wave` `[x]` · Admin KRW proof `[x]` · E8 GATE `[x]`
 * > **후행:** `ew-e10-trust-support-ui`
 * > **코드 계약:** [`ew-e10-wallet-settings-ui-display-contract.ts`](../../apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts)
 */

## 범위

| 항목 | 내용 |
| ---- | ---- |
| Launch | `LAUNCH_GATES.financialConnectivityLive=true` |
| P2P | `/wallet/transfer` · `rpc_transfer_to_user` · history list |
| API keys | `/settings/api-keys` hub live · list/create/revoke |
| Redeem reverse | `/wallet/redeem/giftcard` · preview/create · hub 4th rail |
| Migration | **0** (E8 engine already applied) |

## Unlock 표

| Surface | 상태 | 비고 |
| ------- | ---- | ---- |
| `/wallet/transfer` | **live** | WALLET_SUBNAV · confirm dialog |
| `/settings/api-keys` | **live** | settings hub · secret once |
| Giftcard redeem reverse | **live** | redeem hub rail · `/wallet/redeem/giftcard` |

## 증거

| Gate | 결과 |
| ---- | ---- |
| `gate:ai-impl` wallet-settings UI | L0–L4 green · vitest **13/13** · typecheck · i18n · release |
| `isEwE10WalletSettingsUiUnlocked()` | **true** |
| Wire status | transfer / api-keys / giftcard reverse = **live** |
| Remote migration | E8 GATE already applied — remigration **0** |

## 다음

`ew-e10-trust-support-ui` — `/support/ticket` · `/status` · `/tier/leaderboard`.
