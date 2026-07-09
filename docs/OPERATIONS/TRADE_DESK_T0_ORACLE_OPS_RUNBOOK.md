# Trade Desk T0 — Oracle Ops Runbook (T0-e)

> **Execute SSOT:** Cursor Plan `trade_desk_remediation_v3` (v4.2 FINAL)  
> **Sub-wave:** T0-e · ops audit + PR-1B chart verify  
> **선행:** T0-a~d 각 sub-gate green · `stack:push-remote` · advisor 0 ERROR  
> **다음:** PR-1A/PR-4/PR-5 UI polish · T1 spot limit (S1 서명 후)

---

## 목적

T0-a~d로 복구한 **spot/PHON 오라클·차트 데이터**가 운영 중 drift 하지 않도록 일일/인시던트 감사 절차를 고정한다.  
PR-1B는 **PHON_USDT · BTC_USDT** spot 차트가 `candles.length >= 2` 로 mount 되고, 오라클 mark age가 **300s 미만**인지 확인한다.

**정산 경계 (non-waivable):** `rpc_get_candles` JSON은 **표시 전용**. Settlement RPC는 `oracle_prices` + `_assert_price_fresh` 만 사용 — T0-d grep gate 유지.

---

## 1. Symbol coverage audit (일일 · 배포 후 1회 필수)

Supabase SQL Editor 또는 `scripts/trade-desk-t0e-oracle-ops-spotcheck.sql` 실행.

### 1.1 Spot majors — external feed (T0-a)

```sql
-- 기대: 60 rows (20 active majors × binance/bybit/okx)
SELECT COUNT(*) AS major_sources
  FROM market_sources ms
  JOIN spot_markets sm ON sm.symbol = ms.internal_symbol AND sm.is_active
 WHERE ms.internal_symbol <> 'PHON_USDT'
   AND ms.provider IN ('binance', 'bybit', 'okx')
   AND ms.enabled = TRUE;
```

| 결과     | 조치                                                                           |
| -------- | ------------------------------------------------------------------------------ |
| **60**   | OK                                                                             |
| **< 60** | T0-a migration 재적용 · `trade_t0a_spot_market_sources_test.sql` red 원인 조사 |
| **> 60** | 중복 source row — `market_sources` dedupe 후 advisor                           |

### 1.2 PHON — external feed 없음 (S3)

```sql
SELECT internal_symbol, provider, enabled
  FROM market_sources
 WHERE internal_symbol IN ('PHON_USDT', 'PHONUSDT-PERP')
   AND provider IN ('binance', 'bybit', 'okx');
```

| 결과        | 조치                               |
| ----------- | ---------------------------------- |
| **0 rows**  | OK — PHON은 internal cron (T0-b)   |
| **any row** | 즉시 disable · S3 위반 · 보안 감사 |

### 1.3 Tick bootstrap (T0-c)

```sql
SELECT symbol, COUNT(*) AS tick_count, MAX(created_at) AS last_tick
  FROM price_ticks
 WHERE symbol IN ('PHON_USDT', 'BTC_USDT', 'PHONUSDT-PERP')
 GROUP BY symbol;
```

| symbol          | 기대                                |
| --------------- | ----------------------------------- |
| `PHON_USDT`     | tick_count ≥ 1                      |
| `BTC_USDT`      | tick_count ≥ 1                      |
| `PHONUSDT-PERP` | tick_count ≥ 1 · mark = PHON mirror |

---

## 2. Oracle stale runbook (300s threshold)

`market_circuit_breakers.staleness_seconds` 기본 **300**. `_assert_price_fresh` 초과 시 **submit block** (`stale_price`).

### 2.1 Freshness audit

