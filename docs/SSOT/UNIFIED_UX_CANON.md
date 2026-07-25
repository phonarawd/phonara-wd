# Unified UX Canon (D3)

> **상태:** Phase R active · DA W0 Interaction Grammar 확장 (2026-07-09)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) (Phase R) · Decision 013 · [`ADR-009`](../PRODUCT/ADR/009-digital-aurora-brand-dna.md)  
> **Product Experience:** [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) (Emotion · Brand Memory · Tech Stack)  
> **Token SOT:** `apps/web/src/product/tokens/*` (`--ds-*`) · pre-demolition `theme.css` / `@phonara/ui`는 **복구 금지**  
> **D0 principles:** [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)  
> **Product tone:** [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)

D3 Unified UX Canon은 Trading · Sports · Casino · Earn · Wallet · Admin이 **각각 다른 앱처럼 보이면 실패**입니다.  
Surface reference는 [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md)에서 달라도 **PHONARA interaction grammar**는 하나입니다.

이 문서의 `@phonara/ui`, pre-demolition `theme.css`, `ui/design` 명칭은 **역사**다.  
실행 경로는 `apps/web/src/product/primitives` · `product/tokens` · Digital Aurora SSOT다.

---

## 1. Goal

한 플랫폼 안에서:

- Token · spacing · radius · typography · motion · copy tone = **shared**
- High-risk confirmation = **same pattern** everywhere
- Loading · empty · error · success = **same structure**

Trade만 Binance · Wallet만 Toss · Earn만 앱테크 앱처럼 **완전 분리** = FAIL.

---

## 2. Unified interaction targets

| Element                   | Rule                                                            | SOT                                                              |
| ------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Button**                | shared variants · cva/token · high-risk distinct                | Phase R primitive policy TBD                                     |
| **Card**                  | consistent radius · elevation · padding                         | Phase R token SOT TBD                                            |
| **Modal / dialog**        | same open/close · focus trap · escape                           | Phase R modal pattern TBD                                        |
| **Drawer / bottom sheet** | same gesture · safe-area                                        | shell components                                                 |
| **Loading**               | skeleton **or** spinner — pick per surface type, same family    | `--ds-motion-*`                                                  |
| **Empty state**           | icon/illustration optional · title + next action                | i18n keys                                                        |
| **Error state**           | what happened + what to do                                      | no raw RPC dump                                                  |
| **Success state**         | confirm outcome + optional next step                            | financial = no emoji                                             |
| **Confirmation**          | high-risk: amount recap · irreversible warning · confirm/cancel | trade · withdraw · admin                                         |
| **Dark mode**             | token-based · no per-surface one-off hex                        | Phase R token SOT TBD                                            |
| **Deposit/withdraw**      | wallet grammar extends to all money entry                       | [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) |
| **Toast / notification**  | zone tone rules                                                 | [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)                  |
| **Restriction banner**    | KYC · RG · kill switch · parity hold                            | same component grammar                                           |

---

## 3. What may differ per surface

| May differ                                                       | Must not differ                       |
| ---------------------------------------------------------------- | ------------------------------------- |
| Information density (trade high · earn low · casino medium)      | Phase R semantic color tokens         |
| Layout topology (panels vs cards vs game stage)                  | Spacing scale · radius scale          |
| Reference-inspired module order                                  | Primary/destructive button semantics  |
| Domain-specific modules (order ticket · bet slip · mission card) | High-risk confirmation steps          |
| Animation intensity (casino > earn)                              | Reduced-motion respect                |
| Data table density                                               | Pending/error/success color semantics |

---

## 4. Interaction Grammar (Digital Aurora · §34.3)

> **정본 확장:** Plan §34.3 · [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) §5 motion tiers.  
> Semantic CSS: `apps/web/src/product/tokens/motion.css`.

| Interaction      | Token / Pattern                                        | Tier                                       |
| ---------------- | ------------------------------------------------------ | ------------------------------------------ |
| Press            | `--ds-motion-press` 120ms · `active:scale-[0.98]`      | L1                                         |
| Hover card       | `translateY(-2px)` + elevation `--ds-shadow-2` (da-w1) | L1                                         |
| Loading          | Skeleton fixed height · shimmer (`skeleton-shimmer`)   | L1                                         |
| Success / Reward | reward burst CSS · optional Lottie slot                | **L0 Earn only**                           |
| Error            | field-adjacent + Zone B toast                          | L2 financial                               |
| Navigation       | BottomNav pill morph · View Transitions (mobile)       | L1                                         |
| Number change    | `useCountUp` ≤400ms (`--ds-motion-count-up`)           | L1 · **L2 instant** on withdraw/bet/submit |

### Motion tier policy (cross-surface)

| Tier             | Meaning                 | Surfaces                                           |
| ---------------- | ----------------------- | -------------------------------------------------- |
| **L0 Ambient**   | decorative / ambient OK | Landing · Earn · Casino lobby                      |
| **L1 Surface**   | feedback · nav · hover  | all non-submit                                     |
| **L2 Financial** | **instant only**        | withdraw · bet · trade submit · admin money adjust |

**Wire (`da-w4-motion-system-bundle`):** wallet-hero balance · `/home` tier XP · futures unrealized/realized PnL — display-only · RPC 값 불변.

