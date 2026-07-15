# Design Principles (D0)

> **상태:** Phase R active · DA W0 Accessibility Elevation (2026-07-09)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) (Phase R) · [`ADR-009`](../PRODUCT/ADR/009-digital-aurora-brand-dna.md) · [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md)  
> **Token SOT:** `apps/web/src/product/tokens/*` (`--ds-*`) · pre-demolition `theme.css` / `@phonara/ui` **복구 금지**  
> **v2 archived:** [`DEPRECATED_DOC_DENYLIST.md`](DEPRECATED_DOC_DENYLIST.md)

D0는 mockup·픽셀 diff 없이 **제품 구조·사용자 흐름** 기준으로 presentation rebuild의 공통 원칙을 고정합니다.  
Surface별 reference·layout·module은 D1~D2 canon을 따릅니다.  
Digital Aurora brand · emotion · tech stack은 [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md)가 정본이다.

---

## 1. Navigation philosophy

**목표:** 사용자가 Earn · Bet · Wallet · Account 흐름을 **3초 이내** 이해한다.

### Canonical IA (mobile · BottomNav 5탭)

> **정본:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §12.19 — 도메인 격리 · Trade에 Sports/Casino embed **금지**

| Tab          | Route                                  | Role                                                   |
| ------------ | -------------------------------------- | ------------------------------------------------------ |
| **1 돈벌기** | `/home` + **EarnShell** (`earnSubnav`) | 미션·출석·추천·등급·캐시백·부수입 play                 |
| **2 지갑**   | `/wallet`                              | Money rails · ledger                                   |
| **3 거래**   | `/trade`                               | **Trading only** — spot · futures · positions · orders |
| **4 스포츠** | `/sports`                              | Sportsbook only                                        |
| **5 카지노** | `/casino`                              | Lobby · `/games/*`                                     |

- **Earn 허브 URL:** `/home` — `/earn` → redirect only.
- **Post-login default:** `/home` (돈벌기 탭) — `/trade` default landing **금지**.
- **Account/설정:** TopBar avatar → `/account` — BottomNav 6탭화 **금지**.
- **Cross-domain CTA (Earn/Home):** 「거래」→ `/trade` · 「스포츠」→ `/sports` · 「카지노」→ `/casino` — **navigate only** · embed **금지**.
- **Legacy redirect:** `/trade?section=sports|casino|bet` → canonical route (`§12.17`) — Bet hub · embed 패턴 **역사**.
- **Deep link:** 모든 primary surface는 bookmarkable URL — modal-only navigation 금지 (auth recovery 제외).

### Desktop