```sql
SELECT symbol,
       price,
       updated_at,
       EXTRACT(EPOCH FROM (NOW() - updated_at))::INT AS age_seconds,
       (SELECT staleness_seconds FROM market_circuit_breakers mcb WHERE mcb.symbol = op.symbol) AS threshold
  FROM oracle_prices op
 WHERE symbol IN ('PHON_USDT', 'BTC_USDT', 'PHONUSDT-PERP')
    OR symbol IN (SELECT symbol FROM spot_markets WHERE is_active)
 ORDER BY age_seconds DESC
 LIMIT 30;
```

| age_seconds | UI                                 | Submit                    |
| ----------- | ---------------------------------- | ------------------------- |
| **≤ 300**   | 차트·배너 정상                     | 허용 (기타 gate OK 시)    |
| **> 300**   | stale 배너 (PR-4 submit-only 분리) | **block** · `stale_price` |

### 2.2 PHON internal cron (S3 · T0-b)

| 항목           | 값                                               |
| -------------- | ------------------------------------------------ |
| Cron job       | `phonara_phon_internal_oracle`                   |
| 주기           | 1분                                              |
| RPC            | `rpc_run_phon_internal_oracle()`                 |
| PERP mirror    | `PHONUSDT-PERP` mark = `PHON_USDT`               |
| Admin override | `rpc_update_oracle_price` (service_role / admin) |

**장애 시 순서:**

1. `SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'phonara_phon_internal_oracle') ORDER BY start_time DESC LIMIT 5;`
2. `app_config.phon_internal_oracle_enabled = true` 확인
3. 수동 1회: `SELECT rpc_run_phon_internal_oracle();` — tick append · PERP mirror 확인
4. 여전히 stale → Admin에서 PHON mark override (reason 필수 · audit row 확인)
5. Majors stale → `price-feed` edge function / pg_cron `phonara_price_feed` 로그 확인

### 2.3 Display vs settlement (T0-d)

- **차트 empty여도** forward-fill bar가 있으면 UI mount 가능
- **stale oracle + tick 0** → forward-fill 있어도 market buy **reject** (boundary SQL)
- Operator는 “차트는 보이는데 주문 안 됨”을 stale로 해석 — oracle age 먼저 확인

---

## 3. PR-1B — Spot chart verify (PHON + BTC)

### 3.1 RPC smoke (DB)

```sql
SELECT 'PHON_USDT' AS symbol, jsonb_array_length(rpc_get_candles('PHON_USDT', '1m', 10)) AS bars
UNION ALL
SELECT 'BTC_USDT', jsonb_array_length(rpc_get_candles('BTC_USDT', '1m', 10));
```

| symbol      | PR-1B pass   |
| ----------- | ------------ |
| `PHON_USDT` | bars **≥ 2** |
| `BTC_USDT`  | bars **≥ 2** |

자동 spot-check: `scripts/trade-desk-t0e-oracle-ops-spotcheck.sql`  
SQL suite: `supabase/tests/trade_t0e_oracle_ops_test.sql`

### 3.2 UI verify (operator · 1회 advisory)

| Route    | symbol    | Network           | 기대                                       |
| -------- | --------- | ----------------- | ------------------------------------------ |
| `/trade` | PHON_USDT | `rpc_get_candles` | chart mount · `trade-chart-empty` **없음** |
| `/trade` | BTC_USDT  | WS + RPC fallback | chart mount · `trade-chart-empty` **없음** |

