# Active Work SSOT (2026-07-06)

> **유일한 실행 큐 정본.** 그 외 `.md` (엔진 evidence · v2 wave · Demolition batch · forensic)는 **이력·감사 전용** — 구현 큐로 읽지 않는다.

## 현재 상태

| 영역                          | 상태                                         | AI 행동                                                                                                                                                                         |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Engine Apex**               | `[x] FULLY CLOSED`                           | `supabase/migrations` · `packages/*-engine` **신규 작업 금지** (버그·Phase R 와이어 예외만)                                                                                     |
| **Phase D Demolition**        | `[x] DONE`                                   | 삭제 확장 **금지**                                                                                                                                                              |
| **Phase R UI Rebuild**        | **IN PROGRESS (P10 Betting · §22.2.5)**      | **왕초보 큐:** To-do **위→아래** · completed **스킵** · **첫 pending 1개** (`p10-sports-fiat-hint-wire` #180) · PQA §33 **`[x]` DONE** (#169–179) · **`p10-page-sports` `[x]`** |
| **Trade Desk Remediation**    | **Phase 4 closeout `[x]` DONE**              | Plan `trade_desk_remediation_v3` · S4 LAUNCH RC APPROVED 2026-07-07 · **CI/soak Verified `[x]` 2026-07-07**                                                                     |
| **Trade Desk Zero-Defect QA** | **L9 closeout `[x]` impl** · §15 **STARTED** | Plan `trade_desk_qa_audit` · `closeout-doc-sync` 2026-07-08 · operator Stage 2/3 · 3m window **pending**                                                                        |

## Trade Desk Remediation (Plan `trade_desk_remediation_v3` · execute SSOT)

> **형제 큐:** Phase R Track A와 **독립** — 엔진 T0~T3 + Launch RC Tier 2.  
> **Operator signoff:** [`TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md`](../OPERATIONS/TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md) · [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](../OPERATIONS/TRADE_DESK_LAUNCH_RC_SIGNOFF.md)

| Todo                       | 상태           | 완료일         | 증거                                                                                                     |
| -------------------------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `phase-4-launch-rc`        | `[x]` impl     | 2026-07-07     | `trade-desk-launch-rc-display-contract` · complaint+toast registry 100%                                  |
| **`phase-4-closeout`**     | **`[x]` DONE** | **2026-07-07** | security-auditor PASS · §82 doc sync · **S4 LAUNCH RC APPROVED** · **4C CI + 4D soak operator verified** |
| **`operator-rc-closeout`** | **`[x]` DONE** | **2026-07-07** | CI quality·sql·e2e·advisors green (`fed305d`) · soak spot-check WARNING 0                                |

**Implemented:** `gate:ai-impl` launch-rc **6/6** · visual signoff **41/41** · security-auditor T0~T3 **PASS** (ERROR 0)

**Verified/DONE (full Tier 2 LAUNCH):** GitHub CI **quality·sql·e2e·advisors green** (`fed305d`) + 24h prod soak **WARNING 0** — `scripts/trade-desk-launch-rc-soak-spotcheck.sql` · remediate `scripts/trade-desk-launch-rc-soak-remediate.sql` · **2026-07-07**

## Trade Desk Zero-Defect QA Audit (Plan `trade_desk_qa_audit` · execute SSOT)

> **형제 큐:** Remediation Launch RC **선행 완료** · 본 큐 = P0-0→P4→**L9** Zero-Defect evidence + §15 운영 창  
> **E0 정본:** [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md`](../OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md)  
> **L9 승인:** [`L9/release-approval-record.md`](../OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/L9/release-approval-record.md)  
> **§15 운영 창:** [`ops-window/`](../OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/ops-window/README.md) — **STARTED** 2026-07-08

| Todo                        | 상태           | 완료일         | 증거                                                                  |
| --------------------------- | -------------- | -------------- | --------------------------------------------------------------------- |
| P0-0 ~ P4 (impl)            | `[x]` impl     | 2026-07-07~08  | E0 P0-0/S0/P3/P4 slots · domain contracts · operator docs             |
| **`closeout-doc-sync`**     | **`[x]` DONE** | **2026-07-08** | L9 release-approval-record(실질) · §82 sync · §15 ops-window STARTED  |
| operator L9 Stage 2/3       | `[ ]` pending  | —              | rollback 15min dry-run · KPI baseline · Q1 operator · prod deploy sha |
| §15 week1 / month1 / month3 | **STARTED**    | 2026-07-08     | incident **0** · 마감 2026-07-15 / 2026-08-08 / 2026-10-08            |

**Implemented:** `closeout-doc-sync` — E0 `L9/` + `ops-window/` · ACTIVE_WORK_SSOT §82 · LAUNCH_RC §L9 cross-ref

**Zero-Defect 선언:** **금지** (L9) — §15 3m incident 0 + 복구 (a)~(e) 준수 후에만 "근접" 검토

## Trade Desk 결함 0 수렴 (Plan `트레이딩_결함_0_수렴` · 감사 후속)

> **근거:** [`ENGINE_UI_FULL_AUDIT_2026-07-08.md`](../audit/ENGINE_UI_FULL_AUDIT_2026-07-08.md) · Phase A **`[x]` DONE** 2026-07-08 · Phase B B1–B3 **`[x]` impl** 2026-07-08

| Todo                                        | 상태           | 완료일         | 증거                                                                                                                                                             |
| ------------------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`phase-a-doc-honesty`**                   | **`[x]` DONE** | **2026-07-08** | D-1~D-7 계약·문서 정직화 · `gate:ai-impl` order-states **11/11** · parity **29/29** · layout-dedup **9/9** · i18n-surface **5/5** · `check:ai-reference` green   |
| **`phase-a-unverified`**                    | **`[x]` DONE** | **2026-07-08** | MCP READ-ONLY · UNVERIFIED 1~3 확정 · `list_migrations` 203/204 · `list_edge_functions` liquidation-worker absent · `funding_rates` 21×0% · `funding_payments` 0 |
| **`phase-b-worker-reconnect`** (B1 · H-1)   | **`[x]` impl** | **2026-07-08** | `market-data.worker.ts` depth/ticker WS onclose/onerror · `createReconnectScheduler` · REST re-seed · `parseWsJson` · vitest reconnect **8/8**                   |
| **`phase-b-feed-heartbeat`** (B2 · H-2)     | **`[x]` impl** | **2026-07-08** | `market-data-heartbeat.ts` · worker inactivity · kline Bybit ping/pong · vitest heartbeat **6/6**                                                                |
| **`phase-b-stale-detect`** (B3 · H-3)       | **`[x]` impl** | **2026-07-08** | `display-feed-stale.ts` · store `feedStale` · header/book badge · synthetic book 폴백 · vitest stale **17/17**                                                   |
| **`phase-b-kline-reconnect`** (B4–B5 · M-5) | **`[x]` impl** | **2026-07-08** | `display-kline-reconnect.ts` · `use-display-kline.ts` backoff+jitter · Binance primary 복귀 5m/visibility · vitest kline **9/9** · stale **3/3**                 |
| **`phase-c-rpc-validation`** (C1 · M-6)     | **`[x]` impl** | **2026-07-08** | `trading-rpc-display-contract.ts` · `use-trading.ts` 21 RPC `callRpc`+parsers · kline WS field guards · vitest rpc **6/6** · feed **5/5**                        |
| **`phase-c-type-dedup`** (C2 · L-1)         | **`[x]` impl** | **2026-07-08** | candle/MarginMode/TradeDeskKind/Ticker24h 단일 정본 · adapters · vitest dedup **8/8**                                                                            |
| **`phase-c-dead-contract`** (C3 · L-2)      | **`[x]` impl** | **2026-07-08** | `apps/web/src/contracts/controller-view-freeze.ts` 삭제 · admin copy 유지 · `ENGINE_BOUNDARY.md` 갱신                                                            |

**Implemented (Phase C):** typed RPC parsers · WS kline field guards · type dedup · UNVERIFIED-4 `rpc_run_open_order_fills` caller documented · dead web contract removed

**Phase C closeout (2026-07-08):** `gate:ai-impl` trade-display-type-dedup + trading-rpc-display-contract green · `typecheck` green

| **`phase-d-chart-indicators`** (D5 · 갭 #14 일부) | **`[x]` impl** | **2026-07-08** | chart indicators · drawing tools |
| **`phase-e-engine-gaps`** (E1–E3 · RED STOP) | **`[x]` impl** | **2026-07-08** | `20260722000001_trade_e_phase_e_advanced_orders` · trailing stop · TIF · iceberg · UI wire · `trade_e_phase_e_advanced_orders_test.sql` |

**Implemented (Phase E):** `rpc_set_trailing_stop` · `rpc_clear_trailing_stop` · `time_in_force` · `display_quantity` iceberg slices · `rpc_run_stop_orders` trailing peak · `rpc_run_open_order_fills` IOC/FOK expiry

**NEXT:** P10 **`p10-sports-fiat-hint-wire`** (#180) · PQA §33 gate **`[x]` DONE** 2026-07-09

## 읽을 것 (active)

1. 본 문서 (`ACTIVE_WORK_SSOT.md`)
2. Phase R 실행: [`docs/PRODUCT/REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md)
3. YAML todo 정본: Cursor Plan `phase_r_super-app_8bdf2c10` (frontmatter · **346 ids** · Track A **269** + Track B **77** · completed **179** · pending **160** · cancelled **7** · §20.6.1–§20.6.3 · §20.13 · §20.13.2 Fiat# · **§20.13.3 Sports#·CasinoR#** · **§20.14 Launch** · §25.12.9.1-D · §22.2.4 · **§22.2.5 Sports Parity** · **§23.2.1 Casino one-shot replay** · **§32.7** · §25.12.9.2 audit remediation · **48차** 2026-07-08 · sibling orchestration plan **0**)
4. 엔진 **상태 한 줄만**: [`docs/ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md) (게이트 수치 · 재착수 금지)
5. UX **의도 참조** (실행 큐 아님): `docs/SSOT/*_UX_CANON.md` · `UX_REFERENCE_CANON.md`
6. 경계: [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md) · [`OPERATOR_GATES.md`](OPERATOR_GATES.md) · [`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md)
7. YAML↔doc drift 게이트: `bun run check:plan-doc-sync` · drift 시 `bun run sync:plan-doc-mirror`

## 읽지 말 것 (frozen — denylist)

- `docs/ENGINE_PHASE*_EVIDENCE_REPORT.md` · `ENGINE_POST_APEX_*` · `ENGINE_FORENSIC_*` · `ENGINE_STATE_AUDIT_*`
- Batch 11 삭제 v2 SSOT (경로 목록: [`DEPRECATED_DOC_DENYLIST.md`](DEPRECATED_DOC_DENYLIST.md))
- [`DEMOLITION_PLAN.md`](../PRODUCT/DEMOLITION_PLAN.md) — **완료 이력만** · batch 재실행 큐 **아님**
- [`REBUILD_PLAN_TBD.md`](../PRODUCT/REBUILD_PLAN_TBD.md) — superseded stub

## 게이트 (엔진 회귀 확인 시만)

**저사양 operator (8GB):** SQL · E2E · full vitest/build chain은 **로컬 일상 금지** — **GitHub CI authoritative.**  
로컬 마감 = `gate:ai-impl` · push 후 CI green 확인. 정본: [`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md)

```powershell
# 로컬 (Implemented)
bun run gate:ai-impl -- --test <owner-vitest-path>

# Push → GitHub Actions CI job green (Verified)
# quality · sql · e2e · advisors — .github/workflows/ci.yml

# migration touch 시 (CI sql green 후)
bun run stack:push-remote
bun run check:advisors
```

| Gate             | 로컬                         | CI job           |
| ---------------- | ---------------------------- | ---------------- |
| Engine unit      | `bun run test:engine` (선택) | quality (`test`) |
| SQL Σ=0          | ❌ 위임                      | **sql**          |
| Playwright E2E   | ❌ 위임                      | **e2e**          |
| Remote advisor   | —                            | **advisors**     |
| Remote migration | `stack:push-remote`          | —                |

## 다음 착수 순서 (Phase R · Track A)

**P1 Foundation** → **P2 Admin** → P3 Auth → P4 Money → P5 Security → P6 Shell → **P7 Growth** → **P8 Core** → P9–P12 Product → P13 Soft Launch → E0–E7 Engine Wave

**현재 NEXT:** **`p10-sports-fiat-hint-wire`** — P10 YAML **#180** · PQA §33 gate **`[x]` DONE** 2026-07-09 · **`p10-page-sports` `[x]`**

**왕초보 작업법 (43차 · 이것만):**

1. Cursor Plan To-do **위에서 아래로** 본다
2. **`completed`(체크됨)는 건너뛴다**
3. **첫 `pending`(빈 원) 1개만** 한다 — agent impl 완료 후 operator **`VISUAL APPROVED: p9-operator-visual-signoff`** → YAML #152 completed → **28번 gate**
4. 끝나면 다음 pending — **순서 바꾸지 않음** · **병렬 없음**

**직선 큐 (pending 구간):** … Fiat (#158–167) → `p10-page-sports` (#168) → **PQA audit+fix (#169–179)** → P10 잔여 (#180+) → P11 → P12 → P13 → T1/T2 → Engine Wave

**품질 바 (운영자):** §13.1.2 — UX=거래소급 · 정산=플랫폼 내부 only · chart/WS **display-only** · §32.7 — 노출=동작|disabled+reason|hidden · §22.2.4 표시=RPC · dead control 0

## P9 WORLD 실행 큐 (§25.12.9.1-D · 28 steps + 26a–26b remediation · YAML #124–151)

**정본:** Plan §25.12.9.1-D step 번호 · §25.12.9.2 audit remediation · §22.2.1 F = redirect only · §20.13 global #N

**상태:** `[x]` P9 WORLD **28/28 + gate** · **`p9-gate-trade` `[x]`** · **`p9-world-preflight` `[x]`** · **E1 liquidation notify `[x]`** · **NEXT Launch E2 (#155)**

```text
1  p9-trade-parity-matrix-sync       [x] 2026-07-05
2  p9-trade-spot-pair-wire           [x] 2026-07-05
3  p9-trade-ticker-header-wire       [x] 2026-07-06
4  p9-trade-chart-pro-lwc            [x] 2026-07-06
5  p9-trade-chart-overlays-lwc       [x] 2026-07-06
6  p9-trade-fills-history-wire       [x] 2026-07-06
7  p9-trade-terminal-bottom-dock   [x] 2026-07-06
8  p9-trade-recent-trades-rail       [x] 2026-07-06
9  p9-trade-orderbook-parity         [x] 2026-07-06
10 p9-trade-futures-partial-close-ui [x] 2026-07-06
11 p9-trade-futures-margin-adjust-ui [x] 2026-07-06
12 p9-trade-futures-unrealized-pnl   [x] 2026-07-06
13 p9-trade-leverage-slider-ux         [x] 2026-07-06
14 p9-trade-order-ticket-density       [x] 2026-07-06
15 p9-trade-beginner-help-layer       [x] 2026-07-06
16 p9-trade-position-mode-label       [x] 2026-07-06
17 p9-trade-cross-margin-canary        [x] 2026-07-06
18 p9-trade-funding-history-display      [x] 2026-07-06
19 p9-trade-tier-fee-display              [x] 2026-07-06
20 p9-trade-oracle-circuit-banner       [x] 2026-07-06
21 p9-trade-ultra-layout              [x] 2026-07-06
22 p9-trade-mobile-history-tab          [x] 2026-07-06
23 p9-trade-mobile-futures-book-tab    [x] 2026-07-06
24 p9-trade-settings-prefs-wire           [x] 2026-07-06
25 p9-trade-layout-dedup-gate              [x] 2026-07-06
26 p9-trade-i18n-surface-audit              [x] 2026-07-06
26a p9-trade-audit-remediation-a1           [x] 2026-07-06 · spot whitelist filter+cancel · registry · §12.19
26b p9-trade-audit-remediation-a2           [x] 2026-07-06 · useTradeDeskViewport · chart single mount
27 p9-operator-visual-signoff              [x] 2026-07-06 · agent impl + operator VISUAL APPROVED
28 p9-gate-trade-world-class (#153)        [x] 2026-07-06
29 launch-engine-e1-liquidation-notify (#154)        [x] 2026-07-06
30 launch-engine-e2-admin-halt-market (#155)        [x] 2026-07-06
31 launch-engine-e3-ops-telegram-webhook (#156)      [x] 2026-07-06
32 launch-engine-e4-concurrent-race-test (#157)     [x] 2026-07-06
33 p4-fiat-reference-preflight (#158)        [x] 2026-07-06
34 p4-fiat-currency-precision-ssot (#159)        [x] 2026-07-06
35 p4-fiat-reference-rates-hook (#160)        [x] 2026-07-06
36 p4-fiat-hint-display-contract (#161)        [x] 2026-07-06
37 p4-fiat-money-display-hint (#162)        [x] 2026-07-06
38 p4-page-wallet-fiat-hint (#163)        [x] 2026-07-06
39 p9-trade-fiat-hint-wire (#164)        [x] 2026-07-06
40 p7-earn-fiat-hint-co-primary (#165)        [x] 2026-07-06
41 p5-page-settings-fiat-reference (#166)        [x] 2026-07-06
42 p4-gate-fiat-reference-world-class (#167)        [x] 2026-07-06
```

## Fiat Reference Core Gate (`p4-gate-fiat-reference-world-class` · §13.1.4 · §20.13.2 Fiat#9G · YAML #167) — `[x]` DONE · 재착수 금지

**Implemented:** `p4-gate-fiat-reference-world-class-display-contract.ts` — `assertP4FiatReferenceWorldClassGateSync` · Fiat#1–5 infra + Fiat#6–9 surface wires bundle · ComplaintRisk `fiat-hint-*` **core 3행 live** (ledger-leak · stale-hidden · locale-hardcode-krw) · P10 deferrals (`fiat-hint-casino-drift` · `fiat-hint-sports-odds-order`) registered · preflight grep full `apps/web/src` · **P10 page unblock**

**증거:** `gate:ai-impl` fiat bundle **113/113** (18 files) · `p4-gate-fiat-reference-world-class-display-contract` **6/6** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-gate-fiat-reference-world-class` `[x]`** — §13.1.4 Fiat#9G core gate · **NEXT `p10-sports-fiat-hint-wire` (#169)**

## Sportsbook Home (`p10-page-sports` · §13.1.1 · §12.7 · YAML #168) — `[x]` DONE · 재착수 금지

**Implemented:** `/sports` sportsbook (fixture board + bet slip rail) · child routes `/sports/prematch|live|my-bets|rules|vip` · `/betting` redirect (§12.17) · `use-sports-page-controller` · `use-sports-bet-slip-state` · **USDT/PHON stake currency selector** → `rpc_place_sports_bet(p_currency)` · per-currency avail · `@phonara/sportsbook-engine` display-only payout preview · `TRADE_DUAL_CURRENCY_MATRIX` sports-slip-currency **`phonara: yes`**

**증거:** `gate:ai-impl` `product/surfaces/sports` **5/5** · `sports-page-display-contract` **4/4** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

## Platform Zero-Defect Audit (PQA §33 · YAML #169–179)

> **정본:** Plan `phase_r_super-app_8bdf2c10` §33 · 결함 대장 = [`PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md`](../audit/PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md)  
> **P10 잔여 unblock:** `pqa-gate-platform-audit` (#179) **`[x]` DONE** 2026-07-09 — `#180+` 착수 가능

| Todo                                    | 상태           | 완료일         | 산출                                                                                                                                                                                                                                                       |
| --------------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pqa-audit-a-db-guards`                 | **`[x]` DONE** | 2026-07-08     | `PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md`                                                                                                                                                                                                                 |
| `pqa-audit-b-rpc-contract`              | **`[x]` DONE** | 2026-07-08     | `PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md` · `last-b-rpc-contract-report.json`                                                                                                                                                                          |
| `pqa-audit-c-surface-controls`          | **`[x]` DONE** | 2026-07-08     | `PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md` · `audit-c-surface-controls.ts`                                                                                                                                                                          |
| `pqa-audit-d-config-state`              | **`[x]` DONE** | 2026-07-08     | `PLATFORM_AUDIT_D_CONFIG_STATE_2026-07-08.md` · `audit-d-config-state.ts`                                                                                                                                                                                  |
| **`pqa-audit-report`**                  | **`[x]` DONE** | **2026-07-08** | **`PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md`** — P0 **0** · P1 **3** · P2 **14** · P3 **7**                                                                                                                                                          |
| `pqa-fix-error-mapping`                 | **`[x]` impl** | 2026-07-08     | F1 · P2-ERR-01–10 · `packages/i18n/src/translate-error.ts` · admin `RpcError.i18nKey` · `translate-error.test.ts` **6/6**                                                                                                                                  |
| `pqa-fix-client-gate-prechecks`         | **`[x]` impl** | 2026-07-08     | F2 · P2-GATE-01–07 · `client-gate-contract.ts` · `use-client-gate-prechecks.ts` · trade/wallet/sports/earn wire · `client-gate-contract` **7/7** · F1+F2 bundle **33/33**                                                                                  |
| `pqa-fix-dead-controls`                 | **`[x]` impl** | 2026-07-08     | F3 · P3 stub · `dead-controls-display-contract.ts` · casino hub defer · sports VIP defer · settings API keys disabled · tier-keepStatus unavailable · reward tickets 0 note · BEP20 i18n removal · `gate:ai-impl` F3 bundle **38/38** · engine touch **0** |
| `pqa-fix-types-regen`                   | **`[x]` impl** | 2026-07-09     | F4 · `gen:types` · `check:types` drift gate · `database-types-contract.ts` · `rpc_run_open_order_fills` · `rpc_run_stop_orders` · CI sql job · `gate:ai-impl` F4 **5/5** · engine touch **0**                                                              |
| `launch-engine-e5-realtime-publication` | **`[x]` impl** | 2026-07-09     | F5 · `20260724000001_trade_wallet_realtime_publication.sql` · 10 tables · `trade_wallet_realtime_publication_test.sql` · `stack:push-remote` · advisor 0                                                                                                   |
| `pqa-gate-platform-audit`               | **`[x]` DONE** | **2026-07-09** | G · `gate:ai-impl` PQA bundle **21/21** · `check:i18n` · `check:release` · `audit:pqa-c` · `audit:pqa-d` · `check:ai-reference` · §33 G close · P10 unblock                                                                                                |

**Implemented (audit A–E):** read-only A/B/C/D + E 결함 대장 · prod P0 blocker **0** · advisor ERROR **0** · §12.19 **0** · dead control P2 **0**

**증거 (audit closeout):** `bun run audit:pqa-c` · `bun run audit:pqa-d` · `check:ai-reference` · `typecheck` · `check:hygiene`

**재현:**

```powershell
bun run audit:pqa-c
bun run audit:pqa-d
bun run check:engine-foundation-parity   # migration parity P1-002
```

**P1 engine 큐 (F와 병행 · RED STOP):** `launch-engine-e5-realtime-publication` **`[x]`** 2026-07-09

**다음 todo:** **`p10-sports-fiat-hint-wire`** (#180) — P10 Fiat#10 · PQA gate **`[x]`** unblock

## Settings Fiat Hint Toggle (`p5-page-settings-fiat-reference` · §13.1.4.3 · §20.13.2 Fiat#9 · YAML #166) — `[x]` DONE · 재착수 금지

**Implemented:** `settings-preferences-display-contract.ts` — `preferences.fiatHintEnabled` localStorage · locale default ko ON · en OFF · `use-fiat-hint-preference.ts` · `use-settings-preferences-controller` toggle · `/settings/preferences` Switch card · wallet/trade/earn hooks read preference via `resolveLocaleTargetFiat`

**증거:** `gate:ai-impl` `preferences-settings-page` **1/1** · settings fiat vitest **26/26** (contract+controller+hook+page) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p5-page-settings-fiat-reference` `[x]`** — §13.1.4.3 settings override · **NEXT `p4-gate-fiat-reference-world-class` `[x]`**

## Earn Fiat Hint co-primary (`p7-earn-fiat-hint-co-primary` · §13.1.4.4 · §20.13.2 Fiat#8 · YAML #165) — `[x]` DONE · 재착수 금지

**Implemented:** `earn-fiat-hint-display.ts` · `use-earn-fiat-hint.ts` · `earn-money-with-fiat-hint.tsx` · `earn-mission-reward.tsx` — mission/referral/tier cards PHON + ≈fiat co-primary · `MissionCard.rewardSlot` · RPC `reward_phon` only (client recompute 0) · `useFiatReferenceRates` earn policy (60s) · surfaces: `/home` · `/home/missions*` · `/referral` · `/tier/me` · `FiatHintDisclaimer` 1× per surface

**증거:** `gate:ai-impl` `home-missions-page` **4/4** · earn fiat hint vitest **11/11** (display+hook+primitive) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p7-earn-fiat-hint-co-primary` `[x]`** — §13.1.4.4 Earn co-primary wire · **NEXT `p5-page-settings-fiat-reference` `[x]`**

## Trade Fiat Hint (`p9-trade-fiat-hint-wire` · §13.1.4.4 · §20.13.2 Fiat#7 · YAML #164) — `[x]` DONE · 재착수 금지

**Implemented:** `trade-fiat-hint-display.ts` · `use-trade-fiat-hint.ts` · `trade-money-with-fiat-hint.tsx` · `trade-price-with-fiat-hint.tsx` — spot/futures header last/mark price · spot/futures ticket avail/est rows · futures unrealized/realized PnL secondary hint · `useFiatReferenceRates` trade policy (30s) · oracle stale → hint `—` · USDT/PHON primary · `FiatHintDisclaimer` 1× per desk

**증거:** `gate:ai-impl` `trade-money-with-fiat-hint` **3/3** · trade fiat hint vitest **26/26** (display+hook+surfaces) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p9-trade-fiat-hint-wire` `[x]`** — §13.1.4.4 Trade desk wire · **NEXT `p7-earn-fiat-hint-co-primary` `[x]`**

## P9 VISUAL (`p9-operator-visual-signoff`) — agent impl `[x]` 2026-07-06

> **§20.12:** agent gate green ≠ Plan YAML `completed` — operator preview 육안 **`VISUAL APPROVED: p9-operator-visual-signoff`** 채팅 기록 후 Plan #152 `completed` 가능.

**Implemented (green):**

| 항목                 | 증거                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display contract     | `p9-trade-visual-signoff-display-contract.ts` · G1–G7 · 4-tier · dual-currency spot-check                                                           |
| Automated companions | `p9-trade-visual-signoff.test.tsx` **29/29** · contract test **5/5**                                                                                |
| §13.1.1 spot-check   | spot USDT stake · futures USDT/PHON selector · positions/orders/fills margin column · staking stake_currency HelpTip                                |
| §32.7 dead control 0 | spot/futures submit · mobile sticky CTA · staking-stake-cta · staking-positions-hub-link                                                            |
| Trade bundle gate    | `gate:ai-impl` trade+staking **168/168** · `typecheck` · `check:i18n` · `check:release` · `check:ui-architecture` · `check:phase-r-guards --strict` |

**operator 육안 체크리스트 (§20.12 · Plan YAML #152 completed 조건):**

1. `bun run deploy:pages:web:preview` foreground 1회 (§30.1)
2. Preview **390 / 768 / 1024 / 2560** — `/trade` · `/trade/futures` · `/trade/positions` · `/trade/orders` · `/staking` · `/staking/positions`
3. **§13.1.1** USDT/PHON selector·column spot-check (ticket · positions · fills · staking label)
4. **G7** hedge/reduce-only **미노출** · cross margin canary OFF 시 disabled+reason
5. dead control 0 · axe critical 0 (브라우저 DevTools)
6. 채팅 **`VISUAL APPROVED: p9-operator-visual-signoff`** → Plan YAML `completed` + §82 doc sync

**다음 todo:** `p10-sports-fiat-hint-wire` (#169)

## Wallet/Ledger Fiat Hint (`p4-page-wallet-fiat-hint` · §13.1.4.4 · §20.13.2 Fiat#6 · YAML #163) — `[x]` DONE · 재착수 금지

**Implemented:** `wallet-fiat-hint-display.ts` · `use-wallet-fiat-hint.ts` · `wallet-money-with-fiat-hint.tsx` — Wallet hero + balance rows + ledger/activity amount secondary hint · `useFiatReferenceRates` wallet policy (60s) · KRW deposit queryKey 공유 · KRW ledger rows settlement-only · `FiatHintDisclaimer` 1× per surface

**증거:** `gate:ai-impl` `wallet-fiat-hint` **9/9** · `product/surfaces/wallet` **60/60** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-page-wallet-fiat-hint` `[x]`** — §13.1.4.4 Wallet/Ledger wire · **NEXT `p9-trade-fiat-hint-wire`**

## Fiat Money Display Hint (`p4-fiat-money-display-hint` · §13.1.4.3 · §20.13.2 Fiat#5 · YAML #162) — `[x]` DONE · 재착수 금지

**Implemented:** `product/primitives/money-display-with-fiat-hint.tsx` — `MoneyDisplayWithFiatHint` · `FiatHintDisclaimer` · `MoneyDisplayWithFiatHintSlot` · primary `MoneyDisplay` + secondary `toFiatHint` span · `trade.fiatHint.asOf` tooltip · stale badge · disclaimer slot · `formatFiatHintAsOfTime`

**증거:** `gate:ai-impl` `money-display-with-fiat-hint` **9/9** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-money-display-hint` `[x]`** — §13.1.4.3 FiatHint primitive · **NEXT `p4-page-wallet-fiat-hint`**

## Fiat Hint Display Contract (`p4-fiat-hint-display-contract` · §13.1.4.3 · §20.13.2 Fiat#4 · YAML #161) — `[x]` DONE · 재착수 금지

**Implemented:** `fiat-reference-display-contract.ts` — `toFiatHint` · `LOCALE_FIAT_MAP` (ko→KRW · en→OFF · ja→JPY slot) · `formatFiatHintAmount` · `resolveLocaleTargetFiat` · `FIAT_HINT_I18N_KEYS` · i18n `trade.fiatHint.*` (ko/en) · `trade-i18n-surface-display-contract` wired keys

**증거:** `gate:ai-impl` `domain` **478/478** · `fiat-hint-display-contract` **9/9** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-hint-display-contract` `[x]`** — §13.1.4.3 FiatHint layer · **NEXT `p4-fiat-money-display-hint`**

## Fiat Reference Rates Hook (`p4-fiat-reference-rates-hook` · §13.1.4.2 · §20.13.2 Fiat#3 · YAML #160) — `[x]` DONE · 재착수 금지

**Implemented:** `features/money/fiat-reference-rates-lib.ts` · `use-fiat-reference-rates.ts` · 3-tier fallback (primary snapshot/oracle · secondary median-of-N · tertiary last-known-good) · pair TTL USDT/KRW **15m** · PHON/USDT **5m** · wallet `['exchange-rate', base, quote, 'active']` queryKey 공유 · `use-wallet-data` · `use-krw-deposit-controller` migrated

**증거:** `gate:ai-impl` `features/money` **20/20** · `fiat-reference-display-contract` **14/14** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-reference-rates-hook` `[x]`** — §13.1.4.2 rate layer hook · **NEXT `p4-fiat-hint-display-contract`**

## Currency Precision SSOT (`p4-fiat-currency-precision-ssot` · §13.1.4.1 · §20.13.2 Fiat#2 · YAML #159) — `[x]` DONE · 재착수 금지

**Implemented:** `currency-precision-display-contract.ts` · PHON/USDT/KRW/BTC `{decimals, rounding_mode}` · `@phonara/money` `toFixed` sync · `formatCurrencyPrecisionDisplay` · `currency-precision-display-audit-lib` inline `.toFixed(8)` grep gate

**증거:** `gate:ai-impl` `currency-precision-display-contract` **15/15** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-currency-precision-ssot` `[x]`** — §13.1.4.1 presentation precision SSOT · **이후 Fiat#3 `[x]`** · **NEXT `p4-fiat-hint-display-contract`**

## Fiat Reference Preflight (`p4-fiat-reference-preflight` · §13.1.4 · §20.13.2 Fiat#1 · YAML #158) — `[x]` DONE · 재착수 금지

**Implemented:** `fiat-reference-display-contract.ts` · `FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY` · settlement vs hint fiat codes · ComplaintRisk `fiat-hint-*` **5행** · `fiat-reference-display-audit-lib` naming+settlement leak grep gate

**증거:** `gate:ai-impl` `fiat-reference-display-contract` **12/12** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-reference-preflight` `[x]`** — §13.1.4 display_only boundary · **이후 Fiat#2–3 `[x]`** · **NEXT `p4-fiat-hint-display-contract`**

**Implemented:** `concurrent_wallet_race_test.sql` — wallet `FOR UPDATE` · position `FOR UPDATE` · OI advisory lock invariants · live branches: double-lock · futures margin race · user-close vs service-liquidation sweep · withdrawal double-lock · grand-total Σ=0 · hash-chain

**증거:** `concurrent_wallet_race_test.sql` **5/5** (E4-0..E4-4) · `test:sql` **103/103** · `stack:push-remote` · advisor **0 ERROR** · migration **0** (test-only)

**마지막 완료:** **`launch-engine-e4-concurrent-race-test` `[x]`** — Go/No-Go FAIL #4 closed · **NEXT `p4-fiat-reference-preflight`**

## Launch E3 Ops Telegram Webhook (`launch-engine-e3-ops-telegram-webhook` · §20.14 #156) — `[x]` DONE · 재착수 금지

**Implemented:** `ops_notify_outbox` · … · edge `ops-notify` (**ntfy 1순위** + Telegram + HMAC webhook + fallback + outbound replay) · cron `phonara_ops_notify` + digest `0 3,13 * * *` (12:00/22:00 KST)

**증거:** `ops_notify_e3_test.sql` **2/2** · `test:sql` **102/102** · `stack:push-remote` · advisor **0 ERROR** · edge deploy `ops-notify` · `stack:verify-worldno1-edge` **9/9** · `stack:test-ops-pager` E2E **sent:1** · ntfy `ops-ntfy-dispatch` Deno **4/4**

**마지막 완료:** **`launch-engine-e3-ops-telegram-webhook` `[x]`** — Go/No-Go FAIL #3 closed · **NEXT `launch-engine-e4`**

## Launch E2 Admin Halt Market (`launch-engine-e2-admin-halt-market` · §20.14 #155) — `[x]` DONE · 재착수 금지

**Implemented:** `rpc_admin_halt_market` · `rpc_admin_list_trade_market_breakers` · `rpc_resume_market` audit 강화 (AAL2 · reason mandatory · before/after snapshot · immutable `audit_logs`) · Admin `/ops` market circuit breaker desk

**증거:** `admin_halt_market_e2_test.sql` **2/2** · `test:sql` **101/101** · `stack:push-remote` · advisor **0 ERROR** · `gate:ai-impl` admin-ops **1/1**

**마지막 완료:** **`launch-engine-e2-admin-halt-market` `[x]`** — Go/No-Go FAIL #2 closed · **이후 E3 `[x]`** · **현재 NEXT `launch-engine-e4`**

## Launch E1 Liquidation Notify (`launch-engine-e1-liquidation-notify` · §20.14 #154) — `[x]` DONE · 재착수 금지

**Implemented:** `_notify_position_liquidated` · `_settle_futures_position` liquidated branch → `notification_outbox` `trade_position` · inbox read/display wire · i18n `notif.liquidated.*` (기존 catalog)

**증거:** `liquidation_notify_e1_test.sql` **2/2** · `test:sql` **100/100** · `stack:push-remote` · advisor **0 ERROR** · `notifications-center-display-contract` **5/5**

**마지막 완료:** **`launch-engine-e1-liquidation-notify` `[x]`** — Go/No-Go FAIL #1 closed · **NEXT `launch-engine-e2` `[x]`**

## P9 Trade World-Class GATE (`p9-gate-trade-world-class` · §20.13 #153) — `[x]` DONE · 재착수 금지

**Implemented:** `p9-gate-trade-world-class-display-contract` · `assertP9TradeWorldClassGateSync` · §22.2.1 Tier-A pending 0 · §22.2.3 dedup 0 · §13.1.1 trade dual-currency rows phonara yes · §32.7 H1–H4 P9 trade PASS · §13.1.3 HowItWorks mounted · parity matrix sync (cross-margin · one-way · tier-fee · futures-table-columns)

**증거:** `gate:ai-impl` `p9-gate-trade-world-class-display-contract` **6/6** · `trade-layout-dedup-contract` **9/9** · `trade-action-path-contract` **6/6** · `trade-exchange-parity-display-contract` **29/29** · trade surfaces **122/122** · `typecheck` · `check:i18n` · `check:release` · `check:ui-architecture` · `check:phase-r-guards --strict`

**마감 게이트 (정본):**

```powershell
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/p9-gate-trade-world-class-display-contract.test.ts
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/trade-layout-dedup-contract.test.ts
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/trade-action-path-contract.test.ts
bun run gate:ai-impl -- --test apps/web/src/product/surfaces/trade
```

**마지막 완료:** **`launch-engine-e3-ops-telegram-webhook` `[x]`** — ops Telegram pager · SQL **102/102** · remote advisor 0 · **NEXT `launch-engine-e4`**

**이전 완료:** **`p9-gate-trade-world-class` `[x]`** — WORLD step **28** · §22.2.1–§22.2.3 · §13.1.1 · §32.7 H1–H4 bundle green

**이전 완료:** **`p9-operator-visual-signoff` agent impl `[x]`** — `p9-trade-visual-signoff.test.tsx` **29/29** · contract **5/5** · §13.1.1 dual-currency · dead control 0 · G7 cross-margin canary · `gate:ai-impl` trade+staking **168/168** · §82 doc sync → **NEXT `p9-gate-trade-world-class`**

**세션 규칙:** todo 1개 · step green 후 다음 · Tier-B(hedge·reduce-only·spot limit) UI **금지** · Launch E1–E4 = `[LAUNCH·ENGINE]` bugfix migration (§20.14)

## Fiat Reference 큐 (§20.13.2 · YAML #158–167 · Launch E1–E4 **끝난 뒤** 순차)

**착수:** **`p10-page-sports` `[x]`** · **NEXT `p10-sports-fiat-hint-wire` (#169)** · To-do 순서대로 1개씩

```text
#158  p4-fiat-reference-preflight          [x]
#159  p4-fiat-currency-precision-ssot      [x]
#160  p4-fiat-reference-rates-hook          [x]
#161  p4-fiat-hint-display-contract          [x]
#162  p4-fiat-money-display-hint          [x]
#163  p4-page-wallet-fiat-hint          [x]
#164  p9-trade-fiat-hint-wire          [x]
#165  p7-earn-fiat-hint-co-primary          [x]
#166  p5-page-settings-fiat-reference          [x]
#167  p4-gate-fiat-reference-world-class          [x]
#168  p10-page-sports                    [x]
#169+ P10 (NEXT `p10-sports-fiat-hint-wire`)
```

## P9 Trade Base GATE (`p9-gate-trade` · §20.13) — `[x]` DONE · 재착수 금지

**Implemented:** `P9_TRADE_REGISTERED_ROUTES` manifest (5 routes) · `p9-gate-trade-contract` · tradeSubnav dead link 0 · earnSubnav staking chip visible · `use-trade-error-toast` 삭제 → controller `productToast` strict (§3.4) · first-trade education wired (`TradeFirstVisitEducationGate` · §32.5) · P7 regression `p7-growth-gate-contract` staking chip 갱신

**증거:** `gate:ai-impl` vitest **79/79** (trade · staking surfaces · domain contracts · `p9-gate-trade-contract` 6/6 · `subnav-route-manifest` · `trade-first-visit-education` · P8 regression) · `check:ui-architecture` green · `typecheck` · `check:i18n` · `check:release`

**P9 impl bundle:** `/trade` spot · `/trade/futures` · `/trade/positions` · `/trade/orders` · `/staking` · `/staking/positions` · first-visit education sheet

**마감 게이트 (정본):**

```powershell
bun run gate:ai-impl -- --test apps/web/src/product/surfaces/trade apps/web/src/product/surfaces/staking apps/web/src/features/trading apps/web/src/features/earn/use-staking-page-controller.ts apps/web/src/features/earn/use-staking-positions-page-controller.ts apps/web/src/features/trade apps/web/src/domain/__tests__/p9-gate-trade-contract.test.ts apps/web/src/domain/__tests__/staking-display-contract.test.ts apps/web/src/domain/__tests__/p7-growth-gate-contract.test.ts apps/web/src/domain/__tests__/p8-core-gate-contract.test.ts apps/web/src/product/shell/__tests__/subnav-route-manifest.test.ts
```

**이전 완료 (P9 VISUAL):** **`p9-operator-visual-signoff` `[x]`** — `p9-trade-visual-signoff.test.tsx` **29/29** · contract **5/5** · §13.1.1 dual-currency · dead control 0 · G7 cross-margin canary · `gate:ai-impl` trade+staking **168/168**

**이전 완료:** **`p9-trade-audit-remediation-a1` `[x]`** — `filterSpotDeskOpenOrders` whitelist · `spotOpenOrders` · mobile cancel wire · `cancel-spot-open-order` registry · PHONUSDT-PERP/BTCUSDT-SIM excluded · filter+cancel 동일 PR · `gate:ai-impl` spot-desk · `trade-action-path-contract` · `spot-stake-display-contract` green · §82 doc sync → **NEXT `p9-trade-audit-remediation-a2`**

**이전 완료:** **`p9-trade-i18n-surface-audit` `[x]`** — `trade-i18n-surface-display-contract` · `TRADE_I18N_DEFER_RULES` (Tier B/C owner todos) · catalog 386 keys wired|defer 0 unclassified · `trade.order.balancePercent` aria on balance chips · external-exchange-copy ComplaintRisk live · parity `i18n-surface-audit` DONE · `gate:ai-impl` i18n audit **5/5** · §82 doc sync → **NEXT `p9-trade-audit-remediation-a1`**

**이전 완료:** **`p9-trade-settings-prefs-wire` `[x]`** — `trade-settings-prefs-display-contract` · settings hub one-click + confirm toggles · spot/futures `requestSubmit*` reads prefs only · existing ConfirmDialog single layer · mutual exclusivity · `gate:ai-impl` trade+settings **174/174** · §82 doc sync → **NEXT `p9-trade-layout-dedup-gate`**

**이전 완료:** **`p9-trade-mobile-futures-book-tab` `[x]`** — `TradeDeskMobileTradeStack` order|book subtab · `SpotOrderBookPanel` + `TradeRecentTradesRail` mobile book · spot/futures parity · sticky CTA order subtab only · lg+ book rail 0 duplicate on `<lg` · `trade-mobile-layout-display-contract` · parity `mobile-futures-book-tab` DONE · `gate:ai-impl` trade **114/114** · §82 doc sync → **NEXT `p9-trade-settings-prefs-wire`**

**이전 완료:** **`p9-trade-mobile-history-tab` `[x]`** — `trade-mobile-layout-display-contract` · `TradeDeskMobileTabs` chart|trade|positions|history 4-tab · `<lg` dock 0 · sticky CTA 1 (`trade-desk-mobile-sticky-cta`) · `TradeDeskMobileHistoryStack` same panels as dock · spot/futures desk extend-only · parity mobile-tabs zone DONE · `gate:ai-impl` trade **113/113** · §82 doc sync → **NEXT `p9-trade-mobile-futures-book-tab`**

**이전 완료:** **`p9-trade-ultra-layout` `[x]`** — `trade-ultra-layout-display-contract` · `trade-desk-page-shell` · `trade-desk-layout.css` @container · `--ds-panel-min` 3-panel grid (chart 50%) · `--ds-content-max` shell · `trade-desk-table-scroll` overflow 0 at 1280+ container · spot/futures desk extend-only · parity `ultra-2560-layout` DONE · `gate:ai-impl` trade ultra + parity green · §82 doc sync → **NEXT `p9-trade-mobile-history-tab`**

**이전 완료:** **`p9-trade-oracle-circuit-banner` `[x]`** — `TradeMarketStatusBanner` single mount · kill/circuit/stale priority · spot/futures desk wire · `trade-market-status-display-contract` · ComplaintRisk `duplicate-status-banner` → live · parity `oracle-circuit-banner` DONE · `gate:ai-impl` trade market status green · §82 doc sync → **NEXT `p9-trade-ultra-layout`**

**이전 완료:** **`p9-trade-tier-fee-display` `[x]`** — `TradeTierFeeBadge` VIP badge + `tier_fee` HelpTip · `rpc_get_earn_hub_status.tier` read · est fee numeric = ticket-density only · `tier-fee-display-contract` · parity `tier-fee-badge` partial · ComplaintRisk `duplicate-est-fee-row` → live · `gate:ai-impl` futures-order-ticket **20/20** · spot-order-ticket · tier-fee · parity **31/31** · §82 doc sync → **NEXT `p9-trade-oracle-circuit-banner`**

**이전 완료:** **`p9-trade-funding-history-display` `[x]`** — header `funding_rates.rate` only · dock history sub-tab `TradeFundingHistoryPanel` · `useFundingPayments` · `funding-history-display-contract` · parity `funding-rate-history` DONE · ComplaintRisk `funding-history-missing` → live · `gate:ai-impl` funding+dock+parity **38/38** · §82 doc sync → **NEXT `p9-trade-tier-fee-display`**

**이전 완료:** **`p9-trade-cross-margin-canary` `[x]`** — `MarginModeSegment` canary wire · `feature_cross_margin_enabled` ON=live cross selector · OFF=disabled+`trade.margin.crossDisabled` · `CROSS_MARGIN_CANARY_WAVE` · `useTradeLaunchFlags` · parity sync assert · `gate:ai-impl` futures-order-ticket **20/20** · margin-mode-display **3/3** · §82 doc sync → **NEXT `p9-trade-funding-history-display`**

**이전 완료:** **`p9-trade-position-mode-label` `[x]`** — `PositionModeFixedLabel` · `MarginModeSegment` · one-way fixed label + HelpTip · account-scoped margin copy · hedge toggle built_hidden (E21) · `position_mode`/`margin_mode` HelpTip · `gate:ai-impl` futures-order-ticket **17/17** · beginner-language **7/7** · §82 doc sync → **NEXT `p9-trade-cross-margin-canary`**

**이전 완료:** **`p9-trade-beginner-help-layer` `[x]`** — `TradeHowItWorksPanel` · `TradeHelpTip` · spot/futures/staking HowItWorks · 13 HelpTip terms wired · trade subnav `trade.subnav.help.*` · `trade-beginner-language-display-contract` **7/7** · beginner-help **2/2** · `gate:ai-impl` trade **90/90** · §82 doc sync → **NEXT `p9-trade-position-mode-label`**

**이전 완료:** **`p9-trade-order-ticket-density` `[x]`** — `futures-order-ticket` · `spot-order-ticket` extend-only · OKX balance % chips · est fee/liq/margin rows · §13.1.1 USDT/PHON margin selector → `p_margin_currency` · avail switch · desk dual balance · open orders `margin_currency` column · `order-ticket-display` · ComplaintRisk `futures-margin-phon-hidden` → live · parity dual currency → yes · `gate:ai-impl` trade **90/90** · order-ticket-display **4/4** · §82 doc sync → **NEXT `p9-trade-beginner-help-layer`**

**이전 완료:** **`p9-trade-leverage-slider-ux` `[x]`** — `LeverageControl` extend-only · OKX/Binance preset chips (1x·5x·10x·20x·Max) + slider · `max_leverage` RPC cap clamp · high-leverage risk ack 유지 · parity `leverage-slider` → DONE · `gate:ai-impl` futures-order-ticket **5/5** · leverage-control-display **4/4** · §82 doc sync → **NEXT `p9-trade-order-ticket-density`**

**이전 완료:** **`p9-trade-futures-unrealized-pnl` `[x]`** — `FuturesPositionsPanel` extend-only · unrealized PnL + ROE columns (oracle mark via `compute-position-display-metrics`) · realized PnL column for closed · dock + `/trade/positions` mark wire · ComplaintRisk `pnl-dash` → live · parity `unrealized-pnl` → DONE · `gate:ai-impl` futures-positions-panel + parity **11/11** · §82 doc sync → **NEXT `p9-trade-leverage-slider-ux`**

**이전 완료:** **`p9-trade-futures-margin-adjust-ui` `[x]`** — `FuturesPositionsPanel` extend-only · isolated margin adjust ConfirmDialog (add/remove + amount) · dock + `/trade/positions` same panel props · `rpc_adjust_isolated_margin` wire · cross positions hidden · ComplaintRisk `margin-adjust-ui` → live · parity `margin-adjust` → DONE · `gate:ai-impl` trade surfaces **73/73** · §82 doc sync → **NEXT `p9-trade-futures-unrealized-pnl`**

**이전 완료:** **`p9-trade-futures-partial-close-ui` `[x]`** — `FuturesPositionsPanel` extend-only · partial close ratio ConfirmDialog (25/50/75%) · dock + `/trade/positions` same panel props · `rpc_partial_close_futures` wire · ComplaintRisk `partial-close-ui` → live · `gate:ai-impl` trade surfaces **67/67** · §82 doc sync → **NEXT `p9-trade-futures-margin-adjust-ui`**

**이전 완료:** **`p9-trade-orderbook-parity` `[x]`** — `SpotOrderBookPanel` extend-only · grouping selector · spread row · depth total column · click→ticket (`onBookPriceClick` futures wire) · `order-book-display` spread/grouping helpers · no `futures-order-book-panel` · `gate:ai-impl` trade surfaces green · §82 doc sync → **NEXT `p9-trade-futures-partial-close-ui`**

**이전 완료:** **`p9-trade-recent-trades-rail` `[x]`** — `TradeRecentTradesRail` lg+ book column ×1 · `useReferencePriceTicks` · collapsible · reference disclosure · no full-width duplicate · `gate:ai-impl` trade surfaces **58/58** · §82 doc sync → **NEXT `p9-trade-orderbook-parity`**

**이전 완료:** **`p9-trade-terminal-bottom-dock` `[x]`** — `TradeDeskBottomDock` lg+ single owner · positions close · orders cancel · fills history · inline lg+ `FuturesPositionsPanel` removed · mobile tabs only · `useFuturesDeskWire` close/fills wire · `gate:ai-impl` trade surfaces **55/55** · §82 doc sync → **NEXT `p9-trade-recent-trades-rail`**

**이전 완료:** **`p9-trade-fills-history-wire` `[x]`** — `useTradingOrderFills` · `trade-fills-history-panel` · `/trade/orders` history tab · §22.2.4 RPC rows · `margin_currency` column · tabular nums · `gate:ai-impl` trade surfaces **51/51** · §82 doc sync → **NEXT `p9-trade-terminal-bottom-dock`**

**이전 완료:** **`p9-trade-chart-overlays-lwc` `[x]`** — candle/line toggle · MA7/EMA21 · crosshair OHLC legend · oracle/liq priceLine · fullscreen · display-only RPC boundary · `gate:ai-impl` chart+parity **39/39** · §82 doc sync

**이전 완료:** **`p9-trade-chart-pro-lwc` `[x]`** — LWC v5 `chart/*` · crosshair MagnetOHLC · wheel/touch · fitContent reset · volume histogram · interval 1m–1d · majors WS + PHON `rpc_get_candles` · display-only disclosure · `gate:ai-impl` chart+parity **30/30** · §82 doc sync

**이전 완료:** **`p9-trade-ticker-header-wire` `[x]`** — `useMarketTickerDisplay` · `format-ticker-display` · `TradeMarketTickerStats` · spot/futures header change/high/low/vol(OI) · collapsible mobile advanced row · i18n `trade.change24` 등 header subset · `gate:ai-impl` trade surfaces **29/29** · §82 doc sync

**이전 완료:** Plan **38.5차** 정본 sync · **`p9-trade-spot-pair-wire` `[x]`** — `spot-stake-display-contract` · `use-spot-desk-wire` pair selector · §13.1.1 stake rules · `gate:ai-impl` spot-stake+spot-desk **10/10** · §82 doc sync

**이전 완료:** Plan **37차** §13.1.2 · **`p9-trade-parity-matrix-sync` `[x]`** — `gate:ai-impl` trade-exchange-parity **21/21**

**이전 완료:** Plan **35차** §32.7 Operator Zero-Complaint 흡수 · `p9-world-preflight` YAML `[x]`

**이전 완료:** `p9-gate-trade` — Implemented: trade+staking wire · manifest `/trade/*` + `/staking/*` · §3.4 productToast strict · §32.5 education · §82 doc sync

**이전 완료:** `p8-operator-visual-signoff` — **VISUAL APPROVED** · §20.12 · §22.2 Earn+Home · `/home` · `/notifications` · `/settings/*` · `/account` · 390/768/1024 · axe critical 0 · dead control 0 · `gate:ai-impl` vitest **24/24** · `p8-core-visual-signoff-display-contract` · `deploy:pages:web:preview` → https://preview.phonara-web.pages.dev · §82 doc sync

## P8 Core Part GATE (`p8-gate-core` · §20.13 #113)

**Implemented:** `P8_CORE_REGISTERED_ROUTES` manifest (11 routes) · `p8-core-gate-contract` · §3.4.2 inbox/prefs/toast separation · `emitNotification` → `productToast.showText` · sonner glue `toast-zone.tsx` only · P7 regression `p7-growth-gate-contract` green

**증거:** `gate:ai-impl` vitest **145/145** (home · settings 7 surfaces · account hub/profile · notifications · domain contracts · `p8-core-gate-contract` 7/7 · `subnav-route-manifest`) · `check:ui-architecture` green · `typecheck` · `check:i18n` · `check:release`

**P8 impl bundle (#103–#112 · 재착수 금지):** `/home` · `/notifications` · `/settings` + `/settings/*` (account · preferences · referral · notifications prefs · api-keys STUB) · `/account` · `/account/profile`

**마감 게이트 (정본):**

```powershell
bun run gate:ai-impl -- --test apps/web/src/product/surfaces/home/__tests__/earn-home-page.test.tsx apps/web/src/product/surfaces/settings apps/web/src/product/surfaces/account/__tests__/account-hub-page.test.tsx apps/web/src/product/surfaces/account/__tests__/account-profile-page.test.tsx apps/web/src/product/surfaces/notifications apps/web/src/features/earn/__tests__/use-earn-home-page-controller.test.ts apps/web/src/features/settings apps/web/src/features/account/__tests__/use-account-hub-controller.test.ts apps/web/src/features/account/__tests__/use-account-profile-controller.test.ts apps/web/src/domain/__tests__/p8-core-gate-contract.test.ts apps/web/src/domain/__tests__/p7-growth-gate-contract.test.ts apps/web/src/domain/__tests__/earn-home-display-contract.test.ts apps/web/src/domain/__tests__/notifications-center-display-contract.test.ts apps/web/src/domain/__tests__/notifications-pwa-display-contract.test.ts apps/web/src/domain/__tests__/settings-hub-display-contract.test.ts apps/web/src/domain/__tests__/settings-account-display-contract.test.ts apps/web/src/domain/__tests__/settings-api-keys-display-contract.test.ts apps/web/src/domain/__tests__/settings-notifications-display-contract.test.ts apps/web/src/domain/__tests__/settings-preferences-display-contract.test.ts apps/web/src/domain/__tests__/settings-referral-display-contract.test.ts apps/web/src/domain/__tests__/account-hub-display-contract.test.ts apps/web/src/domain/__tests__/account-profile-display-contract.test.ts apps/web/src/product/shell/__tests__/subnav-route-manifest.test.ts
```

**마지막 완료:** `p8-operator-visual-signoff` — **VISUAL APPROVED** · §20.12 · §22.2 Earn+Home · `/home` · `/notifications` · `/settings/*` · `/account` · 390/768/1024 · axe critical 0 · dead control 0 · `gate:ai-impl` vitest **24/24** · `p8-core-visual-signoff-display-contract` · `deploy:pages:web:preview` → https://preview.phonara-web.pages.dev · §82 doc sync

**이전 완료:** `p8-gate-core` — Implemented: `gate:ai-impl` **145/145** · §12.19.6 P8 manifest dead link 0 · §3.4.2 notification 3-channel · §82 doc sync

**이전 완료:** `p8-page-home` — `/home` `EarnHomePage` · §28.7 ambient · vitest **10/10** · manifest drift 0

**이전 완료:** `p7-gate-growth` — Implemented: `gate:ai-impl` vitest **82/82** (earn · home/referral/share/tier surfaces · domain contracts · `p7-growth-gate-contract` · `subnav-route-manifest`) · §12.19.6 P7 routes dead link 0 · §13.5.5 `mergeE12MissionItems` reward_phon parity · §3.4.3 onboarding D0 hub duplicate claim 0 · `check:ui-architecture` green · §82 doc sync

**이전 완료:** `p7-page-share-earnings` — Implemented: `gate:ai-impl` vitest **23/23** (earn) + domain/surface/manifest **19/19** · `/share/earnings` · canvas OG card · `rpc_get_golden_earth_status.earned_phon_today` + `rpc_get_earn_hub_status` tier display · Web Share · PNG export · post-share `share_referral_link` · `viral_streak_share` claim · earn subnav manifest sync

**이전 완료:** `p7-tier-benefits-narrative` — Implemented: `gate:ai-impl` vitest **7/7** (domain) + **2/2** (controller) + **2/2** (surface) · `/tier/benefits` narrative block · `tier.benefits.narrative.*` i18n ko+en · PHON 단일지갑+미션+추천 3-step story · `rpc_get_earn_hub_status` tier/XP display only

**이전 완료:** `p7-page-tier-benefits` — Implemented: `gate:ai-impl` vitest **21/21** (earn) + domain/surface **28/28** · `/tier/benefits` · unified tier matrix · decay policy · gap 혜택 미노출 · `rpc_get_earn_hub_status` current-tier highlight · earn subnav manifest sync

**이전 완료:** `p7-page-tier-me` — Implemented: `gate:ai-impl` vitest **19/19** (tier-me contract · controller · page · manifest) · `/tier/me` · `rpc_get_earn_hub_status` · decay UX (presentation until E1) · `tier_keep_status` claim · earn subnav manifest sync

**이전 완료:** `p7-page-home-missions-referral` — Implemented: `gate:ai-impl` vitest **11/11** (referral contract · controller · page) · `/home/missions/referral` · curated referral-only missions (`viral-partnerHubVisit` · `tier-reachSilver` · `tier-reachGold`) · viral+repeatable claim · `rpc_get_earn_hub_status` tier/referral read · `invite_3_friends` one-shot read

**이전 완료:** `p7-page-home-missions-invite` — Implemented: `gate:ai-impl` vitest **10/10** (invite contract · controller · page) · `/home/missions/invite` · curated viral invite missions · `rpc_get_viral_mission_status` · referral hub read · onboarding D2/D3 handoff

**이전 완료:** `p7-page-home-attendance` — Implemented: `gate:ai-impl` vitest **19/19** (attendance contract · controller · page · manifest) · `/home/attendance` · `rpc_claim_daily_reward` · streak cycle · RoutineCard · earn subnav manifest sync

**이전 완료:** `p7-page-home-missions` — Implemented: `gate:ai-impl --test apps/web/src/product/surfaces/home/__tests__/home-missions-page.test.tsx` vitest **4/4** · `gate:ai-impl --test apps/web/src/features/earn/__tests__/use-home-missions-page-controller.test.ts` · `check:ui-architecture` green · `/home/missions` hub tabs · manifest sync

**이전 완료:** `p7-page-referral-invite` — Implemented: `gate:ai-impl --test apps/web/src/product/surfaces/referral/__tests__/referral-invite-page.test.tsx` vitest **4/4** · Web Share canonical · `/referral/invite` · manifest sync

**이전 완료:** `p7-page-referral` — `/referral` surface · earn subnav manifest

**이전 완료:** `p6-operator-visual-signoff` — **VISUAL APPROVED** · §20.12 · §12.19.5 AppShell · BottomNav·TopBar·EarnShell · 5탭 IA · 390/768/1024 · axe critical 0 · dead control 0 · `gate:ai-impl` vitest **33/33** · `check:ui-architecture` green · `check:design-tokens` advisory · `deploy:pages:web:preview` → https://preview.phonara-web.pages.dev

**이전 완료:** `p3-operator-visual-signoff` — **VISUAL APPROVED** · §20.12 · §22.2 Landing+Auth · 390/768/1024 · axe critical 0 · dead control 0 · `gate:ai-impl` vitest **46/46** · `check:design-tokens` advisory · `deploy:pages:web:preview` → https://preview.phonara-web.pages.dev

**이전 완료:** `p6-doc-platform-canon-sync` — §32 GLOBAL_EXPANSION · ONBOARDING_JOURNEY · PLATFORM_NARRATIVE SSOT sync · display contracts 3종 · ENGINE_GAP_ADR index · `gate:ai-impl` domain vitest 10/10 · `check:ai-reference` green

**이전 완료:** `p6-gate-shell` — Implemented: `gate:ai-impl --test apps/web/src/product/shell` · `resilience-grammar.test.tsx` 5/5 · `check:ui-architecture` green · sonner glue 0 · subnav dead link 0

**이전 완료:** `p6-page-offline` — Implemented: `gate:ai-impl --test apps/web/src/features/pwa/__tests__/pwa-sw-update.test.ts` · vitest 4/4 · `pwa-shell.test.tsx` 2/2 · `typecheck` · `check:release`

**출시 결함 0 + World-Class + Operator trust + Admin 33차:** §3.4 · §3.5 · §12.19.6 · §13.11 · §24.4–§24.7 · §29.5 · §32 · §32.5–§32.6 · E0–E10