`prefers-reduced-motion: reduce` → all tiers collapse to instant / static ([`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) §3 · §7).

---

## 5. Cross-surface patterns

### High-risk action (unified)

```text
Trigger → Confirm dialog (recap + warning) → RPC → Success/Error toast
```

Applies to: withdraw · large trade · admin manual credit · kill switch override (where permitted).  
Toast만으로 high-risk를 끝내지 않음 — Confirm **선행**.

### Money status (unified)

Pending · reviewing · confirmed · failed · rejected · cancelled — **same color tokens + copy structure** across wallet · casino deposit · admin queue ([`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md)).

### Shell (unified)

- Mobile: `AppShell` · `BottomNav` · single mobile header owner ([`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) §Navigation)
- Desktop: Orbit Grid 12-col · `.ds-shell-panel-grid` ([`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) §7)
- Subnav owner = `AppShell` only — surface 내부 parallel subnav **금지** (rule `97`)

---

## 6. Design system linkage (Phase R)

Token naming · breakpoints · shell — [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) · Digital Aurora [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md) · [`ADR-009`](../PRODUCT/ADR/009-digital-aurora-brand-dna.md).

**Active paths:** `apps/web/src/product/tokens` · `product/primitives`.  
Pre-demolition `@phonara/ui` / `components/ui` 복구 **금지**.

---

## 7. Forbidden

- Per-surface duplicate button systems (new `*Button` families without decision)
- Per-surface incompatible modal grammar (different confirm button order/meaning)
- Wallet deposit vs casino deposit **different interaction** without Decision Log
- Same state (pending/error) with incompatible color · copy · action placement
- Surface-specific hardcoded hex bypassing tokens
- L2 financial submit에 L0 decorative / reward burst
- High-risk를 toast-only로 종료 (Confirm 생략)

---

## 8. Verification

| Gate                            | When                                       |
| ------------------------------- | ------------------------------------------ |
| `bun run check:design-tokens`   | advisory · da-w7 `--strict`                |
| `bun run check:ui-architecture` | no new duplicate chrome/shell              |
| `bun run check:phase-r-guards`  | domain isolation · layout debt             |
| Multi-viewport review           | 390 / 768 / 1024 / **2560** per surface    |
| Visual consistency spot-check   | confirm · toast · error across 2+ surfaces |

---

## 9. Completion signals

- [x] DA W0: Interaction Grammar + Product Experience SSOT (`da-w0-foundation-ssot-bundle`)
- [x] da-w1: Text · elevation · Card CVA alignment (`da-w1-ds-foundation-bundle`)
- [x] da-w1-gate: DS 2.0 bundle gate green (`da-w1-gate-ds-2`)
- [x] da-w2: Shell elevation infra (`da-w2-shell-elevation-infra`)
- [x] da-w2-gate: Shell elevation gate green (`da-w2-gate-shell-elevation`) — `check:ui-architecture` · 390/768/1024 · 5탭 IA
- [x] da-w3: Progressive IA (`da-w3-ia-progressive-bundle`) — `/home` Fold1–5 · wallet-hero accordion · trade ticket collapse · `CollapsibleSection`
- [x] da-w3-gate: Progressive disclosure GATE (`da-w3-gate-ia-progressive`) — above-fold ≤3 · `gate:ai-impl` home+wallet+trade · VISUAL advisory
- [x] da-w4: Motion system BUNDLE (`da-w4-motion-system-bundle`) — `useCountUp` · MoneyDisplay countUp · wallet/XP/PnL
- [x] da-w4-gate: Motion GATE (`da-w4-gate-motion`) — `use-prefers-reduced-motion` regression · `motion-presets` instant · CSS 0ms
- [x] da-w5: Domain card personalities (`da-w5-cards-domain-variants`) — Mission/Wallet/VIP/Trade/Sports/Casino CVA + signature CSS
- [x] da-w5-gate: Domain cards GATE (`da-w5-gate-domain-cards`) — 0.2s scan distinguish · mission-card+wallet+casino tile · `gate:ai-impl` **40/40**
- [x] da-w6: Brand elevation BUNDLE (`da-w6-brand-elevation-bundle`) — BrandMark aurora · domain empty · Quad Stream loading
- [x] da-w6-gate: Brand elevation GATE (`da-w6-gate-brand-elevation`) — `gate:ai-impl` brand-mark **23/23** · `check:design-tokens` advisory · VISUAL advisory
- [x] da-w7: Strict tokens GATE (`da-w7-enforcement-strict-tokens`) — `check:design-tokens --strict` · text-tiny · legacy purge · `gate:ai-impl` **19/19**
- [x] da-w7 VISUAL agent impl (`da-w7-operator-visual-dae-signoff`) — Home+Shell+Trade · 390/768/1024/2560 · preview · axe 0 · `gate:ai-impl` **22/22** · operator `VISUAL APPROVED: da-w7` 대기
- [ ] High-risk flows use shared ConfirmDialog pattern
- [ ] Status states share token semantics across wallet/trade/admin
- [ ] Decision Log entry if intentional surface-specific deviation

---

## 교차 참조

| 주제                             | 문서                                                             |
| -------------------------------- | ---------------------------------------------------------------- |
| Product Experience / Brand DNA   | [`PRODUCT_EXPERIENCE_CANON.md`](PRODUCT_EXPERIENCE_CANON.md)     |
| Payment method UI                | [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) |
| Admin exception UX               | [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)                         |
| i18n labels in shared components | [`I18N_FIRST.md`](I18N_FIRST.md)                                 |
| Regional eligibility UI          | [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md)                     |
| Digital Aurora ADR               | [`ADR-009`](../PRODUCT/ADR/009-digital-aurora-brand-dna.md)      |
