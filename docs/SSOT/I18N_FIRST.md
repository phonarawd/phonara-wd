# i18n First Canon (D3)

> **상태:** D3 narrative complete (2026-06-30)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) (Phase R) · Decision 013  
> **Copy tone:** [`UX_WRITING_GUIDE.md`](UX_WRITING_GUIDE.md) · [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)  
> **Catalog:** `packages/i18n/**` · Lovable `apps/web/src/i18n/ko.ts` · `en.ts`  
> **Global:** [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md)

D3 i18n First Canon은 UI를 **한국어 먼저·영어 나중에** 붙이지 않고, **ko/en 동시 설계** + **장문 locale 확장**에도 깨지지 않는 layout grammar를 고정합니다.

---

## 1. Core principles

| Rule                   | Detail                                               |
| ---------------------- | ---------------------------------------------------- |
| **i18n key only**      | 모든 user-facing copy → locale catalog               |
| **No inline copy**     | JSX/TSX `"입금"` · `"Login"` · `"Success"` **금지**  |
| **Add-only keys**      | Existing `packages/i18n` keys delete/rename **금지** |
| **Dual-locale design** | 새 surface/feature → ko + en key **동시 추가**       |
| **Gate**               | `bun run check:i18n` green before surface closeout   |

### Allowed patterns

```tsx
const { t } = useT();
<Button>{t('wallet.deposit')}</Button>
<Button aria-label={t('wallet.deposit.aria')}>…</Button>
```

### Forbidden patterns

```tsx
<Button>입금</Button>
<Button>Deposit</Button>
title="로그인"
```

---

## 2. Layout resilience

UI는 **텍스트 길이 variance**를 전제로 설계:

| Element                     | Requirement                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| Button · tab · chip         | min-width flexible · wrap or truncate+tooltip                    |
| Card title · section header | multi-line wrap OK · fixed single-line height only with ellipsis |
| Table header/cell           | truncation + tooltip · or responsive column hide                 |
| Bottom nav label            | 2-line wrap or abbreviated key variant                           |
| Modal actions               | stacked on narrow when label long                                |
| Form labels                 | associate with input · no absolute-width label column            |

### Design benchmarks

- `입금` vs `Deposit` length delta
- Future DE/ES/TH longer labels ([`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md))
- Icon-only control → `aria-label` from i18n (never hardcoded)

---

## 3. Locale isolation

| Mode                 | Rule                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| Korean               | Stray English in JSX **0**                                               |
| English              | Korean string **0**                                                      |
| Financial/admin keys | emoji **포함하지 않음** ([`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)) |

Locale switch must not leak catalog strings from other locale.

---

## 4. Orphan keys (UI reset)

UI 전면 삭제로 unused key 발생 시:

- **삭제하지 않음** — `deprecated.uiReset.*` namespace 또는 deprecated summary
- `check:i18n` red → allowlist / deprecated classification / follow-up cleanup **decision**
- Decision → [`DECISION_LOG.md`](DECISION_LOG.md)

---

## 5. Global expansion linkage

Future `zh` · `ja` · `zh-CN` · `zh-TW` etc.:

- **Catalog files only** (`packages/i18n/**` · Lovable locale ts)
- Operator/work docs: Hangul only ([`61-script-locale-hygiene`](../../.cursor/rules/61-script-locale-hygiene.mdc))
- Same key set across locales — missing translation = gate fail

---

## 6. Forbidden

- Korean or English string in TSX/TS (user-facing)
- Fixed-width button breaking on translation
- Layout depending on exact Korean text length only
- Concatenating translated fragments without ICU/plural support where grammar differs
- Copy in operator docs (`docs/**`) used as product UI source

---

## 7. Verification

```powershell
bun run check:i18n
```

Part of `gate:ai-impl` L1 chain ([`OPERATOR_GATES.md`](OPERATOR_GATES.md)).

Surface closeout additionally:

- [ ] ko + en keys added for all new copy
- [ ] 390px viewport: longest locale (en or ko) does not clip primary CTA
- [ ] Icon-only actions have i18n aria labels

---

## 교차 참조

| 주제                     | 문서                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| Currency/country labels  | [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md)                     |
| Unified component labels | [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)                     |
| Payment status copy      | [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) |
