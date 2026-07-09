# ADR-003: Landing Timeless Conversion (CVR pass)

> **상태:** Accepted (skeleton) · **날짜:** 2026-07-05  
> **플랜:** Landing CVR pass · todo `pos-doc-freeze` + CVR 구현 큐  
> **Spec:** [`LANDING_PRODUCT_SPEC.md`](../LANDING_PRODUCT_SPEC.md)  
> **POS:** [`PRODUCT_OPERATING_SYSTEM.md`](../PRODUCT_OPERATING_SYSTEM.md)

## Context

Phase R P3에서 §28 campaign landing (`p3-page-landing` DONE)이 배포되었으나, operator 평가 기준 **CVR 구조 기여 8.8~9.3/10** — hero·missions·FAQ는 있으나 fold 내 “왜·무엇·얼마” 즉시 이해 모듈이 부족하다.

문서 계층이 분산되어 CVR IA·analytics·proof tier가 구현 큐에 없었다. Product OS Phase 0로 문서를 동결하고 CVR 모듈 구현을 Phase 1–2로 진행한다.

**엔진 경계:** 랜딩 CVR pass는 **presentation only** — `supabase/migrations` · money RPC 변경 **0**.

## Decision

### 1. Product OS 문서 계층 (Phase 0 동결)

```text
PRODUCT_OPERATING_SYSTEM.md
  ├── DESIGN_CHARTER.md
  ├── SUCCESS_METRICS.md
  ├── LANDING_PRODUCT_SPEC.md
  └── ADR/003-landing-timeless-conversion.md (본 문서)
```

Charter·Spec **무한 확장 금지** — CVR 모듈 구현이 우선.

### 2. CVR-first fold IA

Hero 직하 순서 고정 ([`LANDING_PRODUCT_SPEC.md`](../LANDING_PRODUCT_SPEC.md) §2):

`WhyStrip` → `Differentiators` → `MissionPreview` → `WalletPreview` → 기존 stats/trust/faq.

### 3. 아키텍처 패턴 (non-waivable)

```text
UI → Display Contract → Resolver → Engine/RPC
```

| 신규 contract (Phase 1)                 | Role                                            |
| --------------------------------------- | ----------------------------------------------- |
| `landing-display-contract.ts` (extend)  | `LANDING_WALLET_PREVIEW_PHON` · mission teasers |
| `landing-proof-resolver.ts`             | L0a/L5 gating                                   |
| `landing-analytics-display-contract.ts` | funnel events · `data-analytics-*`              |

Resolver modes: `presentation` (default) · `live` (operator flag) · A/B section flags (Phase 3).

### 4. 신규 컴포넌트 (~8)

| Component                                                | Phase |
| -------------------------------------------------------- | ----- |
| `LandingWhyStrip`                                        | 1     |
| `LandingDifferentiators`                                 | 1     |
| `LandingMissionPreviewCard` / `LandingMissionPreviewRow` | 1     |
| `LandingWalletPreview`                                   | 1b    |
| `LandingTestimonials`                                    | 1b    |
| `LandingFaqSection`                                      | 1b    |
| `LandingFinalCta`                                        | 1b    |

기존 `landing-page.tsx` 조립 — parallel route **금지** (`/` canonical).

### 5b. FAQ contract (Phase 1b)

[`LANDING_PRODUCT_SPEC.md`](../LANDING_PRODUCT_SPEC.md) §7:

- `LANDING_FAQ_IDS` 8 core + `LANDING_FAQ_BONUS_IDS` 3 bonus
- 기존 `withdraw` · `free` · `why` · `safe` **폐기**
- `LandingFaqSection` accordion · `LandingFinalCta` FAQ 직후
- `landing.faq.expand` analytics payload `{ id: LandingFaqId }`

### 5. Voice & proof (non-waivable)

- 경쟁사 이름 랜딩 **금지**
- L5 testimonials: operator-verified pool only · 0건 → hide
- Mission stars = catalog difficulty presentation · fake user rating **금지**
- Wallet preview = presentation constant · not user balance

### 6. Analytics (Phase 1)

[`SUCCESS_METRICS.md`](../SUCCESS_METRICS.md) §2 이벤트를 contract로 고정.  
DEV: stub log · PROD: hook point + §28.5 pixels (중복 방지 구현 시).

### 7. Defer (본 ADR 범위 밖)

- Geometric brand symbol · Brand Memory Test (Phase 4)
- L0b LIVE withdrawal momentum RPC (Phase 4)
- Ops Dashboard · AI recommendation resolver beyond stub (Phase 3+)
- A/B brandLine/CTA/section order (Phase 3)

## Consequences

- `packages/i18n` add-only keys (`landing.why.*` · `landing.diff.*` · …)
- `gate:ai-impl` landing + landing-\* domain tests 확장
- operator visual signoff: 390/768/1024 · axe critical 0
- L0a/L5 copy used in ads → operator + legal review

엔진 freeze 유지 — CVR pass 완료 ≠ engine reopen.

## Verification

| Gate                                                        | Phase    |
| ----------------------------------------------------------- | -------- |
| `gate:ai-impl --test apps/web/src/product/surfaces/landing` | 1–2      |
| `gate:ai-impl --test apps/web/src/domain` (landing-\*)      | 1–2      |
| `typecheck` · `check:i18n` · `check:release`                | 1–2      |
| `check:ai-reference`                                        | doc sync |
| operator preview signoff                                    | 2        |

## Operator sign-off

| 필드                       | 값                                                                   |
| -------------------------- | -------------------------------------------------------------------- |
| 결정                       | Product OS Phase 0 skeleton + CVR fold IA 동결                       |
| 서명                       | operator — Landing CVR pass plan                                     |
| 날짜                       | 2026-07-05                                                           |
| 다음                       | CVR 모듈 Phase 1 구현 (`LandingWhyStrip` …)                          |
| Phase 0 (`pos-doc-freeze`) | `[x] DONE` — POS · LANDING_SPEC · ADR-003 skeleton 동결 · 2026-07-05 |
