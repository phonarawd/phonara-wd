# ADR-002: Crypto Withdrawal Custody & Signing

> **상태:** Accepted · **날짜:** 2026-07-03  
> **플랜:** `final_engine_plan_aca45593` · todo `crypto-custody-adr`  
> **구현:** [`supabase/functions/crypto-sign/index.ts`](../../../supabase/functions/crypto-sign/index.ts) · [`crypto-withdraw-broadcast`](../../../supabase/functions/crypto-withdraw-broadcast/index.ts)

## Context

코인 출금은 `rpc_request_withdrawal`(lock) → admin approve → `rpc_service_claim_withdrawal_broadcast_batch` → sign → broadcast 경로다. `crypto-sign`은 **fail-closed**: hot wallet key 또는 external signer 없으면 503 + `signing_not_configured` — 자금 유출 없음.

P0 claim/replay: **[x] DONE** — `p0_edge_contracts_claim_webhook` · `p0_edge_contracts_test.sql`.

## Decision

### 경로 선택 (operator 환경별)

| 모드                           | 조건                                                                               | 동작                                                                                                               | 권장 단계       |
| ------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------- |
| **A — Fail-closed (default)**  | hot key / `CRYPTO_SIGN_ENDPOINT` 없음                                              | `crypto-sign` → 503 `fail_closed: true` · broadcast 대기                                                           | Closed Beta 전  |
| **B — Hot wallet env**         | `CRYPTO_TRON_HOT_WALLET_PRIVATE_KEY` 또는 `CRYPTO_ETH_HOT_WALLET_PRIVATE_KEY` 설정 | Edge가 sign 시도 — **현재 local signing 미구현** → 503 `hot_wallet_local_signing_not_implemented_use_external_hsm` | **금지** (prod) |
| **C — External signer (운영)** | `CRYPTO_SIGN_ENDPOINT` + service-role HMAC/secret contract                         | `crypto-withdraw-broadcast`가 external endpoint 호출                                                               | prod 권장       |

**고정:** custody adapter 2개 병렬 · broadcast worker 중복 **금지**.

### Approval threshold (이미 엔진에 존재)

별도 schema 없이 기존 gate 사용:

- KYC · sanctions · AML (`phase5_kyc_test.sql` 등)
- MFA step-up (`withdrawal_mfa_step_up_test.sql`)
- Daily cap · whitelist (`phase5_withdrawal_test.sql`)
- Admin approve + audit (`admin_access_test.sql`)

고액 threshold 변경은 **Admin config / ops_alert_thresholds** — 새 RPC 불필요.

### Fail-closed 계약 (non-waivable)

1. `withdrawal_requests.status !== 'approved'` → sign 거부 (`invalid_withdrawal_status`)
2. `on_chain_tx_hash` 이미 있음 → idempotent return
3. key/endpoint 없음 → **503** + `edge_ops_events` `ops.crypto.sign_fail_closed`
4. browser / Vite env에 private key **절대 금지**

### Env 정본

| 변수                                 | 용도                                |
| ------------------------------------ | ----------------------------------- |
| `CRYPTO_TRON_HOT_WALLET_PRIVATE_KEY` | TRC20 (개발 only — ADR B 미구현)    |
| `CRYPTO_ETH_HOT_WALLET_PRIVATE_KEY`  | ERC20 (개발 only)                   |
| `CRYPTO_SIGN_ENDPOINT`               | External HSM/signer URL (prod 권장) |

## Consequences

- Closed Beta 전: 모드 A 유지 — 출금 approve 후 **manual broadcast** 또는 signer 준비 전까지 queue
- Operator SOP: [`docs/OPERATIONS/FUNDING_RAILS_SOP.md`](../../OPERATIONS/FUNDING_RAILS_SOP.md) §코인 출금
- Local signing 구현 시 **별도 ADR amendment** + security review 필수

## Verification

| Test                         | 역할                                        |
| ---------------------------- | ------------------------------------------- |
| `p0_edge_contracts_test.sql` | claim single-flight · broadcast idempotency |
| `phase5_withdrawal_test.sql` | withdrawal gates · conservation             |
| `crypto_hd_deposit_test.sql` | deposit path (sign과 분리)                  |

## Operator sign-off

| 필드      | 값                                                          |
| --------- | ----------------------------------------------------------- |
| prod 경로 | C (external signer) 또는 A (fail-closed) until signer ready |
| 날짜      | 2026-07-03                                                  |
