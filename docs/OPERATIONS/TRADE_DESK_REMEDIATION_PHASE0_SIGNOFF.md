# Trade Desk Remediation — Phase 0 Operator Signoff

> **Execute SSOT:** Cursor Plan `trade_desk_remediation_v3` (v4.2 FINAL)  
> **Phase:** 0D · S1·S2·S3 operator 서명 (§E 템플릿)  
> **선행:** Phase 0E preflight green (`phase-0-preflight` completed)  
> **다음:** Phase 0C GO 판정 (S1~S3 + 0A + 0B + 0E)

---

## §E — Phase 0 GO 서명 (filled)

```text
[PHONARA Trade Desk · Phase 0 GO]

S1 Spot orders: (x) A. T1 limit/stop full  ( ) B. market-only
S2 Funding 소급: (x) A. 소급 없음  ( ) B. accrue만  ( ) C. 소급 payout
S3 PHON oracle: (x) internal 1min cron + admin override + PERP mirror

서명: PHONARA operator  날짜: 2026-07-07
```

---

## 결정 요약

| ID     | 선택                                                  | 의미                                                                                                                  | 착수 블로커 해제              |
| ------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **S1** | **A. T1 limit/stop full**                             | Spot limit/stop/cancel 전체 구현 (market-only 출시 안 함)                                                             | **T1** spot open orders       |
| **S2** | **A. 소급 없음**                                      | `feature_funding_enabled=false` 기간 cron accrual 데이터 **소급 정산 없음** · flag ON 이후 구간만 user-visible        | **T2-2** funding flag ON      |
| **S3** | **internal 1min cron + admin override + PERP mirror** | PHON 오라클 운영 주체 = internal cron · tick 1분 · admin manual override 허용 · PHONUSDT-PERP = PHON_USDT mark mirror | **T0-b** PHON internal oracle |

---

## 정책 상세 (플랜 §0D · §비즈니스 정책)

### S1 — Spot orders

- **패턴:** futures E2 `trading_open_orders` → `spot_open_orders` 미러 (T1).
- **UI:** market \| limit \| stop · open orders dock · cancel wire.
- **금지:** S1 없이 T1 schema/RPC/UI 착수.

### S2 — Funding 소급

- **DB CONFIRMED:** `feature_funding_enabled=false` 이지만 `trade-funding-accrual` cron live → rate/next_funding_at 갱신 가능.
- **선택 A:** flag OFF 기간 ledger leg **0** · ON 이후 accrual/payout만 user-visible.
- **금지:** S2 없이 T2-2 `feature_funding_enabled` ON rollout.

### S3 — PHON oracle

- **T0-a:** majors 20 × 3-source external (price-feed) — PHON **미포함**.
- **T0-b:** internal feed · 1min tick append · PERP mirror.
- **금지:** S3 없이 T0-b migration/EF 착수.

---

## Tier 0 GO 체크리스트 (잔여)

| 항목                          | 상태                 |
| ----------------------------- | -------------------- |
| 0E preflight green            | `[x]` completed      |
| **S1·S2·S3 서명 (0D)**        | **`[x]` 2026-07-07** |
| 0A DevTools + §0G Critical 5  | **`[x]` 2026-07-07** |
| 0B `test:sql` · `test:engine` | **`[x]` 2026-07-07** |
| Phase 0 **GO** (0C)           | `[ ]` pending        |

**GO 조건:** 위 표 전부 green → Phase 1 PR-2/PR-3 + T0-a 착수 허용.

---

## §0G — Critical 5 판정표 (Phase 0A · 2026-07-07)

> **재현 방식:** 코드 경로 정적 재현 + vitest (`gate:ai-impl` L0~L3).  
> **근거:** `apps/web/src/domain/__tests__/trade-desk-critical5-phase0-repro.test.ts` · `futures-order-ticket.test.tsx` (C5).  
> **DB 교차:** C3 PHON/BTC empty = remote `market_sources`/`price_ticks` 0 (플랜 §0 실측) + UI `trade-chart-empty` testid.