- **Side nav + content column** — `AppShell` · `.shell-content-column`은 Phase R shell intent이며 현재 구현 경로가 아니다 ([`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)).
- Trade/Sports: exchange-grade **다중 패널** — league list · main context · action panel · positions/history.
- Earn/Home: **단일 컬럼** 집중 — side rail은 보조(미션·알림)만.

### Forbidden

- 동일 product surface에 canonical URL 2개 (예: `/earn` + `/home` standalone hub).
- BottomNav label과 TopBar title·CTA destination 불일치.
- Money path를 숨기는 “게스트 전용” nav 우회.
- **Trade layout에 Sports/Casino embed** — league tree · bet slip · casino lobby · `?section=sports|casino` on `/trade`.
- **Bet hub** — Trade · Sports · Casino를 단일 탭 아래 묶는 pre-demolition IA (**역사**).

---

## 2. Visual hierarchy

**목표:** 가장 중요한 **행동 · 잔액 · 상태 · 위험 신호**가 스캔 순서 1~3위에 온다.

### Priority stack (모든 surface)

```text
1. Primary action + money headline (balance · PnL · stake · payout preview)
2. Domain state (open orders · bet slip · mission progress · settlement status)
3. Risk / restriction (kill switch · parity hold · withdrawal gate · KYC · RG limit)
4. Secondary actions · filters · history
5. Social proof · marketing · decorative chrome
```

### Surface density cues

| Surface   | Hierarchy emphasis                               |
| --------- | ------------------------------------------------ |
| Wallet    | Balance → deposit/withdraw CTA → timeline status |
| Trade     | Market context → order ticket → positions        |
| Sports    | League nav → odds table → bet slip risk          |
| Casino    | Game stage → bet controls → provably-fair trust  |
| Earn/Home | Next mission → reward progress → activity feed   |
| Admin     | Exception queue → audit context → action         |

### Typography & color

- **Money/quantity:** tabular nums · mono or Space Grotesk where exchange-grade.
- **Up/down/PnL:** `--up` / `--down` / `--ds-market-*` — semantic only, decorative gradient on numbers 금지 (aurora ≤1 per route — `check:design-tokens`).
- **Status:** success · warning · error · pending — token semantic; grey-only for critical states 금지.

---

## 3. Motion language

**목표:** 장식 motion 0 — **상태 전환·피드백 설명**만 허용.  
**Surface tier (L0/L1/L2):** [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) §5 · Interaction 표 [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md) §4.

> **구현 SOT:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §25.3 · `apps/web/src/product/tokens/motion.css` · `motion.ts`  
> Semantic role 이름이 정본 — `--ds-motion-fast` / `--ds-motion-base` / `--ds-motion-slow`는 deprecated alias (P13 제거).

### Semantic motion roles (L-A CSS tokens)

| Role    | Token                 | ms  | Typical use                                                 |
| ------- | --------------------- | --- | ----------------------------------------------------------- |
| Press   | `--ds-motion-press`   | 120 | Button · IconButton · Dialog/Sheet close · menu item        |
| Field   | `--ds-motion-field`   | 150 | Input · Select border/focus                                 |
| Toggle  | `--ds-motion-toggle`  | 150 | Switch · Tabs pill                                          |
| Surface | `--ds-motion-surface` | 200 | StatusBadge · MissionCard · ProgressRing · Skeleton shimmer |
| Overlay | `--ds-motion-overlay` | 320 | Sheet · Dialog open (L-B cap)                               |

### Allowed motion

| Use                         | Token / pattern                                                   | Max duration           |
| --------------------------- | ----------------------------------------------------------------- | ---------------------- |
| Press · hover · dismiss     | `--ds-motion-press` (120ms)                                       | ≤200ms                 |
| Field focus · border        | `--ds-motion-field` (150ms)                                       | ≤200ms                 |
| Toggle · pill switch        | `--ds-motion-toggle` (150ms)                                      | ≤200ms                 |
| Surface · badge · progress  | `--ds-motion-surface` (200ms)                                     | ≤300ms                 |
| Overlay · sheet/dialog open | `--ds-motion-overlay` (320ms) · L-B spring                        | ≤320ms                 |
| Page enter (shell)          | `pageEnter` / `usePageEnterVariants`                              | ≤250ms                 |
| Toast · inline feedback     | slide/fade in-out                                                 | ≤300ms                 |
| Count-up (display only)     | `useCountUp` · `--ds-motion-count-up` 400ms · RPC value unchanged | ≤400ms                 |
| Game/canvas feel            | engine stage hooks · GPU tier caps                                | per `packages/game-ui` |

### Forbidden motion

- Infinite decorative loops on financial surfaces (trade · wallet · sports slip).
- Motion that delays first interaction (boot splash >2s without skip).
- Parallax · heavy blur · full-screen particle on login/wallet.
- Animation as **only** indicator of success/failure (must have text/icon/state color).

### Reduced motion

- `prefers-reduced-motion: reduce` → instant variants (`pageEnterInstant`) · static feeds · no count-up.
- Casino canvas: rotation/transform may disable; **outcome text/icon must remain visible**.

---

## 4. Information density

**목표:** mobile 집중형 · desktop exchange-grade 다중 패널.

### Breakpoints (정본 · 4-tier smoke)

| Tier    | Min width        | Token / smoke                          | Layout                                 |
| ------- | ---------------- | -------------------------------------- | -------------------------------------- |
| Mobile  | 390 (narrow 320) | smoke **390**                          | single column · thumb-safe CTA         |
| Tablet  | 768              | smoke **768**                          | stacked or 2-col · max-w tablet column |
| Desktop | 1024             | smoke **1024** · **12-col** Orbit Grid | multi-panel · `.ds-shell-panel-grid`   |
| Wide    | 1280+            | `--ds-bp-wide`                         | trade/admin density unlock             |
| Ultra   | 2560             | smoke **2560**                         | panel min preserved                    |

정본 상수: `apps/web/src/product/tokens/viewport-contract.ts` · Orbit Grid: [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) §7.

### Density by domain

| Domain    | Mobile                           | Desktop                               |
| --------- | -------------------------------- | ------------------------------------- |
| Earn/Home | Low — card stacks · 48px+ touch  | Medium — optional side summary        |
| Wallet    | Medium — hero balance + timeline | Medium — same grammar, wider timeline |
| Trade     | Medium-high — tabbed stack       | High — 3-zone + bottom blotter        |
| Sports    | Medium — league + slip drawer    | High — table scan + persistent slip   |
| Casino    | Medium — stage-first             | Medium — lobby grid + stage           |
| Admin     | Low on mobile (exception queues) | High — tables · filters · audit       |

### Rules

- **No single mockup width** as only layout target — 390 / 768 / 1024 / **2560** smoke 필수.
- Financial tables: horizontal scroll OK; **font shrink below readable caption** 금지.
- Empty states: explain next action — blank panel 금지.

---

## 5. Trust cues

**목표:** 보안 · 정산 · 공정성 · 잔액 · 제한 상태를 **숨기거나 미화하지 않음**.

### Always visible when applicable

| Cue                                                        | Surfaces                            |
| ---------------------------------------------------------- | ----------------------------------- |
| Settlement status (pending · settled · failed · reviewing) | Wallet · ledger · withdrawal        |
| Provably fair (hash · seed · verify)                       | Casino · `/fairness`                |
| Real vs bonus balance · wagering progress                  | Wallet · Earn · sports/casino debit |
| Kill switch · feature halt · parity hold                   | Trade · sports · casino · admin     |
| KYC · withdrawal gate · RG limits                          | Wallet · account · bet confirm      |
| Rate snapshot / fee disclosure                             | Trade · wallet · admin audit        |

### Copy discipline

- Truthful eligibility — [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md).
- No guaranteed-profit · no false urgency on financial surfaces.
- Admin audit: reason + timestamp + actor — [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md).

### Forbidden

- “Processing…” without distinguishable pending vs failed path.
- Hiding restrictions until submit on money/risk actions.
- Mock/demo balances in engine paths (presentation string props on Earn OK if truthful).

---

## 6. CTA hierarchy

**목표:** primary · secondary · destructive/high-risk를 **시각·순서·확인 UX** 모두에서 분리.

### Levels

| Level                       | Visual                                            | Confirmation                        | Examples                                                  |
| --------------------------- | ------------------------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| **Primary**                 | filled · mint/brand · single per viewport section | none for low-risk navigation        | Deposit · place bet · start mission                       |
| **Secondary**               | outline · ghost · muted                           | none                                | View history · filter · learn more                        |
| **Destructive / high-risk** | distinct color · not primary mint                 | modal/sheet + reason where required | Withdraw · close position · admin reject · self-exclusion |

### Rules

- **One primary CTA** per focused card/section — competing filled buttons 금지.
- High-risk uses shared confirmation pattern ([`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)) — wallet withdraw = trade close = admin manual adjust grammar align.
- Disabled state: explain **why** (insufficient balance · KYC · halt) — silent disable 금지.
- Touch target: `--ds-touch-target-min` (48px) on mobile primary actions.

