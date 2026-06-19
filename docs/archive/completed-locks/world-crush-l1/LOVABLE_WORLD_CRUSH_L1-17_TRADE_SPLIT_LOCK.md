# LOVABLE World Crush · Trade Split LOCK — L1-17 v0.2 EXECUTE

> **상태:** **✅ §GREEN** · operator report 2026-06-17 · vitest **577/577** (+5) · catalog **Δ=+26** DIFF=0 · G-WC2 ✅  
> **큐 ID:** **L1-17** (Trade Spot \| Futures \| Staking · G-WC2 · Lovable 전용)  
> **의존:** L1-16 ✅ · L1-16i ✅ · vitest **572/572** · catalog carry  
> **상위:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.4

---

## Scope (1줄)

`/trade` 단일 perpetual terminal → **TradeModeShell**로 분할. 상단 segment **Spot · Futures · Staking** (default `futures`), 모드별 panel swap. **12-D futures terminal은 relocate (delete 0)**, spot/staking은 display-only mock. RPC/Supabase/packages **0-touch**, L1-16 home/admin/wallet/sports 회귀 **0**.

---

## Target routes

| route | action |
|-------|--------|
| **`/trade`** (`src/routes/trade.tsx` → `ImportedTradePage`) | mount **`TradeModeShell`** |
| **`/trade/hub`** (`TradeHub.tsx`) | **unchanged** — 별도 hub 카드 페이지 (terminal 아님 · 충돌 0) |

**Default mode:** **`futures`**. segment order: **Spot · Futures · Staking** (Binance grammar).

**Persist:** `localStorage` key `phonara-trade-mode-v1` = `spot|futures|staking`. `?mode=` query는 router 지원 시만; 미지원 시 state-only (§GREEN에 기록).

---

## World Crush bar (G-WC2)

| # | 필수 | FAIL |
|---|------|------|
| T1 | **3 modes** segment · **≥48px** touch targets | futures-only single view |
| T2 | Futures = 기존 12-D body **relocate 0-delete** | 12-D component file delete |
| T3 | Futures **synthetic / display-only** label — `OrderBookDepthPanel` **`trade-orderbook-display-only-label`** carry | label missing |
| T4 | Spot/Staking confirm → **`toast` only** · **no rpc / no wallet mutate** | wallet mutate client-side |
| T5 | money/price **`tabular-nums`** · float math UI **0** | float math in UI |

**Home `/home` · L1-16 · admin · Crash FROZEN = NO-TOUCH.**

---

## §Visual References (pattern only · code import 0)

- https://www.binance.com/en/trade — Spot \| Futures segment · panel swap
- https://www.bybit.com/trade/usdt/BTCUSDT — perps panel grammar
- https://github.com/cokepoppy/my-binance · https://github.com/brlocky/trading-app-bybit
- Internal carry: **12-D** `components/trade/*` · `OrderBookDepthPanel` · `ImportedTradePage` layout

---

## Mode segment IA

| modeId | panel | testid |
|--------|-------|--------|
| `spot` | `TradeSpotPanel` | `trade-panel-spot` |
| `futures` | `TradeFuturesPanel` | `trade-panel-futures` |
| `staking` | `TradeStakingPanel` | `trade-panel-staking` |

Shell root: **`data-testid="trade-mode-shell"`**

**i18n (APPEND only · missing 시):** `trade.mode.spot` · `trade.mode.futures` · `trade.mode.staking` · `trade.spot.*` · `trade.staking.*` · `trade.synthetic.displayOnly` — existing reuse · rename/delete **0**.

---

## Panel contents

### TradeSpotPanel (display-only mock)

- PHON/USDT pair header · spot label · tabular price
- buy/sell **market · limit** tabs · **confirm → `toast` only** · amount input · **no rpc**

### TradeFuturesPanel (12-D carry)

- `ImportedTradePage`의 **`DesktopTrade` + `MobileTradeView`** body를 그대로 이동 (import path만)
- BTC/USDT **무기한** · funding · 24h stats
- **synthetic / display-only** label — `OrderBookDepthPanel` **`trade-orderbook-display-only-label`** carry
- **default visible when mode=futures**

### TradeStakingPanel (display-only mock)

- 3~4 pool cards · APR display strings
- stake CTA → **`toast` only** · optional link **`/earn`**
- reuse `staking.term.*` · `staking.hero.*` where keys exist

---

## Files

