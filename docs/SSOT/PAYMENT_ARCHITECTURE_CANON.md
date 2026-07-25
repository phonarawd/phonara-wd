# Payment Architecture Canon (D3)

> **상태:** D3 narrative complete (2026-06-30)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) (Phase R) · Decision 013  
> **Wallet UX:** [`WALLET_UX_CANON.md`](WALLET_UX_CANON.md) · [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Wallet  
> **Global:** [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md) · [`I18N_FIRST.md`](I18N_FIRST.md)  
> **Display:** [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) · [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md)

D3 Payment Canon은 wallet/deposit/withdraw UI가 **provider·국가·통화가 늘어도 다시 갈아엎지 않도록** payment method grammar를 고정합니다.  
Money arithmetic · settlement · ledger · RPC는 UI에서 재계산하지 않습니다.

---

## 1. 현재 지원 (presentation contract)

| Method                | Flow                                     |
| --------------------- | ---------------------------------------- |
| **Crypto**            | deposit · withdraw                       |
| **KRW bank transfer** | deposit · withdraw                       |
| **Gift card**         | deposit — manual input · operator review |

Engine/RPC 구현은 [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md) · Freeze Manifest 기준 — UI reset은 **표시·흐름 grammar**만 고정.

**KRW bank transfer (Hybrid L3 default · L4 E1b ready):** L3 ingest = operator SOP + admin exception queue — [`docs/OPERATIONS/FUNDING_RAILS_SOP.md`](../OPERATIONS/FUNDING_RAILS_SOP.md) · ADR [`001-pg-less-funding-rails.md`](../PRODUCT/ADR/001-pg-less-funding-rails.md). L4 PG webhook/batch = optional (`pg-bank-webhook` edge · same match RPC). User UI shows reference · amount · expected PHON · status only — **no fake auto-detect** until operator enables L4 exposure.

**L4 E1b engine closeout (2026-07-03):** `pg-bank-webhook` remote deploy `verify_jwt=false` · HMAC headers (`x-pg-timestamp`, `x-pg-nonce`, `x-pg-signature`) · replay table. Operator smoke: `bun run stack:smoke-pg-webhook-hmac`. Evidence: `ENGINE_PHASE0_EVIDENCE_REPORT.md` §P0 Edge Contracts closeout (2026-07-04 삭제 — git history · 수치 정본 [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md)).

---

## 2. 향후 확장 (UI structure — engine work 별도)

다음 provider/method 추가 시 **동일 Payment Method Card grammar**로 slot만 추가:

| Category          | Examples                                         |
| ----------------- | ------------------------------------------------ |
| Overseas PG       | Stripe · Nuvei · Triple-A · Transak · MoonPay    |
| Card / wallet pay | Card · Apple Pay · Google Pay                    |
| Local             | Country-specific adapter · local payment methods |

각 provider card는 아래 **표시 자리**를 선확보:

- fee (RPC/formatted display)
- settlement / expected arrival time
- limit (min/max)
- eligibility / restriction badge
- manual review state (when applicable)

---

## 3. Wallet/Payment UI structure

```text
Wallet
→ Currency Selector
→ Deposit / Withdraw
→ Payment Methods
→ Provider Card
→ Provider-specific instruction / status
```

- **Currency Selector:** multi-currency wallet surfaces 필수 ([`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md))
- **Deposit / Withdraw:** intent 선택 — method list는 **replace가 아닌 drill-down**
- **Payment Methods:** Crypto · Bank Transfer · Gift Card · Future Provider — **동일 card/list grammar**
- **Provider Card:** method name · currencies/networks · fee slot · arrival slot · eligibility · CTA
- **Instruction / status:** network · bank account · gift-card steps · pending/reviewing/confirmed UI

`Coin` · `KR Bank` · `Gift Card` · `Future PG`는 **같은 Payment Method 구조**에서 확장 — route duplication 금지.

---

## 4. Transaction status grammar

사용자-facing 상태 (i18n key — JSX inline 금지):

| Status      | Meaning (presentation)  |
| ----------- | ----------------------- |
| `pending`   | 제출됨 · 처리 대기      |
| `reviewing` | 운영자/시스템 확인 중   |
| `confirmed` | 완료 · 잔액 반영        |
| `failed`    | 실패 · 재시도/지원 안내 |
| `rejected`  | 거절 · 사유 표시        |
| `cancelled` | 사용자/시스템 취소      |

각 상태는 **why + what next** copy slot 보유 ([`COPYWRITING_CANON.md`](COPYWRITING_CANON.md) financial zone).

---

## 5. Provider card contract

각 card exposes (props/RPC display only):

| Slot                            | Source                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| Method name                     | i18n                                                                    |
| Supported currencies / networks | controller/RPC                                                          |
| Fee display                     | `giftcardPreviewFeeDisplay` 등 contract field                           |
| Expected arrival / settlement   | RPC or static catalog — UI invent 금지                                  |
| Eligibility / restriction       | KYC · country · provider availability                                   |
| CTA                             | → method-specific flow (**single route family**, not per-provider page) |

Missing contract field → [`DECISION_LOG.md`](DECISION_LOG.md) product decision · silent UI invent 금지.

---

## 6. Engine boundary

- Balances · fees · settlement amounts: `@phonara/money` display helpers · controller fields only
- Idempotency · duplicate submit: engine pattern 유지 (`WalletSubmitButton` 등)
- Provider 추가: **adapter/card 추가** — wallet shell · deposit index route **뜯지 않음**

---

## 7. Forbidden

- KRW-only hardcoded UI (labels · flow · currency assumption)
- Provider마다 **완전히 다른 deposit page** (duplicate routes/components)
- Provider 추가 시 parallel hub route (`/deposit-stripe` 등)
- 근거 없는 “곧 입금됩니다” · guaranteed settlement copy
- Client-side fee/balance/settlement 재계산

---

## 8. Completion signals (U3 Wallet)

- [ ] Currency selector on multi-currency surfaces
- [ ] Crypto · bank · gift card share provider card grammar
- [ ] All six status states have i18n + next-action copy
- [ ] Fee · arrival · restriction slots wired or explicitly deferred in Decision Log
- [ ] Hybrid L3 honest KRW copy — reference · SLA · no auto-ingest claims ([`REBUILD_ENGINE_SSOT.md`](REBUILD_ENGINE_SSOT.md) §E1a)
- [ ] `DISPLAY_DATA_CONTRACT` wallet rows `exposed` or decision logged
- [ ] Money E2E Σ=0 unchanged (operator/CI)

---

## 교차 참조

| 주제                     | 문서                                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| Unified deposit grammar  | [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)                                    |
| Admin deposit review     | [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)                                        |
| Locale / currency labels | [`I18N_FIRST.md`](I18N_FIRST.md) · [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md) |
