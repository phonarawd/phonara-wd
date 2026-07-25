# Copywriting Canon (D4)

> **상태:** D4 narrative complete (2026-06-30)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) (Phase R) · Decision 014  
> **Product tone zones:** [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)  
> **Locale files:** `packages/i18n/**` · Lovable catalogs — add-only keys

## Tone matrix

| Zone                | Surfaces                                                                                                                                     | Emoji                   | Style                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------- |
| **Forbidden emoji** | Trade · Sports betting · settlement · ledger · withdrawal review · admin audit · risk/security errors · balance/PnL/odds/fee/margin messages | **0**                   | professional · numeric first                |
| **Light emoji OK**  | Home · Earn · missions · referral · general notifications · general success                                                                  | ✨🎉🎁 등 sparingly     | warm Korean · never childish                |
| **Casino**          | game UI · auto bet stats                                                                                                                     | minimal · state-focused | excitement without spam · no flash overload |

---

## Examples

#### Financial (no emoji)

```text
Bad:  🚀 주문 성공!
Good: 주문이 접수되었습니다. / Order submitted.
```

#### General (emoji allowed)

```text
Good: ✨ 저장했어요.
Good: 🎉 보상을 받았어요.
Good: 🎁 친구와 함께 혜택을 받아보세요.
```

---

## Earn / Home constraints

- reward copy **사실 기반** — 과장·false urgency·false deadline 금지
- FOMO/social proof presentation 허용하되 **기만적 claim 금지** ([`EARN_UX_CANON.md`](EARN_UX_CANON.md))

---

## i18n key naming

- 의미 기반: `wallet.deposit.title` · `trade.order.submitted`
- financial keys: emoji **포함하지 않음** (locale에서 zone별 분리 가능)
- orphan key (UI reset): delete 금지 → `deprecated.uiReset.*` 또는 cleanup decision — [`I18N_FIRST.md`](I18N_FIRST.md)

---

## Admin operator language

전문 용어 → 업무 한국어 ([`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)):

| Avoid                 | Prefer             |
| --------------------- | ------------------ |
| Settlement Queue      | 출금 대기          |
| Compliance Review     | 확인이 필요한 회원 |
| Risk Flag             | 이상 거래          |
| Manual Reconciliation | 입금 확인          |

---

## Verification

- `bun run check:i18n` green before surface closeout
- English mode: Korean string **0**
- Korean mode: inline English in JSX **0**