| ID | path | action |
|----|------|--------|
| T17-1 | `src/components/trade/TradeModeShell.tsx` | **NEW** — segment (≥48px touch) + panel outlet · sticky below AppShell header |
| T17-2 | `src/components/trade/panels/TradeSpotPanel.tsx` | **NEW** — spot mock |
| T17-3 | `src/components/trade/panels/TradeFuturesPanel.tsx` | **NEW** — `DesktopTrade` + `MobileTradeView` relocate (12-D carry) |
| T17-4 | `src/components/trade/panels/TradeStakingPanel.tsx` | **NEW** — staking pool cards |
| T17-5 | `src/components/pages/ImportedTradePage.tsx` | **EDIT** — body → `<TradeModeShell defaultMode="futures" />` (AppShell wrapper 유지) |
| T17-6 | `src/i18n/ko.ts` + `en.ts` | **APPEND only** if keys missing |
| T17-7 | `src/components/trade/__tests__/TradeModeShell.test.tsx` | **NEW** — 3 segment · default futures · mode switch · synthetic label |

**DELETE 0** — `MobileTradeView` · `OrderBookDepthPanel` · `useFakeTicker` · `DesktopTrade` 등 12-D 파일 **삭제 금지** (import path만 이동).

---

## Tests

| # | assert |
|---|--------|
| T1 | segment renders **3** modes · `data-testid="trade-mode-shell"` |
| T2 | default selected = **`futures`** |
| T3 | click → panel swap · `trade-panel-spot|futures|staking` |
| T4 | futures panel **synthetic/display-only** label (`trade-orderbook-display-only-label` or i18n) |
| T5 | vitest **572/572 carry** (+new trade tests OK) |
| T6 | ko=en **DIFF=0** |
| T7 | home · admin · wallet · sports · **casino** 회귀 **0** |
| T8 | `rg '[가-힣]' src/components/trade/ --glob '!**/i18n/**'` = **0** |

---

## LOCK Footer T17-F1 ~ T17-F6

| # | 고정 | FAIL |
|---|------|------|
| F1 | 3 modes Spot·Futures·Staking | ≠3 |
| F2 | default **futures** · 12-D body in Futures panel | futures-only dump |
| F3 | synthetic label **present** on futures | label missing |
| F4 | spot/staking **toast-only** · rpc 0 | wallet mutate |
| F5 | vitest **572/572 carry** · DIFF=0 | regression |
| F6 | L1-16 home · `/trade/hub` **0-touch** | hub/ home change |

---

## EXECUTE Steps 0→8

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline 572/572 · ~2591/~2591 |
| 1 | T17-1 TradeModeShell |
| 2 | T17-3 FuturesPanel — **relocate** DesktopTrade + MobileTradeView |
| 3 | T17-2 spot · T17-4 staking panels |
| 4 | T17-5 ImportedTradePage wire |
| 5 | T17-6 i18n append if needed |
| 6 | T17-7 tests |
| 7 | trade + home + admin + wallet + sports + casino + full |
| 8 | §GREEN + **9b-T manual** |

---

## §GREEN full block

```bash
bunx vitest run src/components/trade/
bunx vitest run src/components/home/ src/components/admin/
bunx vitest run wallet sports
bunx vitest run

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print(len(ko^en))"

rg -n 'TradeModeShell' src/routes/ src/components/
rg -n 'display-only|synthetic' src/components/trade/ --glob '*.tsx'
rg -n '[가-힣]' src/components/trade/ --glob '!**/i18n/**'
```

**PASS:** vitest **572/572 carry** (+new OK) · DIFF=**0** · 3 modes · default futures · synthetic label hit · trade Hangul 0 · home/admin/casino regression 0.

**§GREEN template:**

```text
L1-17 §GREEN — TradeModeShell Spot|Futures|Staking · default futures · 12-D relocate 0-delete · synthetic label · vitest N/N · catalog Δ=+K DIFF=0 · 9b-T PASS · G-WC2 · ZIP defer.
```

**Next HEAD:** **L1-18** FOMO motion (G-WC3)

---

## 9b-T manual (operator 60초)

1. `/trade` — segment **현물·선물·스테이킹** 3개 visible
2. default **선물** — chart/OB/order = 기존 터미널
3. **현물** 전환 — spot mock · order toast
4. **스테이킹** 전환 — pool cards · stake toast
5. futures **display-only** label 확인
6. `/trade/hub` — hub 카드 페이지 **변경 없음**
7. en mode: Korean 0

**FAIL =** futures-only · 12-D deleted · synthetic label missing · `/trade/hub` terminal 중복

---

## NO-TOUCH

L1-16 `/home` · admin · wallet · sports · P2-Games 10/10 · Crash FROZEN · `apps/web`/packages/supabase · rpc/migration · **`/trade/hub` 카드 페이지 (`TradeHub.tsx`)** · BetResponseStatus enum · L1-18 motion · ZIP

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO — G-WC2 Trade split |
| 2026-06-17 | **v0.2** — ImportedTradePage wire · TradeHub unchanged · testid · 12-D file list · i18n keys · §GREEN rg paths |
| 2026-06-17 | **§GREEN** — TradeModeShell · vitest **577/577** (+5) · catalog **Δ=+26** DIFF=0 · synthetic label · G-WC2 ✅ · ZIP defer |

---

*Lovable canvas only · G-WC2 · ZIP after G-WC3 + operator GO*
