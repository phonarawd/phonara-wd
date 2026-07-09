# Trade Beginner Language Canon (38차)

> **상태:** Plan §13.1.3 · §30.2 흡수 (2026-07-05)  
> **Authority:** [`phase_r_super-app_8bdf2c10`](../../.cursor/plans/phase_r_super-app_8bdf2c10.plan.md) §13.1.3 · [`TRADE_UX_CANON.md`](TRADE_UX_CANON.md) · [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)  
> **코드:** `apps/web/src/domain/trade-beginner-language-display-contract.ts`  
> **검증 todo:** `p9-trade-beginner-help-layer`  
> **리스크 교육(별도):** §32.5 `p9-first-trade-education` — 수수료·청산·책임 이용 (초보 **기능 설명**과 분리)

거래·스테이킹을 **처음** 쓰는 유저·금융 지식이 없는 유저가 **한눈에** 「이게 뭐지?」「어떻게 하지?」에 답할 수 있게 하는 **유저-facing 초등어** 정본입니다.  
목표 = Admin §29.5와 같은 **짧은 한국어** · 존댓말 · 전문용어는 괄호 쉬운 말 1회.

---

## 1. 두 층 분리 (non-waivable)

| 층                  | 목적                                        | UI                                       | Todo                             |
| ------------------- | ------------------------------------------- | ---------------------------------------- | -------------------------------- |
| **A · 기능 설명**   | 현물/선물/스테이킹이 **뭔지·어떻게 하는지** | `HowItWorks` 3단계 · `HelpTip` ⓘ         | `p9-trade-beginner-help-layer`   |
| **B · 리스크 고지** | 손실·수수료·청산·책임 이용                  | 첫 방문 sheet · `/legal/risk-disclosure` | `p9-first-trade-education` `[x]` |

**FAIL:** 리스크 sheet만 있고 「매수가 뭐예요?」 답 없음 · 법적 고지로 기능 설명 대체 · 영어 약어 화면 노출(CLOB·maker·taker)

---

## 2. Surface별 「이렇게 해요」 3단계 (ko 정본)

### 현물 `/trade`

| 단계 | 한 줄 (i18n ko)                                      |
| ---- | ---------------------------------------------------- |
| 1    | 사고 싶은 코인과 쓸 금액(USDT 또는 PHON)을 고릅니다. |
| 2    | **매수**(사기) 또는 **매도**(팔기) 버튼을 누릅니다.  |
| 3    | 체결되면 지갑 잔액이 바로 바뀝니다.                  |

### 선물 `/trade/futures`

| 단계 | 한 줄                                                                |
| ---- | -------------------------------------------------------------------- |
| 1    | 오를지(**롱**)·내릴지(**숏**)와 **배수(레버리지)** 를 고릅니다.      |
| 2    | 주문을 넣으면 **증거금**이 잠깁니다.                                 |
| 3    | 가격이 맞으면 이익, 반대면 손실·**청산**(강제 종료) 위험이 있습니다. |

### 스테이킹 `/staking` · `/staking/positions`

| 단계 | 한 줄                                                  |
| ---- | ------------------------------------------------------ |
| 1    | 맡길 코인(PHON·USDT)과 **기간**을 고릅니다.            |
| 2    | 맡기면 그동안 **출금이 잠깁니다**.                     |
| 3    | 기간이 끝나면 **이자**를 받거나 다시 찾을 수 있습니다. |

---

## 3. 메뉴·탭 초등어 (subnav · mobile tab)

| 키                       | 화면 라벨 (ko) | 한 줄 도움 (`trade.subnav.help.*`) |
| ------------------------ | -------------- | ---------------------------------- |
| `trade.subnav.spot`      | 현물           | 지금 바로 사고팔기                 |
| `trade.subnav.futures`   | 선물           | 가격 오르내림에 맞추기             |
| `trade.subnav.positions` | 포지션         | 지금 들고 있는 선물                |
| `trade.subnav.orders`    | 주문           | 넣은 주문 목록                     |
| `trade.subnav.history`   | 거래내역       | 지갑에 남은 기록                   |
| (Earn chip) `/staking`   | 맡기기         | 돈 맡기고 이자 받기                |

