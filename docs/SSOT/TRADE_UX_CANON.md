# Trade UX Canon

> **상태:** D1 narrative SSOT (2026-06-30)  
> **Master map:** [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md) §Trade  
> **Blueprint:** [`SURFACE_BLUEPRINTS.md`](SURFACE_BLUEPRINTS.md) §Trade  
> **Display contract:** [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) — Trade rows  
> **Routes:** `/trade` · `/trade/futures` · `/trade/spot/$pair` · `/trade/positions` · `/trade/orders` — [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §12.19 · §13.1.2  
> **Staking:** `/staking` · `/staking/positions` = **Earn** domain (`r0-staking-domain-sot-sync`) — not Trade chapter.

## 목표 경험

고밀도 전문 trading — desktop에서 시장·차트·주문·포지션 연속 처리, mobile에서 chart → order → positions thumb-safe 재배치. 숫자·위험·연결 상태 항상 visible.

## Reference

**Primary:** Binance Desktop  
**Secondary:** Bybit Unified Trading · OKX · Coinbase motion

Pattern only — no proprietary branding clone.

---

## Platform settlement · exchange-grade UX (§13.1.2)

> **정본:** Cursor Plan §13.1.2 · `trade-exchange-parity-display-contract.ts`

유저의 **현물·선물·스테이킹** 거래/베팅/정산은 **PHONARA 플랫폼 내부**에서만 발생한다. 외부 거래소 주문 라우팅 · CLOB 매칭 · API 연동 **0**.

| 층                         | 역할                                                                                                                                                                                                                                                          | 금지                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **UX (Layer A)**           | Binance·Bybit·OKX 패턴 — LWC 실시간 차트 · order book · bottom dock · mobile tabs                                                                                                                                                                             | clone · 「타 거래소 체결」카피 |
| **Display feed (Layer B)** | Binance **spot** WS klines (chart) · Binance **fapi** depth/24h (desk book/ticker) · `rpc_get_candles` · `rpc_get_synthetic_book` · `DISPLAY_ONLY_FEED` · stale 임계 book 10s / ticker 30s / kline 60s → 배지 + synthetic book 폴백 (oracle submit gate 별도) | settlement RPC 입력으로 사용   |
| **Settlement (Layer C)**   | spot/futures/staking RPC · wallet lock · ledger Σ=0 · house fill                                                                                                                                                                                              | chart tick으로 주문·PnL 재계산 |

**Staking:** `/staking` · `/staking/positions` — `rpc_stake_phon` · `rpc_unstake_phon` · `rpc_claim_staking_reward` · `stake_currency` USDT+PHON (§13.1.1)

**P9 todos (§25.12.9.1-D):** **`p9-gate-trade-world-class` `[x]`** 2026-07-06 · **`p9-operator-visual-signoff` `[x]`** · Launch E1–E4 **`[x]`** · Fiat#9G **`p4-gate-fiat-reference-world-class` `[x]`** · **NEXT `p10-page-sports` (#168)** · Fiat#10–12 = P10 surface 이후 (§20.13.2)

### Trade Surface QA audit remediation (§25.12.9.2 · 2026-07-06)

> **증거 (READ-ONLY):** `quote_currency_verification_84120b22.plan.md` · **구현:** `trade_audit_a1_a2_fix_837aab3e.plan.md` · YAML `p9-trade-audit-remediation-a1/a2` **`[x]`**

| ID     | Severity   | 상태    | 요약                                                                                                                                   |
| ------ | ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **A1** | High       | `[x]`   | Spot mobile history — spot symbol whitelist filter + cancel wire + `cancel-spot-open-order` registry · futures orders spot desk 미노출 |
| **A2** | Medium     | `[x]`   | `useTradeDeskViewport` — desktop/mobile shell 상호 배타 conditional render · chart WS 1×                                               |
| A3–A6  | Low~Medium | backlog | hygiene · signoff blocker 아님 · 별도 PR                                                                                               |

**재착수 금지:** `p9-trade-layout-dedup-gate` · `p9-trade-chart-overlays-lwc` 등 completed WORLD todo — gap은 remediation todo로만 닫음 (97-phase-r guard).

---

## Beginner language (§13.1.3 · §30.2)

> **정본:** [`TRADE_BEGINNER_LANGUAGE_CANON.md`](TRADE_BEGINNER_LANGUAGE_CANON.md) · `trade-beginner-language-display-contract.ts`

| 층            | 내용                                                     |
| ------------- | -------------------------------------------------------- |
| **기능 설명** | 현물/선물/스테이킹 「이렇게 해요」3단계 · 용어 ⓘ HelpTip |
| **리스크**    | 첫 방문 sheet (§32.5) — 손실·수수료·청산·책임 이용       |

초등학생도 이해할 **짧은 한국어** · subnav 한 줄 도움 · ticket/panel HelpTip 필수.

---

## Desktop layout canon

| Zone            | ~%          | Content                                                         |
| --------------- | ----------- | --------------------------------------------------------------- |
| Left            | 20%         | market selector · symbol list · watchlist · filters             |
| Center          | 45%         | TradingView-style chart · symbol header · market context        |
| Right           | 20%         | order panel · buy/sell · order type · size · balance            |
| Bottom          | full width  | positions · open orders · history · fills · margin/risk summary |
| Rail (optional) | collapsible | order book · recent trades                                      |

---

## Mobile layout canon

- Top: symbol header · price · change · quick market selector
- Main: chart first → order action tabs
- Sticky/bottom: buy/sell entry
- Secondary tabs: positions · open orders · history

---

## Required modules

Market Selector · Symbol Header · Chart · Order Book · Recent Trades · Order Panel · Asset Balance · Open Positions · Open Orders · Order History · Margin/Risk Indicator · Connection/market status · oracleStale/circuit breaker state

---

## Priority order

1. Price and selected market
2. Chart and market context
3. Order action
4. Positions and open orders
5. History and secondary analytics

---

## Display data (contract-bound)

**Exposed:** futuresPositions (PnL/margin/liquidation fields on rows) · phonAvail/usdtAvail · oraclePriceDisplay · oracleStale · settlement-related controller fields

**Decision pending:** margin input/mode — [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) · do not invent in UI

**Rule:** no client-side balance · PnL · margin · fee arithmetic

---

## Forbidden

- Card-only casual desktop layout
- Hidden order panel
- Decorative chart without trading density
- Mobile-first simplified desktop
- Emoji in trade copy ([`COPYWRITING_CANON.md`](COPYWRITING_CANON.md))
- Sports/Casino embed · bet slip · league tree · casino lobby · `?section=sports|casino` in Trade chrome
- **External exchange settlement claims** — 「Binance/Bybit에서 체결」· API key 연동 · CLOB 이식
- **Chart/WS price as settlement input** — order · PnL · margin must use oracle/mark RPC only

---

## Completion signals

- Professional trader scanability at desktop density
- Thumb-safe mobile order flow
- Controller/hook/RPC signature unchanged
- Lightweight vitest on TradeModeShell / BetDeskSurface
