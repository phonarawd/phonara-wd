# Design Charter — Timeless Conversion

> **상태:** Phase 0 skeleton · **동결:** 2026-07-05  
> **상위:** [`PRODUCT_OPERATING_SYSTEM.md`](PRODUCT_OPERATING_SYSTEM.md)  
> **구현 ADR:** [`ADR/003-landing-timeless-conversion.md`](ADR/003-landing-timeless-conversion.md)  
> **Tone 정본:** [`docs/SSOT/COPYWRITING_CANON.md`](../SSOT/COPYWRITING_CANON.md)

---

## 1. Voice Charter (랜딩 · Earn)

### 허용

- 사실 기반 보상·미션·출금 가능 copy
- restrained FOMO — eligibility-visible countdown · limited slots
- benefit bullets (경쟁사 **이름 비교 금지**)
- operator-verified 후기 (L5 tier)

### 금지

- guaranteed profit · “무료 돈” · false urgency · false deadline
- 경쟁사 이름·로고 랜딩 노출 (오해·법적 리스크)
- 허위·조작·미승인 인용
- Trade PnL 과장 (랜딩 hero)
- unverifiable “100% 안전” claim

### Brand line

Phase 1–2: flat `BrandMark` + semantic tokens — [`p3-refresh-auth-landing-design-sot`](REBUILD_PLAN_v1.md) 정본.  
Phase 4: geometric recall shape (Stripe/Apple/Linear급) — **defer**.

---

## 2. Design Budget (timeless)

| 항목       | Phase 1–2                                  | Phase 4              |
| ---------- | ------------------------------------------ | -------------------- |
| Color      | semantic tokens (`--ds-*`)                 | stable palette audit |
| Typography | `font-display` hero · tabular-nums money   | —                    |
| Motion     | reduced · `prefers-reduced-motion` respect | brand motion test    |
| Density    | landing = low · 48px+ touch                | —                    |
| Icon       | Lucide only (CVR modules)                  | —                    |

**금지:** inline arbitrary hex in JSX · single-width mockup-only layout · pre-demolition `@phonara/ui` 복구

---

## 3. Motion Budget

| Surface         | 허용                               | 금지                           |
| --------------- | ---------------------------------- | ------------------------------ |
| Landing hero    | subtle brand mark · ticker ambient | flash · auto-play video        |
| Mission preview | hover/focus only                   | fake “live” pulse              |
| Wallet preview  | static presentation                | balance count-up from fake RPC |
| Testimonials    | none or fade-in once               | carousel autoplay              |

---

## 4. Responsive shell (랜딩)

| Tier    | Width        | 규칙                                     |
| ------- | ------------ | ---------------------------------------- |
| mobile  | 390          | single column · fold CVR modules stacked |
| tablet  | 768 (`md:`)  | 2-col grids · diff scroll row            |
| desktop | 1024 (`lg:`) | hero split · max content column          |

Canonical route: `/` only — parallel landing hub **금지**.

---

## 5. Presentation vs Live

| Element         | presentation                           | live                         |
| --------------- | -------------------------------------- | ---------------------------- |
| Wallet preview  | `LANDING_WALLET_PREVIEW_PHON` constant | hide or RPC (Phase 4)        |
| Stats L0a       | operator threshold gated               | RPC when enabled             |
| Testimonials L5 | approved pool                          | verified only                |
| Activity ticker | ambient strings                        | `rpc_get_earn_activity_feed` |

UI는 resolver 출력만 표시 — client-side payout/balance 재계산 **금지**.

---

## 6. Phase 4 defer (문서만)

- Brand Memory Test (실측 recall)
- Geometric brand symbol beyond flat `BrandMark`
- LIVE withdrawal momentum strip (L0b)

Phase 1–2 마감 기준: flat mark + timeless tokens + CVR module grammar green.