| ID     | 증상                       | 0A 재현 방법                                                                               | 판정          | 스크린/HAR                                                                                | PR       |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------- | -------- |
| **C1** | Futures kill → spot block  | admin `feature_futures_enabled=false` + spot ON → `use-spot-desk-wire` `tradeBlocked` true | **CONFIRMED** | `platform-gate-contract.ts:76` OR · `use-spot-desk-wire.ts:61-62,122` · vitest C1         | PR-2     |
| **C2** | Staking pools error 오표시 | tier RPC fail → `poolsError=true` (pools fetch 무관)                                       | **CONFIRMED** | `use-staking-page-controller.ts:184` · vitest C2                                          | PR-3     |
| **C3** | Chart empty PHON/BTC       | PHON: WS skip + oracle `[]` → `trade-chart-empty` · BTC: WS OK or RPC fallback `[]`        | **CONFIRMED** | `use-display-kline.ts:69-71` · `trade-chart-panel.tsx:187-194` · vitest C3                | PR-1A+T0 |
| **C4** | Stale 전면 block           | stale banner 표시 + submit `tradeBlocked` 동시 true (submit-only 분리 없음)                | **CONFIRMED** | `use-spot-desk-wire.ts:122` · `trade-market-status-display-contract.ts:64-69` · vitest C4 | PR-4     |
| **C5** | Futures submit 무메시지    | market + `preview:null` → submit disabled · inline reason 0                                | **CONFIRMED** | `futures-order-ticket.tsx:96-104,421-434` · vitest C5                                     | PR-5     |

**0A 판정 요약:** C1~C5 전 row **CONFIRMED** (코드 가설 → 정적 재현 green). 브라우저 HAR/스크린은 operator 선택 1회 advisory — CI/코드 경로와 불일치 시 재현 테스트 우선.

**Phase 0A 증거 (Implemented):**

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-critical5-phase0-repro.test.ts green
gate:ai-impl --test apps/web/src/product/surfaces/trade/__tests__/futures-order-ticket.test.tsx green (C5 row)
```

---

## Phase 0B — Engine smoke baseline (2026-07-07)

> **명령 (operator gate · 1 terminal · G1):** `supabase db reset` → `bun run test:sql` → `bun run test:engine` → RPC spot-check

| Gate                  | 결과              | 증거                                                                                       |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| `supabase db reset`   | green             | local migration apply clean (191 files)                                                    |
| `bun run test:sql`    | **103/103** · Σ=0 | `All 103 SQL test file(s) passed.`                                                         |
| `bun run test:engine` | **275/275**       | vitest 28 files · money · wallet-ledger · trading-engine · game-engine · sportsbook-engine |
| RPC spot-check        | green             | `scripts/trade-desk-phase0b-rpc-spotcheck.sql`                                             |

**RPC spot-check (metadata + smoke):**

| RPC                     | 확인                                        | 비고                                                       |
| ----------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `rpc_get_candles`       | EXISTS · authenticated EXECUTE · smoke `[]` | PHON_USDT 0 rows = DB baseline (T0 전) · 플랜 §0 실측 일치 |
| `rpc_spot_market_buy`   | EXISTS · authenticated EXECUTE              | `conservation_test.sql` 등 test:sql 커버                   |
| `rpc_place_limit_order` | EXISTS · authenticated EXECUTE              | `trade_open_orders_edge_test.sql` 커버                     |
| `rpc_stake`             | EXISTS · authenticated EXECUTE              | majors staking canonical                                   |
| `rpc_stake_phon`        | EXISTS · delegates → `rpc_stake`            | PHON-native wrapper                                        |

**Phase 0B 증거 (operator gate):**

```text
supabase db reset → green
bun run test:sql → 103/103 green
bun run test:engine → 275/275 green
scripts/trade-desk-phase0b-rpc-spotcheck.sql → Phase 0B RPC spot-check OK
```

---

## T0-e — Oracle ops runbook + PR-1B chart verify (2026-07-07)

> **산출:** [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md)  
> **Spot-check:** `scripts/trade-desk-t0e-oracle-ops-spotcheck.sql`  
> **SQL gate:** `supabase/tests/trade_t0e_oracle_ops_test.sql`

| 항목                  | 내용                                                          |
| --------------------- | ------------------------------------------------------------- |
| Symbol coverage audit | 20 majors × 3 sources = 60 · PHON external 0                  |
| Stale runbook         | oracle age > 300s → submit block · PHON cron + admin override |
| PR-1B PHON chart      | `rpc_get_candles` ≥ 2 bars · oracle-rpc-only feed             |
| PR-1B BTC chart       | `rpc_get_candles` ≥ 2 bars · WS + oracle fallback             |

**PR-1B Implemented (vitest):**

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-chart-mount-display-contract.test.ts green
gate:ai-impl --test apps/web/src/product/surfaces/trade/chart/__tests__/trade-chart-panel.test.tsx green (PR-1B mount rows)
```

