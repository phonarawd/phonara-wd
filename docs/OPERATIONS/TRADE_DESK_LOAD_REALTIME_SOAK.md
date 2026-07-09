# Trade Desk — Load / Realtime Soak (P3-C)

> **Plan:** Trade Desk Zero-Defect QA audit · **todo:** `p3-load-realtime`  
> **Gate:** disconnect banner false-positive 0 · submit gate false-positive 0 · prod **read-only** spotcheck  
> **Contract:** `apps/web/src/domain/trade-desk-load-realtime-display-contract.ts`

---

## Scope

| 항목                                       | 방식                                       | prod write                     |
| ------------------------------------------ | ------------------------------------------ | ------------------------------ |
| N concurrent Realtime channels (10/50/100) | `scripts/trade-desk-realtime-load-soak.ts` | **금지** (anon subscribe only) |
| price_ticks burst 관측                     | Launch RC spotcheck SQL P3-C 블록          | **read-only SELECT**           |
| Disconnect / submit gate                   | vitest pure invariants + desk wire tests   | N/A                            |

**DoD:** load soak 중 `resolveTradeOracleRealtimeDisconnected` / `resolveTradeDeskSubmitGate` **오작동 0** — subscribed·connecting 상태에서 banner/submit block 금지.

---

## 1. Realtime channel soak (operator · local stack or prod anon)

```powershell
# 기본 — 10/50/100 tier 순차 (각 30s)
bun run trade-desk:realtime-soak

# 단일 tier
bun run trade-desk:realtime-soak -- --tier=50

# 짧은 창 (advisory)
$env:PHONARA_REALTIME_SOAK_MS = "15000"
bun run trade-desk:realtime-soak -- --tier=10
```

**Env:** `VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY` (또는 `SUPABASE_ANON_KEY`)

**합격:** JSON summary `pass=true` · `subscribedCount === channelCount` · `channelErrors=0` · gate invariants green (contract `evaluateTradeDeskLoadRealtimeSoak`).

**oracle_events:** burst proxy — `oracle_prices` postgres_changes 수신 건수 (tick burst **시뮬레이션 관측**, INSERT 없음).

---

## 2. Prod read-only spotcheck 확장 (24h soak · Plan §4D + P3-C)

기존 Launch RC spotcheck에 P3-C read-only 블록 포함:

```powershell
psql $env:DATABASE_URL -f scripts/trade-desk-launch-rc-soak-spotcheck.sql
```

| 검사                               | WARNING 조건             |
| ---------------------------------- | ------------------------ |
| BTC_USDT ticks (60s)               | spot ON && ticks < 1     |
| Active symbols without ticks (60s) | count > 0                |
| Total price_ticks (60s)            | > 12_000 (runaway burst) |
| Active symbol max tick lag         | > 300s                   |

상수 정본: `TRADE_DESK_LOAD_TICK_BURST_*` in load-realtime contract.

---

## Implemented closeout

```powershell
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/trade-desk-load-realtime-display-contract.test.ts
```

**E0:** [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/P3-C/load-realtime-soak-snapshot.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P3-C/load-realtime-soak-snapshot.md)

**Verified:** operator push → CI green · prod spotcheck WARNING 0 (24h 창) · realtime soak JSON pass (advisory)
