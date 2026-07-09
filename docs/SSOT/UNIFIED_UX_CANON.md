# Unified UX Canon (D3)

> **상태:** Phase R intent · pre-demolition implementation paths are not active (2026-07-03)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) (Phase R) · Decision 013  
> **Pre-demolition design tokens:** `apps/web/src/theme.css` · `apps/web/src/ui/design/design-system.css`는 v5 Demolition에서 삭제됨. Phase R token SOT는 새 plan/ADR에서 재정의.  
> **D0 principles:** [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)  
> **Product tone:** [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)

D3 Unified UX Canon은 Trading · Sports · Casino · Earn · Wallet · Admin이 **각각 다른 앱처럼 보이면 실패**입니다.  
Surface reference는 [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md)에서 달라도 **PHONARA interaction grammar**는 하나입니다.

이 문서의 `@phonara/ui`, `theme.css`, `ui/design`, shell 명칭은 pre-demolition 기록 또는
Phase R intent다. 현재 실행 경로로 import/use 하라는 지시가 아니다.

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
| **Toast / notification**  | zone tone rules                                                 | [`UX_WRITING_GUIDE.md`](UX_WRITING_GUIDE.md)                     |
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

## 4. Cross-surface patterns

### High-risk action (unified)

```text
Trigger → Confirm dialog (recap + warning) → RPC → Success/Error toast
```

Applies to: withdraw · large trade · admin manual credit · kill switch override (where permitted).

### Money status (unified)

Pending · reviewing · confirmed · failed · rejected · cancelled — **same color tokens + copy structure** across wallet · casino deposit · admin queue ([`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md)).

### Shell (unified)

- Mobile: `AppShell` · `BottomNav` · single mobile header owner는 Phase R shell intent ([`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) §Navigation)
- Desktop: `.shell-content-column` · side nav consistency는 Phase R shell intent
- Consolidation C0–C5: no stacked mobile chrome (`88-ui-consolidation-wave`)

---

## 5. U0 design system linkage

Token naming · breakpoints · shell — [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) · Phase R U0 in [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md).

Pre-demolition `@phonara/ui` API compat 기록은 현재 active implementation target이 아니다. Phase R에서 shared primitive package 여부를 새로 결정한다.

Pre-demolition presentation paste zone (`components/ui`) ↔ `@phonara/ui` 병합 정책은 역사 기록이다. Phase R에서는 새 semantic overlap 기준을 다시 정의한다.

---

## 6. Forbidden

- Per-surface duplicate button systems (new `*Button` families without decision)
- Per-surface incompatible modal grammar (different confirm button order/meaning)
- Wallet deposit vs casino deposit **different interaction** without Decision Log
- Same state (pending/error) with incompatible color · copy · action placement
- Surface-specific hardcoded hex bypassing tokens

---

## 7. Verification

| Gate                            | When                                            |
| ------------------------------- | ----------------------------------------------- |
| `bun run check:design-tokens`   | advisory U0 · `--strict-style` surface closeout |
| `bun run check:ui-architecture` | no new duplicate chrome/shell                   |
| Multi-viewport review           | 390 / 768 / 1024 per surface                    |
| Visual consistency spot-check   | confirm · toast · error across 2+ surfaces      |

---

## 8. Completion signals (U0 + per-surface)

- [ ] U0: Phase R shared primitive 위치와 token alignment policy 재정의
- [ ] High-risk flows use shared ConfirmDialog pattern
- [ ] Status states share token semantics across wallet/trade/admin
- [ ] No new `check:ui-architecture` shell violations
- [ ] Decision Log entry if intentional surface-specific deviation

---

## 교차 참조

| 주제                             | 문서                                                             |
| -------------------------------- | ---------------------------------------------------------------- |
| Payment method UI                | [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) |
| Admin exception UX               | [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)                         |
| i18n labels in shared components | [`I18N_FIRST.md`](I18N_FIRST.md)                                 |
| Regional eligibility UI          | [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md)                     |