**T0-e SQL gate:** `trade_t0e_oracle_ops_test.sql` — CI **sql** job authoritative after push.

---

## Phase 4 Launch RC — Closeout (`phase-4-closeout` · 2026-07-07)

> **산출:** [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](TRADE_DESK_LAUNCH_RC_SIGNOFF.md)  
> **Contract:** `apps/web/src/domain/trade-desk-launch-rc-display-contract.ts`  
> **Soak:** `scripts/trade-desk-launch-rc-soak-spotcheck.sql`

| Gate                                   | 결과                 | 증거                                                        |
| -------------------------------------- | -------------------- | ----------------------------------------------------------- |
| Complaint registry 100% (Launch scope) | agent + operator     | `assertTradeDeskLaunchRcSync` · P10 2 rows out-of-scope     |
| Toast registry 100% (T2 deferred only) | agent + operator     | `futures.sltp.updated` · `futures.funding.applied` deferred |
| 390/768/1024 layout + dead control 0   | agent + operator     | `p9-trade-visual-signoff.test.tsx` **41/41**                |
| security-auditor T0~T3                 | **PASS** · ERROR 0   | readonly audit 2026-07-07 · RISK LOW                        |
| CI check:full                          | **`[x]` operator**   | `fed305d` · quality·sql·e2e·advisors green 2026-07-07       |
| 24h prod soak                          | **`[x]` operator**   | soak spot-check WARNING 0 · remediate applied 2026-07-07    |
| **S4 LAUNCH RC APPROVED**              | **`[x]` 2026-07-07** | §E 서명                                                     |

**Phase 4 closeout evidence (Implemented + closeout):**

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-launch-rc-display-contract.test.ts green (6/6)
gate:ai-impl --test apps/web/src/product/surfaces/__tests__/p9-trade-visual-signoff.test.tsx green (41/41)
security-auditor readonly T0~T3 PASS (ERROR 0)
§82 doc sync — TRADE_DESK_LAUNCH_RC_SIGNOFF · ACTIVE_WORK_SSOT · 본 문서
```

---

## §E — Phase 4 Launch RC (S4 · Tier 2 · operator 서명)

```text
[PHONARA Trade Desk · Phase 4 Launch RC — Tier 2 완료 후]

S4 Launch RC: (x) 390/768/1024 signoff · (x) dead control 0 · (x) CI green · (x) 24h soak OK

서명: PHONARA operator  날짜: 2026-07-07
```

**LAUNCH RC APPROVED (S4):** 2026-07-07 — engineering signoff + security-auditor PASS.

**Verified/DONE (full Tier 2 LAUNCH):** S4 + CI quality·sql·e2e·advisors green + 24h soak OK — **2026-07-07**.

---

## 교차 참조

- Plan §0D · §E · §0G · §H Day 0 · T0-e · Phase 4
- [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](TRADE_DESK_LAUNCH_RC_SIGNOFF.md)
- [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md)
- [`OPERATOR_GATES.md`](../SSOT/OPERATOR_GATES.md)
- [`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md)
- [`TRADE_UX_CANON.md`](../SSOT/TRADE_UX_CANON.md)
