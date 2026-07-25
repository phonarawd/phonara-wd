# PHONARA Product Operating System (POS)

> **상위:** [`PLATFORM_CONSTITUTION.md`](../SSOT/PLATFORM_CONSTITUTION.md) — Authority Charter (실행 큐 아님)  
> **상태:** Phase 0 skeleton · **동결:** 2026-07-05  
> **범위:** 랜딩 CVR pass · Product OS 문서 계층 정본  
> **실행 큐:** [`docs/SSOT/ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md) · [`REBUILD_PLAN_v1.md`](REBUILD_PLAN_v1.md)  
> **구현 ADR:** [`ADR/003-landing-timeless-conversion.md`](ADR/003-landing-timeless-conversion.md)

---

## 1. 목적

Product OS는 **제품 의사결정·카피·측정·랜딩 IA**의 단일 문서 계층이다.  
엔진·Demolition 큐와 분리되며, Phase R 랜딩 CVR pass의 **문서 정본** 역할만 한다.

```text
UI → Display Contract → Resolver → Engine/RPC
```

| Mode           | Resolver 동작                                 |
| -------------- | --------------------------------------------- |
| `presentation` | L0a 누적 통계 · L5 후기 풀 · mock wallet      |
| `live`         | L0b 출금 모멘텀 · RPC feed · 미검증 후기 숨김 |
| A/B            | brandLine · CTA copy · section order flags    |

---

## 2. 문서 계층 (동결)

```text
PRODUCT_OPERATING_SYSTEM.md          ← 본 문서 (루트 · 동결 규칙)
  ├── DESIGN_CHARTER.md              ← Voice · Motion · Timeless tokens
  ├── SUCCESS_METRICS.md             ← North Star · 퍼널 · CVR 목표
  ├── LANDING_PRODUCT_SPEC.md        ← CVR IA · 컴포넌트 · proof tiers
  └── ADR/003-landing-timeless-conversion.md   ← 구현 결정 정본
```

| 문서                                                                               | 역할                        | 구현 큐                    |
| ---------------------------------------------------------------------------------- | --------------------------- | -------------------------- |
| [`DESIGN_CHARTER.md`](DESIGN_CHARTER.md)                                           | 브랜드·모션·토큰 의도       | Phase 1–2 flat `BrandMark` |
| [`SUCCESS_METRICS.md`](SUCCESS_METRICS.md)                                         | KPI · analytics 이벤트 매핑 | Phase 1 contract + stub    |
| [`LANDING_PRODUCT_SPEC.md`](LANDING_PRODUCT_SPEC.md)                               | CVR-first fold IA           | Phase 1–2 컴포넌트         |
| [`ADR/003-landing-timeless-conversion.md`](ADR/003-landing-timeless-conversion.md) | ADR 결정·게이트             | 구현 시 정본               |

**교차 참조 (기존 SSOT — POS가 대체하지 않음):**

- [`docs/SSOT/PLATFORM_NARRATIVE_CANON.md`](../SSOT/PLATFORM_NARRATIVE_CANON.md) — positioning · pillars
- [`docs/SSOT/COPYWRITING_CANON.md`](../SSOT/COPYWRITING_CANON.md) — tone matrix
- [`docs/SSOT/EARN_UX_CANON.md`](../SSOT/EARN_UX_CANON.md) — Earn/Home FOMO 규칙
- [`docs/SSOT/ENGINE_BOUNDARY.md`](../SSOT/ENGINE_BOUNDARY.md) — UI display only

**코드 계약 (현행):**

- `apps/web/src/domain/landing-display-contract.ts`
- `apps/web/src/product/surfaces/landing/landing-page.tsx`

---

## 3. Documentation Freeze (Phase 0–2)

### 허용

| 항목                                    | Phase |
| --------------------------------------- | ----- |
| POS skeleton (본 계층)                  | 0     |
| CVR 모듈 **구현**                       | 1–2   |
| Analytics contract + `data-analytics-*` | 1     |
| Phase 3 **데이터 기반** Spec 패치       | 3+    |

### 금지

| 항목                     | 이유       |
| ------------------------ | ---------- |
| Charter 무한 확장        | 구현 지연  |
| 문서만으로 CVR 10 주장   | 실측 없음  |
| 과도 설계 항목 선행 구현 | 아래 defer |

### Defer (문서 언급만 · 구현 Phase 3+)

- Ops Dashboard UI
- AI recommendation resolver (Phase 1 stub만)
- Brand Memory Test 실측 (Phase 4)
- Geometric brand symbol (Phase 4)
- LIVE RPC withdrawal momentum (Phase 4 · L0b)

### 유지 (가치 검증됨)

- UI → Contract → Resolver → RPC
- Design / Motion Budget
- Voice Charter
- `presentation` ↔ `live` swap

---

## 4. 구현 우선순위 (CVR pass)

| 순서 | 작업                                                                                  | Phase |
| ---- | ------------------------------------------------------------------------------------- | ----- |
| 1    | Hero + CTA + **Why + Mission Preview**                                                | 1     |
| 2    | 누적 통계 · 출금 증거 · **FAQ (8+3)** · **Wallet Preview · Testimonials** · Final CTA | 1b    |
| 3    | **Analytics** 이벤트 · 퍼널 측정                                                      | 1     |
| 4    | gates green · preview signoff                                                         | 2     |
| 5    | A/B (brandLine · CTA · section order)                                                 | 3     |
| 6    | 운영 데이터 → Spec/카피 보정                                                          | 3b    |
| 7    | Brand Shape · LIVE · Memory Test                                                      | 4     |

---

## 5. 완료 정의 (CVR pass)

|                  | 문서          | CVR (구조) | 제품               |
| ---------------- | ------------- | ---------- | ------------------ |
| **Phase 0**      | skeleton 동결 | 설계 8.9   | 기존 §28 landing   |
| **Phase 2 ship** | frozen        | **9.3+**   | CVR 모듈 사용 가능 |
| **Phase 3 data** | patches       | **9.5+**   | 실측 검증          |
| **Phase 4**      | stable        | **9.8+**   | shape + KPI        |

**엔진/SQL Phase 1–2:** 0  
**신규 컴포넌트:** ~8 (`LANDING_PRODUCT_SPEC` 참조)

---

## 6. Gates

```text
gate:ai-impl --test apps/web/src/product/surfaces/landing
gate:ai-impl --test apps/web/src/domain (landing-*)
typecheck · check:i18n · check:release
preview 390/768/1024 · axe critical 0
L0a/L5 copy → operator + legal (광고 사용 시)
```

---

## 7. FAIL

- POS 계층 밖에 랜딩 CVR IA 병렬 문서 생성
- Charter·Spec 무한 확장으로 구현 착수 지연
- presentation 상수를 engine/RPC/ledger로 오인
- 경쟁사 이름 랜딩 노출 (Voice Charter 위반)
- 허위·미승인 후기 · cold-start 빈 placeholder