**Vitest (Implemented):**

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-chart-mount-display-contract.test.ts
gate:ai-impl --test apps/web/src/product/surfaces/trade/chart/__tests__/trade-chart-panel.test.tsx
```

### 3.3 Feed strategy (코드 정본)

| Symbol      | Feed                               | 근거                                      |
| ----------- | ---------------------------------- | ----------------------------------------- |
| `PHON_USDT` | oracle RPC only                    | exchange WS skip · `use-display-kline.ts` |
| `BTC_USDT`  | Binance/Bybit WS → oracle fallback | `use-exchange-live-candles.ts` MIN_LIVE=2 |

---

## 4. T0-e 마감 체크리스트

| 항목                                 | Gate                                         | 상태  |
| ------------------------------------ | -------------------------------------------- | ----- |
| Symbol coverage 60 + PHON external 0 | spot-check / `trade_t0e_oracle_ops_test.sql` | `[ ]` |
| PHON/BTC `rpc_get_candles` ≥ 2 bars  | PR-1B SQL                                    | `[ ]` |
| Oracle age ≤ 300s (active symbols)   | §2.1 audit                                   | `[ ]` |
| PHON cron + PERP mirror              | `trade_t0b_*` test green                     | `[ ]` |
| Chart mount contract vitest          | PR-1B domain test                            | `[ ]` |
| 본 runbook operator 확인             | 문서                                         | `[ ]` |

**T0 전체 마감:** T0-a~e sub 각 green + security-auditor readonly (T0 money path).

---

## 5. 교차 참조

- [`TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md`](TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md) — S1~S3 · §0G Critical 5
- [`TRADE_DESK_FAILURE_RECOVERY_MATRIX.md`](TRADE_DESK_FAILURE_RECOVERY_MATRIX.md) — P4-A Tier1/2 · Oracle freeze escalation
- [`../SSOT/CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md) — heavy gate CI authoritative
- [`../SSOT/OPERATOR_GATES.md`](../SSOT/OPERATOR_GATES.md) — operator 「gate 실행」
- Plan §T0-e · PR-1B · Phase 4D oracle freshness soak

---

## 7. Oracle freeze vs lag — P4-A 교차 (operator)

> **정본:** [`TRADE_DESK_FAILURE_RECOVERY_MATRIX.md`](TRADE_DESK_FAILURE_RECOVERY_MATRIX.md) · 코드 [`trade-desk-failure-recovery-display-contract.ts`](../../apps/web/src/domain/trade-desk-failure-recovery-display-contract.ts)

| 분류            | SQL/신호                                       | UI                         | Submit | 본 runbook                  |
| --------------- | ---------------------------------------------- | -------------------------- | ------ | --------------------------- |
| **Lag (stale)** | §2.1 `age_seconds` **> threshold** (기본 300s) | `trade.dataStatus.stale*`  | block  | §2.1 · §2.3                 |
| **Freeze**      | age **≤ threshold** · mark **≥60s unchanged**  | `trade.dataStatus.freeze*` | block  | §1.3 tick alive · §2.2 cron |

**Freeze 인시던트 (4단계 · 15/30분 SLA):**

1. **탐지** — `trade-market-status-banner` `data-status-kind=freeze` · soak WARNING
2. **확인 (15분)** — §2.1 freshness + §1.3 tick — lag면 §2.2 cron/edge · freeze면 feed stuck (동일 가격 반복)
3. **승인 (30분)** — E0 `P4/incident-*.md` · §2.2 PHON cron / majors `price-feed` 로그
4. **공지** — i18n freeze copy only · false urgency 금지 ([`COPYWRITING_CANON.md`](../SSOT/COPYWRITING_CANON.md))

**혼동 방지:** “차트는 보이는데 주문 안 됨” → §2.3 stale 먼저 · freeze는 mark 무변동 60s+ (oracle row는 fresh).

---

## 6. 빠른 실행 (PowerShell · operator gate)

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
# T0-e SQL (로컬 stack · 1 terminal · G1)
supabase db reset
bun run test:sql
# spot-check (read-only)
psql $env:DATABASE_URL -f scripts/trade-desk-t0e-oracle-ops-spotcheck.sql
# PR-1B vitest
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/trade-chart-mount-display-contract.test.ts
bun run gate:ai-impl -- --test apps/web/src/product/surfaces/trade/chart/__tests__/trade-chart-panel.test.tsx
```

원격: `bun run stack:push-remote` 후 Supabase SQL Editor에서 §1~§3 쿼리 실행.
