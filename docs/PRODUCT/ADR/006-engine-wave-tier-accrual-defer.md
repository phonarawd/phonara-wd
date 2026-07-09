# ADR-006: Staking Tier APY Display ↔ Settlement Accrual Defer (Engine Wave E4)

> **상태:** Proposed (defer stub) · **날짜:** 2026-07-08  
> **플랜:** Trade Desk Zero-Defect QA audit · todo `backlog-engine-adr` (부록 C L4 · §10)  
> **SSOT:** [`ENGINE_BOUNDARY.md`](../../SSOT/ENGINE_BOUNDARY.md) §Engine Wave defer  
> **Platform index:** [`ENGINE_GAP_ADR.md`](ENGINE_GAP_ADR.md) E4

## Context

Staking hub는 tier RPC(`/tier/me` 또는 동등)로 등급·보너스 배율을 표시한다. P0-4는 **tier RPC 실패 시 bronze fallback 은폐 + tier-blind claim**을 차단한다 (UI-only).

**갭:** UI에 표시되는 APY/보너스와 **서버-side accrual·정산 RPC** 간 1:1 추적·claimable amount RPC가 Engine Wave E4 범위다. P1-C 2단계는 operator 승인 + migration 불가피 판정 시에만 착수.

**엔진 freeze:** tier 표시 wire는 Phase R 허용 · **accrual engine 확장·claimable RPC** = Engine Wave.

## Decision

### 1. Defer server accrual transparency until Engine Wave E4

- **Launch through L9:** tier badge/bonus는 RPC display value · `tierError` 시 hidden + claim blocked (P0-4).
- **금지:** client-side APY 재계산 · tier 없이 claimable amount 추정.

### 2. Accepted substitutes (P0-4 · P1-C 1단계)

| 조건                                   | UI                                      |
| -------------------------------------- | --------------------------------------- |
| `tierError`                            | claim/unstake **disabled** + i18n retry |
| `pendingReward === '0'` (필드 노출 후) | disabled + 사유                         |
| tier OK                                | active (engine RPC display)             |

### 3. Engine Wave E4 착수 조건 (when approved)

```text
1. 본 ADR Accepted + P4-D operator 서면 승인
2. security-auditor 사전 review PASS
3. claimable amount RPC/view · STAKING_POSITIONS_ROW 확장 설계
4. GRAND_TOTAL flat-only assert — stake/claim E2E 회귀
5. db reset → test:sql → stack:push-remote → advisor 0
```

### 4. P1-C 2단계 게이트 (교차)

| 게이트        | 요구                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| impossibility | UI-only claim disable **불충분** AND 본 ADR Accepted                                        |
| migration     | P4-D 8-step ladder                                                                          |
| money         | [`MONEY_CONSERVATION_FORMULA.md`](../../SSOT/MONEY_CONSERVATION_FORMULA.md) §1 staking flow |

## Consequences

| Positive                        | Negative                                     |
| ------------------------------- | -------------------------------------------- |
| P0-4로 tier-blind claim 차단    | APY 표시↔정산 완전 투명성 gap                |
| Engine freeze 유지              | E4 전까지 operator 수동 tier dispute 가능    |
| E6/E7 staking E2E baseline 유지 | claimable RPC 없으면 pendingReward 필드 제한 |

## Links

- Plan §10 · P1-C · ENGINE_GAP_ADR E4
- [`use-staking-page-controller.ts`](../../../apps/web/src/features/earn/use-staking-page-controller.ts)
- E0: [`P0/P0-4-tier-no-tx.md`](../../OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P0/P0-4-tier-no-tx.md)
