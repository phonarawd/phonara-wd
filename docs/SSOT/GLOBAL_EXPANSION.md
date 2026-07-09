# Global Expansion Canon (Phase R)

> **상태:** `[x] 31차 흡수` · `[x] p6-doc-platform-canon-sync` (2026-07-05)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) · Plan `phase_r_super-app_8bdf2c10` §32  
> **연동:** [`I18N_FIRST.md`](I18N_FIRST.md) · [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) · [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md) · [`PLATFORM_NARRATIVE_CANON.md`](PLATFORM_NARRATIVE_CANON.md) · [`ONBOARDING_JOURNEY_CANON.md`](ONBOARDING_JOURNEY_CANON.md)  
> **코드:** `apps/web/src/domain/platform-narrative-display-contract.ts` · `onboarding-journey-display-contract.ts` · `operator-trust-pages-display-contract.ts`

## 한 줄

PHONARA(PrimeForge)는 **ko/en 동시 설계**를 전제로, currency·region·eligibility·payment rail을 **UI 슬롯**으로 확장한다. KRW-only 하드코딩은 **금지**.

---

## 1. Locale (Phase R)

| Locale             | Phase R       | 규칙                                        |
| ------------------ | ------------- | ------------------------------------------- |
| `ko`               | **P1–P13**    | 기본 operator 검증 언어                     |
| `en`               | **P1–P13**    | English mode에 Korean 노출 **0**            |
| `zh` / `ja` / 기타 | **E-Wave 후** | `packages/i18n` catalog only · JSX inline 0 |

---

## 2. Currency display

| Rule                       | Detail                                                  |
| -------------------------- | ------------------------------------------------------- |
| **MoneyDisplay**           | `@phonara/money` + RPC snapshot only                    |
| **Multi-currency wallet**  | 잔액·ledger는 currency code 표시 · client 환산 **금지** |
| **Deposit/withdraw rails** | KRW · USDT/crypto · giftcard — rail별 copy key 분리     |
| **PHON**                   | 단일 보상·스테이킹 통화 — §13.0                         |

---

## 3. Region & eligibility slots

| Surface         | Slot                   | Source                             |
| --------------- | ---------------------- | ---------------------------------- |
| Signup · KYC    | `country` · `region`   | profile/RPC                        |
| Sports · Casino | jurisdiction gate      | `use-rg-gate-policy` · kill switch |
| Missions        | eligibility badge      | RPC/`app_config` display           |
| Withdraw        | tier limit · whitelist | engine read                        |

**금지:** geo-block 없이 “전 세계 동일 혜택” copy · hidden eligibility

---

## 4. Payment expansion (adapter pattern)

[`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) 정본:

- 신규 rail = provider adapter + wallet hub tab — **wallet surface 뜯지 않음**
- PG-less KRW primary (ADR-001)

---

## 5. Typography & layout (global-ready)

| Item               | Rule                                         |
| ------------------ | -------------------------------------------- |
| Button · tab · nav | wrap · truncate+tooltip · min-width flexible |
| Money suffix       | `MoneyDisplay` baseline gap (§25.1-bis)      |
| Date/time          | `Intl` + user timezone (`/settings/account`) |

---

## 6. FAIL

- JSX에 `₩`/`원` only hardcode (i18n key 필수)
- English mode Korean string
- Client-side FX for withdraw preview without RPC snapshot

---

## 7. 구현 큐

| Todo                         | 산출                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `p6-doc-platform-canon-sync` | `[x] DONE` — 본 문서 + narrative canon pointer + display contracts |
| `p8-page-settings-account`   | locale/timezone SOT                                                |
| E-Wave                       | region-specific rails · 추가 locale catalog                        |
