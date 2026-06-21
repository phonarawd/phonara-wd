# Trade UI 재설계 방향 LOCK (DRAFT)

> **상태:** DRAFT — operator APPROVE 전  
> **Phase:** 1단계 (조사 + LOCK + `MarketTickerBar` 파일럿만)  
> **정본 CEX grid/testId:** [`TRADE_TERMINAL_CEX_SPEC.md`](TRADE_TERMINAL_CEX_SPEC.md) — grid·testId 유지, visual direction만 본 LOCK이 우선

---

## 1. Scope

| 허용 (1단계) | 금지 |
|--------------|------|
| 현황 조사 보고 | 전체 `/trade` 일괄 재설계 |
| 본 LOCK draft | `FuturesOrderTicketForm` / wire / hook 변경 |
| `MarketTickerBar` presentation-only 재구성 | 엔진·SQL·domain·RPC touch |
| `trade-terminal.css` ticker 보조 클래스 | E2E testId 변경 |
| i18n 키 **추가** (`trade.ticker.advanced*`) | 기존 i18n 키 rename/delete |

---

## 2. 현황 조사 (실측 · 2026-06-21)

### 2.1 Active `/trade` 마운트 트리

```
/trade (routes/trade.tsx)
  → TradeLovableSurface (presentation-import/trading/trade-lovable-surface.tsx)
    → PresentationRoot
      → ImportedTradePage (AppShell density="trade")
        → TradeModeShell (components/trade/TradeModeShell.tsx L1–147)
          → TradeTerminalShell
            → FuturesTerminal | SpotTerminal | StakingDiscoverGrid
```

**Legacy 미마운트 (1단계 touch 금지·삭제 금지):** `TradeHub`, `MobileTradeView`, `TradeEngineBody`, `futures-panel.tsx`, `spot-panel.tsx`.

### 2.2 컴포넌트 인벤토리 (active path)

| 구역 | 컴포넌트 | 파일 | 핵심 라인 |
|------|----------|------|-----------|
| 마켓 헤더/티커 | `MarketTickerBar` | `apps/web/src/components/trade/terminal/shared/MarketTickerBar.tsx` | L5–28 props, L91–104 Last/Mark |
| 주문 패널 | `FuturesOrderTicketForm` | `apps/web/src/features/trading/order-ticket/FuturesOrderTicketForm.tsx` | L72–80 balance gate, L113–117 cross, L239–260 busy |
| | `FuturesOrderTicket` | `apps/web/src/components/trade/terminal/futures/FuturesOrderTicket.tsx` | L78–109 confirm |
| | `SpotOrderTicket` | `apps/web/src/components/trade/terminal/spot/SpotOrderTicket.tsx` | L77–115 confirm |
| 레버리지/마진 | `LeverageControl`, `MarginModeSegment` | `apps/web/src/features/trading/order-ticket/` | cross L20–24 |
| 차트 | `ChartPanel` → `ExchangeLiveChart` | `terminal/shared/ChartPanel.tsx`, `display-chart/exchange-live-chart.tsx` | |
| 호가 | `OrderBookPanel` | `terminal/shared/OrderBookPanel.tsx` | |
| 포지션 | `LovableFuturesPositionsCard` | `features/trading/lovable-wire/lovable-futures-positions-card.tsx` | L109–144 liq, L180+ confirm |
| 하단 dock | `TradeBottomDock` | `terminal/shared/TradeBottomDock.tsx` | |
| 레이아웃 CSS | `trade-terminal.css` | `terminal/tokens/trade-terminal.css` | ticker L97–106 |

Desktop wiring: `FuturesDesktopGrid.tsx` L14–41.

### 2.3 디자인 토큰

| 레이어 | 경로 | Trade 사용 |
|--------|------|------------|
| Lovable `[data-density="trade"]` | `presentation-import/styles/lovable-globals.css` L206–214 | **Primary** |
| Tailwind bridge | `lovable-theme-inline.css` | `bg-background`, `text-(--color-up/down)` |
| PHONARA `@theme` | `theme.css` L58–290 | `--surface-trade-*` 정의만, trade TSX 미사용 |
| Terminal scope | `trade-terminal.css` | `--tt-font-*`, `--tt-price-hero`, `.trade-terminal__ticker` |
| Legacy | `styles.css` ~1415 lines | orphan `.trade-ia-header`; 전 페이지 로드 |

