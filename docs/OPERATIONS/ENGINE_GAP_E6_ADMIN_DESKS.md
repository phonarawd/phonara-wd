# ENGINE_GAP E6 Admin Desks Wave (#250)

> **상태:** `[x]` DONE (WAVE impl) · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e6-admin-desks-wave` (#250)  
> **선행:** `ew-e5-gate-gap-surfaces` (#249) `[x]` DONE  
> **후행:** `ew-e6-gate-admin-desks` (#251)  
> **코드 계약:** [`ew-e6-admin-desks-display-contract.ts`](../../apps/admin/src/domain/ew-e6-admin-desks-display-contract.ts)

## 범위

| 항목          | 내용                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Engine        | **0** — 기존 RPC와 Admin hook만 재사용                                                           |
| 데스크        | `/promotions` · `/cms` · `/tier-benefits` · `/casino` · `/staking` · `/earn/activity` · `/audit` |
| 감사 내보내기 | 필터된 감사 피드를 브라우저 CSV로 내려받음                                                       |
| 금지          | 신규 migration · 클라이언트 금액 계산 · 원장 변경                                                |

## 연결 정본

| 데스크       | 데이터 원천                                                     | 동작                                                              |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| CMS·프로모션 | `rpc_admin_list_cms_content` · `rpc_admin_upsert_cms_content`   | 발행·보관·복구·활성·조기 종료는 사유 다이얼로그를 사용            |
| 카지노       | catalog/status RPC · ops alerts                                 | 게임 상태와 RTP 검토를 분리한 탭으로 표시                         |
| 티어 혜택    | `useAdminTiersDesk`                                             | 미션 한도와 Golden Earth 한도를 읽기 전용으로 표시                |
| Earn 활동    | `rpc_admin_get_ops_dashboard` · `rpc_admin_get_viral_analytics` | 예외 큐·알림·추천·미션 집계를 표시                                |
| 감사         | `useAuditLogs`                                                  | 필터 결과를 `at, domain, actionKey, subject, reason` CSV로 내보냄 |

## 게이트 증거

| Gate                                                               | 결과                 |
| ------------------------------------------------------------------ | -------------------- |
| `gate:ai-impl -- --test apps/admin/src/product/surfaces/__tests__` | green · vitest 52/52 |
| typecheck · i18n · release                                         | green                |
| migration                                                          | 없음                 |

## 다음

`ew-e6-gate-admin-desks` (#251) **`[x]` DONE** 2026-07-12 · 후행 `ew-e7-social-wave` (#252).
