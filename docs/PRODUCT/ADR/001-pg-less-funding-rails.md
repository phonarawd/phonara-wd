# ADR-001: PG-less Funding Rails — 운영 모드 고정

> **상태:** Accepted · **날짜:** 2026-07-03  
> **플랜:** `final_engine_plan_aca45593` · todo `pg-less-mode-adr`  
> **엔진 closeout:** [`ENGINE_APEX_CLOSEOUT.md`](../../ENGINE_APEX_CLOSEOUT.md) · P0 edge evidence는 2026-07-04 삭제 (git history)

## Context

PHONARA funding rail(코인 · KRW 계좌이체 · 상품권)은 이미 Supabase RPC·원장·SQL 테스트로 구현되어 있다. PG 결제대행 없이도 운영 가능하며, L4 PG webhook은 **optional overlay**일 뿐 primary rail이 아니다.

Engine Apex + Post-Apex(2026-07-03): `test:sql` **118/118** · migration **211/211** · advisor **0 ERROR**.

## Decision

### 1. Primary 운영 모드 (PG-less default)

| 레일              | 방향         | 권위                                                                            | operator touch      |
| ----------------- | ------------ | ------------------------------------------------------------------------------- | ------------------- |
| **Crypto USDT**   | deposit      | HD address · `crypto-chain-watcher` · admin match                               | 예외 큐만           |
| **Crypto USDT**   | withdraw     | `rpc_request_withdrawal` → approve → claim/broadcast                            | 승인 + custody sign |
| **KRW bank (L3)** | deposit      | `rpc_create_krw_deposit_request` → `rpc_admin_match_krw_deposit`                | **수동 매칭**       |
| **KRW bank (L3)** | withdraw     | `rpc_request_withdrawal` → approve → **수동 송금** → `rpc_mark_withdrawal_sent` | **수동 송금**       |
| **Gift card**     | deposit only | `rpc_create_giftcard_deposit_request` → `rpc_admin_approve_giftcard_deposit`    | **수동 심사**       |

**금지 (PG-less 운영 시):**

- prod에서 L4 `pg-bank-webhook`을 primary ingest로 활성화
- UI에 "자동 입금 감지" copy (L3 honest copy만)
- parallel KRW match RPC 또는 두 번째 deposit hub

### 2. L4 PG webhook (optional · default OFF)

- 엔진 구현: `pg-bank-webhook` + HMAC + replay table — **[x] DONE** (P0)
- **PG-less default:** webhook 미배포 또는 operator feature flag **OFF**
- L4 활성화 시에도 동일 `_try_match_krw_deposit` core 사용 — parallel match 금지
- Smoke: `bun run stack:smoke-pg-webhook-hmac`

### 3. Provider capability matrix (funding)

`notification_provider_capabilities`는 **알림 채널** 전용(Post-Apex E4). Funding rail capability는 본 ADR 표가 정본.

| method           | direction | currency | status taxonomy                                     | idempotency prefix       | risk gates                            |
| ---------------- | --------- | -------- | --------------------------------------------------- | ------------------------ | ------------------------------------- |
| crypto_hd        | deposit   | USDT     | pending → matched → credited                        | `crypto_dep:`            | KYC · sanctions · AML                 |
| crypto_broadcast | withdraw  | USDT     | approved → broadcasting → sent/failed/manual_review | `withdrawal:broadcast:`  | KYC · MFA · daily cap · whitelist     |
| krw_manual       | deposit   | KRW/PHON | pending → matched/rejected                          | `krw_dep:`               | reference uniqueness · amount match   |
| krw_manual       | withdraw  | KRW/PHON | pending → approved → sent                           | withdrawal lifecycle RPC | KYC · MFA · daily cap                 |
| giftcard_manual  | deposit   | PHON     | pending → reviewing → approved/rejected             | `giftcard_dep:`          | fee market · fraud limit · PIN policy |

### 4. Temporal / 외부 saga

**지금 도입 안 함.** DB-native saga로 충분:

- `claim_expires_at` · `retryable_failed` · `manual_review` · `admin_review_queue`
- withdrawal: `approved → broadcasting → sent/failed`

Temporal ADR 트리거(미래): worker lock contention · multi-step withdrawal 복잡도 · cross-service long-running flow.

### 5. 불변 원칙 (non-waivable)

- SQL/RPC = settlement authority — UI display only
- `@phonara/money` decimal string — JS `number` 금지
- append-only ledger + idempotency + system account paired legs (Σ=0)
- `FOR UPDATE SKIP LOCKED` + claim worker = ordered pipeline (LMAX 개념 번역)

## Consequences

- KRW/상품권은 operator SOP 필수 — [`docs/OPERATIONS/FUNDING_RAILS_SOP.md`](../../OPERATIONS/FUNDING_RAILS_SOP.md)
- 코인 출금 sign 경로는 ADR-002 참조
- Phase R Wallet UI는 본 ADR grammar만 표시 — engine 재작성 없음

## Verification

| Gate             | 결과                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL conservation | `phase5_deposit_test.sql` · `phase5_withdrawal_test.sql` · `giftcard_fee_market_test.sql` · `crypto_hd_deposit_test.sql` · `p0_edge_contracts_test.sql` |
| Global           | `test:sql` **118/118** · `conservation_test.sql`                                                                                                        |

## Operator sign-off

| 필드 | 값                                |
| ---- | --------------------------------- |
| 모드 | PG-less primary · L4 optional OFF |
| 날짜 | 2026-07-03                        |
| 증거 | Engine Apex FULLY CLOSED          |
