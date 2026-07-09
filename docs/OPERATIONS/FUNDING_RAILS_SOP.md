# Funding Rails — Operator SOP (PG-less)

> **상태:** `[x] DONE` (2026-07-03)  
> **플랜:** `final_engine_plan_aca45593` · todo `operator-sop-docs`  
> **ADR:** [`001-pg-less-funding-rails.md`](../PRODUCT/ADR/001-pg-less-funding-rails.md) · [`002-crypto-custody-signing.md`](../PRODUCT/ADR/002-crypto-custody-signing.md)  
> **Admin glue:** `apps/admin/src/hooks/admin/useAdminWalletDesk.ts`

1인 운영 기준. 모든 수동 조치는 **reason + audit log** 필수.

---

## 공통

| 항목         | 규칙                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| Audit        | `audit_logs` append-only — reject/flag/match/approve 시 reason 문자열        |
| Idempotency  | 동일 요청 재클릭 시 RPC idempotency — 잔액 이중 반영 금지                    |
| Conservation | 조치 후 Σ=0 유지 — `conservation_test.sql` / admin reconciliation            |
| Kill switch  | `system_readonly` 또는 feature halt 시 **새 match/approve 금지** — 큐만 조회 |

---

## KRW 입금 매칭 (L3)

### 흐름

1. 사용자: `rpc_create_krw_deposit_request` — reference code · 금액 · 예상 PHON
2. 운영자: 은행 입금 내역과 reference/금액 대조
3. 일치: `rpc_admin_match_krw_deposit` (또는 admin desk 동등 RPC)
4. 불일치/사기 의심: reject + flag — **credit 금지**

### SLA (operator 설정)

| 단계          | 목표                                    |
| ------------- | --------------------------------------- |
| 영업시간 매칭 | 요청 후 N시간 내 (ops_alert_thresholds) |
| 예외 큐       | `admin_review_queue` · ops dashboard    |

### Audit reason 예시

- `match:bank_ref=<ref>:amount=<krw>`
- `reject:amount_mismatch`
- `reject:duplicate_reference`
- `flag:suspected_fraud`

### 금지

- PG-less 모드에서 "자동 입금 완료" 사용자 copy
- reference 없이 임의 credit
- L4 webhook 없이 batch auto-match 주장

---

## KRW 출금 (수동 송금)

### 흐름

1. 사용자: `rpc_request_withdrawal` — KYC/MFA/daily cap 통과
2. 운영자: approve (고액은 2인 확인 — policy)
3. **실제 은행 송금** (플랫폼 외부)
4. 송금 완료 후: `rpc_mark_withdrawal_sent` + tx reference
5. reject 시: `rpc_reject_withdrawal` — ledger unlock + audit

### Audit reason 예시

- `approve:withdrawal_id=<uuid>`
- `sent:bank_tx=<ref>`
- `reject:insufficient_kyc`
- `reject:sanctions_hit`

### 금지

- approve 없이 sent mark
- sent mark 없이 사용자에게 "완료" 표시

---

## 상품권 입금 (수동 심사)

### 흐름

1. 사용자: `rpc_preview_giftcard_deposit` → fee/예상 PHON 확인
2. `rpc_create_giftcard_deposit_request` — PIN/serial (UI 마스킹)
3. 운영자: `giftcard_fee_market` 테이블 · issuer 정책 대조
4. approve: `rpc_admin_approve_giftcard_deposit` + reason
5. reject: 사유 기록 — credit 없음

### PIN / 보존 / 마스킹

| 항목 | 규칙                                                          |
| ---- | ------------------------------------------------------------- |
| 저장 | engine가 저장하는 필드만 — UI 로그에 PIN 평문 금지            |
| 표시 | Admin: 마지막 4자리 또는 마스킹 — full PIN 채팅/스크린샷 금지 |
| 보존 | 분쟁 기간 후 PIN 폐기 정책 (operator legal)                   |

### Fraud limit

- 동일 issuer · 동일 serial 중복 → 자동 reject 경로 (SQL test 고정)
- 일일 건수/금액 cap — `giftcard_fee_market` + RG policy
- 의심 패턴 → `flag` + `admin_review_queue` — auto-approve **금지**

### Audit reason 예시

- `approve:issuer=<name>:face_value=<amt>`
- `reject:invalid_pin`
- `reject:fee_market_disabled`
- `flag:velocity_limit`

### 금지

- 상품권 **출금** rail (입금 only)
- fee market 우회 manual credit

---

## 코인 출금 (custody)

### 흐름

1. 사용자 withdraw request → compliance gates
2. Admin approve
3. `crypto-withdraw-broadcast` cron — claim batch (`FOR UPDATE SKIP LOCKED`)
4. `crypto-sign` — ADR-002 경로
5. 성공: `on_chain_tx_hash` · 실패: `retryable_failed` / `manual_review`

### Fail-closed (signer 미준비)

- `crypto-sign` 503 → queue에 유지 · **수동 재시도** 또는 external signer 연결 후 재실행
- operator가 tx hash를 임의 DB insert **금지** — RPC 경로만

### Audit

- `approve:crypto:withdrawal_id=<uuid>`
- `broadcast:tx_hash=<hash>`
- `manual_review:signing_not_configured`

---

## 예외 큐 · ops dashboard

- `rpc_admin_get_ops_dashboard` — threshold · provider_health · edge_ops_events
- 알림: `notification-dispatch` claim two-phase — silent `sent` 금지

---

## 검증 (엔진 — operator gate)

```powershell
supabase db reset
bun run test:sql   # 99/99 — phase5_* · giftcard · crypto · p0_edge
```

증거: [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md)
