# Trade 차트 Soft Launch 운영 체크리스트 (ZA-12 · 1-G)

> **대상:** `/trade` 현물·선물 차트 empty 상태 — [`TradeChartPanel`](../../apps/web/src/product/surfaces/trade/chart/trade-chart-panel.tsx)
> **근거:** [`ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md`](../audit/ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md) 1-G.1~1-G.4 · ZA-12
> **하지 않을 것:** `TRADE_CHART_MOUNT_MIN_CANDLES`(2)를 낮춰 깨진 1봉 차트를 노출하지 않는다 — empty UX·시드·본 체크리스트로만 해소.

## 배경 — empty 원인 2가지 (혼동 금지)

차트는 캔들이 **2개 미만**이면 마운트하지 않고 empty 상태를 보여준다(
[`trade-chart-mount-display-contract.ts`](../../apps/web/src/domain/trade-chart-mount-display-contract.ts)
`TRADE_CHART_MOUNT_MIN_CANDLES`). 원인은 마켓 종류에 따라 **완전히 다르다** — 같은 empty UI를 하나의 카피로 뭉뚱그리면 운영자가 실제 원인을 못 찾는다(ZA-12):

| 마켓 종류                          | 피드 전략(`resolveTradeChartFeedStrategy`) | empty 원인                                                               | empty 카피(`resolveTradeChartEmptyReason`)              |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| PHON(`PHON_USDT`·`PHONUSDT-PERP`)  | `oracle-rpc-only` — 거래소 WS/REST 미사용  | `rpc_get_candles` 오라클 시드가 아직 2봉 미만                            | `oracle-awaiting-seed` — "오라클 캔들 대기 중"          |
| 거래소 페어(`BTC_USDT`·`*-SIM` 등) | `exchange-ws-with-oracle-fallback`         | 거래소 kline WS/REST 1차 경로 실패 **+** 오라클 fallback도 아직 2봉 미만 | `feed-unavailable` — "시세 피드가 일시적으로 안 보여요" |

R9 lazy-loading(코드 스플릿)은 empty 원인이 **아니다** — 1-G.2에서 확정. 이 문서는 위 표의 **원인 판별**만 다룬다.

## PHON — `rpc_get_candles` 오라클 시드 확인 (Soft Launch 배포 직후 1회)

1. Admin 또는 SQL 조회로 `PHON_USDT` 오라클 캔들 행 수 확인 — 최소 2행 필요(`TRADE_CHART_MOUNT_MIN_CANDLES`).

   ```sql
   select count(*) from oracle_candles where symbol = 'PHON_USDT';
   -- 또는 candles 소스 테이블/뷰가 다르면 rpc_get_candles 호출 결과 길이로 확인
   ```

2. 0~1행이면 오라클 시드 크론/워커가 아직 충분히 돌지 않은 상태 — 대기 또는 운영 수동 시드 트리거(엔진 변경 없이, 기존 크론 재실행만).
3. `/trade`에서 PHON 마켓 선택 시 empty 배지가 `data-empty-reason="oracle-awaiting-seed"`(오라클 캔들 대기 중)로 보이면 **정상 대기 상태** — "시세 피드 불가"로 오인하지 않는다.

## 거래소 페어 — Binance/Bybit 등 벤더 도달성 확인 (Soft Launch 환경)

1. Soft Launch 배포 환경(스테이징/프로드)에서 거래소 kline WS/REST 엔드포인트로의 아웃바운드 네트워크가 열려 있는지 확인(방화벽/이그레스 정책 — VPC 이그레스 룰 등 operator 인프라 설정, 코드 변경 아님).
2. `/trade`에서 `BTC_USDT` 등 거래소 페어 선택 → 몇 초 내 캔들 2개 이상 수신되는지 확인.
3. empty가 계속되고 `data-empty-reason="feed-unavailable"`(시세 피드 일시적으로 안 보여요)이면: (a) 벤더 API 상태 확인 (b) 이그레스 정책 확인 (c) 오라클 fallback이 도착하는지 확인(오라클도 2봉 미만이면 `TradeChartPanel`이 재시도 버튼을 계속 노출 — 정상 UX).

