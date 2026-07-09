# Design Charter — Timeless Conversion + Digital Aurora

> **상태:** Active · Phase 4 brand defer **해제** (2026-07-09 · `da-w0-foundation-ssot-bundle`)  
> **상위:** [`PRODUCT_OPERATING_SYSTEM.md`](PRODUCT_OPERATING_SYSTEM.md)  
> **Landing ADR:** [`ADR/003-landing-timeless-conversion.md`](ADR/003-landing-timeless-conversion.md)  
> **Brand DNA ADR:** [`ADR/009-digital-aurora-brand-dna.md`](ADR/009-digital-aurora-brand-dna.md)  
> **Product Experience:** [`docs/SSOT/PRODUCT_EXPERIENCE_CANON.md`](../SSOT/PRODUCT_EXPERIENCE_CANON.md)  
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

- **Chrome / auth:** flat `BrandMark` + semantic tokens — 기본.
- **Hero / memory / splash:** Quad Stream · Aurora Mesh · geometric recall shape (`BRAND_ASSETS.shape`) — Digital Aurora ([`ADR-009`](ADR/009-digital-aurora-brand-dna.md) · `da-w6` 구현).
- **3초 recall:** Aurora Mesh + Quad Stream mark + JetBrains Mono money.

---

## 2. Design Budget (timeless + Aurora)

| 항목       | Phase 1–2 (Landing CVR)                  | DA W0+ (Product)                                                                  |
| ---------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| Color      | semantic tokens (`--ds-*`)               | Quad Stream 4-axis · accent mint CTA only                                         |
| Typography | `font-display` hero · tabular-nums money | Text primitive **`[x]`** · money-mono                                             |
| Motion     | reduced · `prefers-reduced-motion`       | L0/L1/L2 tiers · L2 financial instant                                             |
| Density    | landing = low · 48px+ touch              | Orbit Grid 12-col desktop                                                         |
| Elevation  | flat cards                               | ladder 0–4 ([`PRODUCT_EXPERIENCE_CANON`](../SSOT/PRODUCT_EXPERIENCE_CANON.md) §4) |
| Icon       | Lucide (CVR modules)                     | Phosphor optional (ADR 후)                                                        |

**금지:** inline arbitrary hex in JSX · single-width mockup-only layout · pre-demolition `@phonara/ui` 복구 · competitor gradient clone

---

## 3. Motion Budget

| Surface            | 허용                               | 금지                           |
| ------------------ | ---------------------------------- | ------------------------------ |
| Landing hero       | subtle brand mark · ticker ambient | flash · auto-play video        |
| Mission preview    | hover/focus only                   | fake “live” pulse              |
| Wallet preview     | static presentation (landing)      | balance count-up from fake RPC |
| Wallet live        | Signal Pulse count-up (RPC only)   | L0 decorative loop on withdraw |
| Testimonials       | none or fade-in once               | carousel autoplay              |
| Trade / bet submit | **instant** (L2)                   | reward burst · ambient mesh    |

---

## 4. Responsive shell (랜딩 + product)

| Tier    | Width        | 규칙                                     |
| ------- | ------------ | ---------------------------------------- |
| mobile  | 390          | single column · fold CVR modules stacked |
| tablet  | 768 (`md:`)  | 2-col grids · diff scroll row            |
| desktop | 1024 (`lg:`) | hero split · **12-col** Orbit Grid       |
| ultra   | 2560         | smoke required · panel min preserved     |

Canonical landing route: `/` only — parallel landing hub **금지**.  
Product shell: [`DESIGN_PRINCIPLES.md`](../SSOT/DESIGN_PRINCIPLES.md) · rule `97`.

---

## 5. Presentation vs Live

| Element         | presentation                           | live                         |
| --------------- | -------------------------------------- | ---------------------------- |
| Wallet preview  | `LANDING_WALLET_PREVIEW_PHON` constant | hide or RPC (operator flag)  |
| Stats L0a       | operator threshold gated               | RPC when enabled             |
| Testimonials L5 | approved pool                          | verified only                |
| Activity ticker | ambient strings                        | `rpc_get_earn_activity_feed` |

UI는 resolver 출력만 표시 — client-side payout/balance 재계산 **금지**.

---

## 6. Brand Memory (Phase 4 defer **해제**)

> **2026-07-09:** Landing CVR Phase 4 defer 해제 — Digital Aurora W0 SSOT + W6 구현 큐가 정본.

| 항목                                                  | 상태           | Owner todo                     |
| ----------------------------------------------------- | -------------- | ------------------------------ |
| Brand Memory Rules (aurora≤1 · money mono · mint CTA) | **SSOT `[x]`** | `da-w0-foundation-ssot-bundle` |
| Geometric recall / BrandMark `aurora` variant         | pending impl   | `da-w6-brand-elevation-bundle` |
| Domain empty states · Quad Stream loading             | pending impl   | `da-w6-*`                      |
| LIVE withdrawal momentum strip (L0b)                  | still defer    | operator / later wave          |

Phase 1–2 Landing 마감 기준(유지): flat mark + timeless tokens + CVR module grammar green.  
Product elevation 마감: da-w7 strict + operator **VISUAL APPROVED: da-w7**.
