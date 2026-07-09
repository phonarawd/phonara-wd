# UX Reference Canon (D1)

> **상태:** D1 complete (2026-06-30)  
> **역할:** surface별 **목표 경험**과 **참고 패턴** 고정 — clone 지시 아님  
> **Domain detail:** `*_UX_CANON.md` · **Layout/modules:** [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md)  
> **Routes:** [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md)  
> **Platform grammar:** [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md) · **Design tokens:** [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)

## Reference 사용 규칙 (non-waivable)

| 허용                                                                    | 금지                                                                               |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| layout · hierarchy · interaction · density · trust cue **방향** 추출    | 특정 서비스 **문구 · 로고 · 에셋 · 색상 조합 · 고유 visual identity** 복제         |
| reference 제품의 **정보 구조·스캔 순서·행동 흐름** 학습                 | "Binance 느낌"처럼 **모호한 감성만**으로 구현                                      |
| PHONARA token·shell·controller boundary 안에서 **원본 제품**으로 재해석 | reference 변경 없이 surface **임의 확장** (→ [`DECISION_LOG.md`](DECISION_LOG.md)) |

Reference 변경·추가 시 Decision Log에 사유·영향 surface·rollback을 기록한다.

---

## Surface reference map (요약)

| Surface        | Primary         | Secondary                                     | 목표 경험 (한 줄)                               |
| -------------- | --------------- | --------------------------------------------- | ----------------------------------------------- |
| **Login/Auth** | Apple           | Notion · Linear                               | 절제된 신뢰 · form hierarchy · 빠른 복구        |
| **Home**       | Toss            | Coinbase · Robinhood · Telegram Mini App      | 상태·기회·다음 행동 한눈에                      |
| **Trade**      | Binance Desktop | Bybit Unified · OKX · Coinbase motion         | 고밀도 전문 trading · mobile Bybit류 재배치     |
| **Sports**     | bet365          | DraftKings · Pinnacle · Flashscore            | league nav · odds scan · bet slip · live status |
| **Casino**     | Stake           | BC.Game · Roobet · Shuffle                    | 발견성 · provably fair trust · fast play loop   |
| **Wallet**     | Toss            | Revolut · Apple Wallet · Coinbase Wallet      | 잔액 우선 · 입출금 CTA · timeline · 정산 상태   |
| **Earn**       | Toss            | Cashwalk · PanelNow · Obey · Coupang Partners | 쉬운 미션 · 누적 보상 · 초보자 설명             |
| **Admin**      | Grafana         | Stripe Dashboard · Supabase Studio            | exception queue · audit · operator speed        |

---

## Login / Auth

**Domain canon:** [`AUTH_UX_CANON.md`](AUTH_UX_CANON.md)  
**Routes:** `/login` · `/signup` · `/reset-password` · `/auth/callback`

### 목표 경험

사용자가 **3초 안에** "지금 로그인/가입/복구 중"임을 이해하고, 실수·오류 시 **다음 행동(재시도·복구·지원)** 이 form 근처에서 바로 보인다. 마케팅 noise 없이 **금융·계정 신뢰**를 전달한다.

### Reference에서 가져올 패턴

| Reference  | 추출할 것                                                                   |
| ---------- | --------------------------------------------------------------------------- |
| **Apple**  | 절제된 단일 column · 큰 primary CTA · security/privacy cue · minimal chrome |
| **Notion** | form label hierarchy · inline validation · recovery link placement          |
| **Linear** | 빠른 keyboard flow · focus ring · loading state without layout shift        |

### Layout · hierarchy · density · trust

- **Hierarchy:** brand/trust cue → title → inputs → primary CTA → secondary (signup/reset) → legal/privacy
- **Density:** low — 한 화면에 primary action **1개**
- **Trust:** passkey/magic-link/2FA 등 **실제 지원 수단만** 표시 · unsupported method 숨김 금지(→ disabled + reason)
- **Recovery:** forgot password · contact support — primary CTA 아래 **항상 visible**

### 금지

- form 위 과도한 promo/hero · mockup shell 잔재
- recovery 링크 bury · error를 toast-only로만 처리
- inline hardcoded copy (i18n key only)

---

## Home

**Domain canon:** [`HOME_UX_CANON.md`](HOME_UX_CANON.md)  
**Route:** `/home` (canonical Earn hub — `/earn` redirect)