---

## 4. HelpTip 필수 용어 (주문·포지션 패널)

| term id          | ⓘ 라벨     | 설명 요지 (3문장 이하)                                            |
| ---------------- | ---------- | ----------------------------------------------------------------- |
| `spot_buy`       | 매수       | 지금 가격으로 삽니다.                                             |
| `spot_sell`      | 매도       | 가진 코인을 팝니다.                                               |
| `long`           | 롱(오른다) | 가격이 오르면 이익입니다.                                         |
| `short`          | 숏(내린다) | 가격이 내리면 이익입니다.                                         |
| `leverage`       | 레버리지   | 빌려서 더 크게 거래합니다. 손실도 커질 수 있습니다.               |
| `margin`         | 증거금     | 선물 주문에 묶어 두는 돈입니다.                                   |
| `liquidation`    | 청산       | 증거금이 부족하면 강제로 끝납니다.                                |
| `order_book`     | 호가창     | 사려는·팔려는 가격 목록입니다. 누르면 주문란에 가격이 들어갑니다. |
| `funding`        | 펀딩       | 선물 포지션 유지 비용입니다. 정해진 시간마다 정산됩니다.          |
| `mark_price`     | 기준가     | 손익 계산에 쓰는 공식 가격입니다.                                 |
| `staking_lock`   | 잠금       | 맡긴 동안 출금할 수 없습니다.                                     |
| `staking_apr`    | 예상 이율  | 1년 기준 예상 수익률입니다. 실제는 기간·풀에 따라 달라집니다.     |
| `stake_currency` | 맡길 코인  | PHON 또는 USDT 중 고릅니다.                                       |

---

## 5. 문장 규칙 (§30.2)

- 한 문장 = 한 정보 · **15단어 이내** 목표 · 존댓말
- 첫 등장 전문어 = 괄호: 「레버리지(빌려서 더 크게)」
- **숫자·행동 먼저** — 「매수 버튼을 누릅니다」 (「신속 체결」 같은 모호어 금지)
- 설명과 법적 고지 **분리** — `trade.education.*` 와 `trade.help.*` 혼용 금지

---

## 6. UI 배치 (DoD · `p9-trade-beginner-help-layer`)

| Surface         | 필수                                                                 |
| --------------- | -------------------------------------------------------------------- |
| Spot desk       | `HowItWorks` 상단 · ticket `spot_buy`/`spot_sell` HelpTip            |
| Futures desk    | `HowItWorks` · ticket `long`/`short`/`leverage`/`margin` HelpTip     |
| Staking hub     | `HowItWorks` · `staking_lock`/`staking_apr`/`stake_currency` HelpTip |
| Positions panel | `liquidation` · `mark_price` HelpTip (column header)                 |
| Order book      | `order_book` HelpTip (패널 제목 옆)                                  |

**Primitive:** `HowItWorks` · `HelpTip` — [`product/primitives`](../apps/web/src/product/primitives) §30.2

---

## 7. 금지 화면 단어 (유저 Trade surface · grep FAIL)

`CLOB` · `maker` · `taker` · `RPC` · `oracle`(단독 — 「기준가」사용) · `synthetic` · `house fill` · `Binance에서 체결` · `외부 거래소`

---

## 8. 완료 신호

- [x] `trade-beginner-language-display-contract` test green
- [x] spot · futures · staking `HowItWorks` mounted · persistenceId surface별
- [x] §4 HelpTip 전 term ticket/panel에 wired 또는 `built_hidden` 사유
- [x] `check:i18n` · ko/en key parity
- [x] `p9-gate-trade-world-class` — §32.7 H1–H4 bundle · `assertP9TradeWorldClassGateSync` green

---

## 교차 참조

- §13.1.2 플랫폼 독립 정산 · [`TRADE_UX_CANON.md`](TRADE_UX_CANON.md)
- [`ADMIN_BEGINNER_LANGUAGE_CANON.md`](ADMIN_BEGINNER_LANGUAGE_CANON.md) — operator 대칭
- Plan §30.2 · §32.5 · `operator-trust-pages-display-contract.ts`