### Funnel (product)

- Earn/Home may lead to Bet/Wallet — Trade is **not** default landing for new users ([`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)).

---

## 7. Accessibility Elevation (DA W0 · §34.5)

UI rebuild **완료 조건**에 포함 — surface / DA wave checklist 필수.  
Brand Memory·Emotion과 함께 Product Experience 축 — [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) §6.

| Requirement    | Implementation                                                               |
| -------------- | ---------------------------------------------------------------------------- |
| Keyboard       | focus order logical · modals **trap focus** · **Esc** dismiss                |
| Focus visible  | token ring (`--ds-focus`) · bare `outline-none` **금지**                     |
| Contrast       | `check:contrast` · WCAG AA body · AAA where feasible for money               |
| Touch          | 48px min (`--ds-touch-target-min`) · safe-area (`env(safe-area-inset-*)`)    |
| Reduced motion | §3 — instant variants · **static aurora** · no count-up                      |
| Screen reader  | aria on icon-only chrome · **live regions** for settlement · reward claim    |
| Motion tier L2 | financial submit already instant — decorative must not reappear under reduce |
| Wave gate      | axe critical **0** per `da-w*` gate · operator VISUAL when §20.12            |

### Elevation of a11y vs baseline

| Baseline (D0)    | Elevation (DA W0+)                                    |
| ---------------- | ----------------------------------------------------- |
| Esc closes modal | + focus trap verified in ConfirmDialog / Sheet owners |
| Reduced motion   | + aurora mesh static · Signal Pulse off               |
| Settlement SR    | + reward claim · kill-switch banner live regions      |
| Per-surface axe  | + **wave gate** axe critical 0 (not advisory-only)    |

---

## 8. Performance

**목표:** first interaction을 방해하는 장식·무거운 animation **금지**.

| Rule                                        | Gate                                           |
| ------------------------------------------- | ---------------------------------------------- |
| No blocking splash without skip             | BootSplash · auth                              |
| Lazy below-fold · defer non-critical motion | casino detail · home feeds                     |
| Canvas/WebGL tier caps                      | `data-gpu-tier` · E2E engine flag              |
| Image/format                                | webp/avif catalog · no multi-MB hero on mobile |
| Bundle                                      | no new heavy deps for presentation-only polish |

Decorative assets must not regress LCP on `/home` · `/login` · `/wallet` pilot surfaces.

---

## Design Token Lock

Presentation rebuild에서 **hardcoded style 0**이 목표. 적용은 surface별 **ratchet** (신규 위반 0 · 기존 위반 감소).

### Forbidden in JSX/TSX (presentation paths)

| Category             | Examples                                                      |
| -------------------- | ------------------------------------------------------------- |
| Hex colors           | `#fff`, `#1fe08a`, `text-[#...]`, `bg-[#...]`                 |
| Ad hoc rgba/hsla     | `rgba(31, 224, 138, 0.5)` outside token definition files      |
| Inline spacing magic | `p-[16px]`, `gap-[12px]`, `style={{ padding: 16 }}`           |
| Inline radius magic  | `rounded-[12px]`, `borderRadius: 12`                          |
| Inline shadow magic  | `shadow-[0_4px_...]`, inline `box-shadow`                     |
| Arbitrary typography | `text-[11px]` — use `.t-caption` / `.t-label` / `--ds-text-*` |

### Allowed (Phase R token system 후보)

- `var(--...)` · Tailwind semantic (`bg-primary`, `text-muted`, `rounded-2xl` 등)
- `--ds-*` · `--phonara-*` 계열 token namespace 후보
- Pre-demolition token layer 기록: `theme.css`, `app-globals.css`, `design-system.css`, `presentation-import-tokens.css`는 현재 active path가 아니며 Phase R에서 재정의
- `design-token-allow: <reason>` on line (escape hatch — requires removal plan in PR)
- Game canvas/Pixi palettes — Phase R `check:ui-greenfield` (presentation gate removed in Demolition)

### Token sources (pre-demolition 기록 · not active)

```text
app-globals.css (:root literals + --rgb-*)
  → theme.css (@theme engine tokens)
  → design-system.css (--ds-* presentation)
  → @phonara/ui components (engine/trade shared)
  → ui/design/* (auth · earn · landing primitives)
```

---

## Design Token Audit

### Automated token audit (Phase R)

Presentation `check:design-tokens` removed in Phase D Demolition. Phase R rebuild reintroduces token gates via [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md).

### Manual spot audit (pre-U0)

```powershell
rg "#[0-9a-fA-F]{6}" <phase-r-ui-path> --glob "*.tsx"
rg "text-\[\d+px\]|p-\[\d|gap-\[\d|rounded-\[\d|shadow-\[" <phase-r-ui-path>
```

### Ratchet policy

- **U0 시작:** default gate green 유지 · advisory-style로 baseline 기록.
- **Surface closeout:** 해당 surface path `--strict-style` green.
- **Repo-wide strict:** U8 closeout 목표 — allowlist 증가 금지.

예외는 [`DECISION_LOG.md`](DECISION_LOG.md)에 사유·제거 계획·owner surface 기록.

---

## Verification (D0 + DA W0)

- [x] 본 문서 D0 narrative (v2 wave archived — [`DEPRECATED_DOC_DENYLIST.md`](DEPRECATED_DOC_DENYLIST.md))
- [x] [`DECISION_LOG.md`](DECISION_LOG.md) Decision 009
- [x] §7 Accessibility Elevation · 4-tier smoke · motion tier cross-ref (`da-w0-foundation-ssot-bundle`)
- [x] da-w1: Text · elevation · Card CVA · spacing ratchet (`da-w1-ds-foundation-bundle`)
- [x] da-w1-gate: `gate:ai-impl` primitives+tokens · `check:design-tokens` advisory (`da-w1-gate-ds-2`)
- [x] da-w4-gate: `use-prefers-reduced-motion` regression · `motion-presets` instant · CSS 0ms (`da-w4-gate-motion`)
- [x] da-w6-gate: BrandMark aurora · domain empty · Quad Stream · `check:design-tokens` advisory (`da-w6-gate-brand-elevation`)
- [x] da-w7: `check:design-tokens --strict` · text-tiny · legacy purge (`da-w7-enforcement-strict-tokens`)
- [x] da-w7 VISUAL agent impl: Home+Shell+Trade · 4-tier · preview (`da-w7-operator-visual-dae-signoff`) · operator `VISUAL APPROVED: da-w7` 대기

---

## 교차 참조

| 주제                | 문서                                                         |
| ------------------- | ------------------------------------------------------------ |
| Product Experience  | [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) |
| Unified grammar     | [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)                 |
| Brand DNA ADR       | [`ADR-009`](../PRODUCT/ADR/009-digital-aurora-brand-dna.md)  |
| UX reference (D1)   | [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md)             |
| Layout modules (D2) | [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md)             |
| Copy/tone (D4)      | [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)               |
| Routes              | Phase R route registry · `surface-domain-boundary.ts`        |
| Phase R queue       | [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md)        |
