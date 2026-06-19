# P2 · Trade Crush — Binance/Bybit (12-O) — v1 (정본)

> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) v4 §0·§10  
> **선행:** Route Dedup ✅ · P1.4 ✅ · 카지노 라인 완결  
> **벤치:** Binance / Bybit exchange grammar · 12-D `density="trade"` carry  
> **범위:** `/trade` presentation-only · mock market data · **엔진 NO-TOUCH**  
> **갱신:** 2026-06-15

---

## 왜 P2인가

카지노 라인(P1→Dedup) 완료. v4 로드맵 다음은 **Trade 밀도** — 차트 · 오더북 · 테이프 · 포지션 · 모바일 시트. 12-D `TradeHub` scaffold를 **ImportedTradePage crush 레이아웃**으로 승격.

---

## 12-D와의 관계

| 항목 | 12-D (완료) | P2 (이번) |
|------|-------------|-----------|
| `/trade` | `TradeHub` 6-card scaffold | **`ImportedTradePage` crush 재조립** |
| `ImportedTradePage.tsx` | file preserve (R-D10) | **EDIT 허용** (presentation only) |
| `trade.tsx` | component = TradeHub | **component → crush page** (head Δ=0 목표) |
| `/trade/hub` | 존재 시 | **redirect → `/trade`** (Route Dedup 패턴) |
| engine / websocket | defer | **여전히 NO-TOUCH** |

---

## 슬라이스 분할 (§0-5)

### P2a — Chart + Market Chrome (9 logical)

| # | 파일 | N/E | 역할 |
|---|------|-----|------|
| 1 | `src/lib/trade-market-mock.ts` | NEW | OHLCV seed · orderbook levels · tape rows · funding rate · 24h change · **display string only** |
| 2 | `src/components/trade/TradeChartHero.tsx` | NEW | `lightweight-charts` v4 · candle/line · lazy dynamic import · resize observer |
| 3 | `src/components/trade/FundingBadge.tsx` | NEW | 펀딩 카운트다운 mock |
| 4 | `src/components/trade/Change24hBadge.tsx` | NEW | 24h % · semantic `text-up`/`text-down` |
| 5 | `src/components/trade/TradeModeSegment.tsx` | NEW | 선물/현물/스테이킹 · presentation tab (mutation 0) |
| 6 | `package.json` | EDIT | `lightweight-charts` ^4 |
| 7 | `src/i18n/{ko,en,ja,zh}.ts` | EDIT | `trade.crush.*` · `trade.mode.*` · `trade.chart.*` |
| 8 | `src/components/pages/ImportedTradePage.tsx` | EDIT | P2a: hero chart + badges + mode segment only (scaffold 제거 준비) |
| 9 | `src/routes/trade.tsx` | EDIT | component → crush `ImportedTradePage` · **head/meta Δ=0** |

**Gate P2a:** chart mount · mode switch display · vitest mock sanity · bundle chart chunk lazy

### P2b — Depth + Tape + Position (9 logical)

| # | 파일 | N/E | 역할 |
|---|------|-----|------|
| 1 | `src/components/trade/OrderbookDepth.tsx` | NEW | L2 bid/ask bars · mid spread · `usePageVisible` tick |
| 2 | `src/components/trade/MarketTradesTape.tsx` | NEW | scrolling trades · mock push 1.5s |
| 3 | `src/components/trade/PositionPanel.tsx` | NEW | open positions mock · PnL **display string** (재계산 0) |
| 4 | `src/components/trade/MobileTradeSheet.tsx` | NEW | bottom sheet · buy/sell CTA presentation only |
| 5 | `src/components/pages/ImportedTradePage.tsx` | EDIT | 2col desktop / stack mobile · P2b panels wire |
| 6 | `src/hooks/useTradeMarketTick.ts` | NEW | mock tick orchestrator · ≤3 intervals · visibility gate |
| 7 | `src/hooks/__tests__/useTradeMarketTick.test.tsx` | NEW | reduced-motion · page hidden pause |
| 8 | `src/routes/trade.hub.tsx` | EDIT | redirect → `/trade` (있을 경우) |
| 9 | `TradeGamesTeaserCard` 등 | — | 이미 `/casino` (Dedup ✅) |

**Gate P2b:** desktop 2col · mobile sheet · 동시 timer ≤4 · Lighthouse LCP

---

## 성능 LOCK

| 규칙 | 적용 |
|------|------|
| Chart | `dynamic import('lightweight-charts')` · route chunk |
| Timers | `usePageVisible` + `useInView` · ≤4 concurrent |
| reduced-motion | chart 애니메이션 off · tape static |
| JS budget | trade route **+chart chunk < 60KB gzip** 목표 (초과 시 P2a defer 분리) |
| Hydration | P1.1a 규약 |

---

## v4 §0 / §10 / Money

- Hangul JSX **0** · banned colors **0**
- ad/sensor/watch **0**
- **PnL/price/balance 재계산 금지** — mock `trade-market-mock.ts` display only
- CTA buy/sell → toast/nav · **no RPC** · no `useTrading` wire
- `packages/trading-engine` · `features/trade/**` · `lib/rpc.ts` **NO-TOUCH**

---

## 레이아웃 (ImportedTradePage)

```text
desktop (≥1280):
┌─────────────────────────────────────────┐
│ TradeModeSegment │ Funding │ Change24h   │
├──────────────────────┬──────────────────┤
│ TradeChartHero       │ OrderbookDepth   │
│                      │ MarketTradesTape │
├──────────────────────┴──────────────────┤
│ PositionPanel                             │
└─────────────────────────────────────────┘

mobile (390):
Chart → Orderbook collapse → Tape → Position → MobileTradeSheet FAB
```

`<AppShell density="trade">` 유지 (12-D #D-5).

---

## §GREEN self-check

```bash
rg -i "WatchCard|AdCard|mission\.ad" src/components/trade && exit 1 || true
rg "[가-힣]" src/components/trade src/lib/trade-market-mock.ts --glob '!**/*.test.*' && exit 1 || true
rg "bg-\[#|text-white|text-black|oklch\(" src/components/trade && exit 1 || true
git diff --stat packages/trading-engine apps/web/src/features/trade apps/web/src/domain && exit 1 || true
bunx vitest run src/hooks/__tests__/useTradeMarketTick.test.tsx
```

---

## Gate

| 항목 | FAIL |
|------|------|
| vitest | baseline + P2b +2 |
| `trade.tsx` head | meta/canonical/JSON-LD Δ≠0 |
| engine diff | trading-engine · features/trade hit |
| sitemap | 시작 실측 N 불변 (또는 Δ 문서화) |

---

## 실행 순서

```text
Route Dedup GREEN → P2a → P2b → P3(12-P) Earn
```

| Turn | 보고 |
|------|------|
| P2a | `P2a GREEN · trade chart+badges · lightweight-charts lazy` |
| P2b | `P2b GREEN · orderbook+tape+position · 12-O complete` |

---

## PHONARA paste 어댑터

| Lovable | PHONARA |
|---------|---------|
| `components/trade/*` | `apps/web/src/components/trade/` |
| `trade-market-mock.ts` | `apps/web/src/lib/trade-market-mock.ts` |
| `ImportedTradePage` | `presentation-import/pages/trade-page.tsx` + thin route |

Engine wire (`useTrading`) = **paste 후 별도 태스크** · explicit operator approval.

---

*P2 · 12-O v1 정본 · 2026-06-15*
