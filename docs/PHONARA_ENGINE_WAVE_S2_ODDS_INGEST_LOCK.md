# PHONARA Engine Wave-S2 · Odds Ingest LOCK

> **상태:** LOCK DRAFT · **EXECUTE 0** — S1 GREEN + [`PHONARA_SPORTSBOOK_VENDOR_DECISION.md`](PHONARA_SPORTSBOOK_VENDOR_DECISION.md) 확정  
> **Scope:** vendor WS/REST → normalizer → `sports_odds_snapshots` · optional Redis hot  
> **상위:** [`PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md`](PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md) §3 S2

---

## 아키텍처

```text
[Odds-API.io WS or V2 Oddsmarket] 
  → ingest worker (Edge/cron/VM, service_role)
  → normalizer C1 (event_upsert | odds_upsert | event_remove)
  → PG upsert + latest odds pointer
  → (optional) Redis + Supabase Realtime broadcast
```

API key: **server env only** · `VITE_*` **0**

---

## 산출물

| 산출 | 경로 |
|------|------|
| worker | `scripts/sports-odds-ingest/` or Supabase Edge Function (operator choice at EXECUTE) |
| normalizer | `packages/sports-ingest/` or `scripts/lib/sports-normalizer.ts` |
| migration (if any) | vendor mapping table · ingest cursor · `latest_odds` view |
| ops | reconnect · lastSeq · heartbeat · alert on stall |

---

## i18n

엔진 only — user copy **0**. Admin ingest status는 `admin.sports.ingest.*` (EXECUTE 시).

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | odds **TEXT Decimal** · float column **금지** |
| F2 | normalizer **C1 semantics** 고정 (remove = cancel fixture/market) |
| F3 | vendor raw id → `canonical_outcome_id` mapping |
| F4 | browser bundle에 vendor SDK **금지** |
| F5 | ingest failure 시 **stale odds place 허용 금지** (S3: snapshot age check) |
| F6 | S1 READ RPC가 **latest snapshot** 반환하도록 view/RPC 갱신 |
| F7 | **EXECUTE = Cursor only** · Lovable ingest **0** |

**FAIL =** F4 · F1 · ingest without vendor GO · API key in repo

---

## normalizer contract (고정)

```typescript
type IngestMessage =
  | { type: 'event_upsert'; fixture: FixturePayload; markets: MarketPayload[] }
  | { type: 'odds_upsert'; outcomeId: string; odds: string; capturedAt: string }
  | { type: 'event_remove'; fixtureId: string; reason: string };
```

참고: [sportsbook-odds-streaming-api](https://github.com/rustchainer/sportsbook-odds-streaming-api)

---

## Odds-API.io WS (V1 default · pseudo)

```typescript
// wss://api.odds-api.io/v3/ws
// channels: odds | scores | status
// persist lastSeq; on reconnect request snapshot from lastSeq
// map bookmaker + event id → sports_fixtures.id
```

문서: [WS guide](https://docs.odds-api.io/guides/websockets) · SDK: [odds-api-node](https://github.com/odds-api-io/odds-api-node)

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | S1 GREEN · vendor §5 signed |
| 1 | env secret 등록 (Supabase Edge / CI) |
| 2 | normalizer + unit tests (Decimal parse) |
| 3 | worker WS connect · REST bootstrap leagues |
| 4 | PG upsert path · service_role only |
| 5 | `rpc_get_fixture_markets` latest odds wire |
| 6 | stall detector · ingest lag metric |
| 7 | manual 1회: K리그+EPL fixture ≥1 · 1X2 odds 갱신 확인 |
| 8 | §GREEN full block |

---

## §GREEN self-check (Step 8 · full block)

```bash
# worker exists
test -d scripts/sports-odds-ingest || test -f supabase/functions/sports-odds-ingest/index.ts

# no VITE vendor key
rg "VITE_.*ODDS|VITE_.*API_KEY" apps/web .env.example
# expect 0 hits for sports vendor

# normalizer types
rg "event_upsert|odds_upsert|event_remove" scripts/ packages/ supabase/functions/

# Decimal text in migrations
rg "odds.*text|odds.*numeric" supabase/migrations/

# latest odds readable
rg "rpc_get_fixture_markets|latest" supabase/migrations/ supabase/tests/

# operator doc
rg "[\u4e00-\u9fff]" docs/PHONARA_ENGINE_WAVE_S2_ODDS_INGEST_LOCK.md
```

**FAIL =** VITE key · float odds · ingest 0 rows after 15m run · S3 place enabled before Step 7 manual OK

---

## §GREEN template

```text
Wave-S2 GREEN
- vendor: [V1|V2|V3]
- worker: [path]
- manual: K리그+EPL 1X2 odds updated at [timestamp]
- stale TTL: [N sec] for S3
- NEXT: S3 place LOCK
```

---

## Defer

- Kafka/NATS (C2) — worker+cron until scale
- Multi-vendor merge
- in-play WS (S5) — prematch channel only in S2

---

## paste adapter memo

- S2 GREEN 전 Lovable `/sports` **mock odds only**
- S2 GREEN 후 hook reads `rpc_get_fixture_markets` · no client odds math

---

## 참고 Tier

B1 · B2 · A3 · C1 · A2 (settlement feed note for S4)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | LOCK DRAFT 초판 |

---

*EXECUTE 0 until S1 GREEN + vendor signed*
