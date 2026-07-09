# Product Experience Canon (Digital Aurora · DA W0)

> **상태:** Active SSOT · **날짜:** 2026-07-09  
> **플랜:** `phase_r_super-app_8bdf2c10` §34 · todo `da-w0-foundation-ssot-bundle` (#185)  
> **ADR:** [`ADR-009`](../PRODUCT/ADR/009-digital-aurora-brand-dna.md) (Plan 문구 「ADR-004 brand DNA」= 본 결정)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) · [`ACTIVE_WORK_SSOT.md`](ACTIVE_WORK_SSOT.md)  
> **엔진 경계:** presentation / copy / motion policy only — UI는 RPC 표시 · client money 재계산 **금지**

본 문서는 Digital Aurora **Product Experience** 정본이다.  
도메인별 layout·module은 `*_UX_CANON.md` · [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md)를 따른다.  
공유 interaction·confirm 문법은 [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)가 정본이다.

---

## 1. Brand DNA — 5문법 (§34.1)

```text
Apple 여백 + Stripe 정보 설계 + Linear 미니멀 + Arc 미래감
+ Coinbase 금융 신뢰 + Revolut 마이크로 인터랙션
```

| 문법             | 정의                            | 강제                                                          |
| ---------------- | ------------------------------- | ------------------------------------------------------------- |
| **Aurora Mesh**  | route당 1회 subtle mesh+noise   | aurora ≤1/route · Earn/Wallet low · Trade **off**             |
| **Quad Stream**  | Earn/Trade/Sports/Casino 4-axis | `BRAND_AXIS_COLORS` only · competitor gradient clone **금지** |
| **Orbit Grid**   | PC 12-col · shell panel zones   | `.ds-shell-panel-grid` · page root width hack **금지**        |
| **Signal Pulse** | reward·XP·balance count-up      | `useCountUp` display-only · L2 = instant                      |
| **Neural Glow**  | hero card edge whisper          | Card `raised`/`wallet-hero` only — 전 card glow **금지**      |

**3초 recall:** Aurora Mesh + Quad Stream mark + JetBrains Mono (`--ds-font-mono`) money.

**코드 정본 (이미 존재):**

| 항목               | Path                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| Quad Stream colors | `apps/web/src/domain/brand-display-contract.ts`                        |
| Motion tokens      | `apps/web/src/product/tokens/motion.css`                               |
| Panel grid         | `apps/web/src/product/tokens/layout.css` `.ds-shell-panel-grid`        |
| Aurora Mesh        | `apps/web/src/product/shell/aurora-background.tsx` (+ `.css`)          |
| Orbit col-span     | `layout.css` `.ds-shell-col-span-8` / `.ds-shell-col-span-4`           |
| Viewport smoke     | `apps/web/src/product/tokens/viewport-contract.ts` (390/768/1024/2560) |

---

## 2. Emotion Map (§34.2)

| Surface   | 목표 감정       | 금지 감정                                          |
| --------- | --------------- | -------------------------------------------------- |
| Home/Earn | 성취·기대(절제) | false urgency · guaranteed reward                  |
| Wallet    | 안정·통제       | 불안 조장 · fake urgency on withdraw               |
| Trade     | 집중·전문       | 도박 흥분 · casino-style flash                     |
| Sports    | 스캔·긴장(절제) | guaranteed win · false odds hype                   |
| Casino    | 발견·즐거움     | 중독 유도 · infinite decorative loop on bet submit |
| Auth      | 신뢰·명확       | marketing noise · competing CTAs                   |

Copy tone: [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md) · Earn FOMO 허용 범위는 [`EARN_UX_CANON.md`](EARN_UX_CANON.md) · [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md).

---

## 3. Brand Memory Rules (§34.4)

