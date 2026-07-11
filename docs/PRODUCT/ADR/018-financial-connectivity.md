# ADR-018: Financial Connectivity — P2P · API Keys · Points→Giftcard Reverse (E8)

> **상태:** `[x]` Accepted · **날짜:** 2026-07-12  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e8-financial-wave`  
> **선행:** E23 UI `ew-e23-ui-casino-live-unlocks` **`[x]` DONE** 2026-07-12  
> **후행:** GATE `ew-e8-gate-financial` **`[x]` DONE** 2026-07-12 → `ew-e9-identity-wave` → UI `ew-e10-wallet-settings-ui` **`[x]` DONE** 2026-07-12  
> **코드 계약:** [`ew-e8-financial-display-contract.ts`](../../../apps/web/src/domain/ew-e8-financial-display-contract.ts)  
> **스펙 정본:** Plan §12.18 · §21.1 E8 · ENGINE_GAP_ADR E8 · `LEGAL_BASIS.md` re-review #2

## Context

§12.18 gap 3건(P2P `/wallet/transfer` · trading API keys · PHON→상품권 역교환)은 UI만으로 불가.  
P11 `/wallet/redeem`는 기존 withdraw/deposit rail hub만 연결했고 **역교환 RPC는 없음**.  
`/settings/api-keys`는 P8 STUB(엔진 missing).  
Track B E8 = 본 ADR + 동일 PR 엔진 (51차 WAVE merge).

**Legal:** `LEGAL_BASIS.md` re-review trigger #2 (PHON P2P). WAVE는 엔진만 적재 · **공개 마케팅·hub IA live는 법무 클리어 + GATE/E10 이후**.

## Decision

### 1. 51차 WAVE bundle (non-waivable · 동일 PR)

| 축 | 판정 | 본 WAVE |
| -- | ---- | ------- |
| P2P transfer | **신규** | `rpc_transfer_to_user` · `rpc_list_p2p_transfers` · table `p2p_transfers` |
| Trading API keys | **신규** | `trading_api_keys` · `rpc_list/create/revoke_trading_api_key` |
| Points→giftcard reverse | **신규** | `giftcard_redeem_requests` · preview/create · admin fulfill/reject |
| Giftcard **deposit** | **EXISTS** | `rpc_*_giftcard_deposit*` — remigration 금지 |
| Withdraw/deposit rails | **EXISTS** | P11 redeem hub — remigration 금지 |
| Live UI / hub IA | **GATE/E10** | WAVE: `financialConnectivityEngine=true` · `financialConnectivityLive=false` |

### 2. P2P 정본 (non-waivable)

| 항목 | 값 |
| ---- | --- |
| Currency | **PHON only** (USDT P2P = 후속 ADR) |
| Recipient | `profiles.username` (case-insensitive) **또는** UUID |
| Self-transfer | **금지** (`p2p_self_transfer`) |
| Fee | `app_config.p2p_transfer_fee_bps` (Closed Beta default `0`) → `p2p_transfer_fee_phon` |
| Daily cap | `app_config.p2p_transfer_daily_cap_phon` (gross debit incl. fee) |
| Min amount | `app_config.p2p_transfer_min_phon` |
| Reasons | `p2p_transfer_out` · `p2p_transfer_in` · `p2p_transfer_fee` |
| Lock order | wallets `user_id ASC` (deadlock 방지) |
| Money | `_debit_wallet_internal` sender · `_credit_wallet_internal` recipient · fee system credit · **Σ=0** (no mint) |
| Feature kill | `feature_p2p_transfer_enabled` |
| Idempotency | `rpc_request_idem` + ledger keys `p2p:{transfer_id}:out|in|fee` |

**RPCs:** `rpc_transfer_to_user(p_recipient, p_amount, p_memo, p_client_request_id)` · `rpc_list_p2p_transfers(p_limit)`

### 3. Trading API keys 정본 (non-waivable)

| 항목 | 값 |
| ---- | --- |
| Table | `trading_api_keys` — `key_prefix` · `key_hash` (sha256) · `scopes` · `revoked_at` |
| Secret | create 응답 **1회만** plaintext · 이후 list는 prefix+mask |
| Scopes | Closed Beta: `read` · `trade` (배열 · 최소 1개) |
| Max active | `app_config.trading_api_keys_max_active` (default 5) |
| Storage | plaintext **금지** · hash-at-rest only |
| Auth | `auth.uid()` own rows · admin SELECT |

**RPCs:** `rpc_list_trading_api_keys` · `rpc_create_trading_api_key` · `rpc_revoke_trading_api_key`

### 4. Points→giftcard reverse 정본 (non-waivable)

| 항목 | 값 |
| ---- | --- |
| Direction | PHON → 상품권 출고 (deposit 역방향) |
| Preview | `rpc_preview_giftcard_redeem(kind, face_krw)` → phon_cost · fee |
| Create | `rpc_create_giftcard_redeem_request` — debit user · hold `giftcard_redeem_hold_phon` · fee → `giftcard_fee_phon` |
| Fulfill | `rpc_admin_fulfill_giftcard_redeem` — admin AAL2 · hold → `giftcard_redeem_settled_phon` |
| Reject | `rpc_admin_reject_giftcard_redeem` — admin AAL2 · hold+fee → user refund |
| Rate | active PHON/KRW snapshot · stale 15m |
| Fee market | `giftcard_fee_market` enabled kind · `giftcard_redeem_fee_bps` config |
| Feature kill | `feature_giftcard_redeem_enabled` |

**EXISTS pin:** `rpc_create_giftcard_deposit_request` · withdraw rails — 의미론 유지.

### 5. UI unlock (WAVE vs GATE/E10)

| 단계 | 내용 |
| ---- | ---- |
| **본 WAVE** | ADR + migration + RPCs + SQL + display contract · `LAUNCH_GATES.financialConnectivityEngine=true` |
| **GATE** `ew-e8-gate-financial` | **`[x]` DONE** 2026-07-12 — `stack:push-remote` · advisor 0 · SQL Σ=0 (CI) |
| **E10** `ew-e10-wallet-settings-ui` | `/wallet/transfer` · `/settings/api-keys` hub · redeem reverse wire · `financialConnectivityLive` **`[x]` DONE** 2026-07-12 |

## Consequences

- WAVE에서 hub nav · `/wallet/transfer` route live **금지**
- P2P 마케팅 copy / Soft Launch 노출은 법무 re-review 전 **금지**
- API key plaintext을 create 이후 재조회 시도 = FAIL
- Giftcard deposit remigration = FAIL
- Remote apply = GATE

## Verification

| Gate | 기대 |
| ---- | ---- |
| SQL | `ew_e8_financial_test.sql` E8-0..E8-4 · CI sql authoritative (G13) |
| Vitest | `ew-e8-financial-display-contract` |
| Remote | GATE **`[x]` DONE** 2026-07-12: `stack:push-remote` · advisor 0 ERROR · tail `20260711192506_ew_e8_financial` |

## Operator sign-off

Cursor Plan todo `ew-e8-financial-wave` 배정·구현 지시 = 본 ADR Accepted + 동일 PR (P2P · API keys · giftcard reverse).
