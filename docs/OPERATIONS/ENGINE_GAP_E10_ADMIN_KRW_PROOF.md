# ENGINE_GAP E10 Admin KRW Proof Review

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e10-page-admin-krw-proof-review`  
> **선행:** E10 WAVE `ew-e10-platform-engine-wave` `[x]`  
> **후행:** `ew-e10-wallet-settings-ui`  
> **코드 계약:** [`admin-krw-proof-review-display-contract.ts`](../../apps/admin/src/domain/admin-krw-proof-review-display-contract.ts)  
> **ADR:** [`020-platform-engine.md`](../PRODUCT/ADR/020-platform-engine.md)

## 범위 (§29.2 · §29.5)

| 항목    | 내용                                                                   |
| ------- | ---------------------------------------------------------------------- |
| Desk    | `/admin/deposits` (기존 surface 확장 · parallel route **0**)           |
| Surface | `AdminDepositsPage` · `AdminTable` only                                |
| Hook    | `useAdminWalletDesk` — proof map · review · signed URL                 |
| RPC     | `rpc_admin_review_krw_deposit_proof` (AAL2 · reason · **원장 이동 0**) |
| Storage | bucket `krw-deposit-proofs` · admin select policy                      |
| 버튼    | **입금 증빙 사진 보기** · **증빙 맞음 표시** (R2)                      |
| 돈      | 증빙 승인 ≠ 입금 확인 — credit는 `rpc_admin_match_krw_deposit`만       |

## 증거

| Gate                           | 결과                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `gate:ai-impl` admin-krw-proof | vitest display + deposits page · typecheck · i18n · release |
| Engine                         | E10 WAVE remigration **0** — proof RPC EXISTS               |

## 다음

`ew-e10-wallet-settings-ui`
