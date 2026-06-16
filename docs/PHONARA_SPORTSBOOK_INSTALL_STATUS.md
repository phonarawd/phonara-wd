# PHONARA 스포츠북 설치 상태

> **갱신:** 2026-06-16 · Wave **S1–S22** 로컬 GREEN (Phase A 엔진 코어)  
> **SQL:** sports **16/16** · 전체 **57/57**  
> **벤더:** The Odds API · Odds-API.io REST+WS · SportsGameOdds REST (S12) · `auto` failover  
> **방어:** S13 anti-arb · S14 multi-account device/IP · risk tiers · liability caps  
> **UI:** Lovable AI 전담 — Cursor는 엔진·RPC·hooks·worker만  
> **나중에 할 목록:** [`PHONARA_SPORTSBOOK_DEFERRED_TODO.md`](PHONARA_SPORTSBOOK_DEFERRED_TODO.md)

---

## 설치 완료 (Cursor repo · 로컬 검증됨)

| Wave | migration / package | 내용 |
|------|---------------------|------|
| S1 | `20260616000099` | `sports_*` 스키마 · READ RPC · RLS · `feature_sports_enabled` |
| S2 | `20260616000100` | `rpc_ingest_sports_c1` / `_batch` · ingest cursor |
| S3 | `20260616000101` | `rpc_place_sports_bet` · wallet lock · idempotency |
| S4 | `20260616000102` | settle / void · Σ=0 conservation |
| S5 | `20260616000103` | RG `sports` domain |
| S6 | `20260616000104` | OU 2.5 · parlay ≤8 · exposure cap · suspend · score settle |
| S7 | `20260616000105` | in-play status ingest · live state RPC · auto-settle path |
| S8 | `20260616000106` | RG `sports` domain CHECK · refresh batch includes sports |
| S9 | `packages/sports-ingest/` | Odds-API.io REST · auto vendor failover |
| S10 | `scripts/sports-odds-ingest/ws-run.ts` | WebSocket live ingest · lastSeq · stall reconnect |
| S11 | `20260616000107` + `scripts/sports-orchestrator/` | 24/7 orchestrator · health/lag · ops_alerts · WS supervisor |
| **S12** | `packages/sports-ingest/src/sportsgameodds.ts` | SportsGameOdds v2/events REST ingest |
| **S13** | `20260616000108` | anti-arb · hedge block · overround guard · risk tiers · liability |
| **S14** | `20260616000109` | device/IP correlation · linked-account block · admin RPC |
| **S15** | `20260616000110` | market registry · spread · asian HC · multi totals · BTTS settle |
| **S16–S22** | `20260616000111` | sport TTL · cashout · SGP · system bet · props · dead heat · admin desk |

| 구성 | 경로 |
|------|------|
| 도메인·콤보 | `packages/sportsbook-engine/` |
| 3-vendor ingest + vendor-chain | `packages/sports-ingest/` |
| odds ingest worker (REST · auto failover) | `scripts/sports-odds-ingest/` · `bun run sports:ingest:dry` |
| WS live ingest (S10) | `scripts/sports-odds-ingest/ws-run.ts` · `bun run sports:ingest:ws:dry` |
| 24/7 orchestrator (S11) | `scripts/sports-orchestrator/run.ts` · `bun run sports:orchestrator:dry` |
| scores auto-settle worker | `scripts/sports-settle/` · `bun run sports:settle:dry` |
| hooks (UI 연결용) | `apps/web/src/features/sports/use-sports-betting.ts` |
| SQL tests (16) | `supabase/tests/sportsbook_*.sql` |
| E2E (RPC-only) | `tests/e2e/sports-engine.spec.ts` · **5** scenarios |

### env (서버 전용 · VITE 금지)

```env
THE_ODDS_API_KEY=
ODDS_API_IO_KEY=
SPORTSGAMEODDS_API_KEY=
SPORTS_ODDS_VENDOR=auto
SPORTS_ODDS_VENDOR_PRIORITY=the-odds-api,odds-api-io,sportsgameodds
SPORTS_ODDS_IO_BOOKMAKERS=Bet365,1xBet,Pinnacle
SPORTS_ODDS_BOOKMAKERS=onexbet,pinnacle,williamhill
SPORTS_SGO_BOOKMAKERS=bet365
SPORTS_INGEST_LEAGUES=epl,k-league,nfl
SPORTS_INGEST_DRY_RUN=true
SPORTS_ORCHESTRATOR_WS=true
```

**auto 모드:** quota=0 · API 오류 · 429 · zero messages 시 체인 다음 벤더 자동 시도.

### 방어 시스템 (S13+S14 · place-bet RPC)

| 계층 | 기능 |
|------|------|
| 양방/헤지 | 동일 마켓 2베팅 금지 · implied-sum 서어벳 ingest suspend |
| 배당 | exact match · stale 차단 · live 15s / prematch 300s |
| 한도 | stake/payout · house exposure · outcome liability · 일일 횟수/금액 |
| 샤프 | risk tier (normal/restricted/sharp/banned) · live delay · stake multiplier |
| 다계정 | device_hash / ip_hash correlation · banned device link block |
| 운영 | `rpc_admin_set_sports_risk_tier` · `rpc_admin_list_sports_risk_events` · `rpc_admin_list_linked_device_users` |

### 게이트 명령

```powershell
supabase db reset
bun run build:packages
bun run test:sql                    # 56/56 (sportsbook 15/15)
bun run test -- packages/sportsbook-engine packages/sports-ingest
bun run test:e2e:sports-engine      # 5/5
bun run sports:orchestrator:dry
bun run check:i18n
```

---

## 아직 **원격 미적용** (의도적)

| 항목 | 이유 |
|------|------|
| Remote Supabase migration apply | operator **「스포츠 GO」** + LEGAL gate |
| Lovable `/sports` UI | L1 큐 · paste 전 0-touch |
| Phase A (엔진 코어) | **S15–S22 GREEN** — [`PHONARA_SPORTSBOOK_ENGINE_TIER_STRATEGY.md`](PHONARA_SPORTSBOOK_ENGINE_TIER_STRATEGY.md) |
| Phase B (수익 후) | 30+ league WS · Betradar UOF · esports depth · Lovable UI · props 카탈로그 폭 |

---

## operator 다음 액션

1. `.env` 3 vendor key + `SPORTS_ODDS_VENDOR=auto`
2. LEGAL clearance → **「스포츠 GO」** → remote migration apply
3. live: `SPORTS_INGEST_DRY_RUN=false` · `bun run sports:orchestrator`
4. Lovable `/sports` UI EXECUTE (hooks + i18n error keys 준비됨)

---

## self-check

```bash
rg "2026061600010[0-9]" supabase/migrations
bun run test:sql 2>&1 | rg "sportsbook_.*PASSED"
bun run test:e2e:sports-engine
rg "VITE_.*ODDS" apps/web .env.example
rg "fetchSportsGameOddsSportOdds|market_hedge_blocked" packages scripts supabase
```