**강점:** CEX seamless grid, up/down 일관, tabular-nums, z-index contract.  
**약점:** 이중 토큰 네임스페이스, ad-hoc `text-[10px]`, trade에 `prefers-reduced-motion` 0건, `.surface-trade` 미와이어, 파일럿 전 hex 1건 (`MarketTickerBar` L59 `#F7931A`).

### 2.4 안전 로직 보존 대상

| 항목 | UI | 데이터 출처 (touch 금지) |
|------|-----|-------------------------|
| Last vs Mark | `MarketTickerBar`; `useFuturesTerminalWire.ts` L214–217 | `use-trade-page-controller.ts` L104–116 |
| 청산가 | `OrderTicketSummary`, `LovableFuturesPositionsCard` | `preview.liquidationPrice`, `pos.liquidation_price` |
| cross_margin | `MarginModeSegment` L20–24 | `crossMarginEnabled` launch flag |
| Funding | `MarketTickerBar`; wire L218–224 | `useFundingRate` |
| 잔액 gate | `FuturesOrderTicketForm` L72–80, L247 | `avail` vs margin + fee |
| 이중제출 | form busy; `ConfirmDialog` | `use-trading.ts` idempotency |

---

## 3. 디자인 원칙

**하이브리드:** Hyperliquid-style **미니멀 골격** + Binance-style **펼치면 나오는 정보 밀도**.

- **Earn-first 퍼널:** Earn(황금지구·생존신고) 유입 일반인 → 트레이드 전환. 기본 화면은 깔끔·안 무섭게(초보).
- **프로 만족:** Mark·24h·Funding·OI·레버리지 세부는 Advanced 접이 또는 후속 패널 단계에서 노출.
- **30년 내구:** 화려함보다 절제·일관성·토큰 기반.

---

## 4. 디자인 토큰 체계

### 4.1 재사용 (변경 없음)

- `--tt-font-xs`, `--tt-font-sm`, `--tt-price-hero` (`trade-terminal.css`)
- `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`
- `text-(--color-up)`, `text-(--color-down)`, `bg-(--color-surface-elev)`

### 4.2 신규 (operator 확인)

| 토큰 | 용도 | 1단계 파일럿 |
|------|------|--------------|
| `--color-asset-btc` (안 A) | BTC base badge | **미적용** — LOCK에만 기록 |
| `--color-warn` (안 B) | BTC badge 대체 | **적용** — hex 제거 |

**금지:** TSX/JSX 내 임의 `#hex` / `rgb()` literal.

### 4.3 다크 기본

기존 Lovable dark `:root` 유지. 별도 light trade skin 1단계 범위 밖.

---

## 5. 정보 밀도 전략 (operator 확정)

| 기본 행 (always visible) | Advanced 접이 (default collapsed) |
|--------------------------|-----------------------------------|
| 페어 선택, base badge, perp chip | Mark (`trade.oracleSettlementPrice`) |
| Last price 히어로 (`--tt-price-hero`) | 24h change / high / low / vol |
| Favorite (placeholder) | Funding, Open Interest |
| `trailing` slot (rules badge 등) | — |

PC·모바일 **동일:** Advanced default **collapsed**, 토글로 expand.

---

## 6. PC vs 모바일 반응형

- Sticky ticker 유지: `.trade-terminal__ticker` + `sticky top-0 z-20`
- Advanced toggle: `min-height: 44px` (touch target)
- Mobile `pairLabel` footer 유지 (`lg:hidden`)
- Grid breakpoint 1024px — `TRADE_TERMINAL_CEX_SPEC` grid 변경 없음

---

## 7. 접근성

