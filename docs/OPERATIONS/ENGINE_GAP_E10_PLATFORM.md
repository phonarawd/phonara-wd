# ENGINE_GAP E10 Platform

> **상태:** `[x]` DONE · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e10-platform-engine-wave`  
> **ADR:** [`020-platform-engine.md`](../PRODUCT/ADR/020-platform-engine.md)  
> **코드 계약:** [`ew-e10-platform-engine-display-contract.ts`](../../apps/web/src/domain/ew-e10-platform-engine-display-contract.ts)  
> **선행:** `ew-e9-gate-identity-support` `[x]`  
> **후행:** `ew-e10-page-admin-krw-proof-review` **`[x]` DONE** 2026-07-12 → `ew-e10-wallet-settings-ui`

## 범위 (E10 WAVE · 동일 PR)

| 항목 | 내용 |
| ---- | ---- |
| ADR | KRW 입금 증빙 · 미션 체인 · 친구 동시 베팅 · 규칙 기반 미션 추천 |
| Migration | `20260813000001_ew_e10_platform_engine.sql` |
| NEW RPCs | 증빙 첨부·관리자 검토 · 체인 목록·상태 · 동시 베팅 초대·수락·연결·완료·상태 · 미션 추천 |
| EXISTS | KRW 입금 매칭 레일 · 미션 카탈로그 · 스포츠 베팅 · 제휴 관계 · E7 공동 미션 — 재마이그레이션 0 |
| Launch | `platformEngine=true` · 증빙·체인·동시 베팅·추천 UI live 플래그는 `false` 유지 |
| Defer | 증빙 업로드 UI · 체인 허브 · 스포츠 동시 베팅 UI · 추천 캐러셀 · 카카오 공유 SDK · 상태 페이지 |

## 증거

| Gate | 결과 |
| ---- | ---- |
| `gate:ai-impl` E10 display contract | display contract · typecheck · i18n · release |
| SQL | `ew_e10_platform_engine_test.sql` E10-0..E10-5 · 증빙 무원장 · 체인 해금 · 동시 베팅 초대·수락·완료 · 2명 각 25 및 시스템 50 보존 · **CI sql authoritative** (G13) |
| Remote | E10 GATE에서 `stack:push-remote` 및 advisor 0 ERROR 확인 |

## 다음

`ew-e10-page-admin-krw-proof-review` **`[x]` DONE** 2026-07-12 — 다음은 `ew-e10-wallet-settings-ui`. E10 WAVE는 엔진 RPC만 준비하며, 사용자 UI live 해금은 후속 todo에서 수행한다.
