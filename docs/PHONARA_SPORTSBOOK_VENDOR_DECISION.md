# PHONARA 스포츠북 Vendor Decision — 기획 정본

> **단계:** Planning · **S2 ingest 착수 전** operator 1순위 확정  
> **상위:** [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) · [`PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md`](PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md) §2  
> **갱신:** 2026-06-16

---

## 0. Scope (1줄)

Wave-S **S2 odds ingest**용 B2B 피드 vendor **1순위**를 operator가 고르기 위한 비교·의사결정 프레임 (계약·API key는 GO 후).

---

## 1. 후보 요약 (Tier 정본)

| 순위 | Vendor | 유형 | GitHub/문서 | MVP 적합 |
|------|--------|------|-------------|----------|
| **V1** | **Odds-API.io** | REST + WS SaaS | [odds-api-node](https://github.com/odds-api-io/odds-api-node) · [WS guide](https://docs.odds-api.io/guides/websockets) | **1차 권장** — TS worker · 빠른 POC |
| **V2** | **Oddsmarket** | prematch/live WS v4 | [oddsmarket_client](https://github.com/AspiraLimited/oddsmarket_client) | live·depth ↑ · 계약·온보딩 무거움 |
| **V3** | **Sportradar Betradar UOF** | AMQP enterprise | [betradar-uof-service](https://github.com/gdszyy/betradar-uof-service) | Bet365급 · **비용·통합 최대** |
| V4 | The Odds API (the-odds-api.com) | REST | D1 analytics 참고 | WS 약 · **S2 1순위 아님** |
| V5 | SportsGameOdds | Pusher live | B5 | 보조 · 단독 MVP 비권장 |

**FAIL =** Tier E clone · goldsvet · bet365 스크랩을 vendor로 선택

---

## 2. 비교 매트릭스 (MVP bar B1~B3)

| 기준 | Odds-API.io (V1) | Oddsmarket (V2) | Betradar UOF (V3) |
|------|------------------|-----------------|-------------------|
| **축구 K리그+EPL** | 플랜·bookmaker 커버 확인 필요 | 강함 (B2B 표준) | 매우 강함 |
| **1X2 · OU 2.5** | 일반 지원 | 지원 | 지원 |
| **실시간 WS** | `wss://api.odds-api.io/v3/ws` · lastSeq | api-pr / api-lv | AMQP → 자체 fanout |
| **PHONARA stack** | **Node/TS worker** | Java client 참고 · TS gateway | Go/Java sidecar |
| **정산 결과 피드** | scores/status channel (확인) | snapshot REST parity | **settlement parser (A2)** |
| **온보딩** | SaaS API key · 빠름 | B2B 영업 | enterprise SLA |
| **월 비용 (상대)** | 낮~중 | 중~高 | 高 |
| **lock-in 완화** | normalizer C1 contract | outcome_id canonical | fixture_id mapping 테이블 |
| **S5 in-play** | WS scores/status | **live WS v4** | **full live** |

---

## 3. PHONARA ingest 아키텍처 (vendor 무관 · 고정)

```text
[Vendor] → normalizer (C1: event_upsert | odds_upsert | event_remove)
         → sports_odds_snapshots (PG, TEXT Decimal)
         → optional Redis hot + Realtime fanout
         → rpc_list_* / rpc_get_* (read only)
```

**Non-negotiable**

- API key **server only** · `VITE_*` **0**
- odds **TEXT Decimal** · `@phonara/money` parse
- vendor raw id → `sports_outcomes.canonical_id` **mapping table** (vendor 교체 대비)

---

## 4. 권고 (Planning · operator override 가능)

### 4.1 MVP (S2~S4 prematch)

**1순위: Odds-API.io (V1)**

- 이유: TS SDK · WS handoff · S2 LOCK과 stack 일치 · POC 비용 최소
- 조건: operator가 **K리그+EPL · 1X2/OU** bookmaker 커버를 **계약 전** 샘플 REST로 확인

### 4.2 S5 in-play 또는 Bet365 bar 상향

**2순위 검토: Oddsmarket (V2)** 또는 **V1 + scores channel**으로 bar 충족 여부 실측 후 결정

### 4.3 Enterprise / 다종목 30+ 리그

**V3 Betradar** — Wave-S **defer** 또는 별도 Wave; S2와 **동시 온보딩 금지**

---

## 5. Operator 결정 템플릿

```text
[ ] V1 Odds-API.io — prematch MVP 확정
[ ] V2 Oddsmarket — live/in-play 동시 또는 depth 우선
[ ] V3 Betradar — enterprise (S2 defer, V1 POC 후 재평가)
[ ] Hybrid: V1 prematch + V2 live only (normalizer 이중 — 비용·복잡도 ↑)

서명/날짜: ___________
API key 보관: Supabase Edge secret / VM env (브라우저 0)
샘플 확인 완료 리그: ___________
```

---

## 6. 계약 체크리스트 (S2 전)

| # | 조항 | Y/N |
|---|------|-----|
| C1 | 재배포·white-label 표시 의무 | |
| C2 | odds 지연·오류 면책 · SLA | |
| C3 | 경기 void/postpone 처리 데이터 | |
| C4 | settlement/result feed 포함 여부 | |
| C5 | rate limit · burst · WS reconnect | |
| C6 | 테스트/sandbox key 분리 | |
| C7 | 종료 시 data retention | |

**FAIL =** C4=N 인데 S4 settle을 vendor 없이 **수동 only**로 가지 않을 계획

---

## 7. normalizer contract (C1 — LOCK에 인용)

| Message | 동작 |
|---------|------|
| `event_upsert` | fixture + markets + outcomes upsert |
| `odds_upsert` | snapshot row append · latest pointer |
| `event_remove` | fixture status cancelled · place reject |

참고: [sportsbook-odds-streaming-api](https://github.com/rustchainer/sportsbook-odds-streaming-api)

---

## 8. EXECUTE (Planning)

| Step | 액션 |
|------|------|
| 0 | 본 문서 + [`PHONARA_SPORTSBOOK_LEGAL_GATE.md`](PHONARA_SPORTSBOOK_LEGAL_GATE.md) clearance |
| 1 | V1 REST 샘플로 K리그+EPL 1X2/OU 확인 |
| 2 | §5 결정 템플릿 체크 |
| 3 | §6 계약 협상 |
| 4 | S2 LOCK에 vendor id · env key name 고정 |
| 5 | ingest worker 구현 GO |

---

## 9. §GREEN self-check (Planning · 계약 0 허용)

```bash
test -f docs/PHONARA_SPORTSBOOK_VENDOR_DECISION.md
rg "Odds-API|Oddsmarket|Betradar" docs/PHONARA_SPORTSBOOK_VENDOR_DECISION.md
rg "VITE_" docs/PHONARA_SPORTSBOOK_VENDOR_DECISION.md
rg "[\u4e00-\u9fff]" docs/PHONARA_SPORTSBOOK_VENDOR_DECISION.md
```

**FAIL =** browser API key 허용 · Tier E vendor · normalizer 없이 raw vendor id를 PK로 사용

---

## 10. Defer

- 정확한 월 요금표 — operator 견적 후 기입
- V3 Betradar POC — S4 GREEN 후
- 다중 vendor aggregation — bar B7 defer

---

## 11. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | 초판 — V1~V3 비교 · MVP 권고 · 계약 체크 |

---

*Planning 정본 · S2 worker는 vendor 확정 + API key 후 only*
