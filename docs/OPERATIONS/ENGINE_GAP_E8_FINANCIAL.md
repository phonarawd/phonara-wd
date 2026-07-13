# ENGINE_GAP E8 Financial

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e8-financial-wave`  
> **ADR:** [`018-financial-connectivity.md`](../PRODUCT/ADR/018-financial-connectivity.md)  
> **코드 계약:** [`ew-e8-financial-display-contract.ts`](../../apps/web/src/domain/ew-e8-financial-display-contract.ts)  
> **선행:** E23 UI `ew-e23-ui-casino-live-unlocks` `[x]`  
> **후행:** `ew-e8-gate-financial` → `ew-e10-wallet-settings-ui`

## 범위 (51차 WAVE · 동일 PR)

| 항목      | 내용                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------- |
| ADR       | P2P PHON · trading API keys · giftcard redeem reverse · legal re-review pin                        |
| Migration | `20260811000001_ew_e8_financial.sql` (**신규만**)                                                  |
| NEW RPCs  | transfer/list · API key list/create/revoke · giftcard redeem preview/create · admin fulfill/reject |
| EXISTS    | giftcard deposit · withdraw rails — remigration **0**                                              |
| Launch    | `LAUNCH_GATES.financialConnectivityEngine=true` · `financialConnectivityLive=false`                |
| Defer     | `/wallet/transfer` hub · API keys hub · USDT P2P · marketing (LEGAL_BASIS #2)                      |

## 증거

| Gate                           | 결과                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `gate:ai-impl` ew-e8-financial | vitest **9/9** · typecheck · i18n · release                                               |
| SQL                            | `ew_e8_financial_test.sql` E8-0..E8-4 · **CI sql authoritative** (G13)                    |
| Remote                         | GATE **`[x]`** — see [`ENGINE_GAP_E8_GATE_FINANCIAL.md`](ENGINE_GAP_E8_GATE_FINANCIAL.md) |

## 다음

`ew-e8-gate-financial` **`[x]` DONE** 2026-07-12 — next `ew-e9-identity-wave` · E10 hub UI later.