### 목표 경험

앱을 열면 **지금 내 상태(잔액·보상·제한)** 와 **다음에 할 일 1가지**가 먼저 보이고, Earn·Wallet·Trade/Sports/Casino로 **의도된 funnel** 이 card/row로 연결된다 (navigate only — embed **금지** · [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §12.19). Telegram Mini App처럼 **가볍고 스캔 가능**하되, 금융 surface처럼 **과장·거짓 urgency 없음**.

### Reference에서 가져올 패턴

| Reference             | 추출할 것                                                         |
| --------------------- | ----------------------------------------------------------------- |
| **Toss**              | 상단 status summary · warm but restrained tone · next-action card |
| **Coinbase**          | balance/reward snapshot · product entry clarity                   |
| **Robinhood**         | portfolio-at-a-glance · change indicators (RPC-backed only)       |
| **Telegram Mini App** | compact mobile feed · sticky bottom nav · low scroll to action    |

### Layout · hierarchy · density · trust

- **Hierarchy:** status summary → next best action → money/reward/bet entry cards → activity feed → trust/restriction cues
- **Density:** low–medium (390 mobile) · desktop에서도 **card clutter 금지**
- **Trust:** KYC/RG/halt/restriction — 숨기지 않고 **actionable state**로 표시
- **Earn hub:** `/home` 단일 canonical — parallel Earn hub **0** ([`88-ui-consolidation-wave`](../../.cursor/rules/88-ui-consolidation-wave.mdc) C1)

### 금지

- random promo feed · false social proof · duplicate `/earn` hub rebuild
- client-side balance/reward recompute

---

## Trade

**Domain canon:** [`TRADE_UX_CANON.md`](TRADE_UX_CANON.md)  
**Routes:** `/trade` · `/trade/futures` · `/trade/spot/$pair` · `/trade/positions` · `/trade/orders` — [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §12.19

### 목표 경험

전문 트레이더가 desktop에서 **시장·차트·주문·포지션**을 스캔 없이 연속 처리하고, mobile에서는 **chart → order → positions** thumb-safe 흐름으로 동일 작업을 완료한다. **숫자·상태·위험**이 항상 visible.

**정산 모델 (§13.1.2):** UX는 Binance·Bybit·OKX **패턴**(실시간 LWC 차트 · order book · tape) — 정산은 **PHONARA 플랫폼 내부** only. Staking(`/staking`) 동일 — engine RPC · USDT+PHON(§13.1.1).

**초보 가이드 (§13.1.3):** 「이렇게 해요」3단계 · 용어 ⓘ — [`TRADE_BEGINNER_LANGUAGE_CANON.md`](TRADE_BEGINNER_LANGUAGE_CANON.md)

### Reference에서 가져올 패턴

| Reference           | 추출할 것                                                                              |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Binance Desktop** | left market list · center chart · right order ticket · bottom positions/orders/history |
| **Bybit Unified**   | unified account context · mobile tab/stack reorder                                     |
| **OKX**             | order book / recent trades rail · connection status                                    |
| **Coinbase motion** | state-change motion (price tick · fill) — reduced-motion respect                       |

### Layout canon

**Desktop**

- Left (~20%): market selector · symbol list · watchlist · filters
- Center (~45%): chart · symbol header · market context
- Right (~20%): order panel · buy/sell · type · size · balance
- Bottom (full width): positions · open orders · history · margin/risk summary
- Optional rail: order book · recent trades

**Mobile**

- Top: symbol header · price · change · quick market selector
- Main: chart first → order action tabs
- Sticky/bottom: buy/sell entry (thumb-safe)
- Secondary tabs: positions · open orders · history

### Density · trust

- **Density:** high — tabular nums · compact rows · professional scan
- **Trust:** oracleStale · circuit breaker · connection — **order path 옆**에 표시
- **Forbidden:** emoji · card-only casual desktop · hidden order panel · client PnL/margin recompute

---

## Sports

**Domain canon:** [`SPORTS_UX_CANON.md`](SPORTS_UX_CANON.md)  
**Routes:** `/sports` (canonical) · `/sports/fixture/$fixtureId` · sports subnav routes (§12.19)

### 목표 경험

리그·경기·배당을 **표 스캔**으로 빠르게 찾고, bet slip에 **선택·stake·risk**가 항상 붙어 있다. Live에서는 score · timer · status를 **숨기지 않는다**.

### Reference에서 가져올 패턴

| Reference      | 추출할 것                                            |
| -------------- | ---------------------------------------------------- |
| **bet365**     | league tree · odds table scan · bet slip persistence |
| **DraftKings** | market group filters · mobile slip sheet             |
| **Pinnacle**   | sharp odds density · suspended state clarity         |
| **Flashscore** | live score/timer prominence · match row rhythm       |

### Layout canon

- **Desktop:** left sports/league nav · center match/odds table · right bet slip · live header
- **Mobile:** sport/league tabs · match+odds list · sticky/bottom bet slip · live detail screen

### Density · trust

- **Density:** medium–high (odds table) · mobile card-only grid **금지**
- **Trust:** suspended/closed market · sportsBlocked gate reason — **선택 전** visible
- **Forbidden:** odds modal-only flow · detached slip · ambiguous live status

---

## Casino

**Domain canon:** [`CASINO_UX_CANON.md`](CASINO_UX_CANON.md) (D1.5 detail)  
**Routes:** `/casino/*` · `/games/*` — Trade embed · `?section=casino` **금지**

### 목표 경험

world-class gaming platform — **premium · fast · clear · trustworthy**. 게임 발견 → play loop → rebet/auto bet이 **끊김 없이** 이어지고, provably fair · balance · session state가 **항상 surface**에 있다. indie crypto casino · generic admin-dashboard 느낌 **금지**.

### Reference에서 가져올 패턴

| Reference   | 추출할 것                                                   |
| ----------- | ----------------------------------------------------------- |
| **Stake**   | lobby discovery · in-game HUD density · provably fair entry |
| **BC.Game** | category nav · recent/featured · fast rebet                 |
| **Roobet**  | motion that explains state (not decoration)                 |
| **Shuffle** | mobile thumb betting · session clarity                      |

### Layout · trust (lobby + in-game 공통)

- **Discovery:** category · featured · balance · fairness entry
- **In-game:** stage dominates · bet controls thumb-safe · **Auto Bet first-class** (modal-only 금지)
- **Trust layer (always):** Provably Fair · RTP (where applicable) · balance · bet amount · P/L · network · session · auto bet status

D1.5 game-specific UX · legacy presentation policy: [`CASINO_UX_CANON.md`](CASINO_UX_CANON.md)

---

## Wallet

**Domain canon:** [`WALLET_UX_CANON.md`](WALLET_UX_CANON.md)  
**Routes:** `/wallet` · `/ledger` · `/staking`

### 목표 경험

초보자가 **"지금 쓸 수 있는 돈이 얼마인지"** 즉시 답하고, deposit/withdraw path가 **1–2 tap** 이내 visible. timeline의 pending/settled/failed가 **원인과 함께** 설명된다.

### Reference에서 가져올 패턴

| Reference           | 추출할 것                                      |
| ------------------- | ---------------------------------------------- |
| **Toss**            | top summary · immediate CTA row · warm clarity |
| **Revolut**         | available vs locked · timeline status chips    |
| **Apple Wallet**    | card stack for assets · clean hierarchy        |
| **Coinbase Wallet** | network/fee explanation · restriction notices  |

### Layout canon

- **Desktop:** top total (available/locked) · asset cards · side deposit/withdraw/KYC · bottom timeline
- **Mobile:** summary top · CTA row · balance cards · recent timeline

### Density · trust

- **Density:** medium — money numbers **tabular · largest tier**
- **Trust:** KYC/withdraw gate · fee preview (RPC display) · no client money math
- **Payment:** provider card pattern — [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md)

---

## Earn

**Domain canon:** [`EARN_UX_CANON.md`](EARN_UX_CANON.md)  
**Routes:** `/home` (hub) · `/home/missions` · `/dashboard` · `/events` — **`/earn` redirect-only**

### 목표 경험

novice가 **"무엇을 하면 · 얼마를 · 얼마나 걸려서 · 언제 cashout"** 인지 **즉시** 이해한다. 반복 참여 동기는 주되 **과장·거짓 deadline·숨겨진 eligibility 금지**.

### Reference에서 가져올 패턴

| Reference                              | 추출할 것                                                      |
| -------------------------------------- | -------------------------------------------------------------- |
| **Toss**                               | mission card (reward · time · difficulty) · today earnings top |
| **Cashwalk**                           | streak/participation (truthful copy only)                      |
| **PanelNow / Obey / Coupang Partners** | category tabs · partner/referral entry clarity                 |

### Layout canon

- **Desktop:** today earnings · available reward · missions · category sections · streak/tier side
- **Mobile:** earnings top · category quick tabs · mission cards · cashout/referral CTA bottom

### Tone · trust

- Warm Korean · light emoji OK in general earn ([`COPYWRITING_CANON.md`](COPYWRITING_CANON.md))
- Activity feed/streaks — **presentation string display props only** (engine mutation 금지)
- **Forbidden:** exaggerated rewards · false urgency · deceptive FOMO

---

## Admin

**Domain canon:** [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)  
**Routes:** `/admin/*` — user↔admin: [`PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md`](../PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md)

### 목표 경험

1인 operator가 dashboard를 열면 **오늘 처리할 예외 queue**가 먼저 보이고, high-risk action마다 **reason · confirmation · audit trail**이 붙는다. 초보 operator도 **업무 한국어**로 triage 가능.

### Reference에서 가져올 패턴

| Reference            | 추출할 것                                              |
| -------------------- | ------------------------------------------------------ |
| **Grafana**          | alert/exception first · dense filterable tables        |
| **Stripe Dashboard** | status chips · drill-down · clear failure reason       |
| **Supabase Studio**  | SQL-adjacent clarity · permission feedback from server |

### Layout canon

**첫 화면 우선순위**

```text
오늘 해야 할 일
→ 처리 안 된 출금
→ 입금 확인
→ 회원 문의
→ 이상 거래
→ 오류/실패 작업
→ 오늘 매출/정산 요약
```

Normal dashboard보다 **exception queue** 우선. Tables: filter · search · bulk-read optimized.

### Density · trust

- **Density:** high for tables · jargon-only screens **금지**
- **Trust:** every manual action → reason field + audit row · permission by UI hide only **금지**

---

## Cross-surface completion signals (D1)

모든 surface U-phase closeout 시 아래를 **추가**로 만족 (Phase R surface completion — [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md)).

| Signal           | 기준                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Responsive       | mobile 390 · tablet 768 · desktop 1024 — layout 붕괴 0                                            |
| Token-only       | hardcoded hex/spacing/radius/shadow 0 — [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)            |
| Engine           | controller/hook/RPC signature unchanged — [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md)              |
| Display          | [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) required fields exposed or decision logged |
| Lightweight gate | `gate:ai-impl -- --test <owner-vitest-path>` green                                                |

---

## Domain canon index

| Document                                   | Surface                   | D-phase   |
| ------------------------------------------ | ------------------------- | --------- |
| [`AUTH_UX_CANON.md`](AUTH_UX_CANON.md)     | Login · Signup · Reset    | D1        |
| [`HOME_UX_CANON.md`](HOME_UX_CANON.md)     | Home hub `/home`          | D1        |
| [`TRADE_UX_CANON.md`](TRADE_UX_CANON.md)   | Trade                     | D1        |
| [`SPORTS_UX_CANON.md`](SPORTS_UX_CANON.md) | Sports                    | D1        |
| [`CASINO_UX_CANON.md`](CASINO_UX_CANON.md) | Casino (D1.5 game detail) | D1 / D1.5 |
| [`WALLET_UX_CANON.md`](WALLET_UX_CANON.md) | Wallet · Ledger · Staking | D1        |
| [`EARN_UX_CANON.md`](EARN_UX_CANON.md)     | Earn missions · dashboard | D1        |
| [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)   | Admin                     | D1 / D3   |

Blueprint (layout modules · forbidden · completion): [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md)

---

## Verification (D1 done)

- [x] 본 문서 — 8 surface 목표 경험 · reference map · layout/trust direction
- [x] Domain canon 8종 — Auth · Home 신규 · Trade/Sports/Casino/Wallet/Earn/Admin cross-link
- [x] [`DECISION_LOG.md`](DECISION_LOG.md) Decision 010
- [x] D1 narrative complete · Phase R queue — [`ACTIVE_WORK_SSOT.md`](ACTIVE_WORK_SSOT.md) (구 rebuild/NEXT_STEP.md는 2026-07-04 삭제)