1. **Aurora ≤1 / route** — `check:design-tokens` (da-w7 strict).
2. **Money** = 항상 `MoneyDisplay` (또는 domain wrapper) + `tabular-nums` + mono — ad-hoc `text-[10px]` trade escape hatch는 da-w\*에서 흡수.
3. **Accent mint** (`--ds-accent`) = **primary CTA only** — section당 filled primary **1개**.
4. **Quad Stream only** — 외부 브랜드 gradient·로고·unique identity clone **금지**.
5. **DESIGN_CHARTER Phase 4 defer 해제** — geometric recall / brand memory는 DA W6+에서 구현 가능 ([`DESIGN_CHARTER.md`](../PRODUCT/DESIGN_CHARTER.md)).

---

## 4. Elevation ladder (§34 · ADR-009)

| Level     | Use                   | Token (da-w1 `[x]`)                       |
| --------- | --------------------- | ----------------------------------------- |
| 0 Flat    | default · trade-dense | border · `shadow-none`                    |
| 1 Raised  | content card          | `--ds-shadow-1` · `bg-surface-raised`     |
| 2 Float   | hover card · sticky   | `--ds-shadow-2` + `translateY(-2px)` (L1) |
| 3 Overlay | Dialog · Sheet        | `--ds-shadow-overlay` / `--ds-shadow-3`   |
| 4 Toast   | system toast          | `--ds-z-toast` · `--ds-shadow-4`          |

**구현:** `product/tokens/elevation.css` · `Card` CVA (`default|raised|glass|mission|wallet-hero|vip|trade-dense|sports-odds|casino-play`) · `Text` primitive · `domain-card-personalities.css` (§34.17 signatures).

---

## 5. Motion tiers L0 / L1 / L2 (§34.15–34.16)

| Tier             | 허용                                             | 금지                                           |
| ---------------- | ------------------------------------------------ | ---------------------------------------------- |
| **L0 Ambient**   | Landing · Earn · Casino lobby mesh/ambient       | wallet infinite loop · trade blotter particles |
| **L1 Surface**   | press · hover · nav · skeleton · count-up ≤400ms | layout shift · motion-only success             |
| **L2 Financial** | withdraw · bet · order submit = **instant**      | decorative · reward burst · count-up delay     |

Semantic CSS roles: [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) §3 (`--ds-motion-press` 120ms 등).  
Interaction 표: [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md) §Interaction Grammar.

**구현 (`da-w4-motion-system-bundle`):** `useCountUp` · `MoneyDisplay countUp` · `--ds-motion-count-up` 400ms · wire = wallet balance · Earn XP · futures PnL.

`prefers-reduced-motion: reduce` → instant variants · static aurora · no count-up.

**GATE (`da-w4-gate-motion`):** `usePrefersReducedMotion` media-query SOT · `instantMotionVariants` · CSS token 0ms · `gate:ai-impl` **38/38**.

---

## 6. Accessibility Elevation (§34.5)

상세 체크리스트: [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) **§7**.

| 요구            | 규칙                                         |
| --------------- | -------------------------------------------- |
| Keyboard        | focus order · Esc dismiss · modal focus trap |
| Focus visible   | token ring · bare `outline-none` 금지        |
| Reduced motion  | L0/L1 → instant · L2 already instant         |
| SR live regions | settlement · reward claim · kill switch      |
| Gate            | axe critical **0** per DA wave gate          |

---

## 7. Orbit Grid · PC 12-col

| Tier    | Width | Layout                                                              |
| ------- | ----- | ------------------------------------------------------------------- |
| Mobile  | 390   | single column · thumb-safe                                          |
| Tablet  | 768   | 2-col where domain allows                                           |
| Desktop | 1024+ | **12-col** content grammar · multi-panel via `.ds-shell-panel-grid` |
| Ultra   | 2560  | panel min preserved · smoke required                                |

**Forbidden:** page root `max-w-[390px]` · `w-[390px]` · `min-w-[500px+]` (rule `97-phase-r-surface-domain-guard`).

---

## 8. World-Class Tech Stack SSOT (§35.1)

> **원칙:** repo에 **이미 있는** 스택만 강제. 신규 dep는 ADR 없이 **금지**.