## E2E 참고 (empty가 "의도"인 경우)

`VITE_PHONARA_E2E_ENGINE=1` 환경에서는 실시간 벤더 피드가 연결되지 않으므로 empty 상태가 **기본값**이다 — 이는 결함이 아니라 E2E 격리 설계다. 이 환경에서 empty를 "고치려" 하지 않는다.

## 검증 게이트

- `gate:ai-impl -- --test apps/web/src/product/surfaces/trade/chart` (empty 카피 분기 vitest)
- `check:i18n` (신규 `trade.chart.empty.oracleAwaiting.*` / `trade.chart.empty.feedUnavailable.*` ko/en)
- (선택·operator) Soft Launch 환경에서 Playwright MCP로 Network 1회 스모크 — 어느 심볼이 지금 empty인지 실측 기록(로컬 heavy E2E 금지, G13).

## Phase 5 재검증 (2026-07-14 · Zero-Defect Critical Hardening)

| 항목                      | 결과                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 코드측 empty 원인 분기    | **유지** — `resolveTradeChartEmptyReason` · `TRADE_CHART_MOUNT_MIN_CANDLES=2` 미변경                                  |
| owner vitest              | `trade-chart-mount-display-contract` green (Phase 5 세션)                                                             |
| Soft Launch Network 실측  | **여전히 OPEN** — 본 Phase에서 브라우저 실측·시드 트리거 **미실행** (운영자 Soft Launch 시 §PHON / §거래소 페어 절차) |
| 본 Phase에서 하지 않은 것 | MIN_CANDLES 하향 · empty 카피 재작성 · 엔진/피드 코드 변경 **0**                                                      |

정본 Plan: [`PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md`](../PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md) Phase 5.

## 2026-07-14 후속 — 거래소 REST CORS 근본 수정 (Edge 프록시)

`§거래소 페어 — Binance/Bybit 등 벤더 도달성 확인` 절의 원인 중 **브라우저 직접 CORS 차단**은
아래 변경으로 코드측에서 제거되었다. 나머지(이그레스 정책·벤더 API 상태)는 인프라 요인으로 남아있어
Soft Launch Network 실측은 여전히 필요하다.

| 항목            | 내용                                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 변경            | Binance/Bybit klines 히스토리·depth 스냅샷·24h ticker REST 호출을 브라우저 직접 fetch에서 [`market-data-proxy`](../../supabase/functions/market-data-proxy/index.ts) Edge Function 경유로 전환 |
| 미변경          | WS 스트림(kline/depth/ticker)은 그대로 브라우저 직결 — CORS는 WS 핸드셰이크를 막지 않으므로 대상 아님                                                                                          |
| 코드측 효과     | "브라우저 CORS/지역 차단으로 REST가 막혀 `feed-unavailable`이 뜨는" 경로가 구조적으로 제거됨(모든 REST가 Supabase 도메인을 통과)                                                               |
| **여전히 OPEN** | (a) 배포 후 Network 탭에서 `api.binance.com`/`api.bybit.com` 직접 호출 0건 실측 (b) `_headers` `connect-src`에서 해당 REST 도메인 제거는 (a) 확인 **후에만** — 미확인 상태로 제거 금지         |
| 완료 조건       | 위 (a) 확인 후 `_headers` connect-src 정리 + 본 문서 "완전 CLOSE"로 갱신 — 아직 아님                                                                                                           |

## 참고

- [`trade-chart-mount-display-contract.ts`](../../apps/web/src/domain/trade-chart-mount-display-contract.ts) — `resolveTradeChartFeedStrategy` · `resolveTradeChartEmptyReason`
- [`trade-chart-panel.tsx`](../../apps/web/src/product/surfaces/trade/chart/trade-chart-panel.tsx) — empty UI 분기 렌더
- [`ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md`](../audit/ZERO_ASSUMPTION_FULL_AUDIT_2026-07-13.md) 1-G — 근거 조사
