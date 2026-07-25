# Product Principles (D4)

> **상위:** [`PLATFORM_CONSTITUTION.md`](PLATFORM_CONSTITUTION.md) — Authority Charter (실행 큐 아님)  
> **상태:** D4 narrative complete (2026-06-30)  
> **Authority:** [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) (Phase R) · Decision 014  
> **Copy execution:** [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)  
> **하위 canon:** [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) · [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md) · [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md) · [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)

## 한 줄

PHONARA는 Trading · Sports · Casino · Earn · Wallet · Admin이 **하나의 플랫폼** 안에서 신뢰·재미·운영 원칙을 공유합니다.  
재미·참여 영역과 전문 금융 영역의 **tone은 분리**하되, 전체는 **한 서비스**처럼 느껴져야 합니다.

---

## 1. Platform model

| Domain     | Role in platform                         | Primary tone zone                                                  |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------ |
| **Trade**  | Exchange-grade spot/futures              | Financial                                                          |
| **Sports** | Sportsbook · bet slip · odds             | Financial (betting)                                                |
| **Casino** | 12 games · provably fair · auto bet      | Casino (state-focused · minimal emoji)                             |
| **Earn**   | Missions · rewards · referral · home hub | General consumer                                                   |
| **Wallet** | Deposit · withdraw · ledger · balance    | Financial (money movement) · General (non-money settings feedback) |
| **Admin**  | 1-person ops · exception queue · audit   | Financial / admin audit                                            |

Surface reference는 [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md)에서 달라도 **product tone zones**는 본 문서가 정본입니다.

---

## 2. Tone zones (non-waivable)

### 2.1 Financial / Betting / Admin audit

#### 대상 surfaces

- Trade · order · position · liquidation · margin
- Sports betting · bet slip · odds change · settlement
- Wallet money movement · deposit confirm · withdraw submit · ledger entries
- Settlement · reviewing · failed · rejected states
- Admin audit · withdrawal review · manual reconciliation · risk/permission
- Balance · PnL · odds · fee · margin · settlement messages
- Risk/security errors · kill switch · parity hold · KYC · RG limits

#### Tone rules

| Rule                       | Detail                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- |
| Style                      | professional · short · numeric first · trustworthy                           |
| Emoji                      | **0**                                                                        |
| Cute wording               | **금지**                                                                     |
| Exaggerated success/profit | **금지**                                                                     |
| Apology-first copy         | **금지** — next action 우선 ([`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)) |
| Guaranteed profit          | **금지**                                                                     |

#### Examples

```text
Bad:  🚀 주문 성공!
Good: 주문이 접수되었습니다. / Order submitted.

Bad:  💰 대박! 입금 완료!
Good: 입금을 확인했습니다. / Deposit confirmed.

Bad:  출금 신청 완료
Good: 출금 신청을 접수했습니다. / Withdrawal request submitted.
```

### 2.2 General consumer

#### 대상 surfaces

- Home · Earn hub · missions · referral · onboarding
- General notifications · settings · profile (non-money)
- General wallet completion feedback (non-settlement celebratory tone)
- Auth welcome · feature discovery (not money confirmation)

#### Tone rules

| Rule                | Detail                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Style               | warm · human · friendly Korean (ko) · short clear English (en)                                   |
| Emoji               | light use allowed — ✨🎉🎁 등 **sparingly**                                                      |
| Childish tone       | **금지**                                                                                         |
| Reward copy         | **사실 기반** — 과장·false urgency·false deadline **금지**                                       |
| FOMO / social proof | presentation display props 허용 — **기만적 claim 금지** ([`EARN_UX_CANON.md`](EARN_UX_CANON.md)) |

#### Examples

```text
Good: ✨ 저장했어요.
Good: 🎉 보상을 받았어요.
Good: 🎁 친구와 함께 혜택을 받아보세요.
```

### 2.3 Casino (bridge zone)

Casino는 excitement를 허용하되 **financial zone과 동일한 money/settlement grammar**를 따릅니다.

| Allowed                                                                   | Forbidden                                  |
| ------------------------------------------------------------------------- | ------------------------------------------ |
| State-focused game feedback · auto bet stats · minimal celebration on win | Emoji spam on balance/PnL/settlement       |
| Excitement in game UI · motion · result reveal                            | Flash overload · guaranteed-profit wording |
| Provably fair trust copy — factual                                        | Cute wording on bet submit / ledger        |

상세: [`CASINO_UX_CANON.md`](CASINO_UX_CANON.md) · [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md) §Casino

---

## 3. Platform trust

| 영역              | 원칙                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| **Money**         | Decimal only · append-only ledger · UI displays RPC — [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md) |
| **Settlement**    | 상태 숨기지 않음 · pending / reviewing / failed / rejected 명확                                  |
| **Provably fair** | casino trust layer 항상 surface — seed hash · reveal · verify                                    |
| **Risk**          | kill switch · parity hold · withdrawal gate · KYC · RG limits = first-class UI states            |
| **Display**       | contract에 없는 값 UI 재계산 **금지** — [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md)   |

Financial tone은 **신뢰를 말로가 아니라 상태·숫자·다음 행동**으로 전달합니다.

---

## 4. Funnel & product personality

```text
Earn/Home (low density · reward feedback · warm tone)
  → Wallet (trust · clarity · financial tone on money)
  → Trade · Sports · Casino (separate BottomNav tabs · domain-isolated · navigate-only CTAs from Earn)
```

| Principle            | Detail                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Earn first           | Home sets personality — Trade is **not** default landing for new users ([`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)) |
| Trade last in funnel | High density · exchange grammar isolated to Trade surface                                                               |
| Unified grammar      | Deposit/withdraw confirm · high-risk dialog · toast structure — [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)            |
| Copy tone split      | General warmth **does not leak** into trade ledger or admin audit                                                       |

