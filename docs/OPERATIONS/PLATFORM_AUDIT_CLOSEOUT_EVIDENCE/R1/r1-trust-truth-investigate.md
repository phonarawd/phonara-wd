# R1 — Trust & Truth Investigate Evidence (`audit-r1-trust-truth`)

> **Stage:** R1 · **Plan todo:** `audit-r1-trust-truth` (Implement **전** Investigate)  
> **Date:** 2026-07-13  
> **Baseline SHA:** `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`  
> **Command:** Investigate (수정 0 · No Assumption §37)

## 선행 완료 (R0 · R1 블로커 해소)

| 항목                    | 상태             | Evidence                                                                    |
| ----------------------- | ---------------- | --------------------------------------------------------------------------- |
| Plan Owner 승인         | `[x]`            | DL-R0-PLAN · Standing Grant                                                 |
| Browser MCP M-18        | `VERIFIED_FIXED` | [`R0/browser-mcp-probe.md`](../R0/browser-mcp-probe.md) Probe 5             |
| bun audit §54           | `[x]`            | [`R0/bun-audit-2026-07-13.md`](../R0/bun-audit-2026-07-13.md)               |
| Evidence bucket         | `[x]`            | [`R0/evidence-bucket-provisioned.md`](../R0/evidence-bucket-provisioned.md) |
| `blocked_by` (R1 batch) | **0**            | C-02 live health는 R4 후속 · R1은 fail-closed stub                          |

## R1 Implement 배치 (Standing Grant · max 3 Finding/PR)

| PR                      | Finding                 | Domain                                |
| ----------------------- | ----------------------- | ------------------------------------- |
| **R1-a**                | C-01 · H-01 · M-01      | Marketing + Earn (landing synthesis)  |
| **R1-b**                | C-02                    | Marketing (`/status` fail-closed)     |
| **R1-c** (동일 PR 가능) | PrimeForge→PHONARA 노출 | Marketing (i18n + narrative contract) |

---

## C-01 — 합성 social proof

| 필드               | 값                                                                                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Symptom**        | 100만+ 회원·누적 지급·출금 건수·후기·동시 가입이 실적처럼 표시                                                                                                                                                                   |
| **Root cause**     | `LANDING_PROOF_MODE='ambient'` + presentation bot/constants가 기본 ON · live threshold 미달 시에도 stats/testimonials/withdrawal proof 렌더                                                                                      |
| **Files**          | `landing-member-bot.ts:8-76` · `landing-display-contract.ts:140-233` · `landing-proof-resolver.ts:34-38` · `landing-cumulative-stats.tsx` · `landing-testimonials.tsx` · `landing-withdrawal-proof.tsx` · i18n `landing.stats.*` |
| **Fix (approved)** | 검증된 집계 없으면 stats/testimonials/withdrawal momentum/signup bot **hidden** · ambient presentation tier 제거 또는 explicit “예시” 라벨 없이 **섹션 omit** (No Shortcut)                                                      |
| **Regression**     | `landing-page.test.tsx` · `auth-landing-visual-signoff.test.tsx` · Stage1 `/` Browser after fix                                                                                                                                  |

### 재현 (static)

```text
rg "LANDING_MEMBER_BOT_BASE|156_800_000|LANDING_TESTIMONIAL_POOL" apps/web/src/domain
→ presentation constants + bot always >= 1M members
LANDING_PROOF_MODE = 'ambient' (landing-display-contract.ts:17)
resolveLandingProof() → stats: 'presentation' when live count < threshold
```

---

## C-02 — `/status` false-green

| 필드               | 값                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Symptom**        | Trade·Sports·Crypto degraded여도 모든 lane `operational`                                                         |
| **Root cause**     | `SystemStatusPage`가 health RPC/table 미사용 · `StatusBadge state="settled"` 고정                                |
| **Files**          | `system-status-page.tsx:61,81` · `system-status-display-contract.ts`                                             |
| **Fix (approved)** | fail-closed: `unknown`/`degraded` · live aggregate는 **R4** `rpc_get_public_platform_status` 검증 후만 (Plan R1) |
| **Regression**     | status surface vitest · Stage1 `/status` Browser                                                                 |

### 재현 (static)

```text
system-status-page.tsx: StatusBadge state="settled" on summary + every component row
data-engine-todo present — no fetch/hook for platform health
```

---

## H-01 — 1 PHON = 1 KRW

| 필드               | 값                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Symptom**        | 2,900 PHON ≈ ₩2,900 표시 · 실제 rate ~14.91 KRW/PHON                                                                                             |
| **Root cause**     | `landing-wallet-preview.tsx:21-22` 동일 number를 PHON·KRW에 재사용 · i18n footnote `1 PHON = 1 KRW`                                              |
| **Files**          | `landing-wallet-preview.tsx` · `landing-display-contract.ts:133,259-265` · i18n `landing.wallet.footnote` · `packages/i18n/src/index.ts:596-600` |
| **Fix (approved)** | `MoneyDisplayWithFiatHint` + fresh rate snapshot · rate/stale 없으면 KRW 줄 **omit** · footnote 삭제                                             |
| **Regression**     | landing wallet tests · `check:i18n` · Stage1 `/` Browser                                                                                         |

---

## M-01 — P vs PHON 혼용

| 필드               | 값                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Symptom**        | 미션 `+200P` · 합계/지갑 PHON                                                                                                                                                      |
| **Root cause**     | `EARN_STATIC_MISSIONS[].rewardLabel` legacy `P` suffix · landing teasers reuse verbatim                                                                                            |
| **Files**          | `apps/web/src/data/earn-static-missions.ts:8+` · `landing-display-contract.ts:127,236-248` · `landing-page.tsx` mission cards                                                      |
| **Fix (approved)** | landing path: PHON-only labels via i18n/MoneyDisplay · `parseLandingRewardPhon` naming/behavior align (engine catalog key rename 금지 — landing display layer only per Scope Lock) |
| **Regression**     | landing-page tests · earn static mission display contracts                                                                                                                         |

---

## R1 부가 scope — PrimeForge 노출

| 필드           | 값                                                                                 |
| -------------- | ---------------------------------------------------------------------------------- |
| **Symptom**    | document title `PrimeForge — 부업 습관` (Probe 5 post-hydration)                   |
| **Root cause** | `platform-narrative-display-contract.ts:8` · i18n `platform.positioning.pageTitle` |
| **Fix**        | PHONARA 공개 naming · COPYWRITING_CANON · PWA/meta parity                          |
| **Finding id** | 없음 (R1 Stage Exit 항목)                                                          |

---

## No Assumption checklist (§37)

- [x] 파일 존재 — grep/read 확인
- [x] RPC live health — **없음** (C-02 근거)
- [x] `blocked_by` — R1 batch 0
- [x] Browser MCP — Probe 5 CAPTURE_OK
- [x] Plan Standing Grant — R1 UI · migration 0

## Next command

**Implement** → PR **R1-a** (C-01 · H-01 · M-01) then **R1-b** (C-02) per Execution Budget §11.
