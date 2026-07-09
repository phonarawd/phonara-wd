# ADR-009: Digital Aurora Brand DNA (DA W0)

> **상태:** Accepted · **날짜:** 2026-07-09  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `da-w0-foundation-ssot-bundle` (#185 · §34)  
> **SSOT:** [`PRODUCT_EXPERIENCE_CANON.md`](../../SSOT/PRODUCT_EXPERIENCE_CANON.md)  
> **참고:** Plan YAML 문구의 「ADR-004 brand DNA」는 **본 결정(브랜드 DNA)** 을 가리킨다. 파일 번호 **009** — 기존 [`004-trade-desk-sentry-defer.md`](004-trade-desk-sentry-defer.md)와 충돌 방지.

## Context

Phase R surfaces는 `--ds-*` 토큰·primitives를 이미 갖고 있으나, 브랜드 기억·elevation·motion tier·PC 12-col 문법이 SSOT에 고정되지 않아 화면이 평평하고 도메인 개성이 없다 (§34.0 갭).

**엔진 경계:** presentation / SSOT only — `supabase/migrations` · money RPC 변경 **0**. 신규 라이브러리 **0** (§34.30 · §35.1).

## Decision

### 1. Brand DNA — Digital Aurora 5문법 (non-waivable)

| 문법             | 정의                                      | 코드 강제 (후속 wave)                                         |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------- |
| **Aurora Mesh**  | route당 1회 subtle mesh+noise             | `aurora-background` · aurora ≤1/route · `check:design-tokens` |
| **Quad Stream**  | Earn/Trade/Sports/Casino 4-axis glow      | `brand-display-contract.ts` `BRAND_AXIS_COLORS`               |
| **Orbit Grid**   | PC 12-col · shell panel zones             | `layout.css` `.ds-shell-panel-grid` · 12-col desktop          |
| **Signal Pulse** | reward·XP·balance count-up (display-only) | `useCountUp` ≤400ms · L2 financial = instant                  |
| **Neural Glow**  | hero card edge whisper only               | Card `raised` / `wallet-hero` (da-w1+)                        |

**3초 recall:** Aurora Mesh + Quad Stream mark + JetBrains Mono money.

### 2. Elevation ladder (SSOT → da-w1 tokens)

| Level     | Intent                     | Token 후보                              |
| --------- | -------------------------- | --------------------------------------- |
| 0 Flat    | default card / dense trade | border only · no raise shadow           |
| 1 Raised  | primary content card       | `--ds-shadow-1` · `surface-raised`      |
| 2 Float   | hover / sticky chrome      | `--ds-shadow-2` · translateY(-2px) L1   |
| 3 Overlay | dialog · sheet             | `--ds-shadow-3` / `--ds-shadow-overlay` |
| 4 Toast   | system feedback            | `--ds-z-toast` · `--ds-shadow-4`        |

구현: `apps/web/src/product/tokens/elevation.css` + theme bridges (`da-w1-ds-foundation-bundle` **`[x]`**). 본 ADR은 **사다리 정의** 정본.

### 3. Motion tier L0 / L1 / L2

| Tier             | 허용 surface                                     | 금지                                   |
| ---------------- | ------------------------------------------------ | -------------------------------------- |
| **L0 Ambient**   | Landing · Earn · Casino lobby                    | infinite loop on wallet/trade withdraw |
| **L1 Surface**   | all non-submit (press · hover · nav · count-up)  | layout shift · blocking splash         |
| **L2 Financial** | withdraw · bet · trade submit = **instant only** | decorative loop · reward burst         |

Semantic roles (`--ds-motion-press` 등)는 [`DESIGN_PRINCIPLES.md`](../../SSOT/DESIGN_PRINCIPLES.md) §3 유지. Tier는 **surface 정책** 계층.

### 4. PC 12-col (Orbit Grid)

- Desktop (≥1024): content column은 **12-col grid** 문법 — Trade/Sports multi-panel은 `.ds-shell-panel-grid` + panel min (`--ds-panel-min`).
- Smoke widths: **390 / 768 / 1024 / 2560** ([`viewport-contract.ts`](../../../apps/web/src/product/tokens/viewport-contract.ts)).
- Page root `max-w-[390px]` · `min-w-[500px+]` **금지** (rule `97`).

### 5. DESIGN_CHARTER Phase 4 defer 해제

[`DESIGN_CHARTER.md`](../DESIGN_CHARTER.md) Phase 4 brand memory / geometric recall defer를 **해제**한다.  
flat `BrandMark`는 chrome 기본 · Aurora / Quad Stream / shape mark는 hero·memory surfaces에서 DA wave가 승격한다 (`da-w6`).

## Consequences

- W0 = **DOC/SSOT only** — UI 구현은 da-w1+ Owner 경로만 확장.
- GSAP / Three.js shell · Magic UI paste · 신규 chart/state lib = **ADR 없이 금지** (§35.1).
- `check:ai-reference` · `check:plan-doc-sync` green 유지.

## Verification

- [x] `docs/SSOT/PRODUCT_EXPERIENCE_CANON.md` (§34.2–34.5 · §35.1)
- [x] `UNIFIED_UX_CANON.md` Interaction Grammar
- [x] `DESIGN_PRINCIPLES.md` §7 Accessibility Elevation
- [x] `DESIGN_CHARTER.md` Phase 4 defer 해제
- [x] `bun run check:ai-reference`
