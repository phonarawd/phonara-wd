# PHONARA Engine Wave-S · 토토/스포츠 베팅 엔진 계획 (operator 정본)

> **Scope:** Bet365/토토형 **스포츠북 엔진** (fixture · market · odds snapshot · bet slip · settle/void) — **계획·참고 레포만**. migration/RPC 구현은 operator **「스포츠 GO」** 후 별도 LOCK.  
> **갱신:** 2026-06-16  
> **상위 정본:** [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) (기획 · MVP bar · 문서 트리 · 타임라인)  
> **연결:** [`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md) · [`LEGAL_BASIS.md`](LEGAL_BASIS.md) · [`PHONARA_V2_MASTER_PLAN.md`](PHONARA_V2_MASTER_PLAN.md)

---

## 0. 한 줄 요약

| 질문 | 답 |
|------|-----|
| Bet365/Stake 공식 엔진 GitHub? | **없음** |
| “전세계 1위 1레포”? | **없음** — 아래 **Tier별 선별 정본** |
| PHONARA에 merge? | **금지** — 아키텍처·프로토콜·상태머신 **참고만** |
| 구현 순서 | **엔진 first** — S1 schema/read → S2 ingest → S3 place → S4 settle → S5 in-play |
| Lovable paste 전 migration? | **0-touch** (기존 gap 로드맵과 동일) |
| UI/UX 어디서? | **Lovable only** · Cursor는 paste adapter + hook wire |
| 엔진 어디서? | **Cursor only** — Lovable canvas에서 supabase/RPC **0** |

---

## 1. 벤치 대응 (엔진 관점)

| 벤치 | 엔진에서 가져올 것 | PHONARA Wave-S |
|------|-------------------|----------------|
| **Bet365 / 토토** | fixture · 1X2/OU/핸디 · 슬립/조합 · live odds · 정산/void | **본 Wave 전체** |
| **Stake** | crypto wallet + RG (이미 있음) · 스포츠는 보통 B2B | wallet/RG **재사용** · 스포츠 **신규** |
| **Rollbit** | live crash (별도 Wave-1) | 스포츠북과 **테이블/RPC 분리** |

**절대 금지:** `game_rounds` / `rpc_place_game_bet` / `@phonara/game-engine` PF 경로에 스포츠 억지 연결.

---

## 2. 참고 레포 선별 정본 (Tier · 링크 · PHONARA에서 쓸 것)

> 선별 기준: (1) **실시간 odds/ingest** 또는 **풀 스포츠북 상태머신** (2) **PostgreSQL + WS** 패턴 (3) OSS 라이선스 명시 (4) PHONARA **merge 불가** 전제 하 **설계 참고 가치**  
> ★는 GitHub stars·문서·아키텍처 completeness 기준 **상대 순위** (절대 “공식 1위” 아님).

### Tier A — **풀 스포츠북 플랫폼·상태머신** (엔진 설계 1순위)

| ★ | 레포 | 링크 | PHONARA에서 참고 |
|---|------|------|------------------|
| A1 | **lets-bet** | https://github.com/nutcas3/lets-bet | Go microservices · **단폴/멀티/시스템** · Redis live odds · NATS · PG optimistic lock · PlaceBet state machine · compliance 훅 · **Wave-S RPC/테이블 naming 레퍼런스** |
| A2 | **betradar-uof-service** | https://github.com/gdszyy/betradar-uof-service | **엔터프라이즈 피드 ingest 레이어**: AMQP → parse → PG → **WS fanout** · settlement/fixture parser 분리 · **S2 ingest 아키텍처 정본** |
| A3 | **Oddsmarket client + WS v4 wiki** | https://github.com/AspiraLimited/oddsmarket_client · https://github.com/AspiraLimited/oddsmarket_client/wiki/Odds-feed-WS-API-(API-v4) | prematch `api-pr` / live `api-lv` WS · subscribe/snapshot/outcomes · **피드 계약·재연결·permessage-deflate** |

### Tier B — **실시간 배당 SDK** (ingest worker 구현 1순위 · PHONARA = TypeScript)

| ★ | 레포 / 문서 | 링크 | PHONARA에서 참고 |
|---|------------|------|------------------|
| B1 | **Odds-API.io Node SDK** | https://github.com/odds-api-io/odds-api-node | REST snapshot + **WS handoff** (`lastSeq`) · PHONARA ingest **Edge/cron worker** 후보 |
| B2 | **Odds-API.io WS 가이드** | https://docs.odds-api.io/guides/websockets | `wss://api.odds-api.io/v3/ws` · channels `odds|scores|status` · **S2/S5 프로토콜** |
| B3 | **Odds-API.io Python SDK** | https://github.com/odds-api-io/odds-api-python | REST+WS 예제 · Python sidecar ingest 시 |
| B4 | **SharpAPI TS (oddsWs)** | https://github.com/Sharp-API/sharpapi-ts | `initial` + `odds_update` 이벤트 모델 · **유저-facing WS payload naming** |
| B5 | **SportsGameOdds TS** | https://github.com/SportsGameOdds/sports-odds-api-typescript | Pusher `events:live` / `events:byid` · live feed 패턴 |

### Tier C — **오즈 정규화·스트리밍 계약** (S2 normalizer)

| ★ | 레포 | 링크 | PHONARA에서 참고 |
|---|------|------|------------------|
| C1 | **sportsbook-odds-streaming-api** | https://github.com/rustchainer/sportsbook-odds-streaming-api | `event_upsert` / `odds_upsert` / `event_remove` · snapshot batch · **내부 fanout contract** (공개 repo는 쇼케이스 — 로직 merge 금지) |
| C2 | **real-time-betting-engine** | https://github.com/rogerio-castellano/real-time-betting-engine | NATS JetStream ingest · Redis odds counter · **수평 확장 ingest** 패턴 |

### Tier D — **파이프라인·수학·데이터** (보조)

| ★ | 레포 | 링크 | PHONARA에서 참고 |
|---|------|------|------------------|
| D1 | **sports_betting_analytics_engine** | https://github.com/sanchitvj/sports_betting_analytics_engine | The Odds API → Kafka → 처리 · **대량 ingest 테스트베드** (베팅 RPC 아님) |
| D2 | **WagerBrain** | https://github.com/sedemmler/WagerBrain | implied prob · vig removal · **조합 배당 검증 수학** |
| D3 | **sportsbookreview-scraper** | https://github.com/flancast90/sportsbookreview-scraper | NFL/NBA/MLB **히스토리 오즈** · SQL 테스트 fixture seed 아이디어 |
| D4 | **OpenBet Core** | https://github.com/LucasReisVillasBoas/openbet-core · 데모 https://openbet-core-shell.vercel.app | 화이트라벨 **ClientConfig** · **UI/IA만** (엔진 아님 · paste/Lovable 단계) |

### Tier E — **주의 (마케팅·clone·품질 미검증)**

| 레포 | 링크 | 판정 |
|------|------|------|
| sportsbook-bet365 clone | https://github.com/bigfrankykevin/sportsbook | bet365 토픽 · **실서비스·보안 미검증** · merge **금지** |
| Sports-Betting-Sportsbook / BoiBook | https://github.com/fairrustana/Sports-Betting-Sportsbook | 마케팅 문구 과다 · **피드 계약 검증 필요** |
| `casino-script` / goldsvet 계열 | https://github.com/topics/casino-script | **스포츠북 엔진 아님** · 보안 리스크 · **참고 제외** |

### Tier F — **Bet365 / Stake / Rollbit 공식**

| 항목 | 링크 | 판정 |
|------|------|------|
| Bet365 | (공개 엔진 repo 없음) | B2B: Sportradar / LSports / Oddsmarket 등 **유료 피드** |
| Stake | (공식 UI/엔진 OSS 없음) | PF 카지노는 PHONARA **기존 engine** · 스포츠는 Tier A~B |
| Rollbit | (공식 OSS 없음) | live crash = [`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md) **Wave-1** |

---

## 3. PHONARA Wave-S 엔진 구현 순서 (엔진 only)

```text
[전제] paste GO + (선택) Wave-1~3 안정 · LEGAL re-review GO
    ↓
S1  schema + prematch READ RPC
    ↓
S2  odds ingest (Tier B WS + Tier C normalizer) → PG + hot cache
    ↓
S3  rpc_place_sports_bet (단폴·조합·odds_snapshot·wallet lock)
    ↓
S4  settle / void / refund (service_role cron + SQL conservation)
    ↓
S5  in-play (live suspend · WS fanout · kickoff lock)
    ↓
(UI wire / Lovable /sports UI — S3 GREEN 후 paste · hook wire = Cursor)
```

### Cursor ↔ Lovable (Wave-S)

| Wave | Cursor | Lovable |
|------|--------|---------|
| S1~S5 | migration · RPC · ingest · SQL tests | **0** |
| UI | paste adapter · `use-*` hook only | `/sports` · BetSlip · i18n · mock |
| paste | hook wire · route wrap · type shim | UI 산출물 = **시각 정본** |

**FAIL =** Lovable EXECUTE on `supabase/` · Cursor 신규 `/sports` 레이아웃 창작

### S1 · Schema + prematch read (LOCK-first)

**신규 테이블 (카지노와 분리):**

| 테이블 | 역할 |
|--------|------|
| `sports_fixtures` | 경기 · kickoff · status · league |
| `sports_markets` | fixture + market_type (1x2, totals_2_5, …) |
| `sports_outcomes` | selection · line |
| `sports_odds_snapshots` | outcome_id · decimal odds TEXT · captured_at |
| `sports_bets` | user · stake · status · idempotency_key |
| `sports_bet_legs` | bet_id · outcome_id · **odds_at_bet TEXT** |

**READ RPC (가칭):**

- `rpc_list_sports_fixtures(p_date, p_league, p_status)`
- `rpc_get_fixture_markets(p_fixture_id)`

**재사용:** `@phonara/money` Decimal · RLS 패턴 · rate limit config

**참고 레포:** A1 (API.md 구조) · A3 (fixture/outcome identity)

### S2 · Odds ingest (실시간 반영)

**권장 1차 피드 (operator 계약 후):**

| 우선 | 제공 | GitHub/문서 |
|------|------|-------------|
| 1 | Odds-API.io REST+WS | B1 · B2 |
| 2 | Oddsmarket WS v4 | A3 |
| 3 | Betradar UOF (AMQP) | A2 |

**PHONARA ingest (Supabase 밖 또는 Edge):**

```text
[Vendor WS/AMQP] → normalizer (C1 contract) → sports_odds_snapshots + Redis hot
                                              → (optional) Supabase Realtime / own WS gateway
```

**규칙:**

- API key **서버 only** · 브라우저/VITE **0**
- 부동소수 **금지** · odds는 TEXT Decimal
- `event_remove` / void signal **Tier C1** 동일 semantics

**참고 레포:** A2 · B1-B2 · C1 · C2

### S3 · Place bet (머니 mutation · RED-first)

**RPC (가칭):** `rpc_place_sports_bet(p_legs JSONB, p_stake TEXT, p_idempotency_key TEXT)`

**필수 invariant:**

1. 각 leg **현재 허용 odds** 와 `odds_at_bet` 일치 ( tolerance 0 )
2. kickoff 전 only (prematch) — S5에서 live 규칙 추가
3. wallet **lock/debit** · idempotency replay
4. RG / kill switch (`rpc_place_game_bet`와 **동일 hook**)
5. 조합 배당 = leg odds 곱 (**D2** 수학 검증)

**FAIL =** client가 보낸 odds로 payout · snapshot 없이 place

**참고 레포:** A1 PlaceBet state machine · lets-bet tax/reserve 패턴 (PHONARA tax는 defer 가능)

### S4 · Settlement / void

**RPC/cron (가칭):**

- `rpc_settle_sports_fixture(p_fixture_id, p_results JSONB)` — service_role
- `rpc_void_sports_market(p_market_id, p_reason TEXT)`

**SQL gate:** every path **Σ=0** · `supabase/tests/sportsbook_conservation_test.sql` (신규)

**참고 레포:** A2 settlement parser · A3 snapshot REST parity check

### S5 · In-play (defer until S4 GREEN)

- live WS channels (B2 `scores|status`)
- goal suspend · odds lock window
- `rpc_place_sports_bet` live branch

**참고 레포:** A3 live endpoint · B4 oddsWs

---

## 4. Tier → Wave 매핑 (한눈)

| Wave | Primary refs | Secondary refs |
|------|--------------|----------------|
| S1 | A1, A3 | D4 (IA only) |
| S2 | B1, B2, A3, C1 | A2, C2, D1 |
| S3 | A1, D2 | B4 |
| S4 | A2, A3 | D3 |
| S5 | B2, B4, B5 | C1 |

---

## 5. merge / paste 정책 (non-negotiable)

| 허용 | 금지 |
|------|------|
| 폴더 구조 · WS message type 이름 · state machine diagram | 레포 코드 **copy-paste merge** |
| ingest normalizer **의사코드** LOCK에 고정 | Go/Java stack을 PHONARA supabase RPC로 **직접 이식** |
| Tier D 수학을 `@phonara/money`로 **재구현** | vendor SDK를 browser bundle에 포함 |
| OpenBet **UI config** 아이디어 (Lovable **only**) | goldsvet / casino-script 계열 |
| Cursor paste adapter · hook wire | Lovable에서 engine package 수정 |

동일 규칙: [`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md) §3 · §7

---

## 6. 법무 · operator GO

| Gate | 시점 |
|------|------|
| [`LEGAL_BASIS.md`](LEGAL_BASIS.md) re-review | **S1 migration 전** |
| operator **「스포츠 GO」** | S1 LOCK 착수 |
| 피드 vendor 계약 + API key | **S2 전** |
| `supabase db reset` + conservation SQL | **각 Wave closeout** |
| security advisor 0 ERROR | **각 migration 후** |

---

## 7. 기존 로드맵과의 순서

[`PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md`](PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md) §5 고정:

```text
paste GO → Wave-1 Crash → Wave-2 Partner → Wave-3 Earn
         → Wave-S (본 문서) S1→S5
         → defer CLOB / global crash room
```

**병렬 금지:** Wave-1 money mutation과 Wave-S3 **동시 migration**.

---

## 8. Wave-S LOCK 템플릿 (다음 문서)

S1 착수 시 별도 파일: [`PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md`](PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md) (✅ DRAFT)

필수 블록:

- Scope 1줄 · schema DDL 초안 · RPC 시그니처 · RLS/GRANT
- odds snapshot 규칙 · FAIL 조건 · RED-first SQL file path
- EXECUTE 0→N · §GREEN self-check full block
- Tier A1/A3 · B1/B2 링크 **본 문서 §2 인용**

---

## 9. §GREEN self-check (계획 단계 · migration 0)

```bash
# Tier E 제외 — 스포츠북 참고 레po 링크가 문서에 있는지
rg "github.com/nutcas3/lets-bet|odds-api-io|AspiraLimited/oddsmarket" docs/PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md

# operator doc CJK (중/일) 0
rg "[\u4e00-\u9fff]" docs/PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md

# paste 전 엔진 touch 0 (계획만 작성 시)
git diff --stat supabase/ packages/money packages/trading-engine packages/game-engine wallet-ledger
```

**FAIL =** Tier E clone을 Tier A처럼 기술 · merge 허용 문구 · S3 전 LEGAL 생략

---

## 10. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | §0 Cursor↔Lovable 분업 · Wave-S 표 추가 |

---

*operator 정본 · 구현은 「스포츠 GO」+ Wave-Sn LOCK 후 only*
