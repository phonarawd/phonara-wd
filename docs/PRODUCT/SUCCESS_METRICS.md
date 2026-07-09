# Success Metrics — Landing CVR & North Star

> **상태:** Phase 0 skeleton · **동결:** 2026-07-05  
> **상위:** [`PRODUCT_OPERATING_SYSTEM.md`](PRODUCT_OPERATING_SYSTEM.md)  
> **Analytics 구현:** `landing-analytics-display-contract.ts` (Phase 1 · ADR-003)

---

## 1. North Star (Product OS)

| Metric             | 정의                          | 소스                        |
| ------------------ | ----------------------------- | --------------------------- |
| **Signup**         | `/signup` 완료 (auth session) | auth surface                |
| **Activation**     | 첫 미션 완료                  | `rpc_*` earn hub            |
| **First Earn**     | 첫 PHON 적립 ledger row       | engine (display only in UI) |
| **First Withdraw** | 첫 출금 요청 제출             | wallet RPC                  |
| **D7**             | 가입 후 7일 재방문            | analytics (Phase 3)         |

랜딩 CVR pass는 **Signup → Activation** 퍼널 가속이 1차 목표.

---

## 2. Landing funnel events (필수)

| Event                               | Trigger                                        | Phase |
| ----------------------------------- | ---------------------------------------------- | ----- |
| `landing.hero.viewed`               | hero in viewport (once)                        | 1     |
| `landing.hero.cta`                  | primary CTA click                              | 1     |
| `landing.scroll.25` / `.50` / `.75` | scroll depth (once each)                       | 1     |
| `landing.mission.viewed`            | mission preview in viewport                    | 1     |
| `landing.mission.click`             | mission card CTA                               | 1     |
| `landing.wallet.viewed`             | wallet preview in viewport                     | 1     |
| `landing.withdraw.viewed`           | withdrawal proof section                       | 1     |
| `landing.faq.viewed`                | FAQ section                                    | 1     |
| `landing.faq.expand`                | FAQ item open · payload `{ id: LandingFaqId }` | 1     |
| `landing.signup.started`            | signup link click                              | 1     |
| `landing.signup.completed`          | post-auth (auth surface)                       | 1     |

**Phase 1 구현:** contract + `data-analytics-*` attributes · DEV stub log · prod pixel hook point (§28.5 pixels와 병행 · 중복 전송 방지는 구현 시).

---

## 3. CVR 구조 목표 (설계 · 실측은 Phase 3)

| 영역          | Phase 0 설계 | Phase 2 ship | Phase 3 data       |
| ------------- | ------------ | ------------ | ------------------ |
| 문서 완성도   | 9.7          | frozen       | patches            |
| CVR 구조 기여 | 8.9          | **9.3+**     | **9.5+**           |
| Brand recall  | —            | flat mark    | **9.8+** (Phase 4) |

실측 KPI baseline은 soft launch 후 operator가 본 문서 §4 표에 기록.

---

## 4. Operator baseline (TBD — Phase 3)

| Metric                | Baseline | Target | 측정 시작 |
| --------------------- | -------- | ------ | --------- |
| Hero CTA CTR          | TBD      | TBD    | Phase 3   |
| Scroll 50% rate       | TBD      | TBD    | Phase 3   |
| Signup completion     | TBD      | TBD    | Phase 3   |
| Mission preview click | TBD      | TBD    | Phase 3   |

**금지:** baseline 없이 “CVR 10” 주장.

---

## 5. Proof tier ↔ metrics

| Tier | UI                 | Metric impact                   |
| ---- | ------------------ | ------------------------------- |
| L0a  | 누적 통계          | social proof scroll             |
| L0b  | 출금 모멘텀 (live) | trust fold (Phase 4)            |
| L1   | activity ticker    | ambient engagement              |
| L5   | testimonials       | conversion lift (verified only) |

Cold-start: L5 후기 0건 → 섹션 숨김 (빈 placeholder 금지).

---

## 6. Verification

```text
domain/__tests__/landing-analytics-display-contract.test.ts  (Phase 1)
gate:ai-impl --test apps/web/src/domain (landing-analytics*)
check:release  (no console.log in prod path)
```

Attribution: 기존 `LANDING_ATTRIBUTION_QUERY_KEYS` · §28.5 ad pixels — signup conversion 이벤트와 ID 정합.