| 계층        | 정본 스택                                                                                 | 금지                                  |
| ----------- | ----------------------------------------------------------------------------------------- | ------------------------------------- |
| Runtime     | Bun · TypeScript strict · Vitest `maxWorkers:1`                                           | Node-only scripts without Bun         |
| Web UI      | React 19 · TanStack Router · TanStack Query · CVA · Radix in `product/primitives`         | `@phonara/ui` 복구 · parallel DS      |
| Money       | `@phonara/money` Decimal · ledger append-only                                             | JS `number` settlement                |
| Trade chart | Lightweight Charts v5 · WS display-only                                                   | chart 가격으로 주문/PnL 재계산        |
| Casino PF   | `@phonara/game-engine` · SQL `rpc_place_game_bet`                                         | client `settle()` as ledger truth     |
| Sports      | `@phonara/sportsbook-engine` preview · RPC settle                                         | client odds multiply as payout        |
| DB          | Postgres · Supabase RLS/RPC · `stack:push-remote`                                         | raw `db push` · MCP `apply_migration` |
| Admin       | AAL2 MFA · reason+audit · RBAC matrix                                                     | role=admin 전원 동일 권한 방치        |
| Quality     | `gate:ai-impl` · `check:phase-r-guards` · `check:plan-yaml` · CI quality/sql/e2e/advisors | agent 자율 `test:sql`/E2E (G13)       |
| Design      | `--ds-*` · Digital Aurora §34 · 4-tier 390/768/1024/2560                                  | inline hex · max-w-[390px] page root  |

**Shell 금지 (ADR 없이):** Three.js · GSAP global · Magic UI paste.  
**ADR 후 선택:** Lenis (Landing only) · Lottie (reward moment) · Phosphor icons.

---

## 9. Wave ownership (구현은 후속 todo)

| Wave   | Todo                                             | Scope                                                              |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------ |
| **W0** | `da-w0-foundation-ssot-bundle`                   | 본 문서 · ADR-009 · UNIFIED/DESIGN sync (**DOC**)                  |
| **W1** | `da-w1-ds-foundation-bundle` · `da-w1-gate-ds-2` | Text · elevation.css · Card CVA · spacing ratchet · GATE **`[x]`** |
| **W2** | `da-w2-shell-elevation-infra` · `da-w2-gate-shell-elevation` | Aurora · floating BottomNav · 12-col · Earn rails · GATE **`[x]`** |
| **W3** | `da-w3-ia-progressive-bundle` · `da-w3-gate-ia-progressive` | `/home` Fold1–5 · wallet-hero · trade ticket · GATE above-fold ≤3 **`[x]`** |
| **W4** | `da-w4-motion-system-bundle` · `da-w4-gate-motion` | `useCountUp` · reduced-motion instant · motion-presets GATE **`[x]`** |
| **W5** | `da-w5-cards-domain-variants` **`[x]`** · `da-w5-gate-domain-cards` | Domain card personalities CVA **`[x]`** · GATE pending |
| W6–W8  | `da-w6`…`da-w8`                                  | brand · signature · enforcement            |
| W7     | `da-w7-enforcement-strict-tokens`                | `check:design-tokens --strict`                                     |

---

## 10. FAIL

- GSAP/Three.js shell 도입 (ADR 없이)
- Wallet/Trade withdraw·bet submit에 decorative L0 loop
- route당 aurora >1 · mint primary CTA 남발
- Emotion Map 금지 감정 copy (false urgency · guaranteed win)
- W0에서 parallel surface/route 생성
- da-w7 strict red인데 P13 GO 주장

---

## 교차 참조

| 주제                | 문서                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| Interaction Grammar | [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)                                        |
| A11y · motion roles | [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)                                      |
| Brand charter       | [`DESIGN_CHARTER.md`](../PRODUCT/DESIGN_CHARTER.md)                                 |
| Domain UX           | `*_UX_CANON.md` · [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md)                  |
| Copy                | [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)                                      |
| ADR                 | [`009-digital-aurora-brand-dna.md`](../PRODUCT/ADR/009-digital-aurora-brand-dna.md) |
