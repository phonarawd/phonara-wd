# 트레이딩 페이지 전수조사 — 엔진·UI 역설계 감사 보고서

> **감사일:** 2026-07-08 · **방법:** READ-ONLY 정적 코드 읽기만 (파일 수정 0 · 테스트 실행 0 · heavy gate 실행 0 — G13 준수)
> **판정 태그:** `구현됨` / `부분구현` / `미구현` / `확인불가(UNVERIFIED)` — 근거 없는 추측 판정 없음 (`30-audit-discipline`)
> **범위:** `/trade` · `/trade/futures` · `/trade/positions` · `/trade/orders` · `/staking` · `/staking/positions` 및 하부 엔진·계약·SQL 전 계층

---

## 목차

1. [Executive Summary (심각도 상/중/하)](#1-executive-summary)
2. [STEP 1 — 엔진 레이어](#2-step-1--엔진-레이어)
   - 2.1 가격/시세 파이프라인 · 2.2 오더북 · 2.3 포지션/PnL · 2.4 리스크 엔진 · 2.5 기준통화 환산(KRW hint) · 2.6 마이그레이션·SQL 테스트
3. [STEP 2 — 데이터 계약](#3-step-2--데이터-계약)
4. [STEP 3 — UI 레이어](#4-step-3--ui-레이어)
5. [STEP 4 — Binance/Bybit/OKX 갭 분석](#5-step-4--binancebybitokx-갭-분석)
6. [문서-코드 불일치 목록 (⚠️)](#6-문서-코드-불일치-목록)
7. [UNVERIFIED 목록](#7-unverified-목록)
8. [부록 A — 조사 파일 전체 경로 목록](#8-부록-a--조사-파일-전체-경로-목록)

---

## 1. Executive Summary

전체 판정: 트레이딩 데스크는 **엔진(SQL 정본) · 돈 안전(Decimal · Σ=0 · display-only 경계) · UI 조립(단일 마운트 · 반응형 · 토큰)** 측면에서 견고하게 구현되어 있다. 반면 **외부 거래소 피드의 장애 내성**(worker WS 무재연결 · heartbeat 부재)과 **계약/상태 문서의 stale 표기**가 주요 결함이다. 돈 경로 float 사용은 **0건**, page root 레이아웃 금지 패턴 위반 **0건**, JSX 인라인 hex 위반 **0건**.

### 심각도 상 (사용자 체감 · 데이터 무결성)

| #   | 발견                                                                                                                                                     | 근거                                                                                                                      | 영향                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| H-1 | **worker WS 무재연결** — 오더북/24h 티커 WS(`market-data.worker.ts`)에 `onclose`/`onerror`/재연결 로직이 전혀 없음. 두 WS 모두 `onmessage`만 설정        | `apps/web/src/workers/market-data.worker.ts:134-135, 172-173` (파일 전체 1–218에 reconnect 0건)                           | 끊기면 오더북·24h 통계가 **마지막 스냅샷에서 조용히 멈춤** — stale 라이브북이 신선한 것처럼 계속 표시 |
| H-2 | **WS heartbeat/ping 미구현** — worker와 kline 훅 모두 ping/pong·keepalive 없음. Bybit v5는 `op: 'ping'` 요구 — 유휴 끊김 위험                            | `market-data.worker.ts:1-218` · `features/trading/display-chart/use-display-kline.ts:1-479` (`:337-342` subscribe만 전송) | Bybit 폴백 상태에서 유휴 연결이 서버 측에서 끊길 수 있음 — H-1과 결합 시 무감지                       |
| H-3 | **거래소 피드 자체의 stale 감지 미구현** — oracle(내부 가격)에는 stale/freeze 게이트가 있으나(§2.1) 외부 거래소 표시 피드에는 마지막 수신 시각 검사 없음 | freeze 게이트는 oracle 전용: `hooks/use-trading.ts:478-500` · 외부 피드 검사 부재 (grep 0건)                              | H-1/H-2의 감지 수단 부재 — 표시 피드 신뢰성                                                           |

### 심각도 중 (일관성 · 계약 드리프트)

| #   | 발견                                                                                                                                                                                                            | 근거                                                                                                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-1 | **⚠️ 계약↔코드 불일치 — 포지션 TP/SL 편집**: 계약 2곳이 `built_hidden · RPC missing`으로 표기하지만 RPC(`rpc_update_futures_position_sltp`) + UI 편집 다이얼로그 + SQL 테스트까지 전부 **live**                 | 계약: `domain/trade-exchange-parity-display-contract.ts:986-992` · `domain/trade-order-states-display-contract.ts:332` ↔ 코드: `supabase/migrations/20260721000007_trade_t2_futures_completion.sql:205` · `hooks/use-trading.ts:1278` · `product/surfaces/trade/futures-positions-panel.tsx:335, 358-399` |
| M-2 | **⚠️ 문서 stale — E21 backlog**: `docs/CURRENT_STATUS.md:318` (`ew-e21-engine-position-tpsl-amend` pending) · `:320` (`ew-e21-engine-spot-limit-stop` pending) — 두 항목 모두 코드상 live                       | `hooks/use-trading.ts:1278, 1475, 1509` · `product/surfaces/trade/spot-order-ticket.tsx:178-188`                                                                                                                                                                                                          |
| M-3 | **⚠️ 문서 상호 불일치**: `docs/CURRENT_STATUS.md:359` NEXT = `p10-page-sports (#168)` ↔ `docs/SSOT/ACTIVE_WORK_SSOT.md:11` — `p10-page-sports` **`[x]` 완료** · 첫 pending = `p10-sports-fiat-hint-wire (#169)` | 두 파일 실측 (플랜 사전 발견 후보 확정)                                                                                                                                                                                                                                                                   |
| M-4 | **같은 화면 데이터 소스 혼재**: spot 데스크 오더북·24h 통계 = Binance **선물**(`fapi`/`fstream`) ↔ 차트 kline = Binance **현물**(`api`/`stream`) — 문서화 없음                                                  | 선물: `market-data.worker.ts:97, 118-119, 134, 172` ↔ 현물: `use-display-kline.ts:140, 291` (Bybit 폴백도 spot: `:113, 332`)                                                                                                                                                                              |
| M-5 | **kline 재연결 부분구현**: 고정 3초 타이머 + Binance→Bybit **단방향** 전환만 — 지수 backoff·jitter·Binance 복귀 로직 없음                                                                                       | `use-display-kline.ts:271-277` (고정 3000ms) · `:279-287` (단방향 전환) · `provider = 'binance'` 재할당 파일 전체 0건                                                                                                                                                                                     |
| M-6 | **RPC/WS 응답 런타임 검증 없음**: 트레이딩 RPC 22종 응답 전부 `as` cast — zod는 `lib/env.ts` 1곳뿐. typed `callRpc` 진입점도 트레이딩은 우회                                                                    | `hooks/use-trading.ts:345, 365` 등 (§3.1 표) · WS도 `JSON.parse as T` cast (`use-display-kline.ts:303, 349`)                                                                                                                                                                                              |
| M-7 | **깨진 authority 참조**: 계약 헤더들이 인용하는 `docs/SSOT/REBUILD_ENGINE_SSOT.md`가 디스크에 존재하지 않음 (Glob 0건)                                                                                          | 인용 예: `domain/margin-position-mode-display-contract.ts:7`                                                                                                                                                                                                                                              |

### 심각도 하 (부채 · 명칭 정직성)

| #   | 발견                                                                                                                                           | 근거                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| L-1 | candle 타입 3중 정의 (string OHLC 2종 + number OHLC 1종) · `TradeDeskKind` 2중 · `MarginMode` 2~3중 · `Ticker24hSnapshot`/`Ticker24hView` 중복 | §3.4                                                                                            |
| L-2 | `contracts/controller-view-freeze.ts` — 정의만 있고 import 0건 (죽은 계약 장치)                                                                | `apps/web/src/contracts/controller-view-freeze.ts:1-9`                                          |
| L-3 | reduce-only `mitigatedBy: 'built_hidden'` 표기 — 실제 built된 코드 0건 (명칭 과대 · 사용자 노출 위험은 없음)                                   | `trade-exchange-parity-display-contract.ts:979-984` ↔ grep `reduce_only\|reduceOnly` UI/RPC 0건 |
| L-4 | 체결 이력 테이블 행 수 캡/페이지네이션 없음 (오더북 12행 · tape 16행 캡과 대조) — 상류 fetch limit은 UNVERIFIED                                | `product/surfaces/trade/trade-fills-history-panel.tsx:89`                                       |
| L-5 | 리스트 가상화 미구현 — 설계상 행 수 캡으로 대체 (현재 규모에서 문제 없음)                                                                      | §4.2                                                                                            |
| L-6 | ~~플랜 문서의 "trade 73파일"~~ → 정본 **67파일** (구현 41 + 테스트 26)                                                                         | Glob 실측 · Phase A D-7 정직화                                                                  |

### 잘 지켜지고 있는 것 (감사 확인)

- **돈 경로 float 0건** — 오더북 수학·fiat 환산·엔진 미리보기 전부 Decimal (`@phonara/money`)
- **Σ=0 정산** — `_settle_futures_position` 4-leg 분해(user·fee·insurance·dust) + idempotency + hash-chain + pg_cron 청산/SL-TP/펀딩 실배선
- **display-only 경계** — fiat hint · 차트 피드 · synthetic book 모두 "정산 입력 금지" 계약 + leak grep gate + 정적 단언 테스트
- **WS/worker 단일 마운트 (A2)** — 모듈 싱글턴 worker + refcount + rAF 배칭 2중, docs 4곳 + 테스트 3곳 교차 확인
- **레이아웃 금지 패턴 위반 0건** — page root 390px 캡 없음 · `overflow-x-auto`는 table wrapper 내부만 · JSX 인라인 hex 0건

---

## 2. STEP 1 — 엔진 레이어

### 2.1 가격/시세 파이프라인 — 판정: **부분구현** (핵심 경로 구현 · 장애 내성 갭)

#### 차트 kline WS — 구현됨

- 훅: `apps/web/src/features/trading/display-chart/use-display-kline.ts` — symbol+interval당 WS 1개를 refcount로 공유 (`:440-448, 455-478` — "One WebSocket per symbol+interval — shared across chart and header hooks")
- Binance spot 스트림 `wss://stream.binance.com:9443/ws/<sym>@kline_<interval>` (`:291`) · REST 히스토리 `api.binance.com/api/v3/klines` (`:140`)
- Binance 실패 시 Bybit 폴백: `onWsFailed`에서 `provider === 'binance' → 'bybit'` (`:279-287`), Bybit spot `wss://stream.bybit.com/v5/public/spot` (`:332`)
- 메시지 타입: `BinanceKlineMsg` (`:16-26`) · `BybitKlineMsg` (`:28-38`) — 수신은 `JSON.parse as T` cast + try/catch (`:303, 314-316, 349, 360-362`)

#### 재연결 — 부분구현

- `scheduleReconnect` = `window.setTimeout(connect, 3000)` **고정** (`:271-277`) — 시도 카운터·지수 증가·jitter 없음
- Binance→Bybit **단방향**: `provider = 'binance'` 재할당이 파일 전체에 없음 — 한번 Bybit로 넘어가면 복귀 불가 (`:209` 초기화 · `:282` 전환)

**heartbeat — 미구현** (H-2)

- worker + kline 훅 양쪽 모두 ping/pong/keepalive `setInterval` 0건. Bybit WS에는 `op: 'subscribe'`만 전송 (`use-display-kline.ts:337-342`)

#### oracle 캔들 폴백 — 구현됨

- 클라이언트: `useCandles` → `supabase.rpc('rpc_get_candles', { p_symbol, p_interval, p_limit: 200 })` · `refetchInterval: 30_000` (`apps/web/src/hooks/use-trading.ts:335-354`)
- SQL 최종 정의: `supabase/migrations/20260721000005_trade_t0d_candles_display_safety.sql:33-188` — `price_ticks` 버킷 집계 CTE (`:103-113`) + oracle forward-fill (`:96-100, 148-168`) · `REVOKE FROM PUBLIC, anon` + `GRANT TO authenticated, service_role` (`:190-191`) · 헤더 주석 "output must never feed settlement" (`:8`)
- 이전 세대 2건(`20260609000040_stage2_candles.sql` · `20260609000044_zero_defect_sql_hardening.sql`)을 재정의 — timestamp상 20260721000005가 최후. candles 테이블은 없고 집계 함수만 (미구현 아님 — 의도된 설계)
- 라이브 스트림과 oracle 폴백 병합: `display-chart/use-exchange-live-candles.ts:26-38`

#### oracle stale/freeze/realtime 게이트 — 구현됨

- 계약: `domain/trade-market-status-display-contract.ts:23-24, 44, 79-92` — 배너 우선순위 "kill → circuit → disconnect → freeze → stale"
- freeze 임계 `TRADE_ORACLE_PRICE_FREEZE_SECONDS = 60` (`domain/trade-desk-failure-recovery-display-contract.ts:23`) · `resolveOraclePriceFrozen`은 `oracleStale`이면 false를 반환해 freeze(가격 무변동)와 stale(수신 지연)을 구분 (`:168-174`)
- 적용: `hooks/use-trading.ts:478-500` (`staleSymbols` · `isPriceFrozen`) → `:1071` `tradeDisabled: priceStale || priceFrozen || realtimeDisconnected` → `use-spot-desk-wire.ts:171-181` `resolveTradeDeskSubmitGate`
- realtime 끊김 원천: zustand `stores/realtime.ts:18` `useRealtimeConnectionStore`

**외부 피드 stale 감지 — 미구현** (H-3): oracle에만 있고 거래소 표시 피드(worker WS · kline WS)에는 마지막 수신 시각 검사 없음.

#### 표시 전용 경계 — 구현됨

- `display-chart/display-feed-contract.ts:5` `DISPLAY_ONLY_FEED = true as const` · `:12-18` `ORACLE_DISPLAY_INTERVALS` · `:21-28` `TradingChartCandle` · 헤더 "Never pass these values to settlement, order, or PnL RPCs (ADR-0002 · rule 30/90)" (`:1-4`)

### 2.2 오더북 — 판정: **구현됨**

#### `rpc_get_synthetic_book` — 결정적 생성 (랜덤 0건)

- 정의: `supabase/migrations/20260609000041_stage2_synthetic_orderbook.sql:21-91` — oracle mid 조회 (`:44-49`, 없으면 `no_price` RAISE) → config 기반 bps 스프레드/레벨 (`synthetic_book_spread_bps`=8 · `level_step_bps`=6 · `base_size`=100 · `depth_levels`=10, `:57-65`, 시드 `:10-19`) → 레벨 루프 `v_price := v_mid * (1 ± ((spread + i*step)/10000))` (`:67-81`)
- `random()` grep 0건 — 완전 결정적. anon GRANT는 `20260630000001_synthetic_book_anon_grant.sql` (display-only 공시 하)

#### 렌더 패널 — 구현됨

- `product/surfaces/trade/spot-order-book-panel.tsx`는 props 수신 presentational (`:27-47`). 데이터 공급은 wire: live worker book 우선 → 비면 `rpc_get_synthetic_book` reference 폴백 (`features/trading/use-spot-desk-wire.ts:145-168` · RPC 폴링 30초 `hooks/use-trading.ts:356-375`)
- 그루핑: `resolveBookGroupingSteps(pricePrecision)` + Select UI (`spot-order-book-panel.tsx:48-56, 101-116`) · 가시 12행 슬라이스 (`:62-66`, `BOOK_VISIBLE_ROW_LIMIT = 12` — `features/trading/order-book-display.ts:7`)

#### Decimal 수학 — 구현됨 (돈 경로 float 0건)

- `features/trading/order-book-display.ts:2` `import { toDecimal } from '@phonara/money'` — 수량 파싱 (`:40-48`) · 누적 depth `cumulative.plus()` (`:98-117`) · 스프레드 `bestAsk.minus(bestBid)` · `div(mid).mul(100)` (`:167-195`) 전부 Decimal. 유일한 `toNumber()`는 depth bar width % 표시 전용 (`:59-66`)

#### 선물 오더북 — spot 패널 재사용 (parallel 파일 0)

- `futures-desk-page.tsx:46` import + `:234, 297, 368` 사용 — extend-only registry(`trade-exchange-parity-display-contract.ts:763-767` "futures-order-book-panel.tsx 생성 금지")와 일치

### 2.3 포지션/PnL — 판정: **구현됨**

#### TS 엔진 (`packages/trading-engine`) — Decimal 미리보기 전용

- apps에서 `@phonara/trading-engine` import는 정확히 3개 파일: `features/trading/order-ticket/order-ticket-display.ts:1-5` (`computeSpotBuy/Sell/MajorSpotBuy` — spot 미리보기) · `hooks/use-trading.ts:14` (`computeOpenPosition` — open 미리보기) · `features/trading/order-ticket/compute-position-display-metrics.ts:2` (`computePnl` — 표시 전용)
- 즉 UI는 엔진 값을 **미리보기/표시**로만 쓰고 정산은 전부 SQL — `90-ui-ux-presentation` 경계 준수

#### SQL 정산 정본 — Σ=0 4-leg 분해

- `_settle_futures_position`: user·fee·insurance·dust 4-leg 분해로 Σ=0 보장 + two-tick liquidation buffer (`supabase/migrations/20260611000071_two_tick_liquidation_buffer.sql` 전체)
- 스키마: `futures_positions` (`20260609000006_phase3_trading_schema.sql:71-96` — `entry_price` · `liquidation_price` · SL/TP · `margin_currency` CHECK PHON/USDT) · `position_ledger` append-only (no_update/no_delete RULE, `:110-128`) · `spot_trades` append-only (`:132-153`)
- 진입가: `rpc_open_futures_position`이 `oracle_prices`에서 `v_entry`를 읽어 `entry_price` + `position_ledger.price`에 스냅샷 (`20260609000007_phase3_trading_rpcs.sql:215-216, 238-249`) — "All trades snapshot this value" (`…000006:49`)
- idempotency: `20260609000021_p0_request_idempotency.sql` · hash-chain: `20260609000008_p0_hardening_schema.sql`

**미구현(의도된 설계)**: entry price 평균화 없음 — 1 open = 1 포지션 설계. cross-margin 실정산은 feature flag OFF (§5 참조).

#### 미배선(engine-only) 코드 — SQL 미러가 정본

| 미배선 TS export                                            | 실서비스 대체 SQL 경로                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `stop-trigger.ts` `isStopTriggered`                         | `_position_stop_triggered` + cron `trade-stop-orders` (`20260620000131_trade_e1_funding_sltp.sql:71-91, 244-248`) |
| `funding.ts` `computeFundingPayment`                        | `_compute_funding_payment` + `_apply_funding_for_market` (`20260721000007:18-33, 40-135`)                         |
| `staking.ts` 전체 3 함수                                    | `rpc_claim_staking_reward` / `rpc_unstake_phon` (`20260609000009:778-882`)                                        |
| `futures.ts` `isLiquidatable` · `computeCloseSettlement`    | `_settle_futures_position` + two-tick buffer (`20260611000071`)                                                   |
| `spot.ts` `isSpotLimitCrossed` · `isSpotStopEntryTriggered` | `_spot_order_limit_crossed` 계열 (spot open orders cron, `20260721000006:844-847`)                                |

이들은 엔진 내부 테스트 + `sql-parity.test.ts`만 소비 — 죽은 코드가 아니라 SQL parity 검증용이나, 문서화되지 않은 이중 구조임은 기록.

### 2.4 리스크 엔진 — 판정: **구현됨**

- **자동 청산**: pg_cron `rpc_run_liquidations` (`20260609000009_p0_auto_liquidation.sql` 전체 · cron runner `20260609000015_p0_liquidation_cron_runner.sql`) + two-tick buffer (`20260611000071`) — 실제 트리거됨. Edge Function `liquidation-worker`는 **미배포 · 의도적** — 원격 `list_edge_functions` 9종 ACTIVE 중 absent · repo 소스 삭제(`setup/MANUAL_TASKS.md:45`) · pg_cron `phonara_auto_liquidations` ACTIVE (Phase A UNVERIFIED-2 확정 2026-07-08)
- **마진 조정**: `rpc_adjust_isolated_margin` — 클라이언트 `hooks/use-trading.ts:1256` · 다이얼로그 `futures-positions-panel.tsx:344-467`
- **레버리지 캡**: `futures_markets.max_leverage TEXT DEFAULT '50'` (regex CHECK, `20260609000006:22-35`) — UI 슬라이더가 캡 소비 (`features/trading/order-ticket/leverage-control.tsx:50-93`)
- **서킷 브레이커/halt**: `market_circuit_breakers` (`is_halted` · `max_tick_pct` · `staleness_seconds`, `20260609000008:112-121`) — halt 시 `futures_markets.is_active`도 내림 (`:604-613`) · admin `rpc_admin_halt_market` + resume 감사 스냅샷 (`20260720000001_admin_halt_market_e2.sql` 전체)
- **펀딩**: SQL cron 배선 (`20260721000007:40-135`) · `feature_funding_enabled='true'` 설정 마이그레이션 존재 (`:199-201`) — **시드 0% · 정산 0건** — 원격 `funding_rates` 21행 전부 `rate=0` · `funding_payments` 0건 · cron `trade-funding-accrual` ACTIVE (Phase A UNVERIFIED-3 확정 2026-07-08)
- **SL/TP 트리거**: SQL cron `trade-stop-orders` (`20260620000131:244-248`)
- **min_notional · OI cap**: `20260611000064` · `20260609000020_p1_position_oi_caps.sql`
- **가격 신선도**: `_assert_price_fresh` (`20260609000008` — hardening)

### 2.5 기준통화 환산 (KRW hint 레이어) — 판정: **구현됨 · display-only 경계 준수**

- **경계 선언**: `domain/fiat-reference-display-contract.ts:83` `FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY = true` — 정산 통화는 PHON/USDT만 (`:90`), hint fiat KRW/USD/JPY/VND (`:95`), locale 기본 ko→KRW · en→OFF (`:108-112`)
- **변환**: `toFiatHint` — `toDecimal(amount).mul(toDecimal(rate))` · `ROUND_HALF_EVEN` (`:367-416, 340-342`) — float 0건
- **leak 방지 gate 내장**: `FIAT_SETTLEMENT_LEAK_PATTERNS` (`:252-261`) + grep 스캐너 (`domain/__tests__/fiat-reference-display-audit-lib.ts:4-46`) — RPC 인자로 fiat 유입 grep 0건
- **요율 3-tier fallback**: `features/money/fiat-reference-rates-lib.ts:246-260` — ① `exchange_rate_snapshots` active 최신/oracle → ② 최근 5건 median → ③ localStorage last-known-good(항상 stale 강제). PHON/KRW는 스냅샷 없으면 synthetic 합성(PHON/USDT × USDT/KRW, 6dp, `:99-104`)
- **훅**: `use-fiat-reference-rates.ts` — queryKey `['exchange-rate', base, quote, 'active']` (`:51-53`) · refetch trade 30s / earn·wallet 60s / casino 세션 고정 (`rates-lib.ts:324-338`) · 출처는 RPC가 아닌 테이블 direct select (`:56-109`)
- **trade hint**: `features/trading/trade-fiat-hint-display.ts:83-105` — 정산 통화만 eligible · oracle stale 시 `—` 표시 (`:62-75`) · "trade 데스크에서 KRW는 secondary hint 금지" 단언 (`domain/trade-fiat-hint-consistency-display-contract.ts:33-35`)
- **정밀도 SSOT**: `domain/currency-precision-display-contract.ts:45-74` (PHON 6dp · USDT 6dp · KRW 0dp) · `@phonara/money` DECIMALS sync assert (`:170-183`)
- **rate snapshot 규율**: KRW 입금 `rate_snapshot_id` + `expected_phon` (`20260609000051_krw_deposit_require_rate.sql:52-72`) · KRW 출금 FK + AML 로그 (`20260704000001:4-10, 80-92, 157-181`) · 거래는 oracle `entry_price` 스냅샷 방식 — fiat 미개입 정산이라 규칙("when applicable") 위반 아님
- **한계**: `markets.tick_size` 컬럼 미구현 — 가격 변동 제한은 circuit breaker `max_tick_pct`만

### 2.6 마이그레이션 · SQL 테스트 — 판정: **구현됨**

- trade 관련 마이그레이션 약 38건 확인 — 핵심 축: `20260609000006/7`(스키마·RPC) → `000008/9/15/20/21`(hardening·청산·OI·idempotency) → `000027`(멀티소스 oracle median) → `000038-42`(market metadata·candles·registry) → `20260620000128-140`(Tier-1 카탈로그 · spot RPC · E1 funding/SLTP · E2 open orders · E3 cross margin · launch gates) → `20260721000002-9`(T-wave: majors 시드 · PHON oracle cron · candles safety · spot open orders · T2 futures completion · T3 staking)
- SQL 테스트 (`supabase/tests/` — Glob 114개 파일): trade 관련만 추려도 `conservation_test` · `futures_parity_test` · `settlement_race_test` · `oi_cap_race_test` · `trade_sltp_trigger_test` · `trade_t2_futures_sltp_test` · `trade_t2_futures_cron_test` · `trade_funding_conservation_test` · `trade_t2_funding_settlement_test` · `trade_cross_margin_test` · `trade_open_orders_conservation_test` · `circuit_breaker_state_test` · `admin_halt_market_e2_test` · `liquidation_notify_e1_test` · `system_account_hash_chain_test` · `staking_conservation_test` — Σ=0 · hash-chain · race 커버

---

## 3. STEP 2 — 데이터 계약

### 3.1 RPC 계약 스키마 — 판정: **부분구현** (compile-time 촘촘 · 런타임 검증 부재)

- `apps/web/src/contracts/`에는 파일 **1개**(`controller-view-freeze.ts`)뿐이고 import 0건 — 죽은 장치 (L-2). 실질 계약 정본은 `hooks/use-trading.ts`(약 1,665줄 단일 허브) + `domain/*display-contract*.ts` + `packages/shared-types` 3분할
- typed 진입점 `lib/rpc.ts` `callRpc`(`:60-66` — `Database['public']['Functions']` 파생 + 에러코드 11종 변환)는 wallet/casino/RG만 사용 — **트레이딩은 raw `supabase.rpc` + `as` cast**

트레이딩 RPC 호출 전수 (전부 `hooks/use-trading.ts`, 응답 처리 = cast):

| RPC                          | 라인 | RPC                                | 라인        |
| ---------------------------- | ---- | ---------------------------------- | ----------- |
| `rpc_get_candles`            | 339  | `rpc_update_futures_position_sltp` | 1278        |
| `rpc_get_synthetic_book`     | 360  | `rpc_close_futures_position`       | 1297        |
| `rpc_cancel_spot_order`      | 757  | `rpc_record_consent`               | 1362        |
| `rpc_set_margin_mode`        | 865  | `rpc_spot_market_buy`              | 1406, 1419  |
| `rpc_cancel_order`           | 1095 | `rpc_spot_market_sell`             | 1437, 1455  |
| `rpc_open_futures_position`  | 1148 | `rpc_place_spot_limit_order`       | 1475        |
| `rpc_place_limit_order`      | 1180 | `rpc_place_spot_stop_order`        | 1509        |
| `rpc_place_stop_order`       | 1213 | `rpc_stake_phon` / `rpc_stake`     | 1603 / 1621 |
| `rpc_partial_close_futures`  | 1238 | `rpc_unstake_phon`                 | 1639        |
| `rpc_adjust_isolated_margin` | 1256 | `rpc_claim_staking_reward`         | 1651        |

- 별도: `rpc_get_earn_hub_status` (trade 티어 수수료 배지, `features/trading/use-trade-earn-vip-tier.ts:14`) — 이곳만 **수동 파서** `parseEarnHubTierSnapshot` (`domain/tier-me-display-contract.ts:75-89`)
- funding rate/payments는 RPC가 아닌 direct REST 테이블 fetch (`use-trading.ts:893, 933` — cast)
- 테이블 select 14종 + select 컬럼 문자열 정본 `packages/shared-types/src/supabase-row-selects.ts:44-54`
- zod는 `lib/env.ts:1` 단 1곳 — **RPC/테이블 응답 런타임 스키마 검증 미구현** (M-6). 부분 가드: `realFillBookFromRpcResult` (`use-trading.ts:68-94`) · fill row 매퍼 null 가드 (`:248-263, 663-677`)
- `rpc_run_open_order_fills`는 이름 상수만 존재 (`domain/trade-order-states-display-contract.ts:22`) — 호출 주체는 cron/서버 추정 (UNVERIFIED)

### 3.2 WebSocket 메시지 타입 — 판정: **부분구현**

- kline: `BinanceKlineMsg`/`BybitKlineMsg` 타입 존재 · 수신 cast + try/catch (§2.1)
- depth: worker 인라인 cast `{ u; U; b; a }` (`market-data.worker.ts:136-141`) — try/catch 없음 · ticker: cast 후 `parseTickerPayload`가 필드별 `String()` 방어 정규화 (`:64-77, 173-177`)
- 유일한 런타임 정합성 장치: depth **sequence-guard** — `createSequenceGuard`/`applyBookDelta` (`packages/market-display/src/sequence-guard.ts` · worker `:142-153`) — gap 시 REST re-seed
- book/level 공유 타입 정본: `packages/market-display/src/order-book-types.ts:2-27` (`PriceLevel` = Decimal 문자열 튜플)

### 3.3 상태관리 — 판정: **구현됨**

- 실측: **TanStack Query** `^5.101.0` + **zustand** `5.0.14` (`apps/web/package.json:29, 43`) — 단 zustand는 `stores/realtime.ts`(realtime disconnect) · `stores/notifications.ts` 2개뿐, 트레이딩 features에 0건
- 시장 실시간: `useSyncExternalStore` + 커스텀 스토어 — `TickerStore` (`features/trading/market-store/ticker-store.ts:27-76`) · `OrderBookStore` (`order-book-store.ts:19-73`) + Comlink worker
- queryKey 정본 레지스트리 `tradingKeys` 18키 (`hooks/use-trading.ts:98-117`): `['futures-markets']` · `['candles', symbol, interval]` · `['synthetic-book', symbol]` · `['futures-positions', userId]` · `['staking-pools']` · `['trading-open-orders', userId]` · `['funding-rate', market]` 등
- 공유키: `['exchange-rate', base, quote, 'active']` (빌더 `domain/fiat-reference-display-contract.ts:170-175` — wallet과 공유)
- 무효화: RPC 성공 시 `walletKeys.all` + open orders + fills invalidate (`use-trading.ts:745-750, 1084-1088, 1130-1134, 1395-1400`) · realtime INSERT 구독 invalidate (`:411-417, 724-729, 823-828, 1574-1579`) · 매트릭스 계약 `domain/trade-fill-realtime-display-contract.ts:22-37`
- 컨트롤러 계층: `use-trade-page-controller.ts` → `use-spot-desk-wire.ts:54` / `use-futures-desk-wire.ts:45` — 데스크 wire는 자체 queryKey 신규 생성 없음

### 3.4 타입 정의 파일 인벤토리 — 판정: **구현됨 (중복 부채 있음)**

- `domain/*display-contract*.ts` 총 **92개** (Glob) — trade/staking/fiat 계열 30+ (상세 목록·목적은 부록 조사 파일 참조; 대형: `trade-exchange-parity-display-contract.ts` 1,356줄)
- row 타입 실질 정본: `hooks/use-trading.ts` (`FuturesPosition`~`SpotOrderFill`, `:31-230, 635-646`)
- `features/trade/`(별도 폴더 3파일)는 first-visit 교육 오버레이만 — 데이터 계약 아님
- **중복 (L-1)**: ① candle 3중 — `TradingCandle`(`use-trading.ts:39-46`, string) vs `TradingChartCandle`(`display-feed-contract.ts:21-28`, string) vs `DisplayCandle`(`use-display-kline.ts:7-14`, **number**) ② `TradeDeskKind` 2중 (`trade-market-status-…:17` · `trade-submit-…:20`) ③ `MarginMode` 2~3중 (`trade-order-states-…:39` · `margin-position-mode-…:36` · `use-trading.ts:133` 인라인) ④ `Ticker24hSnapshot`/`Ticker24hView` (`market-data.worker.ts:7-16` · `ticker-store.ts:2-12`) ⑤ RPC 이름 상수 중복 (`trade-order-states-…:11,21` · `margin-position-mode-…:13,15`)

---

## 4. STEP 3 — UI 레이어

### 4.1 컴포넌트 트리 — 판정: **구현됨**

- 정본: `product/surfaces/trade` **67파일** (구현 41 + 테스트 26) + `staking` 5파일
- 라우팅: TanStack Router file-based (`router.ts:1-8` + `routeTree.gen`) — `/trade`(`routes/trade.tsx:6-18` → `SpotDeskPage`) · `/trade/futures` · `/trade/positions` · `/trade/orders` · `/staking` · `/staking/positions`, 전부 `beforeLoad` 세션 가드
- 셸: `routes/__root.tsx:30-36` → `AppShell` (`product/shell/appshell.tsx:79-98` — TopBar · DomainSubnav(trade subnav `:31-40`) · BottomNav + trade 전용 gate 2개: 교육 시트 `:94` · realtime 피드백 `:95`)

```text
SpotDeskPage (spot-desk-page.tsx:210)
├─ TradeDeskPageShell (@container · trade-desk-page-shell.tsx:15 + trade-desk-layout.css)
├─ MarketDataBridge — worker/WS 단일 마운트 · null 렌더 (spot-desk-page.tsx:267)
├─ SpotMarketHeader (memo, spot-market-header.tsx:110)
│  ├─ SpotMarketSelector (memo :80) · SpotMarkPrice (memo :42)
│  ├─ TradePriceDirTicker (memo · 틱 leaf 격리, trade-price-dir-ticker.tsx:51)
│  └─ TradeMarketTickerStatsWire (memo · store 구독 격리, :17)
├─ TradeMarketStatusBanner (kill/circuit/stale/freeze/disconnect 단일 마운트, :22)
├─ TradeDeskFetchErrorBanner (:17)
├─ [desktop lg+] 3열 grid (spot-desk-page.tsx:328-367)
│  ├─ SpotOrderBookPanel + TradeRecentTradesRail (side rail)
│  ├─ TradeChartPanel → lazy TradeChart (chart/trade-chart-panel.tsx:20-34)
│  │  └─ useLightweightChart(5 series) · useChartSeries(증분) · useChartPriceLines(oracle/청산가)
│  ├─ SpotOrderTicket
│  └─ TradeDeskBottomDock (positions|openOrders|history 탭, :150)
├─ [tablet 768–1023] TradeDeskTabletLayout (:39)
├─ [mobile <768] TradeDeskMobileTabs (chart|trade|positions|history 4탭 + 스와이프, :126)
│  └─ SpotMobileStickyCta (trade-desk-mobile-sticky-cta.tsx:18)
└─ FiatHintDisclaimer (조건부, :471)
```

- `FuturesDeskPage` (`futures-desk-page.tsx:88`): 동일 골격 + `FuturesMarketHeader`(funding rate 셀 `:122-142`) · `FuturesOrderTicket` · `FuturesPositionsPanel`(1,297줄 최대 파일) · 차트에 `liquidationPrice` 전달 (`:122-138`) · 오더북은 spot 패널 재사용
- Staking: `StakingHubPage` (`staking-hub-page.tsx:89` — 3-step wizard pool→amount→confirm `:293-542`) · `StakingPositionsPage`(active/unstaked 탭) · `StakingPositionsPanel`

### 4.2 렌더링 — 판정: **CSR 구현됨 · 가상화 미구현(캡 대체) · memo 구현됨 · Canvas 차트 구현됨**

- **CSR**: `main.tsx:14-24` `createRoot().render(<RouterProvider/>)` — SSR/hydrate 없음
- **가상화 미구현**: react-window/virtuoso/tanstack-virtual grep 0건. 오더북 plain `.map()` (`spot-order-book-panel.tsx:179`) + 12행 캡 · tape 16행 캡 (`trade-recent-trades-rail.tsx:15, 122`) · fills 테이블은 캡 없음 (`trade-fills-history-panel.tsx:89` — L-4)
- **memo 격리**: 헤더 분할 memo (spot 3개 · futures 5개) · 틱 leaf 격리("tick updates re-render this leaf only", `trade-price-dir-ticker.tsx:24-51`) · 티커 store 구독 격리 (`trade-market-ticker-stats-wire.tsx:16-17`) · 오더북 파생 계산 `useMemo` (`spot-order-book-panel.tsx:48-70`). `SpotOrderBookPanel` 자체는 memo 미적용 — wire에서 배열 안정화만 (`use-spot-desk-wire.ts:146-167`)
- **차트**: lightweight-charts v5 Canvas 2D (`chart/use-lightweight-chart.ts:2-3, 39-63` — 5 series) · lazy import (`trade-chart-panel.tsx:20-22`) · 증분 `series.update()` + `document.hidden` flush 지연 (`use-chart-series.ts:62-101`)
- **tape 데이터**: WS가 아닌 `price_ticks` 15s 폴링 + realtime INSERT invalidate (`use-trading.ts:387-417`) — "reference" 공시 상시 노출 (`trade-recent-trades-rail.tsx:78`)

### 4.3 WS/worker 단일 마운트 — 판정: **구현됨**

- `MarketDataBridge` 데스크당 1회 마운트 (`spot-desk-page.tsx:267` · `futures-desk-page.tsx:165`) — "Mount once per terminal surface" 주석 (`market-data-bridge.tsx:154`)
- 모듈 스코프 worker 싱글턴 (`market-data-bridge.tsx:16-18` + `ensureWorker` `:44-70`) · 심볼 refcount 구독 (`:20-21, 79-91`) · rAF 배칭 양단 (worker `:38-52` · main `:30-42`)
- kline WS symbol+interval당 1개 공유 refcount (`use-display-kline.ts:440-478`)
- zone owner 계약: `all-market-ws` zone "second bridge" 금지 (`trade-exchange-parity-display-contract.ts:731-738`)

### 4.4 반응형 — 판정: **구현됨 (금지 패턴 위반 0건)**

- viewport 훅: `features/trading/use-trade-desk-viewport.ts:69-100` — `useSyncExternalStore` + matchMedia 2개(768/1024). SOT 체인: `product/tokens/viewport-contract.ts:14-23` (320~2560) → `domain/trade-desk-layout-display-contract.ts:13-17` (mobile 390 · tablet 768 · desktop 1024) → `trade-mobile-layout-display-contract.ts:67-98` (`resolveTradeDeskLayoutTier`) — CSS/JS drift 방지 assert 3종 + 테스트
- 모바일: 4탭 `chart|trade|positions|history` + `order|book` 서브탭 + `chart↔trade` 스와이프 (`trade-mobile-layout-display-contract.ts:39-51` · 구현 `trade-desk-mobile-tabs.tsx:63-203`) · 터치 최소 44px (`trade-desk-layout.css:76-82`)
- @container: `.trade-desk-page` `container-name: trade-desk` (`trade-desk-layout.css:12-13`) + `min-width: 1024px` 쿼리 3곳 (`:25-30, 44-49, 55-65`). **2560 전용 쿼리는 없음** — `--ds-content-max`(1680px) 캡 + 1:2:1 grid로 처리 (`:9, 20-21` · `trade-ultra-layout-display-contract.ts:33-36`)
- **위반 0건**: page root `max-w-[390px]`/`w-[390px]` 매치 0 · `min-w-[5xx]`는 전부 `<table>` 요소 4곳 (`open-orders-panel.tsx:93` 등) · `overflow-x-auto`는 table wrapper 4곳 + staking 칩 스크롤러 1곳 — 전부 Card/table 내부, desktop에서 container query가 `visible` 복귀

### 4.5 테마 — 판정: **구현됨**

- 토큰: `product/tokens/colors.css:6-66` — 전 `--ds-*` 색 OKLCH + `light-dark()` 이중 정의 · market up/down 분리 (`:46-47`) · Tailwind v4 bridge `theme.css:38-126` (`--color-* = var(--ds-*)`)
- 스위치: `light|dark|system`, 기본 dark (`domain/settings-preferences-display-contract.ts:30-34`) — `documentElement.dataset.theme` 적용 (`:149-155` · 부트 `product/theme/theme-shell.tsx:6-12`)
- 차트: `chart/chart-theme.ts:42-71` — DOM probe로 `--ds-*` 5종을 computed rgb로 해석해 LWC 전달 · oklch→rgb Canvas 정규화 (`:20-39`) · rgb fallback 5건은 LWC 파싱 제약 명시 주석 하 (`:11-17`) — **JSX 인라인 hex 위반 0건** (trade+staking 전체 grep)
- tabular-nums: trade 20개 파일 + staking 11곳 적용 (`MoneyDisplay` primitive 내부 적용 여부만 UNVERIFIED)

---

## 5. STEP 4 — Binance/Bybit/OKX 갭 분석

### 5.1 Parity 계약 구조 (`domain/trade-exchange-parity-display-contract.ts` 1,356줄 전문 실측)

| 블록                                                  | 라인              | 내용                                                                                                                                                                          |
| ----------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TRADE_DUAL_CURRENCY_MATRIX`                          | 92–163            | USDT+PHON 이중통화 7행 (casino stake만 `no`)                                                                                                                                  |
| `TRADE_PLATFORM_SETTLEMENT_MODEL`                     | 186–259           | 전 행 `externalExchangeRouting: false` (타입 리터럴 `false` — "PHONARA never routes orders to external exchange matching", `:178-179`)                                        |
| `TRADE_REALTIME_MARKET_DATA_MATRIX`                   | 272–327           | 표시 전용 피드 6행 전부 `displayOnly: true`                                                                                                                                   |
| `TRADE_EXCHANGE_PARITY_MATRIX`                        | 342–651           | 28행 기능 매트릭스 — Tier `B`(의도 defer) 2행: reduce-only (`:531-540`) · hedge (`:553-562`), `N/A` 1행                                                                       |
| `TRADE_UI_ZONE_OWNERS` / `TRADE_EXTEND_ONLY_REGISTRY` | 666–748 / 757–803 | viewport×zone 단일 owner 9행 · parallel 파일 금지 9행                                                                                                                         |
| `TRADE_USER_COMPLAINT_RISKS`                          | 879–1089          | 컴플레인 리스크 25행 (`live`/`disabled+key`/`built_hidden`)                                                                                                                   |
| assert 함수군                                         | 1136–1355         | sibling 계약 3개와 hedge hidden · cross disabled · 통화 리스크 동기화를 런타임 예외로 강제 — `OKX_MARGIN_POSITION_PARITY_ACHIEVED` "must stay false until E21" (`:1200-1202`) |

### 5.2 계약↔코드 교차 검증 — 불일치 3건 (⚠️ §6 통합)

- **M1 — 포지션 TP/SL 편집** (최대): 계약 `built_hidden · RPC missing`(`:986-992` · `trade-order-states-…:332`) ↔ 코드 live — RPC `20260721000007:205`(GRANT `:281-282`) · 호출 `use-trading.ts:1278` · capability `trade-rpc-capabilities.ts:12-13` `positionTpSlEdit: true` · UI `futures-positions-panel.tsx:317, 335, 358-399, 469-477` · wiring `futures-desk-page.tsx:266, 323, 405` · SQL 테스트 `trade_t2_futures_sltp_test.sql:47`. 모순 고착: 테스트가 capability `true`와 wire `'built_hidden'`을 **동시 단언** (`domain/__tests__/trade-order-states-display-contract.test.ts:105-107`)
- **M2 — spot limit/stop 문서 drift**: parity 매트릭스 DONE(`:464-474`, 코드와 일치) ↔ `docs/CURRENT_STATUS.md:320` pending · i18n defer note "built_hidden until E21" (`trade-i18n-surface-display-contract.ts:200-208`) 구식
- **M3 — reduce-only `built_hidden` 명칭 과대** (`:979-984`): built된 UI/RPC 코드 0건 — capability `reduceOnlyOrders: false`만 존재

### 5.3 UX 갭 17항목 판정

| #   | 항목                                    | 판정                            | 근거                                                                                                                                                                                        |
| --- | --------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 호가창 가격 클릭 → 티켓 프리필          | 구현됨                          | `spot-order-book-panel.tsx:197-210` → `use-futures-desk-wire.ts:242-249` / `use-spot-desk-wire.ts:390-397` (limit 전환 + 가격 prefill + side)                                               |
| 2   | 진입 시 TP/SL                           | **부분구현**                    | `futures-order-ticket.tsx:382-417` — **market 주문일 때만** 노출 (limit/stop에 부착 불가) · RPC 파라미터 `use-trading.ts:1154-1155`                                                         |
| 3   | 포지션 TP/SL 편집                       | 구현됨 (계약 표기만 stale — M1) | §5.2                                                                                                                                                                                        |
| 4   | reduce-only                             | 의도된 미구현 (E21 defer)       | parity Tier B `ownerTodo: 'ew-e21-engine-reduce-only-orders'` (`:531-540`) · `trade-rpc-capabilities.ts:10-11`                                                                              |
| 5   | hedge / position mode                   | 의도된 미구현 (E21 defer)       | `margin-position-mode-display-contract.ts:27-30` "hedge/dual-side has no engine branch (plan A14 Q13)" · `:102-109` `engine: 'missing'` · one-way 고정 라벨 `position-mode-fixed-label.tsx` |
| 6   | spot limit + stop                       | 구현됨                          | `use-trading.ts:1475, 1509` · 4탭 티켓 `spot-order-ticket.tsx:178-188`                                                                                                                      |
| 7   | trailing stop                           | **진짜 갭 (defer 선언 0)**      | 코드·docs grep 0건                                                                                                                                                                          |
| 8   | post-only / IOC / FOK                   | **진짜 갭 (선언 0)**            | time-in-force 개념 자체 부재 — `FuturesOrderType` 4종뿐 (`trade-order-states-…:28`)                                                                                                         |
| 9   | iceberg                                 | **진짜 갭 (선언 0)**            | 코드·docs grep 0건                                                                                                                                                                          |
| 10  | cross margin                            | 의도된 미구현 (disabled+key)    | RPC 존재 `use-trading.ts:865` · flag 기본 OFF `20260620000140:17-18` + reject `:55-58` · 사유 키 `trade.margin.crossDisabled` · SQL 테스트 `trade_cross_margin_test.sql:64-87`              |
| 11  | 레버리지 슬라이더                       | 구현됨                          | `leverage-control.tsx:50-93` (Slider + preset chips + Max cap)                                                                                                                              |
| 12  | depth chart 시각화                      | **진짜 갭 (선언 0)**            | 행별 depth bar만 (`spot-order-book-panel.tsx:189-196`) — 별도 차트 0건                                                                                                                      |
| 13  | 실 WS trade tape                        | 의도된 설계 (선언 있음)         | 계약이 `feedSource: 'price_ticks reference rail'` 명시 (`:309-317`) · reference 공시 상시 노출                                                                                              |
| 14  | drawing tools / multi-chart / 추가 지표 | 부분 defer + **부분 진짜 갭**   | MA7/EMA21만 (`chart/compute-indicator-series.ts:11, 26`) · overlay copy Tier C defer (`trade-i18n-…:148-176`) · watchlist defer (`:178-183`) — **drawing tools·multi-chart는 선언 0건**     |
| 15  | price alerts                            | 부분구현                        | store `stores/notifications.ts:22-42, 201-212` + 알림 채널 설정 존재 — **데스크에 alert 생성 UI 0건**                                                                                       |
| 16  | 호가 정밀도 그루핑                      | 구현됨                          | `spot-order-book-panel.tsx:48-56, 101-116`                                                                                                                                                  |
| 17  | 펀딩 카운트다운                         | 의도된 미구현 (선언 있음)       | `funding-history-display-contract.ts:17-18` "no next_funding_at" + 부재 단언 테스트 (`__tests__/…:23`) — 헤더는 rate만 (`futures-market-header.tsx:122-142`)                                |

### 5.4 성능 parity

#### 오더북 업데이트 = worker diff-적용 + 프레임 상한 · 렌더는 가시 12행 슬라이스 재렌더 (full re-fetch 아님)

1. sequence guard + 델타 검증: `market-data.worker.ts:142-148` (`applyBookDelta`) — gap 시 REST re-seed (`:150-152, 95-113`)
2. 델타 병합: `mergeLevels` (`:79-93`) — Map에 델타만 반영
3. rAF 배칭 2중: worker `:38-57` → main `market-data-bridge.tsx:30-42` → `orderBookStore.setSnapshot` (`order-book-store.ts:53-62`)
4. 피드 우선순위: live WS book → 비면 `rpc_get_synthetic_book` reference (`use-spot-desk-wire.ts:145-168`)

**A2 WS 단일 마운트 remediation — 검증됨 (UNVERIFIED 아님)**: `docs/SSOT/TRADE_UX_CANON.md:45` ("A2 `[x]` chart WS 1×") · `docs/CURRENT_STATUS.md:215` (`p9-trade-audit-remediation-a2 [x] DONE 2026-07-06`) · `docs/PRODUCT/REBUILD_PLAN_v1.md:164` · `docs/SSOT/ACTIVE_WORK_SSOT.md:141` + 테스트 3곳 (`trade-layout-dedup-contract.test.ts:101` "A2 — no double WS" · `spot-desk-page.test.tsx:372` · `futures-desk-page.test.tsx:339`)

### 5.5 의도적 스코프 제외 (선언 근거)

| 제외                                        | 선언 위치                                                                                                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 내부 정산(house counterparty) · 외부 CLOB 0 | `trade-exchange-parity-display-contract.ts:178-186` · `docs/SSOT/TRADE_UX_CANON.md:26` ("외부 거래소 주문 라우팅 · CLOB 매칭 · API 연동 0") · `trade-synthetic-book-disclosure-display-contract.ts:3` ("Engine Wave CLOB defer") |
| synthetic/reference book 공시               | 상시 disclosure 2종 (`spot-order-book-panel.tsx:87-95`) · 티켓 confirm에 house-counterparty ack 강제 (`futures-order-ticket.tsx:501-509, 560`)                                                                                   |
| 외부 거래소 체결 카피 금지                  | `TRADE_UX_CANON.md:120` · complaint risk `external-exchange-copy` (`:1066-1072`) · catalog 정적 단언 `assertTradeI18nExternalCopyFree` (`trade-i18n-…:328-340`)                                                                  |
| 과장·확정수익 카피 금지 (광고법 등가)       | "advertising law" 직접 표현은 repo에 없음 — 등가 선언: `docs/SSOT/COPYWRITING_CANON.md:40` · `docs/SSOT/PRODUCT_PRINCIPLES.md:144-145` · `docs/SSOT/DESIGN_PRINCIPLES.md:182`                                                    |
| 차트/WS 가격의 정산 입력 금지               | `TRADE_UX_CANON.md:31-32, 121` · complaint risk `chart-price-settlement` (`:1042-1048`)                                                                                                                                          |

---

## 6. 문서-코드 불일치 목록

| ⚠️  | 불일치                                             | stale 측                           | 실제 측                                                                                       |
| --- | -------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| D-1 | ~~포지션 TP/SL 편집 `built_hidden · RPC missing`~~ | contract/doc                       | **`[x]`** `position_tpsl_edit` live · `rpc_update_futures_position_sltp` (Phase A 2026-07-08) |
| D-2 | ~~spot limit/stop pending~~                        | `CURRENT_STATUS` · i18n defer note | **`[x]`** live · parity DONE (Phase A 2026-07-08)                                             |
| D-3 | ~~NEXT 큐 상호 불일치~~                            | `CURRENT_STATUS.md:359`            | **`[x]`** `p10-sports-fiat-hint-wire (#169)` (Phase A 2026-07-08)                             |
| D-4 | ~~reduce-only `built_hidden` 명칭~~                | complaint/wire contract            | **`[x]`** `disabled` / `built_disabled` (Phase A 2026-07-08)                                  |
| D-5 | ~~깨진 authority 참조~~                            | domain contract headers            | **`[x]`** `ENGINE_APEX_CLOSEOUT` · `ENGINE_BOUNDARY` (Phase A 2026-07-08)                     |
| D-6 | ~~소스 혼재 미문서화~~                             | (선언 문서 없음)                   | **`[x]`** `display-feed-contract.ts` · `TRADE_UX_CANON.md` Layer B (Phase A 2026-07-08)       |
| D-7 | ~~플랜 "trade 73파일"~~                            | 감사 사전 조사치                   | **`[x]`** 정본 67파일 (구현 41 + 테스트 26)                                                   |

---

## 7. UNVERIFIED 목록

코드 정적 읽기만으로 확인 불가 — PASS/FAIL 판정하지 않음 (1~3은 Phase A 원격 READ-ONLY 조회로 **확정** · 2026-07-08):

1. ~~**원격 DB 적용 상태**~~ → **`[x]` 부분 parity (203/204)** — MCP `list_migrations` · project `yocjhjsdwoijfdrehzoq` · name 기준 203/204 일치 · **미적용 1건:** `trade_t0b_oracle_aal2_guard` (로컬 `20260721000009`) · 원격 `rpc_update_oracle_price`에 `_assert_admin_aal2` guard **없음** (해당 migration 미적용과 일치) · 핵심 trade RPC 3종(`rpc_update_futures_position_sltp` · `rpc_run_liquidations` · `_apply_funding_for_market`) **존재 확인** · 원격 duplicate name 1건: `p1b_admin_ops_visibility` (version 2회 — 로컬은 단일 파일)
2. ~~**Edge Function `liquidation-worker` 배포 여부**~~ → **`[x]` 미배포 · 의도적** — MCP `list_edge_functions`: ACTIVE 9종(price-feed · crypto-_· usdt-krw-feed · notification-dispatch · pg-bank-webhook · ops-notify) · **`liquidation-worker` absent** · repo `supabase/functions/liquidation-worker` **삭제됨** (`setup/MANUAL_TASKS.md:45` S1 스케줄러 일원화) · pg_cron `phonara_auto_liquidations` `_ \* \* \* \*`ACTIVE →`\_run_liquidations_logged()`
3. ~~**`funding_rates.rate` 실데이터 값**~~ → **`[x]` 시드 0% · 정산 0건** — MCP `execute_sql`: `funding_rates` **21행** · `rate` non-zero **0** · `updated_at` 일괄 `2026-07-07 17:05:00+00` · `funding_payments` **0건** · pg_cron `trade-funding-accrual` `5 * * * *` ACTIVE → `rpc_run_funding_accrual()` · UI 표시용 rate는 0% 고정 시드
4. **`rpc_run_open_order_fills` 호출 주체** — 이름 상수만 존재 (`trade-order-states-display-contract.ts:22`) · cron/서버 경로 추정
5. **fills 테이블 상류 fetch limit** — 패널에 캡 없음 · 쿼리 limit 존재 여부 미확정
6. **`MoneyDisplay` primitive 내부 tabular-nums** — surface 레벨 직접 사용은 확인됨
7. **worker depth WS malformed JSON 시 상위 에러 핸들러** — try/catch 부재 확인 · Comlink 상위 처리 여부 미확인

---

## 8. 부록 A — 조사 파일 전체 경로 목록

정적 읽기(전문/부분/grep)로 훑은 파일. 중복 제거 · 카테고리별 정렬.

### apps/web — 부트스트랩·라우트·셸

```text
apps/web/package.json
apps/web/src/main.tsx
apps/web/src/router.ts
apps/web/src/routes/__root.tsx
apps/web/src/routes/trade.tsx
apps/web/src/routes/trade.futures.tsx
apps/web/src/routes/trade.positions.tsx
apps/web/src/routes/trade.orders.tsx
apps/web/src/routes/staking.tsx
apps/web/src/routes/staking.positions.tsx
apps/web/src/product/shell/appshell.tsx
apps/web/src/product/shell/trade-realtime-feedback-gate.tsx
apps/web/src/product/shell/trade-first-visit-education-gate.tsx
apps/web/src/product/theme/theme-shell.tsx
```

### apps/web — product/surfaces/trade · staking

```text
apps/web/src/product/surfaces/trade/spot-desk-page.tsx
apps/web/src/product/surfaces/trade/futures-desk-page.tsx
apps/web/src/product/surfaces/trade/futures-positions-page.tsx
apps/web/src/product/surfaces/trade/futures-orders-page.tsx
apps/web/src/product/surfaces/trade/trade-desk-page-shell.tsx
apps/web/src/product/surfaces/trade/trade-desk-layout.css
apps/web/src/product/surfaces/trade/trade-desk-tablet-layout.tsx
apps/web/src/product/surfaces/trade/trade-desk-mobile-tabs.tsx
apps/web/src/product/surfaces/trade/trade-desk-mobile-sticky-cta.tsx
apps/web/src/product/surfaces/trade/spot-market-header.tsx
apps/web/src/product/surfaces/trade/futures-market-header.tsx
apps/web/src/product/surfaces/trade/trade-price-dir-ticker.tsx
apps/web/src/product/surfaces/trade/trade-market-ticker-stats.tsx
apps/web/src/product/surfaces/trade/trade-market-ticker-stats-wire.tsx
apps/web/src/product/surfaces/trade/spot-order-book-panel.tsx
apps/web/src/product/surfaces/trade/trade-recent-trades-rail.tsx
apps/web/src/product/surfaces/trade/futures-positions-panel.tsx
apps/web/src/product/surfaces/trade/open-orders-panel.tsx
apps/web/src/product/surfaces/trade/trade-fills-history-panel.tsx
apps/web/src/product/surfaces/trade/trade-funding-history-panel.tsx
apps/web/src/product/surfaces/trade/spot-order-ticket.tsx
apps/web/src/product/surfaces/trade/futures-order-ticket.tsx
apps/web/src/product/surfaces/trade/trade-desk-bottom-dock.tsx
apps/web/src/product/surfaces/trade/trade-market-status-banner.tsx
apps/web/src/product/surfaces/trade/trade-desk-fetch-error-banner.tsx
apps/web/src/product/surfaces/trade/trade-money-with-fiat-hint.tsx
apps/web/src/product/surfaces/trade/trade-price-with-fiat-hint.tsx
apps/web/src/product/surfaces/trade/trade-confirm-settings-link.tsx
apps/web/src/product/surfaces/trade/trade-first-visit-education-sheet.tsx
apps/web/src/product/surfaces/trade/chart/trade-chart-panel.tsx
apps/web/src/product/surfaces/trade/chart/trade-chart.tsx
apps/web/src/product/surfaces/trade/chart/use-lightweight-chart.ts
apps/web/src/product/surfaces/trade/chart/use-chart-series.ts
apps/web/src/product/surfaces/trade/chart/use-chart-price-lines.ts
apps/web/src/product/surfaces/trade/chart/use-chart-crosshair-legend.ts
apps/web/src/product/surfaces/trade/chart/trade-chart-crosshair-legend.tsx
apps/web/src/product/surfaces/trade/chart/chart-options.ts
apps/web/src/product/surfaces/trade/chart/chart-theme.ts
apps/web/src/product/surfaces/trade/chart/to-chart-data.ts
apps/web/src/product/surfaces/trade/chart/compute-indicator-series.ts
apps/web/src/product/surfaces/trade/chart/chart-overlay-contract.ts
apps/web/src/product/surfaces/trade/__tests__/spot-order-book-panel.test.tsx
apps/web/src/product/surfaces/trade/__tests__/spot-desk-page.test.tsx
apps/web/src/product/surfaces/trade/__tests__/futures-desk-page.test.tsx
apps/web/src/product/surfaces/trade/__tests__/futures-positions-page.test.tsx
apps/web/src/product/surfaces/trade/__tests__/futures-order-ticket.test.tsx
apps/web/src/product/surfaces/staking/staking-hub-page.tsx
apps/web/src/product/surfaces/staking/staking-positions-page.tsx
apps/web/src/product/surfaces/staking/staking-positions-panel.tsx
apps/web/src/product/surfaces/__tests__/p9-trade-visual-signoff.test.tsx
```

### apps/web — features · hooks · stores · workers · lib · contracts

```text
apps/web/src/hooks/use-trading.ts
apps/web/src/hooks/use-rpc.ts
apps/web/src/hooks/use-trade-launch-flags.ts
apps/web/src/lib/rpc.ts
apps/web/src/lib/env.ts
apps/web/src/contracts/controller-view-freeze.ts
apps/web/src/stores/realtime.ts
apps/web/src/stores/notifications.ts
apps/web/src/workers/market-data.worker.ts
apps/web/src/features/trading/display-chart/use-display-kline.ts
apps/web/src/features/trading/display-chart/use-exchange-live-candles.ts
apps/web/src/features/trading/display-chart/display-feed-contract.ts
apps/web/src/features/trading/display-chart/resolve-exchange-symbol.ts
apps/web/src/features/trading/display-chart/use-exchange-display-price.ts
apps/web/src/features/trading/market-store/market-data-bridge.tsx
apps/web/src/features/trading/market-store/ticker-store.ts
apps/web/src/features/trading/market-store/order-book-store.ts
apps/web/src/features/trading/market-store/use-market-ticker.ts
apps/web/src/features/trading/market-store/use-order-book.ts
apps/web/src/features/trading/order-book-display.ts
apps/web/src/features/trading/order-ticket/order-ticket-display.ts
apps/web/src/features/trading/order-ticket/compute-position-display-metrics.ts
apps/web/src/features/trading/order-ticket/leverage-control.tsx
apps/web/src/features/trading/order-ticket/margin-mode-display.ts
apps/web/src/features/trading/order-ticket/position-mode-fixed-label.tsx
apps/web/src/features/trading/trade-rpc-capabilities.ts
apps/web/src/features/trading/trade-fiat-hint-display.ts
apps/web/src/features/trading/use-trade-fiat-hint.ts
apps/web/src/features/trading/use-trade-earn-vip-tier.ts
apps/web/src/features/trading/use-house-counterparty-acknowledgement.ts
apps/web/src/features/trading/use-spot-desk-wire.ts
apps/web/src/features/trading/use-futures-desk-wire.ts
apps/web/src/features/trading/use-futures-positions-page-controller.ts
apps/web/src/features/trading/use-trade-desk-viewport.ts
apps/web/src/features/trading/trade-beginner-help/trade-how-it-works-panel.tsx
apps/web/src/features/trading/__tests__/use-trade-desk-viewport.test.ts
apps/web/src/features/money/fiat-reference-rates-lib.ts
apps/web/src/features/money/use-fiat-reference-rates.ts
apps/web/src/features/wallet/use-krw-deposit-controller.ts
apps/web/src/features/wallet/use-krw-withdraw-controller.ts
apps/web/src/features/settings/use-settings-preferences-controller.ts
```

### apps/web — domain 계약 (trade·fiat 계열)

```text
apps/web/src/domain/fiat-reference-display-contract.ts
apps/web/src/domain/currency-precision-display-contract.ts
apps/web/src/domain/trade-fiat-hint-consistency-display-contract.ts
apps/web/src/domain/trade-exchange-parity-display-contract.ts
apps/web/src/domain/trade-order-states-display-contract.ts
apps/web/src/domain/margin-position-mode-display-contract.ts
apps/web/src/domain/trade-synthetic-book-disclosure-display-contract.ts
apps/web/src/domain/trade-market-status-display-contract.ts
apps/web/src/domain/trade-submit-display-contract.ts
apps/web/src/domain/trade-fill-realtime-display-contract.ts
apps/web/src/domain/trade-settings-prefs-display-contract.ts
apps/web/src/domain/trade-toast-display-contract.ts
apps/web/src/domain/trade-chart-mount-display-contract.ts
apps/web/src/domain/trade-beginner-language-display-contract.ts
apps/web/src/domain/trade-i18n-surface-display-contract.ts
apps/web/src/domain/trade-i18n-surface-audit-display-contract.ts
apps/web/src/domain/trade-layout-dedup-display-contract.ts
apps/web/src/domain/trade-desk-layout-display-contract.ts
apps/web/src/domain/trade-mobile-layout-display-contract.ts
apps/web/src/domain/trade-ultra-layout-display-contract.ts
apps/web/src/domain/trade-desk-fetch-error-display-contract.ts
apps/web/src/domain/trade-desk-failure-recovery-display-contract.ts
apps/web/src/domain/trade-desk-security-display-contract.ts
apps/web/src/domain/trade-desk-observability-display-contract.ts
apps/web/src/domain/trade-desk-perf-display-contract.ts
apps/web/src/domain/trade-desk-load-realtime-display-contract.ts
apps/web/src/domain/trade-desk-browser-matrix-display-contract.ts
apps/web/src/domain/trade-desk-a11y-display-contract.ts
apps/web/src/domain/trade-desk-a11y-contrast-spot-check.ts
apps/web/src/domain/trade-desk-release-rollback-display-contract.ts
apps/web/src/domain/trade-desk-migration-verify-display-contract.ts
apps/web/src/domain/trade-desk-launch-rc-display-contract.ts
apps/web/src/domain/trade-desk-fiat-hint-wire-display-contract.ts
apps/web/src/domain/p9-trade-visual-signoff-display-contract.ts
apps/web/src/domain/p9-gate-trade-world-class-display-contract.ts
apps/web/src/domain/spot-stake-display-contract.ts
apps/web/src/domain/staking-display-contract.ts
apps/web/src/domain/funding-history-display-contract.ts
apps/web/src/domain/unified-tier-display-contract.ts
apps/web/src/domain/tier-me-display-contract.ts
apps/web/src/domain/settings-preferences-display-contract.ts
apps/web/src/domain/notifications-pwa-display-contract.ts
apps/web/src/domain/wallet.ts
apps/web/src/domain/phon-balance.ts
apps/web/src/domain/responsible-gaming.ts
apps/web/src/domain/__tests__/fiat-reference-display-audit-lib.ts
apps/web/src/domain/__tests__/trade-order-states-display-contract.test.ts
apps/web/src/domain/__tests__/funding-history-display-contract.test.ts
apps/web/src/domain/__tests__/trade-layout-dedup-contract.test.ts
```

### apps/web — product/tokens · admin

```text
apps/web/src/product/tokens/index.css
apps/web/src/product/tokens/colors.css
apps/web/src/product/tokens/theme.css
apps/web/src/product/tokens/layout.css
apps/web/src/product/tokens/viewport-contract.ts
apps/admin/src/domain/ops.ts
```

### packages

```text
packages/trading-engine/src/spot.ts
packages/trading-engine/src/futures.ts
packages/trading-engine/src/staking.ts
packages/trading-engine/src/funding.ts
packages/trading-engine/src/stop-trigger.ts
packages/trading-engine/src/shared.ts
packages/trading-engine/src/markets.ts
packages/trading-engine/src/index.ts
packages/trading-engine/src/sql-parity.test.ts
packages/market-display/src/order-book-types.ts
packages/market-display/src/sequence-guard.ts
packages/shared-types/src/supabase-row-selects.ts
packages/shared-types/src/database.types.ts
```

### supabase — migrations (trade 계열 헤더/발췌/전문)

```text
supabase/migrations/20260609000001_phase1_auth_wallet_ledger.sql
supabase/migrations/20260609000006_phase3_trading_schema.sql
supabase/migrations/20260609000007_phase3_trading_rpcs.sql
supabase/migrations/20260609000008_p0_hardening_schema.sql
supabase/migrations/20260609000009_p0_auto_liquidation.sql
supabase/migrations/20260609000012_p1_anon_lockdown_oracle_liquidate.sql
supabase/migrations/20260609000015_p0_liquidation_cron_runner.sql
supabase/migrations/20260609000020_p1_position_oi_caps.sql
supabase/migrations/20260609000021_p0_request_idempotency.sql
supabase/migrations/20260609000027_s1_multisource_oracle.sql
supabase/migrations/20260609000038_stage2_market_metadata.sql
supabase/migrations/20260609000040_stage2_candles.sql
supabase/migrations/20260609000041_stage2_synthetic_orderbook.sql
supabase/migrations/20260609000042_stage2_market_source_registry.sql
supabase/migrations/20260609000044_zero_defect_sql_hardening.sql
supabase/migrations/20260609000051_krw_deposit_require_rate.sql
supabase/migrations/20260611000064_min_notional_enforcement.sql
supabase/migrations/20260611000065_oracle_per_symbol_min_sources.sql
supabase/migrations/20260611000068_price_change_audit_append_only.sql
supabase/migrations/20260611000071_two_tick_liquidation_buffer.sql
supabase/migrations/20260613000080-83 (price-feed edge cron 계열)
supabase/migrations/20260613000087_invariant_checks_monitoring.sql
supabase/migrations/20260620000128-140 (trade majors · E-wave 계열)
supabase/migrations/20260620000131_trade_e1_funding_sltp.sql
supabase/migrations/20260620000134_trade_e3_cross_margin.sql
supabase/migrations/20260620000140_trade_launch_funding_cross_gates.sql
supabase/migrations/20260626000001_phon_krw_rate_refresh.sql
supabase/migrations/20260626000008_guard_aal2_users_trade_exposure.sql
supabase/migrations/20260627000001_worldno1_money_ops_rails.sql
supabase/migrations/20260630000001_synthetic_book_anon_grant.sql
supabase/migrations/20260704000001_krw_phon_withdrawal_rate_snapshot.sql
supabase/migrations/20260719000001_liquidation_notify_e1.sql
supabase/migrations/20260720000001_admin_halt_market_e2.sql
supabase/migrations/20260721000002-9 (T-wave 계열)
supabase/migrations/20260721000005_trade_t0d_candles_display_safety.sql
supabase/migrations/20260721000006_trade_t1_spot_open_orders.sql
supabase/migrations/20260721000007_trade_t2_futures_completion.sql
```

### supabase — tests (헤더 검토 · Glob 114개 중 trade 계열)

```text
supabase/tests/conservation_test.sql
supabase/tests/futures_parity_test.sql
supabase/tests/settlement_race_test.sql
supabase/tests/oi_cap_race_test.sql
supabase/tests/concurrent_wallet_race_test.sql
supabase/tests/trade_sltp_trigger_test.sql
supabase/tests/trade_t2_futures_sltp_test.sql
supabase/tests/trade_t2_futures_cron_test.sql
supabase/tests/trade_funding_conservation_test.sql
supabase/tests/trade_t2_funding_settlement_test.sql
supabase/tests/trade_cross_margin_test.sql
supabase/tests/trade_open_orders_conservation_test.sql
supabase/tests/trade_launch_gates_test.sql
supabase/tests/circuit_breaker_state_test.sql
supabase/tests/admin_halt_market_e2_test.sql
supabase/tests/liquidation_notify_e1_test.sql
supabase/tests/system_account_hash_chain_test.sql
supabase/tests/staking_conservation_test.sql
supabase/tests/invariant_checks_test.sql
supabase/tests/grants_rls_inventory_test.sql
```

### docs (대조 참조)

```text
docs/CURRENT_STATUS.md
docs/SSOT/ACTIVE_WORK_SSOT.md
docs/SSOT/TRADE_UX_CANON.md
docs/SSOT/COPYWRITING_CANON.md
docs/SSOT/PRODUCT_PRINCIPLES.md
docs/SSOT/DESIGN_PRINCIPLES.md
docs/PRODUCT/REBUILD_PLAN_v1.md
docs/PRODUCT/LANDING_PRODUCT_SPEC.md
docs/OPERATIONS/TRADE_DESK_FAILURE_RECOVERY_MATRIX.md
```

---

_본 문서는 READ-ONLY 역설계 감사 산출물이며 구현 큐가 아니다. 후속 수정 착수 시 `ACTIVE_WORK_SSOT` 큐와 operator 승인 절차를 따른다._