---

## 5. Responsible interaction

| Zone             | Rule                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Earn/Home        | conversion·FOMO 허용 — **과장된 보상·false deadline·허위 긴급성 금지**                            |
| Financial        | guaranteed-profit claim · 근거 없는 확정 입금 문구 **금지**                                       |
| Sports/Casino    | odds/PnL/settlement — display RPC only · no client recompute                                      |
| RG & eligibility | limits · restriction · eligibility — **숨기지 않음**                                              |
| Admin            | high-risk action — reason · confirmation · audit trail ([`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)) |

---

## 6. Operations & expansion

| Topic          | Principle                                                        | Canon                                                            |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| **1인 운영**   | 99% automation · operator는 exception만                          | [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)                         |
| **결제 확장**  | provider card/adapter 추가 · wallet 화면 뜯지 않음               | [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) |
| **글로벌**     | KRW-only UI 고정 금지 · currency/region/eligibility slots        | [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md)                     |
| **i18n**       | ko/en 동시 설계 · JSX inline copy 0                              | [`I18N_FIRST.md`](I18N_FIRST.md)                                 |
| **Unified UX** | surface reference 달라도 token · interaction · confirmation 동일 | [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)                     |

---

## 7. Rebuild discipline

- Engine 보존 · presentation 전면 교체 — [`PRESENTATION_REBUILD_SCOPE.md`](PRESENTATION_REBUILD_SCOPE.md)
- One surface at a time · one canonical route — Phase R [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md)
- No parallel implementations · no duplicate hub routes
- Copy changes = i18n catalog only — no JSX string literals

---

## 8. Design principles linkage (D0)

Navigation · hierarchy · motion · density · trust · CTA · a11y · performance · Design Token Lock — [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)

Toast · button · empty · error copy patterns — [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)

---

## 9. Verification (D4 closeout)

| Check                            | Gate                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Tone zone per surface documented | 본 문서 §2 + domain `*_UX_CANON.md` cross-link                               |
| Financial zone emoji 0           | `check:i18n` · locale audit · [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md) |
| JSX inline user copy 0           | `check:i18n`                                                                 |
| English mode Korean leak 0       | `check:i18n`                                                                 |
| Surface closeout                 | `gate:ai-impl -- --test <path>` green                                        |

Tone/emoji violation in new copy = **surface closeout FAIL**.
