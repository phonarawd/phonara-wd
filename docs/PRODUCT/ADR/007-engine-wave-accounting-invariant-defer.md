# ADR-007: Accounting Invariant Full Defer (Engine Wave)

> **상태:** Proposed (defer stub) · **날짜:** 2026-07-08  
> **플랜:** Trade Desk Zero-Defect QA audit · todo `backlog-engine-adr` (부록 C L4 · §10)  
> **SSOT:** [`ENGINE_BOUNDARY.md`](../../SSOT/ENGINE_BOUNDARY.md) §Engine Wave defer  
> **Money SOT:** [`MONEY_CONSERVATION_FORMULA.md`](../../SSOT/MONEY_CONSERVATION_FORMULA.md) §2

## Context

Trade Desk Zero-Defect DoD #3은 **Wallet Conservation (GRAND_TOTAL)** 만 검증한다. P0-0에서 역추출된 assert는 `wallets` + `system_accounts` grand total 불변이다.

**Accounting Invariant (확장)** 는 별도 계층이다:

- `wallet_ledger` journal leg Σ=0 per transaction
- deposit pending · withdraw settlement reserve 상태 machine
- fee/treasury/reserve 계정 명시 분해

> **Wallet Conservation ⊄ Accounting Invariant** — v5 V1 · [`MONEY_CONSERVATION_FORMULA.md`](../../SSOT/MONEY_CONSERVATION_FORMULA.md) §2

현재 SQL은 hash-chain + GRAND_TOTAL만 pin ([`conservation_test.sql`](../../../supabase/tests/conservation_test.sql)). Journal leg 분해·pending 상태 machine full audit는 Engine Wave.

## Decision

### 1. Defer Accounting Invariant full until Engine Wave

- **Launch through L9:** Wallet Conservation (flat-only Σ) = DoD #3 정본.
- **금지:** GRAND_TOTAL pass를 Accounting full pass로 **주장** · journal leg Σ=0 미검증 상태에서 "회계 완전" copy.

### 2. Accepted substitutes (P0-0 · baseline)

| 계층             | 검증                                                  |
| ---------------- | ----------------------------------------------------- |
| GRAND_TOTAL      | `conservation_test.sql` L64–97 · E2E `currencyTotals` |
| Hash-chain       | `conservation_test.sql` L99+                          |
| UI               | `@phonara/money` · client recompute 0                 |
| Fee/staking flow | P0-0 mermaid · fee → `system_accounts`                |

### 3. Engine Wave 착수 조건 (when approved)

```text
1. 본 ADR Accepted + P4-D operator 서면 승인
2. MONEY_CONSERVATION_FORMULA.md §2 → §3 formalize (journal leg 정의)
3. SQL: per-RPC journal leg Σ=0 assert 추가 (conservation_test 확장 또는 전용 파일)
4. Deposit/withdraw pending 상태 machine ADR slice (필요 시 ADR-007b)
5. db reset → test:sql → stack:push-remote → advisor 0
```

### 4. Scope table (roadmap · §2 정본)

| 계정/개념                  | GRAND_TOTAL          | Engine Wave 산출      |
| -------------------------- | -------------------- | --------------------- |
| `wallets` available+locked | ✅                   | —                     |
| `system_accounts`          | ✅                   | treasury·reserve 분해 |
| `wallet_ledger` journal    | hash-chain only      | leg Σ=0 per tx        |
| Deposit pending            | 의도적 변경          | pending SM            |
| Withdraw lock              | 의도적 변경          | settlement reserve    |
| Fee legs                   | system_accounts 흡수 | fee account 분리      |

## Consequences

| Positive                            | Negative                                |
| ----------------------------------- | --------------------------------------- |
| P0-0 역추출 baseline 유지           | Journal-level audit gap                 |
| 명확한 Wallet vs Accounting 분리    | Operator 회계 dispute 시 수동 조회      |
| Engine freeze until deliberate wave | Full exchange-grade accounting deferred |

## Links

- Plan §0-B · §10 · DoD #0b
- [`MONEY_CONSERVATION_FORMULA.md`](../../SSOT/MONEY_CONSERVATION_FORMULA.md) §2
- [`docs/ADR/0006-wallet-sigma-rule.md`](../../ADR/0006-wallet-sigma-rule.md)