- Semantic color tokens (대비 Lovable dark baseline)
- Market `<select>`: `sr-only` label + `id="trade-terminal-market"` 유지
- Advanced toggle: `aria-expanded`, `aria-controls="trade-ticker-advanced-panel"`
- Collapsed panel: `hidden` attribute (스크린리더·DOM 일치)
- Mark `PriceBlock`: `title={trade.chart.oracleLineDescription}` 유지
- `@media (prefers-reduced-motion: reduce)`: advanced panel transition none

---

## 8. 안전 보존 계약

1. `MarketTickerBarProps` interface **변경 없음**
2. Last/Mark **라벨 i18n 키·props 값** 동일 — DOM 재배치만
3. `markPriceUnavailable` → muted tone + opacity semantics 유지
4. Wire 파일 diff 0: `FuturesDesktopGrid`, `FuturesMobileTerminal`, `SpotTerminal`, `TradeFuturesDisplayFallback`
5. `useFuturesTerminalWire`, `use-trading`, domain, supabase diff 0

---

## 9. 재설계 순서 (2단계+, APPROVE 후)

1. **MarketTickerBar** (파일럿 — 본 Phase)
2. `FuturesOrderTicketForm` shell (order ticket)
3. `OrderBookPanel`
4. `TradeBottomDock` + `LovableFuturesPositionsCard`
5. `ChartPanel` chrome
6. `MobileTradeCTA` + `FuturesOrderSheet`
7. `TradeModeShell` chrome
8. `SpotOrderTicket`

---

## 10. FAIL 조건

| ID | FAIL = |
|----|--------|
| F1 | Last/Mark 데이터 출처·props·i18n 키 변경 |
| F2 | `useFuturesTerminalWire` / `use-trading` / domain / supabase diff |
| F3 | TSX hex literal 잔존 |
| F4 | E2E testId 변경 (`trade-mode-*`, `futures-open` 등) |
| F5 | Advanced collapsed 시 Mark 라벨이 primary row에 노출 (밀도 경계 위반) |
| F6 | 전체 터미널 grid/layout 1단계에서 변경 |

---

## 11. LOCK Footer

- **#1** 파일럿 = `MarketTickerBar` only  
- **#2** 밀도 = Last 히어로 + Advanced 접이 (PC/mobile 동일 collapsed default)  
- **#3** BTC badge = `--color-warn` (안 B); `--color-asset-btc`는 2단계 operator GO 시  
- **#4** Props/wire/engine 0-touch  
- **#5** 신규 i18n: `trade.ticker.advanced`, `trade.ticker.advancedHide`

---

## 12. §GREEN self-check (파일럿 merge 후)

```bash
rg "MarketTickerBarProps|lastPriceDisplay|markPriceDisplay" apps/web/src/components/trade/terminal/shared/MarketTickerBar.tsx
rg "#F7931A|#f7931a" apps/web/src/components/trade/terminal/
rg "useFuturesTerminalWire|use-trading" --glob "*.tsx" apps/web/src/components/trade/terminal/shared/MarketTickerBar.tsx
rg "trade\.ticker\.advanced" packages/i18n/src/locales/
bun run typecheck
bun run test -- apps/web/src/components/trade/terminal/shared/__tests__/MarketTickerBar.test.tsx
bun run check:i18n
git diff --name-only | rg "domain/|supabase/|use-trading|useFuturesTerminalWire" && echo FAIL || echo engine-0-touch-OK
```

**§GREEN template:**

```
Phase 1 Trade UI pilot: MarketTickerBar hybrid layout
LOCK: docs/TRADE_UI_REDESIGN_DIRECTION_LOCK.md DRAFT
Pilot: Last hero + Advanced collapse; safety props unchanged
Gates: typecheck OK · vitest OK · check:i18n OK · engine diff 0
Operator: APPROVE / REVISE
```

---

## 13. Defer

- 전체 order ticket / orderbook / dock 재디자인 → 2단계+
- `--color-asset-btc` 토큰 추가 → operator 2안 선택 후
- E2E visual regression → APPROVE 후 optional
- Legacy 미마운트 컴포넌트 정리 → 별도 slice
