# R2 — Capability Rails Investigate Evidence (`audit-r2-capability-rails`)

> **Stage:** R2 · **Plan todo (착수):** `audit-r2a-crypto-giftcard` (H-03+H-11) · siblings `audit-r2b`~`audit-r2d`  
> **Handoff:** [`PLATFORM_AUDIT_TODO_HANDOFF.md`](../../PLATFORM_AUDIT_TODO_HANDOFF.md#audit-r2a-crypto-giftcard)  
> **Date:** 2026-07-13  
> **Baseline / implement SHA (R1):** `391646f6f8ab6ae204d17f55ae59677036ca0728`  
> **Command:** Investigate (수정 0 · No Assumption §37) · READ-ONLY  
> **선행:** R1 Verify (push · CI · Stage1 Browser) — 본 문서는 Crypto/Giftcard Implement 직전 핸드오프

## R2 Finding 배치 (Standing Grant · max 3 Finding/PR)

| PR       | Finding     | Domain                                     | 우선               |
| -------- | ----------- | ------------------------------------------ | ------------------ |
| **R2-a** | H-03 · H-11 | Wallet (Crypto + Giftcard hub fail-closed) | **Plan todo `audit-r2a-crypto-giftcard` NEXT** |
| **R2-b** | H-10        | Wallet (출금 OFF — 운영 decision + copy)   | 후속               |
| **R2-c** | H-05        | Sports (stale odds · ingest)               | ops 선행           |
| **R2-d** | M-21        | Wallet (KRW proof upload wire)             | gate flip 후       |

---

## Executive Summary

| ID       | Severity | Hub 노출 vs capability                     | 코드 fail-closed          | Implement    |
| -------- | -------- | ------------------------------------------ | ------------------------- | ------------ |
| **H-03** | HIGH     | Crypto rail **노출** · `cryptoRails=false` | **미적용** (계약만)       | R2-a         |
| **H-11** | HIGH     | Giftcard rail **노출** · market 0/6        | **부분** (페이지 empty만) | R2-a         |
| **H-10** | CRITICAL | 출금 CTA 전역 차단                         | **적용됨**                | decision log |
| **H-05** | HIGH     | 배당 stale · bet/cashout gate OFF          | **적용됨** (launch)       | ingest 선행  |
| **M-21** | MEDIUM   | KRW proof RPC live · Web caller 0          | **의도적 defer**          | wire 후 flip |

**핵심 갭:** `LAUNCH_GATES.cryptoRails`와 giftcard market 가용성이 **deposit/withdraw hub**에 미연결. `crypto-edge-display-contract` fail-closed 헬퍼는 **테스트에서만** 사용.

---

## H-03 — Crypto rail

| 필드                      | 값                                                                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Symptom**               | Crypto rail 노출 · provider `missing_config` · derive/주소 경로 위험                                                                                                  |
| **Root cause**            | `cryptoRails:false`인데 hub static 3-rail · `use-crypto-deposit` derive invoke에 gate 미검사                                                                          |
| **Files**                 | `launch-gates.ts:8` · `deposit-hub-display.ts:37-58` · `use-deposit-hub-controller.ts:82` · `use-crypto-deposit.ts:45-51` · `crypto-edge-display-contract.ts:203-210` |
| **Fix (approved design)** | hub resolver로 crypto omit · derive invoke block · direct URL → hub redirect · gate flip은 provider green 후                                                          |
| **blocked_by**            | ops: CRYPTO\_\* env · provider_health (flip 전) · registry `blocked_by: []`                                                                                           |

### No Assumption

- [x] Hub에 `shouldHideCryptoWalletPanels` production import **0**
- [x] Direct `/wallet/deposit/crypto` route guard **없음**
- [ ] 원격 provider 13k failures — **UNVERIFIED** (audit 인용)

---

## H-11 — Giftcard markets

| 필드                      | 값                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Symptom**               | Giftcard rail 노출 · `giftcard_fee_market` enabled 0/6                                                                                                |
| **Root cause**            | 상세 페이지는 `marketEmpty` fail-closed · hub/redeem은 rail 항상 노출                                                                                 |
| **Files**                 | `deposit-hub-display.ts:52-58` · `use-giftcard-deposit-controller.ts:115` · `wallet-redeem-display-contract.ts:67-75` · migration Q3 default inactive |
| **Fix (approved design)** | market empty → hub/redeem giftcard rail **omit** · direct URL redirect · (선택) `giftcardRails` gate                                                  |
| **blocked_by**            | Admin market enable 정책 (Option B) · Option A(숨김)은 즉시 가능                                                                                      |

### No Assumption

- [x] RPC empty → page empty UI **CONFIRMED**
- [x] Hub 3-rail 고정 **CONFIRMED**
- [ ] 원격 enabled 0/6 — **UNVERIFIED** (audit 인용)

---

## H-10 / H-05 / M-21 (요약 · R2-a 밖)

- **H-10:** `feature_withdrawal_enabled=false` fail-closed **정상** — 운영 의도 확인 + decision log.
- **H-05:** place/cashout launch gate OFF **정상** — ingest 복구 전 flip 금지 · board freshness gate 보강 후보.
- **M-21:** `krwDepositProofLive=true` · upload wire DONE (`audit-r2d-krw-proof-wire`).

---

## Next command (R1 Verify green 후)

**Implement R2-a** — H-03 + H-11 (동일 Wallet domain · max 3 Finding/PR 준수).

```text
1. wallet-capability-rails resolver (deposit/withdraw hub)
2. crypto derive block + route guard
3. giftcard market-aware hub/redeem filter
4. owner vitest RED-first → green
5. Stage1 Wallet Browser after push
```
